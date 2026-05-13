// ISSUE #5: Unbounded JIT Re-evaluation Loop
// This test file demonstrates the infinite JIT retry loop bug
// Tests should FAIL until the fix is implemented

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
process.env.NODE_ENV = 'test';
import { test } from 'node:test';
import assert from 'node:assert';
import { processTasks } from '../lifecycle.js';
import type { PoolInfo, MarketSnapshot, StrategyResult } from '@lp-system/core';

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_1 = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';
const MAX_SIGNAL_AGE_MS = 180000; // 3 minutes as per lifecycle.ts

function createMocks() {
  const tasks: any[] = [];
  const executionRecords: any[] = [];
  const orchestrators: any[] = [];
  const knownPositions: any[] = [];

  const store: any = {
    getAssignments: async () => [],
    saveAssignment: async () => {},
    deleteAssignment: async () => {},
    getExecutionRecords: async () => executionRecords,
    saveExecutionRecord: async (record: any) => {
      executionRecords.push(record);
    },
    getTasks: async () => tasks,
    saveTask: async (task: any) => {
      const idx = tasks.findIndex((t: any) => t.id === task.id);
      if (idx >= 0) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
    },
    deleteTask: async (id: string) => {
      const idx = tasks.findIndex((t: any) => t.id === id);
      if (idx >= 0) {
        tasks.splice(idx, 1);
      }
    },
    archiveTask: async (task: any) => {
      const idx = tasks.findIndex((t: any) => t.id === task.id);
      if (idx >= 0) {
        tasks.splice(idx, 1);
      }
    },
  };

  const executor: any = {
    apply: async (decision: any, _market: any) => ({
      id: 'record_' + Date.now(),
      decision,
      txSignatures: ['tx_signature_123'],
      status: 'success',
      executedAt: Date.now(),
    }),
    setReEvaluate: () => {},
  };

  const positionProvider: any = {
    getPositions: async () => [],
    getPosition: async (_id: string) => {
      throw new Error('Not implemented');
    },
    getPoolInfo: async (_poolAddress: string): Promise<PoolInfo> => ({
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      feeRate: 100,
      activeBound: 1000,
      tokenXAddress: MOCK_PUBKEY_2,
      tokenYAddress: MOCK_PUBKEY_3,
    }),
    getMarketSnapshot: async (poolAddress: string): Promise<MarketSnapshot> => ({
      poolAddress,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      activeBound: 1000,
      price: 1.5,
      priceHistory: [],
      feeRate: 100,
      capturedAt: Date.now(),
      activeBinId: 1000,
    }),
  };

  const rpcPool: any = {
    getConnection: () => ({}),
    execute: async (fn: any) => {
      const mockConnection = {
        getParsedTokenAccountsByOwner: async () => ({ value: [] }),
        getBalance: async () => 1000000000,
      };
      return fn(mockConnection as any);
    },
  };

  const registry: any = {
    register: (orch: any) => {
      const idx = orchestrators.findIndex((o) => o.id === orch.id);
      if (idx >= 0) {
        orchestrators[idx] = orch;
      } else {
        orchestrators.push(orch);
      }
    },
    deregister: (id: string) => {
      const idx = orchestrators.findIndex((o) => o.id === id);
      if (idx >= 0) {
        orchestrators.splice(idx, 1);
      }
    },
    deregisterByAssignmentId: (assignmentId: string) => {
      const idx = orchestrators.findIndex((o) => o.assignmentId === assignmentId);
      if (idx >= 0) {
        orchestrators.splice(idx, 1);
      }
    },
    getForPosition: (posId: string) => orchestrators.filter((o) => o.positionId === posId),
    get: (id: string) => orchestrators.find((o) => o.id === id),
    getAll: () => orchestrators,
  };

  const positionStore: any = {
    getKnown: async () => knownPositions,
    saveKnown: async (positions: any[]) => {
      knownPositions.length = 0;
      knownPositions.push(...positions);
    },
    archivePosition: async () => {},
    getArchived: async () => [],
  };

  return { store, executor, positionProvider, rpcPool, registry, positionStore, tasks, orchestrators, knownPositions };
}

