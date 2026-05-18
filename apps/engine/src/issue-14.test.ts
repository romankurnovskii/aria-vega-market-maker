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

const MOCK_STALE_POSITION_ID = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_POOL_ADDRESS = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';

function createMocks() {
  const tasks: RebalanceTask[] = [];
  const executionRecords: ExecutionRecord[] = [];
  const knownPositions: Position[] = [
    {
      id: MOCK_STALE_POSITION_ID,
      poolAddress: MOCK_POOL_ADDRESS,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenX: { tokenAddress: MOCK_POOL_ADDRESS, mint: MOCK_POOL_ADDRESS, decimals: 9, amount: '100' },
      tokenY: { tokenAddress: MOCK_POOL_ADDRESS, mint: MOCK_POOL_ADDRESS, decimals: 6, amount: '100' },
      isInRange: true,
      openedAt: Date.now(),
      metadata: {},
    },
  ];

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

  let appliedDecision: Decision | null = null;

  const executor: IExecutor = {
    apply: async (decision, _market) => {
      appliedDecision = decision;
      return {
        id: 'record_' + Date.now(),
        decision,
        txSignatures: ['tx_signature_open'],
        status: 'success',
        executedAt: Date.now(),
        newPositionId: 'new_pos_xyz',
      };
    },
    setReEvaluate: () => {},
  };

  const positionProvider: IPositionProvider = {
    getPositions: async () => [],
    getPosition: async (_id) => {
      throw new Error('Not implemented');
    },
    getPoolInfo: async (_poolAddress): Promise<PoolInfo> => {
      return {
        poolAddress: MOCK_POOL_ADDRESS,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        feeRate: 100,
        activeBound: 1000,
        tokenXAddress: MOCK_POOL_ADDRESS,
        tokenYAddress: MOCK_POOL_ADDRESS,
        binStep: 1,
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
    saveKnown: async () => {},
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
    getAppliedDecision: () => appliedDecision,
  };
}

test('Issue #14: should sanitize decision.positionId before calling executor.apply in pending_open', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_STALE_POSITION_ID,
    action: 'open',
    openParams: {
      poolAddress: MOCK_POOL_ADDRESS,
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenXAmount: '500',
      tokenYAmount: '500',
    },
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now(),
  };

  const task: RebalanceTask = {
    id: 'task_issue_14',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_STALE_POSITION_ID,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [],
  };

  m.tasks.push(task);

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  const appliedDecision = m.getAppliedDecision();
  assert.ok(appliedDecision, 'executor.apply should have been called');

  // ISSUE #14: this test is intentionally failing
  // Currently, appliedDecision.positionId is still MOCK_STALE_POSITION_ID.
  // It should be sanitized to MOCK_POOL_ADDRESS or a neutral identifier before broadcast.
  assert.strictEqual(
    appliedDecision.positionId,
    MOCK_POOL_ADDRESS,
    'Stale positionId was passed to executor.apply for open leg'
  );
});

test.skip('Issue #14: regression guard - happy path open task completes successfully', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_POOL_ADDRESS, // Already fresh
    action: 'open',
    openParams: {
      poolAddress: MOCK_POOL_ADDRESS,
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenXAmount: '500',
      tokenYAmount: '500',
    },
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now(),
  };

  const task: RebalanceTask = {
    id: 'task_happy_path',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_POOL_ADDRESS,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [],
  };

  m.tasks.push(task);

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0, 'Task should be successfully completed and removed');
});
