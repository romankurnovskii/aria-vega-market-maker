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
  IRpcPool,
  IOrchestratorRegistry,
  IPositionStore,
  IOrchestrator,
  StrategyResult,
} from '@lp-system/core';

const MOCK_WALLET_ADDRESS = 'WALTqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_1 = 'POS1qv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';
const WSOL_MINT = 'So11111111111111111111111111111111111111112';

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

  const executor: IExecutor & { applyCalls: any[] } = {
    applyCalls: [],
    apply: async (decision, _market) => {
      executor.applyCalls.push(decision);
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
    getPoolInfo: async (poolAddress): Promise<PoolInfo> => ({
      poolAddress,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      feeRate: 100,
      activeBound: 1000,
      tokenXAddress: MOCK_PUBKEY_2,
      tokenYAddress: MOCK_PUBKEY_3,
    }),
    getMarketSnapshot: async (poolAddress): Promise<MarketSnapshot> => ({
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

  const rpcPool: IRpcPool = {
    getConnection: () => ({}),
    execute: async (fn) => {
      const mockConnection = {
        getParsedTokenAccountsByOwner: async () => ({
          value: [{ account: { data: { parsed: { info: { mint: WSOL_MINT, tokenAmount: { amount: '1000000000' } } } } } }],
        }),
        getBalance: async () => 2000000000,
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

// ISSUE #17: PV-JIT-03 - Stale signal (> 180s) should transition back to awaiting_settlement
test('PV-JIT-03: Stale signal (> 180s) transitions back to awaiting_settlement', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'close+open',
    openParams: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.0, upperBound: 2.0, tokenXAmount: '500', tokenYAmount: '500' },
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now() - 181000,
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now() - 181000,
    events: [{ stage: 'INIT', timestamp: Date.now() - 181000 }],
  };

  m.tasks.push(task);

  // Add mock orchestrator to simulate strategy behavior
  const mockOrchestrator: IOrchestrator = {
    id: 'orch_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'test-strategy',
    mode: 'active',
    tick: async () => ({
      action: 'open',
      params: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.0, upperBound: 2.0, tokenXAmount: '500', tokenYAmount: '500' },
    }),
  };
  m.orchestrators.push(mockOrchestrator);

  // Add a known position to satisfy potential checks within processTasks
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

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // ISSUE #17: Stale signal should revert to awaiting_settlement, not proceed with open
  assert.strictEqual(
    task.status,
    'awaiting_settlement',
    'Task should revert to awaiting_settlement if JIT signal is stale (> 180s)'
  );
  assert.strictEqual(m.executor.applyCalls.length, 0, 'Should not have called executor.apply for open leg on stale signal');
});

// ISSUE #17: BUG-02 - WSOL handling should use WSOL ATA balance, not native SOL
test('BUG-02: WSOL handling - uses WSOL ATA balance, not native SOL', async () => {
  const m = createMocks();

  m.rpcPool.execute = async (fn) => {
    const mockConnection = {
      getParsedTokenAccountsByOwner: async () => ({
        value: [{ account: { data: { parsed: { info: { mint: WSOL_MINT, tokenAmount: { amount: '100000000' } } } } } }],
      }),
      getBalance: async () => 2000000000, // 2 SOL native
    };
    return fn(mockConnection as any);
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'awaiting_settlement',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      openParams: { poolAddress: MOCK_PUBKEY_2, lowerBound: 1.0, upperBound: 2.0, tokenXAmount: '500', tokenYAmount: '500' },
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
    events: [],
  };

  m.tasks.push(task);

  m.positionProvider.getPoolInfo = async (poolAddress): Promise<PoolInfo> => ({
    poolAddress,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    feeRate: 100,
    activeBound: 1000,
    tokenXAddress: WSOL_MINT,
    tokenYAddress: MOCK_PUBKEY_3,
  });

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // ISSUE #17: BUG-02 - For WSOL pools, should use ATA balance (100000000), not native SOL (2000000000)
  const appliedDecision = m.executor.applyCalls[0];
  assert.strictEqual(
    appliedDecision.openParams.tokenXAmount,
    '100000000',
    'Should use WSOL ATA balance, not native SOL balance'
  );
});

// ISSUE #17: PV-CAPITAL-01 - SOL amount capped when wallet balance is near rent buffer
test('PV-CAPITAL-01: SOL amount capped when wallet balance is near rent buffer', async () => {
  const m = createMocks();

  m.rpcPool.execute = async (fn) => {
    const mockConnection = {
      getParsedTokenAccountsByOwner: async () => ({ value: [] }),
      getBalance: async () => 90_000_000, // 0.09 SOL
    };
    return fn(mockConnection as any);
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'awaiting_settlement',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      openParams: {
        poolAddress: MOCK_PUBKEY_2,
        lowerBound: 1.0,
        upperBound: 2.0,
        tokenXAmount: '89000000',
        tokenYAmount: '0',
      },
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
    events: [],
  };

  m.tasks.push(task);

  m.positionProvider.getPoolInfo = async (poolAddress): Promise<PoolInfo> => ({
    poolAddress,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    feeRate: 100,
    activeBound: 1000,
    tokenXAddress: WSOL_MINT,
    tokenYAddress: MOCK_PUBKEY_3,
  });

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_WALLET_ADDRESS, m.registry, m.positionStore);

  // ISSUE #17: PV-CAPITAL-01 - Should cap deposit to balance - buffer = 0.09 - 0.08 = 0.01 SOL = 10,000,000
  const appliedDecision = m.executor.applyCalls[0];
  const amount = BigInt(appliedDecision.openParams.tokenXAmount);
  assert.ok(amount <= 10_000_000n, `SOL deposit should be capped by rent buffer. Got: ${amount}`);
});
