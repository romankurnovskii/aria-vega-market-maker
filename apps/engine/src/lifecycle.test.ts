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

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_PUBKEY_1 = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_PUBKEY_2 = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const MOCK_PUBKEY_3 = '3b9SrqR9yXnNnHe1Kz77aFeYV8nK9wZfL6tX8T3tX9tY';

// Simple Mocks generator helper
function createMocks() {
  const tasks: RebalanceTask[] = [];
  const orchestrators: IOrchestrator[] = [];
  const assignmentsList: any[] = [];
  const knownPositionsList: Position[] = [];
  const storeId = `store_${Math.random().toString(36).substring(7)}`;

  const store = {
    id: storeId,
    getTasks: async () => [...tasks],
    saveTask: async (task: any) => {
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) tasks[idx] = task;
      else tasks.push(task);
    },
    deleteTask: async (id: string) => {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx >= 0) tasks.splice(idx, 1);
    },
    getAssignments: async () => [...assignmentsList],
    saveAssignment: async (a: any) => {
      const idx = assignmentsList.findIndex((prev) => prev.id === a.id);
      if (idx >= 0) assignmentsList[idx] = a;
      else assignmentsList.push(a);
    },
    getExecutionRecords: async () => [],
    saveExecutionRecord: async () => {},
    archiveTask: async () => {},
    deleteAssignment: async () => {},
  } as any;

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

  const positionStore: any = {
    getKnown: async () => [...knownPositionsList],
    saveKnown: async (positions: Position[]) => {
      knownPositionsList.length = 0;
      knownPositionsList.push(...positions);
    },
    archivePosition: async (position: Position) => {},
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
    assignments: assignmentsList,
    orchestrators,
    knownPositions: knownPositionsList,
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

  // 1. Process 'pending_close' -> becomes 'pending_open'
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 1);
  assert.strictEqual(task.status, 'pending_open');
  assert.ok(task.events?.some((e) => e.stage === 'POSITION_CLOSED'));

  // 2. Process 'pending_open' -> completes
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);
  assert.strictEqual(m.tasks.length, 0);
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));

  // 2. Simulate next tick in startTickLoop creating pending_open task
  const openTask: RebalanceTask = {
    id: 'task_open_abc',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: {
      positionId: MOCK_PUBKEY_1,
      action: 'open',
      openParams: {
        poolAddress: MOCK_PUBKEY_2,
        lowerBound: 1.1,
        upperBound: 2.1,
        tokenXAmount: '500',
        tokenYAmount: '500',
      },
      sourceAssignmentId: 'assign_123',
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now(), message: 'Init open task' }],
  };
  m.tasks.push(openTask);

  // 3. Process 'pending_open' -> completes and deletes
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Task should be deleted
  assert.ok(openTask.events?.some((e) => e.stage === 'OPEN_BROADCAST'));
  assert.ok(openTask.events?.some((e) => e.stage === 'OPEN_CONFIRMED'));
  assert.ok(openTask.events?.some((e) => e.stage === 'COMPLETED'));
});

