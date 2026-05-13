/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { test } from 'node:test';
import assert from 'node:assert';
import { processTasks } from './lifecycle.js';
import {
  RebalanceTask,
  Decision,
  Position,
  PoolInfo,
  MarketSnapshot,
  ExecutionRecord,
  IStore,
  IExecutor,
  IPositionProvider,
  IRpcProvider,
  IOrchestratorRegistry,
  IPositionStore,
} from '@lp-system/core';

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_1 = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';

// Simple Mocks generator helper
function createMocks() {
  const tasks: RebalanceTask[] = [];
  const executionRecords: ExecutionRecord[] = [];
  const knownPositions: Position[] = [];

  const store: IStore = {
    getAssignments: async () => [],
    saveAssignment: async () => {},
    deleteAssignment: async () => {},
    getExecutionRecords: async () => executionRecords,
    saveExecutionRecord: async (record) => {
      executionRecords.push(record);
    },
    getTasks: async () => tasks,
    saveTask: async (task) => {
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
    },
    deleteTask: async (id) => {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx >= 0) {
        tasks.splice(idx, 1);
      }
    },
    archiveTask: async (task) => {
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        tasks.splice(idx, 1);
      }
    },
  };

  let applyCalls = 0;
  const executor: IExecutor = {
    apply: async (decision, _market) => {
      applyCalls++;
      return {
        id: 'record_' + Date.now() + '_' + applyCalls,
        decision,
        txSignatures: ['tx_sig_' + applyCalls],
        status: 'success',
        executedAt: Date.now(),
        newPositionId: 'new_pos_' + applyCalls,
      };
    },
    setReEvaluate: () => {},
  };

  const positionProvider: IPositionProvider = {
    getPositions: async () => [],
    getPosition: async (_id) => {
      return {
        id: 'new_pos_1',
        poolAddress: MOCK_PUBKEY_2,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        lowerBound: 1.0,
        upperBound: 2.0,
        tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '500' },
        tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '500' },
        isInRange: true,
        openedAt: Date.now(),
        metadata: {},
      };
    },
    getPoolInfo: async (_poolAddress): Promise<PoolInfo> => {
      return {
        poolAddress: MOCK_PUBKEY_2,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        feeRate: 100,
        activeBound: 1000,
        tokenXAddress: MOCK_PUBKEY_2,
        tokenYAddress: MOCK_PUBKEY_3,
      };
    },
    getMarketSnapshot: async (poolAddress): Promise<MarketSnapshot> => {
      return {
        poolAddress,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        activeBound: 1000,
        price: 1.5,
        priceHistory: [],
        feeRate: 100,
        capturedAt: Date.now(),
        activeBinId: 1000,
      };
    },
  };

  const rpcPool: IRpcProvider = {
    getConnection: () => ({}),
    execute: async (fn) => {
      const mockConnection = {
        getParsedTokenAccountsByOwner: async () => ({ value: [] }),
      };
      return fn(mockConnection as any);
    },
  };

  const registry: IOrchestratorRegistry = {
    register: () => {},
    deregister: () => {},
    deregisterByAssignmentId: () => {},
    getForPosition: () => [],
    get: () => undefined,
    getAll: () => [],
  };

  const positionStore: IPositionStore = {
    getKnown: async () => knownPositions,
    saveKnown: async (positions) => {
      knownPositions.length = 0;
      knownPositions.push(...positions);
    },
    archivePosition: async () => {},
    getArchived: async () => [],
  };

  return {
    store,
    executor,
    positionProvider,
    rpcPool,
    registry,
    positionStore,
    tasks,
    getApplyCalls: () => applyCalls,
  };
}

test('Issue #4: Missing Idempotency Protection in pending_open rebalance task', async () => {
  // ISSUE #4: this test is intentionally failing
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'open',
    openParams: {
      poolAddress: MOCK_PUBKEY_2,
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenXAmount: '500',
      tokenYAmount: '500',
    },
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now(),
  };

  const task: RebalanceTask = {
    id: 'task_idemp_1',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };

  m.tasks.push(task);

  // We simulate that on the first run of processTasks, executor.apply succeeds,
  // but saveKnown throws an error when trying to update the position store cache,
  // causing processTasks to abort before deleteTask is called.
  m.positionStore.saveKnown = async () => {
    throw new Error('Simulated cache storage failure during open completion');
  };

  try {
    await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);
  } catch {
    // Expected error
  }

  assert.strictEqual(m.getApplyCalls(), 1, 'executor.apply should have been called once on first run');
  assert.strictEqual(m.tasks.length, 1, 'task should still be in store due to failure');

  // Now processTasks runs a second time (e.g. next tick or after recovery).
  // Without idempotency protection, executor.apply will be called a second time for the same task!
  try {
    await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);
  } catch {
    // Expected error
  }

  // ISSUE #4: This assertion will fail because applyCalls is 2, demonstrating lack of idempotency protection.
  assert.strictEqual(
    m.getApplyCalls(),
    1,
    'Idempotency failure: executor.apply should NOT be called a second time for the same pending_open task'
  );
});
