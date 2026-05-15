/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ISSUE #34: Split RebalanceTask into Independent Close/Open Operations
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
  IOrchestrator,
  StrategyResult,
} from '@lp-system/core';

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_1 = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';

function createMocks() {
  const tasks: RebalanceTask[] = [];
  const executionRecords: ExecutionRecord[] = [];
  const orchestrators: IOrchestrator[] = [];
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

  const executor: IExecutor & { pollBalances?: () => Promise<void> } = {
    apply: async (decision, _market) => {
      return {
        id: 'record_' + Date.now(),
        decision,
        txSignatures: ['tx_signature_123'],
        status: 'success',
        executedAt: Date.now(),
      };
    },
    setReEvaluate: () => {},
    pollBalances: async () => {},
  };

  const positionProvider: IPositionProvider = {
    getPositions: async () => [],
    getPosition: async (_id) => {
      throw new Error('Not implemented');
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
        getParsedTokenAccountsByOwner: async () => {
          return {
            value: [
              {
                account: {
                  data: {
                    parsed: {
                      info: {
                        mint: MOCK_PUBKEY_2,
                        tokenAmount: { amount: '1000000000' },
                      },
                    },
                  },
                },
              },
              {
                account: {
                  data: {
                    parsed: {
                      info: {
                        mint: MOCK_PUBKEY_3,
                        tokenAmount: { amount: '2000000000' },
                      },
                    },
                  },
                },
              },
            ],
          };
        },
      };
      return fn(mockConnection as any);
    },
  };

  const registry: IOrchestratorRegistry = {
    register: (orch) => {
      const idx = orchestrators.findIndex((o) => o.id === orch.id);
      if (idx >= 0) {
        orchestrators[idx] = orch;
      } else {
        orchestrators.push(orch);
      }
    },
    deregister: (id) => {
      const idx = orchestrators.findIndex((o) => o.id === id);
      if (idx >= 0) {
        orchestrators.splice(idx, 1);
      }
    },
    deregisterByAssignmentId: (assignmentId) => {
      const idx = orchestrators.findIndex((o) => o.assignmentId === assignmentId);
      if (idx >= 0) {
        orchestrators.splice(idx, 1);
      }
    },
    getForPosition: (posId) => orchestrators.filter((o) => o.positionId === posId),
    get: (id) => orchestrators.find((o) => o.id === id),
    getAll: () => orchestrators,
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
    executionRecords,
    orchestrators,
    knownPositions,
  };
}

test('ISSUE #34: RebalanceTask should split close and open into independent operations', async () => {
  // ISSUE #34: this test is intentionally failing under current monolithic implementation
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'close+open',
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
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_close',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now(), message: 'Init task' }],
  };

  m.tasks.push(task);

  const mockOrchestrator: IOrchestrator = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    tick: async (): Promise<StrategyResult> => {
      return {
        action: 'open',
        openParams: {
          poolAddress: MOCK_PUBKEY_2,
          lowerBound: 1.1,
          upperBound: 2.1,
          tokenXAmount: '500',
          tokenYAmount: '500',
        },
      };
    },
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

  // 1. Process the close operation
  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // Under decoupled semantics, after the close operation completes, the close task should be deleted immediately
  // and the position should be marked as CLOSED or awaiting independent open.
  // Currently, it transitions to 'awaiting_settlement' and keeps the monolithic task alive.
  assert.strictEqual(
    m.tasks.length,
    0,
    'ISSUE #34: Monolithic RebalanceTask should be deleted upon close completion, decoupling the open leg'
  );
});
