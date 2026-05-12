/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { test } from 'node:test';
import assert from 'node:assert';
import { processTasks, startDiscovery } from './lifecycle.js';
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

const MOCK_PUBKEY_1 = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';

// Simple Mocks generator helper
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
      // Mock connection passed to getWalletBalances
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

test('processTasks - Scenario A: Standard rebalance (close+open)', async () => {
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
    isExecuting: true,
    tick: async (): Promise<StrategyResult> => {
      return {
        action: 'open',
        params: {
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

  // 1. Process 'pending_close'
  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(task.status, 'awaiting_settlement');
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'SETTLEMENT_POLLING'));
  assert.ok(task.events?.some((e) => e.stage === 'SETTLEMENT_DETECTED'));

  // 2. Process 'awaiting_settlement' -> transition to 'pending_open'
  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(task.status, 'pending_open');
  assert.ok(task.events?.some((e) => e.stage === 'JIT_REEVALUATION'));

  // 3. Process 'pending_open' -> completes and deletes
  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Task should be deleted
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.strictEqual(mockOrchestrator.isExecuting, false);
});

test('processTasks - Scenario B: Rebalance with JIT Abort', async () => {
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
    status: 'awaiting_settlement', // start at settlement to test skip leg
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [
      { stage: 'INIT', timestamp: Date.now() },
      { stage: 'CLOSE_BROADCAST', timestamp: Date.now() },
      { stage: 'CLOSE_CONFIRMED', timestamp: Date.now() },
      { stage: 'SETTLEMENT_POLLING', timestamp: Date.now() },
      { stage: 'SETTLEMENT_DETECTED', timestamp: Date.now() },
    ],
  };

  m.tasks.push(task);

  const mockOrchestrator: IOrchestrator = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    isExecuting: true,
    tick: async (): Promise<StrategyResult> => {
      return { action: 'skip' }; // skip signal!
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

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Task should be deleted on JIT abort
  assert.ok(task.events?.some((e) => e.stage === 'JIT_REEVALUATION'));
  assert.ok(task.events?.some((e) => e.stage === 'JIT_SKIPPED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.strictEqual(mockOrchestrator.isExecuting, false);
});

test('processTasks - Scenario C: Pure Close (close)', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'close', // pure close action
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
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };

  m.tasks.push(task);

  const mockOrchestrator: IOrchestrator = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    isExecuting: true,
    tick: async (): Promise<StrategyResult> => ({ action: 'skip' }),
  };
  m.orchestrators.push(mockOrchestrator);

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Pure close should complete and delete immediately without settlement/open
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.ok(!task.events?.some((e) => e.stage === 'SETTLEMENT_POLLING'));
  assert.strictEqual(mockOrchestrator.isExecuting, false);
});

test('processTasks - Scenario D: Pure Open (open)', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'open', // pure open action
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
    status: 'pending_open', // starts directly at pending_open
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };

  m.tasks.push(task);

  const mockOrchestrator: IOrchestrator = {
    id: 'assign_123',
    assignmentId: 'assign_123',
    positionId: MOCK_PUBKEY_1,
    strategyId: 'active-restake',
    mode: 'active',
    isExecuting: true,
    tick: async (): Promise<StrategyResult> => ({ action: 'skip' }),
  };
  m.orchestrators.push(mockOrchestrator);

  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Pure open should complete and delete
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.ok(!task.events?.some((e) => e.stage === 'CLOSE_BROADCAST'));
  assert.strictEqual(mockOrchestrator.isExecuting, false);
});

test('processTasks - Timeout Scenario', async () => {
  const m = createMocks();

  const decision: Decision = {
    positionId: MOCK_PUBKEY_1,
    action: 'close+open',
    sourceAssignmentId: 'assign_123',
    evaluatedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_close',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now() - 6 * 60 * 1000,
    events: [{ stage: 'INIT', timestamp: Date.now() - 6 * 60 * 1000 }],
  };

  m.tasks.push(task);

  // We only run timeout check and expect TIMEOUT event
  await processTasks(m.store, m.executor, m.positionProvider, m.rpcPool, MOCK_PUBKEY_1, m.registry, m.positionStore);

  assert.ok(task.events?.some((e) => e.stage === 'TIMEOUT'));
});