test('ISSUE #5: JIT re-evaluation should be bounded by MAX_JIT_ATTEMPTS', async () => {
  // ISSUE #5: Currently the JIT re-evaluation loop has no bounds
  const m = createMocks();

  const decision: any = {
    positionId: MOCK_PUBKEY_1,
    action: 'close+open',
    openParams: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.0, upperBound: 2.0, tokenXAmount: '500', tokenYAmount: '500' },
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now(),
  };

  const task: any = {
    id: 'task_jit_loop',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now() - MAX_SIGNAL_AGE_MS - 1000, // Stale signal
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };

  m.tasks.push(task);

  const mockOrchestrator: any = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    tick: async (): Promise<StrategyResult> => ({
      action: 'open',
      params: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.1, upperBound: 2.1, tokenXAmount: '500', tokenYAmount: '500' },
    }),
  };
  m.orchestrators.push(mockOrchestrator);

  m.knownPositions.push({
    id: MOCK_PUBKEY_1,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 1.0,
    upperBound: 2.0,
    tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
    tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
    isInRange: true,
    openedAt: Date.now(),
    metadata: {},
  });

  const MAX_JIT_ATTEMPTS = 5;

  for (let i = 0; i < 10; i++) {
    // Force the task to be in pending_open and stale to trigger the circuit breaker
    task.status = 'pending_open';
    task.evaluatedAt = Date.now() - MAX_SIGNAL_AGE_MS - 1000;

    await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

    if (task.jitAttempts !== undefined && task.jitAttempts >= MAX_JIT_ATTEMPTS) {
      break;
    }
  }

  // EXPECTED TO FAIL: jitAttempts is undefined in current code
  assert.ok(task.jitAttempts !== undefined, 'Task should have jitAttempts field');
  assert.strictEqual(task.jitAttempts, MAX_JIT_ATTEMPTS, 'Task should stop after MAX_JIT_ATTEMPTS');
});

test('ISSUE #5: Task should have exponential backoff between JIT retries', async () => {
  const m = createMocks();
  const task: any = {
    id: 'task_backoff',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      sourceAssignmentId: 'assign_123',
      evaluatedAt: Date.now() - MAX_SIGNAL_AGE_MS - 1000,
    },
    evaluatedAt: Date.now() - MAX_SIGNAL_AGE_MS - 1000,
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };
  m.tasks.push(task);

  const mockOrchestrator: any = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    tick: async (): Promise<StrategyResult> => ({
      action: 'open',
      params: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.1, upperBound: 2.1, tokenXAmount: '500', tokenYAmount: '500' },
    }),
  };
  m.orchestrators.push(mockOrchestrator);

  m.knownPositions.push({
    id: MOCK_PUBKEY_1,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 1.0,
    upperBound: 2.0,
    tokenX: { decimals: 9 },
    tokenY: { decimals: 6 },
  });

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // EXPECTED TO FAIL: jitBackoffSeconds is undefined in current code
  assert.ok(task.jitBackoffSeconds !== undefined, 'Task should have jitBackoffSeconds field');
});

test('ISSUE #5: 5-minute fail-safe timeout should not be reset by JIT transitions', async () => {
  const m = createMocks();
  const sixMinutesAgo = Date.now() - 6 * 60 * 1000;

  const task: any = {
    id: 'task_failsafe',
    assignmentId: 'assign_123',
    status: 'pending_close',
    originalPositionId: MOCK_PUBKEY_1,
    intent: { positionId: MOCK_PUBKEY_1, action: 'close+open', sourceAssignmentId: 'assign_123', evaluatedAt: Date.now() },
    evaluatedAt: Date.now(), // Reset recently by JIT
    events: [{ stage: 'INIT', timestamp: sixMinutesAgo }],
    createdAt: sixMinutesAgo, // Fix will use this
  };

  m.tasks.push(task);
  m.knownPositions.push({
    id: MOCK_PUBKEY_1,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 1.0,
    upperBound: 2.0,
    tokenX: { decimals: 9 },
    tokenY: { decimals: 6 },
  });

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // EXPECTED TO FAIL: current code uses evaluatedAt for timeout, which was just reset
  assert.strictEqual(m.tasks.length, 0, 'Task should have timed out after 5 minutes total lifetime');
});
