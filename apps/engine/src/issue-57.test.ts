import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import http from 'http';
import {
  IPositionProvider,
  IExecutor,
  IOrchestratorRegistry,
  IOrchestrator,
  Position,
  PoolInfo,
  MarketSnapshot,
  Decision,
  StrategyResult,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { handlePositionsRouter } from './routes/positions.js';

const MOCK_POSITION_ID = 'pos_12345';
const MOCK_POOL_ADDRESS = 'pool_67890';
const MOCK_WALLET = 'wallet_abc';

function setupTestServer() {
  const position: Position = {
    id: MOCK_POSITION_ID,
    poolAddress: MOCK_POOL_ADDRESS,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 10,
    upperBound: 20,
    tokenX: { amount: '1000', decimals: 6, mint: 'mintX', tokenAddress: 'mintX' },
    tokenY: { amount: '2000', decimals: 6, mint: 'mintY', tokenAddress: 'mintY' },
    isInRange: true,
    openedAt: Date.now(),
    metadata: {
      feeX: '2500000',
      feeY: '1800000',
    },
  };

  const marketSnapshot: MarketSnapshot = {
    poolAddress: MOCK_POOL_ADDRESS,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    activeBound: 15,
    activeBinId: 15,
    price: 1.0,
    priceHistory: [],
    feeRate: 0.01,
    capturedAt: Date.now(),
  };

  const poolInfo: PoolInfo = {
    poolAddress: MOCK_POOL_ADDRESS,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    feeRate: 0.01,
    activeBound: 15,
    tokenXAddress: 'mintX',
    tokenYAddress: 'mintY',
    binStep: 1,
  };

  const positionProvider: IPositionProvider = {
    getPositions: async () => [position],
    getPosition: async (id) => {
      if (id === MOCK_POSITION_ID || id === 'pos_unassigned') return position;
      throw new Error(`Position ${id} not found`);
    },
    getPoolInfo: async () => poolInfo,
    getMarketSnapshot: async () => marketSnapshot,
  };

  let lastAppliedDecision: Decision | null = null;

  const executor: IExecutor = {
    apply: async (decision) => {
      lastAppliedDecision = decision;
      return {
        id: 'exec_1',
        decision,
        txSignatures: ['sig_123', 'sig_456'],
        status: 'success',
        executedAt: Date.now(),
      };
    },
    setReEvaluate: () => {},
  };

  const mockOrchestrator = {
    id: 'orch_1',
    assignmentId: 'assign_1',
    positionId: MOCK_POSITION_ID,
    strategyId: 'trailing-usdc',
    mode: 'active' as const,
    tick: async (): Promise<StrategyResult> => ({
      action: 'close+open',
      openParams: {
        poolAddress: MOCK_POOL_ADDRESS,
        lowerBound: 12,
        upperBound: 18,
        tokenXAmount: '500',
        tokenYAmount: '500',
      },
    }),
  };

  const registry: IOrchestratorRegistry = {
    register: () => {},
    deregister: () => {},
    deregisterByAssignmentId: () => {},
    getForPosition: (id) => (id === MOCK_POSITION_ID ? [mockOrchestrator as unknown as IOrchestrator] : []),
    get: () => undefined,
    getAll: () => [mockOrchestrator as unknown as IOrchestrator],
  };

  const factory = new OrchestratorFactory({
    'trailing-usdc': {
      id: 'trailing-usdc',
      description: 'Trailing USDC strategy',
      execute: async (): Promise<StrategyResult> => ({
        action: 'close+open',
        openParams: {
          poolAddress: MOCK_POOL_ADDRESS,
          lowerBound: 12,
          upperBound: 18,
          tokenXAmount: '500',
          tokenYAmount: '500',
        },
      }),
    },
  });

  const app = express();
  app.use(express.json());
  app.use('/positions', handlePositionsRouter(positionProvider, executor, registry, factory, MOCK_WALLET));

  const server = http.createServer(app);

  return new Promise<{ server: http.Server; url: string; getDecision: () => Decision | null }>((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      resolve({
        server,
        url: `http://localhost:${port}/positions`,
        getDecision: () => lastAppliedDecision,
      });
    });
  });
}

test('ISSUE #57: POST /positions/:id/actions with action=evaluate returns strategy result', async () => {
   const { server, url } = await setupTestServer();
   try {
     const res = await fetch(`${url}/${MOCK_POSITION_ID}/actions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'evaluate', strategyId: 'trailing-usdc' }),
     });

     assert.strictEqual(res.status, 200);
     const data = (await res.json()) as { status: string; action: string; result: StrategyResult };
     assert.strictEqual(data.status, 'success');
     assert.strictEqual(data.action, 'evaluate');
     assert.strictEqual(data.result.action, 'close+open');
   } finally {
     server.close();
   }
 });

test('ISSUE #57: POST /positions/:id/actions with action=removeLiquidity removes liquidity', async () => {
   const { server, url, getDecision } = await setupTestServer();
   try {
     const res = await fetch(`${url}/${MOCK_POSITION_ID}/actions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'removeLiquidity' }),
     });

     assert.strictEqual(res.status, 200);
     const data = (await res.json()) as { status: string; action: string; transactionSignatures: string[]; positionClosed: boolean };
     assert.strictEqual(data.status, 'success');
     assert.strictEqual(data.action, 'removeLiquidity');
     assert.deepStrictEqual(data.transactionSignatures, ['sig_123', 'sig_456']);
     assert.strictEqual(data.positionClosed, true);

     const decision = getDecision();
     assert.ok(decision);
     assert.strictEqual(decision.action, 'close');
     assert.strictEqual(decision.positionId, MOCK_POSITION_ID);
   } finally {
     server.close();
   }
 });

test('ISSUE #57: POST /positions/:id/actions with action=addLiquidity adds liquidity', async () => {
   const { server, url, getDecision } = await setupTestServer();
   try {
     const res = await fetch(`${url}/${MOCK_POSITION_ID}/actions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         action: 'addLiquidity',
         tokenXAmount: '100',
         tokenYAmount: '200',
         slippageTolerance: 50,
       }),
     });

     assert.strictEqual(res.status, 200);
     const data = (await res.json()) as { status: string; action: string; transactionSignatures: string[]; positionOpened: boolean };
     assert.strictEqual(data.status, 'success');
     assert.strictEqual(data.action, 'addLiquidity');
     assert.deepStrictEqual(data.transactionSignatures, ['sig_123', 'sig_456']);
     assert.strictEqual(data.positionOpened, true);

     const decision = getDecision();
     assert.ok(decision);
     assert.strictEqual(decision.action, 'open');
     assert.strictEqual(decision.positionId, MOCK_POSITION_ID);
     assert.ok(decision.openParams);
     assert.strictEqual(decision.openParams.tokenXAmount, '100');
     assert.strictEqual(decision.openParams.tokenYAmount, '200');
   } finally {
     server.close();
   }
 });

test('ISSUE #57: POST /positions/:id/actions with action=evaluate on unassigned position creates ad-hoc orchestrator and returns strategy result', async () => {
   const { server, url } = await setupTestServer();
   try {
     const res = await fetch(`${url}/pos_unassigned/actions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'evaluate', strategyId: 'trailing-usdc' }),
     });

     assert.strictEqual(res.status, 200);
     const data = (await res.json()) as { status: string; action: string; result: StrategyResult };
     assert.strictEqual(data.status, 'success');
     assert.strictEqual(data.action, 'evaluate');
     assert.strictEqual(data.result.action, 'close+open');
   } finally {
     server.close();
   }
 });