test('startDiscovery - Scenario E: Crash Recovery with newPositionId', async () => {
  const m = createMocks();
  const assignmentsList = [
    {
      id: 'assign_123',
      strategyId: 'active-restake',
      positionId: MOCK_PUBKEY_1,
      mode: 'active' as any,
      createdAt: Date.now(),
    },
  ];

  m.store.getAssignments = async () => assignmentsList;
  m.store.saveAssignment = async (assignment) => {
    const idx = assignmentsList.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) assignmentsList[idx] = assignment;
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    newPositionId: MOCK_PUBKEY_2, // This simulates success on-chain but crash before cleanup
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      evaluatedAt: Date.now(),
      sourceAssignmentId: 'assign_123',
    },
    evaluatedAt: Date.now(),
    events: [],
  };
  m.tasks.push(task);

  const factory = {
    create: (assignment: any) => {
      const orchestrator: IOrchestrator = {
        id: `orch_${assignment.id}`,
        assignmentId: assignment.id,
        positionId: assignment.positionId,
        strategyId: assignment.strategyId,
        mode: assignment.mode,
        isExecuting: false,
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run startDiscovery
  await startDiscovery(MOCK_PUBKEY_1, m.positionProvider, m.positionStore, factory, m.store, m.registry);

  // Assignment positionId must be updated to newPositionId
  assert.strictEqual(assignmentsList[0].positionId, MOCK_PUBKEY_2);

  // The task must be deleted from store
  assert.strictEqual(m.tasks.length, 0);

  // Orchestrator targeting the new position must be registered in the registry
  const registeredOrchs = m.registry.getForPosition(MOCK_PUBKEY_2);
  assert.strictEqual(registeredOrchs.length, 1);
  assert.strictEqual(registeredOrchs[0].id, 'orch_assign_123');
});

test('startDiscovery - Scenario F: Lock Restoration with Active Task', async () => {
  const m = createMocks();
  const assignmentsList = [
    {
      id: 'assign_123',
      strategyId: 'active-restake',
      positionId: MOCK_PUBKEY_1,
      mode: 'active' as any,
      createdAt: Date.now(),
    },
  ];

  m.store.getAssignments = async () => assignmentsList;

  // Position is still on-chain
  const livePositions = [
    {
      id: MOCK_PUBKEY_1,
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
      tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
      isInRange: true,
      openedAt: Date.now(),
      metadata: {},
    },
  ];
  m.positionProvider.getPositions = async () => livePositions;

  // Active in-flight task (pending_close)
  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_close',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'close',
      evaluatedAt: Date.now(),
      sourceAssignmentId: 'assign_123',
    },
    evaluatedAt: Date.now(),
    events: [],
  };
  m.tasks.push(task);

  const factory = {
    create: (assignment: any) => {
      const orchestrator: IOrchestrator = {
        id: `orch_${assignment.id}`,
        assignmentId: assignment.id,
        positionId: assignment.positionId,
        strategyId: assignment.strategyId,
        mode: assignment.mode,
        isExecuting: false,
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run startDiscovery
  await startDiscovery(MOCK_PUBKEY_1, m.positionProvider, m.positionStore, factory, m.store, m.registry);

  // Orchestrator must be registered
  const registeredOrchs = m.registry.getForPosition(MOCK_PUBKEY_1);
  assert.strictEqual(registeredOrchs.length, 1);

  // isExecuting lock must be restored to true!
  assert.strictEqual(registeredOrchs[0].isExecuting, true);
});

test('processTasks - Scenario G: Seamless Transition with newPositionId', async () => {
  const m = createMocks();
  const assignmentsList = [
    {
      id: 'assign_123',
      strategyId: 'active-restake',
      positionId: MOCK_PUBKEY_1,
      mode: 'active' as any,
      createdAt: Date.now(),
    },
  ];

  m.store.getAssignments = async () => assignmentsList;
  m.store.saveAssignment = async (assignment) => {
    const idx = assignmentsList.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) assignmentsList[idx] = assignment;
  };

  const knownPositionsList: Position[] = [
    {
      id: MOCK_PUBKEY_1,
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
      tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
      isInRange: true,
      openedAt: Date.now(),
      metadata: {},
    },
  ];
  m.positionStore.getKnown = async () => knownPositionsList;
  m.positionStore.saveKnown = async (positions) => {
    knownPositionsList.length = 0;
    knownPositionsList.push(...positions);
  };

  const newOnChainPos = {
    id: MOCK_PUBKEY_3,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana' as const,
    protocol: 'meteora_dlmm' as const,
    lowerBound: 1.1,
    upperBound: 2.1,
    tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '500' },
    tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '500' },
    isInRange: true,
    openedAt: Date.now(),
    metadata: {},
  };
  m.positionProvider.getPosition = async (id) => {
    if (id === MOCK_PUBKEY_3) return newOnChainPos;
    throw new Error('not found');
  };

  // Mock executor to return a successful record with newPositionId
  m.executor.apply = async (decision) => {
    return {
      id: 'exec_xyz',
      decision,
      txSignatures: ['tx_sig_xyz'],
      status: 'success',
      executedAt: Date.now(),
      newPositionId: MOCK_PUBKEY_3,
    };
  };

  const task: RebalanceTask = {
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      sourceAssignmentId: 'assign_123',
      openParams: {
        poolAddress: MOCK_PUBKEY_2,
        lowerBound: 1.1,
        upperBound: 2.1,
        tokenXAmount: '500',
        tokenYAmount: '500',
      },
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
    events: [],
  };
  m.tasks.push(task);

  const factory = {
    create: (assignment: any) => {
      const orchestrator: IOrchestrator = {
        id: `orch_${assignment.id}`,
        assignmentId: assignment.id,
        positionId: assignment.positionId,
        strategyId: assignment.strategyId,
        mode: assignment.mode,
        isExecuting: false,
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run processTasks
  await processTasks(
    m.store,
    m.executor,
    m.positionProvider,
    m.rpcPool,
    MOCK_PUBKEY_1,
    m.registry,
    m.positionStore,
    factory
  );

  // The assignment positionId must be updated
  assert.strictEqual(assignmentsList[0].positionId, MOCK_PUBKEY_3);

  // The new orchestrator must be registered in the registry targeting MOCK_PUBKEY_3
  const registeredOrchs = m.registry.getForPosition(MOCK_PUBKEY_3);
  assert.strictEqual(registeredOrchs.length, 1);

  // The old position must be removed from cache, and the new position must be added
  assert.strictEqual(knownPositionsList.length, 1);
  assert.strictEqual(knownPositionsList[0].id, MOCK_PUBKEY_3);
});