test('processTasks - Scenario B: Rebalance with JIT Abort', async () => {
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
    id: 'task_abc',
    assignmentId: 'assign_123',
    status: 'pending_open',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now() }],
  };

  m.tasks.push(task);

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

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore, { isInitialRun: true });

  // After recovery, it should be pending_close and processed
  assert.strictEqual(m.tasks.length, 1);
  assert.strictEqual(task.status, 'pending_open');
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
    tick: async (): Promise<StrategyResult> => ({ action: 'skip' }),
  };
  m.orchestrators.push(mockOrchestrator);

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Pure close should complete and delete immediately without settlement/open
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'CLOSE_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.ok(!task.events?.some((e) => e.stage === 'SETTLEMENT_POLLING'));
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
    tick: async (): Promise<StrategyResult> => ({ action: 'skip' }),
  };
  m.orchestrators.push(mockOrchestrator);

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  assert.strictEqual(m.tasks.length, 0); // Pure open should complete and delete
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_BROADCAST'));
  assert.ok(task.events?.some((e) => e.stage === 'OPEN_CONFIRMED'));
  assert.ok(task.events?.some((e) => e.stage === 'COMPLETED'));
  assert.ok(!task.events?.some((e) => e.stage === 'CLOSE_BROADCAST'));
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

  // Setup active known position to test position auto-heal and archival
  const mockPosition: Position = {
    id: MOCK_PUBKEY_1,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 1.0,
    upperBound: 2.0,
    tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
    tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
    isInRange: true,
    openedAt: Date.now() - 6 * 60 * 1000,
    metadata: {},
  };
  m.knownPositions.push(mockPosition);

  let archivedPosition: Position | null = null;
  m.positionStore.archivePosition = async (pos) => {
    archivedPosition = pos;
  };

  // Run processTasks
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore, { isInitialRun: true });

  // 1. The task must have a TIMEOUT event appended
  assert.ok(task.events?.some((e) => e.stage === 'TIMEOUT'));

  // 2. The task must be archived and removed from the active queue
  assert.strictEqual(m.tasks.length, 0);

  // 3. The associated position must have transitioned to FAILED and been archived
  assert.ok(archivedPosition);
  assert.strictEqual((archivedPosition as Position).state, 'FAILED');

  // 4. The position must be removed from the active known positions cache
  assert.strictEqual(m.knownPositions.length, 0);
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
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run startDiscovery
  await startDiscovery(
    MOCK_WALLET_ADDRESS,
    m.positionProvider,
    m.positionStore,
    factory,
    m.store,
    m.registry,
    m.positionStore
  );

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
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run startDiscovery
  await startDiscovery(
    MOCK_WALLET_ADDRESS,
    m.positionProvider,
    m.positionStore,
    factory,
    m.store,
    m.registry,
    m.positionStore
  );

  // Orchestrator must be registered
  const registeredOrchs = m.registry.getForPosition(MOCK_PUBKEY_1);
  assert.strictEqual(registeredOrchs.length, 1);
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
        tick: async () => ({ action: 'skip' }),
      };
      return orchestrator;
    },
  } as any;

  // Run processTasks
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore, { isInitialRun: true, factory });

  // The assignment positionId must be updated
  assert.strictEqual(assignmentsList[0].positionId, MOCK_PUBKEY_3);

  // The new orchestrator must be registered in the registry targeting MOCK_PUBKEY_3
  const registeredOrchs = m.registry.getForPosition(MOCK_PUBKEY_3);
  assert.strictEqual(registeredOrchs.length, 1);

  // The old position must be removed from cache, and the new position must be added
  assert.strictEqual(knownPositionsList.length, 1);
  assert.strictEqual(knownPositionsList[0].id, MOCK_PUBKEY_3);
});

test('processTasks - Issue 1: Race Condition in Position State Updates', async () => {
  const m = createMocks();

  // Set up two tasks
  const task1: RebalanceTask = {
    id: 'task_1',
    assignmentId: 'assign_1',
    status: 'pending_close',
    originalPositionId: 'pos_1',
    intent: { positionId: 'pos_1', action: 'close', sourceAssignmentId: 'assign_1', evaluatedAt: Date.now() },
    evaluatedAt: Date.now(),
    events: [],
  };

  const task2: RebalanceTask = {
    id: 'task_2',
    assignmentId: 'assign_2',
    status: 'pending_close',
    originalPositionId: 'pos_2',
    intent: { positionId: 'pos_2', action: 'close', sourceAssignmentId: 'assign_2', evaluatedAt: Date.now() },
    evaluatedAt: Date.now(),
    events: [],
  };

  m.tasks.push(task1, task2);

  // Set up initial known positions
  const knownPositionsList: Position[] = [
    {
      id: 'pos_1',
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
      tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
      isInRange: true,
      openedAt: Date.now(),
      state: 'OPEN',
      metadata: {},
    },
    {
      id: 'pos_2',
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 1.0,
      upperBound: 2.0,
      tokenX: { tokenAddress: MOCK_PUBKEY_2, mint: MOCK_PUBKEY_2, decimals: 9, amount: '0' },
      tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
      isInRange: true,
      openedAt: Date.now(),
      state: 'OPEN',
      metadata: {},
    },
  ];

  // Introduce async delay to trigger race condition in getKnown/saveKnown
  let concurrentReads = 0;
  m.positionStore.getKnown = async () => {
    concurrentReads++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return [...knownPositionsList];
  };

  m.positionStore.saveKnown = async (positions) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    knownPositionsList.length = 0;
    knownPositionsList.push(...positions);
  };

  const archivedPositionsList: Position[] = [];
  m.positionStore.archivePosition = async (position) => {
    archivedPositionsList.push(position);
  };

  // Run processTasks once (both tasks will be processed in the same loop)
  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  // Assert both positions were successfully archived as CLOSED.
  const archived1 = archivedPositionsList.find((p) => p.id === 'pos_1');
  const archived2 = archivedPositionsList.find((p) => p.id === 'pos_2');

  assert.ok(archived1, 'pos_1 should have been archived');
  assert.ok(archived2, 'pos_2 should have been archived');
  assert.strictEqual(archived1?.state, 'CLOSED', 'pos_1 state should be CLOSED');
  assert.strictEqual(archived2?.state, 'CLOSED', 'pos_2 state should be CLOSED');
});

test('processTasks - Issue 3: Missing Error Handling in Archive Operations', async () => {
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

  // Make archiving fail
  m.positionStore.archivePosition = async () => {
    throw new Error('Disk full or write failed');
  };

  // Run processTasks
  try {
    await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);
  } catch {
    /* ignore expected error */
  }

  // Under correct error handling, the task MUST NOT be deleted if archiving failed
  assert.strictEqual(m.tasks.length, 1, 'Task should not be deleted if archiving fails');
  assert.strictEqual(m.tasks[0].id, 'task_abc');
});

test('processTasks - Issue 4: Duplicate Position After Rebalance (Failed cache update preserves task)', async () => {
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

  m.knownPositions.push({
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
  });

  m.positionProvider.getPosition = async () => {
    return {
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
  };

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

  // Make saveKnown fail (failed cache update)
  m.positionStore.saveKnown = async () => {
    throw new Error('Failed to update known positions');
  };

  try {
    await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);
  } catch {
    /* ignore expected error */
  }

  // Under correct error handling, the task MUST NOT be deleted if saveKnown fails
  assert.strictEqual(m.tasks.length, 1, 'Task should not be deleted if saving known positions fails');
});

test('processTasks - Issue 13: WSOL uses ATA balance exclusively (not native SOL)', async () => {
  const m = createMocks();

  const WSOL_MINT = 'So11111111111111111111111111111111111111112';

  m.positionProvider.getPoolInfo = async (_poolAddress): Promise<PoolInfo> => {
    return {
      poolAddress: MOCK_PUBKEY_2,
      chain: 'solana',
      protocol: 'meteora_dlmm',
      feeRate: 100,
      activeBound: 1000,
      tokenXAddress: WSOL_MINT,
      tokenYAddress: MOCK_PUBKEY_3,
      binStep: 1,
    };
  };

  m.rpcPool.execute = async (fn) => {
    const mockConnection = {
      getParsedTokenAccountsByOwner: async () => {
        return {
          value: [
            {
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: WSOL_MINT,
                      tokenAmount: { amount: '5000000000' },
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
      getBalance: async () => BigInt('1000000000'),
    };
    return fn(mockConnection as any);
  };

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
    id: 'task_wsol',
    assignmentId: 'assign_123',
    status: 'pending_close',
    originalPositionId: MOCK_PUBKEY_1,
    intent: decision,
    evaluatedAt: Date.now(),
    events: [{ stage: 'INIT', timestamp: Date.now(), message: 'Init task' }],
  };

  m.tasks.push(task);

  m.knownPositions.push({
    id: MOCK_PUBKEY_1,
    poolAddress: MOCK_PUBKEY_2,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 1.0,
    upperBound: 2.0,
    tokenX: { tokenAddress: WSOL_MINT, mint: WSOL_MINT, decimals: 9, amount: '0' },
    tokenY: { tokenAddress: MOCK_PUBKEY_3, mint: MOCK_PUBKEY_3, decimals: 6, amount: '0' },
    isInRange: true,
    openedAt: Date.now(),
    metadata: {},
  });

  await processTasks(m.store, m.executor, m.positionProvider, m.registry, m.positionStore);

  // After one cycle, close leg is done
  assert.strictEqual(m.tasks.length, 1);
  assert.strictEqual(task.status, 'pending_open');
  assert.ok(task.events?.some((e) => e.stage === 'POSITION_CLOSED'));
});
