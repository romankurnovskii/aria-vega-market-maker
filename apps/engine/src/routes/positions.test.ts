/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import { handlePositionsRouter } from './positions.js';

describe('Positions Router - applyStrategy Action', () => {
  let app: express.Application;
  let originalFetch: typeof fetch;

  // Mock states to verify interactions
  let lastCloseDecision: any = null;
  let lastOpenDecision: any = null;
  let applyCalls: string[] = [];
  let tickCount = 0;
  let tickMarkets: any[] = [];

  // Configurable mock outcomes
  let firstTickAction: 'close+open' | 'close' | 'open' | 'skip' = 'close+open';
  let secondTickAction: 'close+open' | 'open' | 'skip' = 'close+open';
  let closeStatus: 'success' | 'failed' = 'success';
  let openStatus: 'success' | 'failed' = 'success';

  let knownPositions: any[] = [];
  let archivedPositions: any[] = [];

  const mockPositionStore = {
    getKnown: async () => knownPositions,
    saveKnown: async (positions: any[]) => {
      knownPositions = positions;
    },
    getArchived: async () => archivedPositions,
    archivePosition: async (position: any) => {
      archivedPositions.push(position);
    },
  } as any;

  before(() => {
    // Save original fetch
    originalFetch = globalThis.fetch;

    // Mock global fetch to intercept Meteora Datapi calls
    globalThis.fetch = (async (url: string | URL | Request, _init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/pools/pool_123/ohlcv')) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      if (urlStr.includes('/pools/pool_123')) {
        // Return simulated pool data
        const current_price = urlStr.includes('second_evaluation') ? 1.05 : 1.0;
        return new Response(
          JSON.stringify({
            address: 'pool_123',
            current_price,
            dynamic_fee_pct: 0,
            pool_config: { bin_step: 100, base_fee_pct: 100 },
            token_x: { address: 'tokenX_mint', decimals: 6 },
            token_y: { address: 'tokenY_mint', decimals: 6 },
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;

    const mockPosition = {
      id: 'pos_123',
      poolAddress: 'pool_123',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 100,
      upperBound: 200,
      tokenX: { amount: '1000', decimals: 6, mint: 'tokenX_mint', tokenAddress: 'tokenX_mint' },
      tokenY: { amount: '2000', decimals: 6, mint: 'tokenY_mint', tokenAddress: 'tokenY_mint' },
      isInRange: true,
      openedAt: Date.now(),
      metadata: {},
    };

    const mockPositionProvider = {
      getPosition: async (id: string) => {
        if (id === 'new_pos_456') {
          return {
            id: 'new_pos_456',
            poolAddress: 'pool_123',
            chain: 'solana',
            protocol: 'meteora_dlmm',
            lowerBound: 110,
            upperBound: 210,
            tokenX: { amount: '1200', decimals: 6, mint: 'tokenX_mint', tokenAddress: 'tokenX_mint' },
            tokenY: { amount: '2200', decimals: 6, mint: 'tokenY_mint', tokenAddress: 'tokenY_mint' },
            isInRange: true,
            openedAt: Date.now(),
            metadata: {},
          };
        }
        return mockPosition;
      },
      getPositions: async () => [mockPosition],
      getPoolInfo: async () => ({ binStep: 100, feeRate: 0.01 }),
      getWalletBalances: async () => ({ amountX: '0', amountY: '0' }),
      getWalletAddress: async () => 'wallet_123',
      listWallets: async () => [],
    } as any;

    const mockExecutor = {
      apply: async (decision: any, _market: any) => {
        applyCalls.push(decision.action);
        if (decision.action === 'close') {
          lastCloseDecision = decision;
          return {
            id: 'exec_close',
            decision,
            txSignatures: ['sig_close'],
            status: closeStatus,
            executedAt: Date.now(),
            metrics: {
              baseFeeCollected: '1.25',
              quoteFeeCollected: '2.50',
            },
          };
        }
        if (decision.action === 'open') {
          lastOpenDecision = decision;
          return {
            id: 'exec_open',
            decision,
            txSignatures: ['sig_open'],
            status: openStatus,
            executedAt: Date.now(),
            newPositionId: 'new_pos_456',
          };
        }
        return { id: 'unknown', decision, txSignatures: [], status: 'failed', executedAt: Date.now() };
      },
      setReEvaluate: () => {},
    } as any;

    const mockOrchestrator = {
      id: 'orch_123',
      assignmentId: 'asg_123',
      positionId: 'pos_123',
      strategyId: 'strategy_123',
      mode: 'active',
      tick: async (_pos: any, market: any) => {
        tickCount++;
        tickMarkets.push(market);
        const action = tickCount === 1 ? firstTickAction : secondTickAction;
        if (action === 'close+open') {
          return {
            action: 'close+open',
            openParams: {
              poolAddress: 'pool_123',
              lowerBound: 110,
              upperBound: 210,
              lowerBinId: 110,
              upperBinId: 210,
              tokenXAmount: '1200',
              tokenYAmount: '2200',
            },
          };
        }
        if (action === 'close') {
          return { action: 'close' };
        }
        if (action === 'open') {
          return {
            action: 'open',
            openParams: {
              poolAddress: 'pool_123',
              lowerBound: 120,
              upperBound: 220,
              lowerBinId: 120,
              upperBinId: 220,
              tokenXAmount: '1300',
              tokenYAmount: '2300',
            },
          };
        }
        return { action: 'skip' };
      },
    } as any;

    const mockRegistry = {
      getForPosition: () => [mockOrchestrator],
    } as any;

    const mockFactory = {
      create: () => mockOrchestrator,
    } as any;

    app = express();
    app.use(express.json());
    app.use(
      '/positions',
      handlePositionsRouter(mockPositionProvider, mockExecutor, mockRegistry, mockFactory, mockPositionStore, 'wallet_123')
    );
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  const runRequest = async (body: any) => {
    return new Promise<any>((resolve) => {
      const req = {
        method: 'POST',
        url: '/positions/pos_123/actions',
        headers: { 'content-type': 'application/json' },
        body,
      };

      const mockRes: any = {
        statusCode: 200,
        setHeader: () => {},
        getHeader: () => {},
        removeHeader: () => {},
        status: (code: number) => {
          mockRes.statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          resolve({ status: mockRes.statusCode, body: data });
        },
      };

      (app as any).handle(req, mockRes);
    });
  };

  test('should handle applyStrategy suggesting close+open successfully', async () => {
    // Reset state variables
    lastCloseDecision = null;
    lastOpenDecision = null;
    applyCalls = [];
    tickCount = 0;
    tickMarkets = [];
    firstTickAction = 'close+open';
    secondTickAction = 'close+open';
    closeStatus = 'success';
    openStatus = 'success';
    knownPositions = [
      {
        id: 'pos_123',
        poolAddress: 'pool_123',
        chain: 'solana',
        protocol: 'meteora_dlmm',
        lowerBound: 100,
        upperBound: 200,
        tokenX: { amount: '1000', decimals: 6, mint: 'tokenX_mint', tokenAddress: 'tokenX_mint' },
        tokenY: { amount: '2000', decimals: 6, mint: 'tokenY_mint', tokenAddress: 'tokenY_mint' },
        isInRange: true,
        openedAt: Date.now(),
        metadata: {},
      },
    ];
    archivedPositions = [];

    const res = await runRequest({ action: 'applyStrategy', strategyId: 'strategy_123' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.appliedAction, 'close+open');
    assert.strictEqual(tickCount, 2); // Tick should be evaluated twice
    assert.deepStrictEqual(applyCalls, ['close', 'open']); // Close then Open should be dispatched
    assert.ok(lastCloseDecision);
    assert.ok(lastOpenDecision);
    assert.strictEqual(lastOpenDecision.openParams.tokenXAmount, '0.0012'); // Enriched decimal base token amount
    assert.strictEqual(lastOpenDecision.openParams.tokenYAmount, '0.0022'); // Enriched decimal quote token amount

    // Check fee collection and metrics
    assert.ok(res.body.closeRecord);
    assert.deepStrictEqual(res.body.closeRecord.metrics, {
      baseFeeCollected: '1.25',
      quoteFeeCollected: '2.50',
    });

    // Check newly opened position details
    assert.ok(res.body.newPosition);
    assert.strictEqual(res.body.newPosition.id, 'new_pos_456');

    // Check transaction signatures links
    assert.deepStrictEqual(res.body.transactionSignatures, ['sig_close', 'sig_open']);

    // Check state storage updates
    assert.strictEqual(knownPositions.length, 1);
    assert.strictEqual(knownPositions[0].id, 'new_pos_456');
    assert.strictEqual(archivedPositions.length, 1);
    assert.strictEqual(archivedPositions[0].id, 'pos_123');
    assert.strictEqual(archivedPositions[0].state, 'CLOSED');
    assert.strictEqual(archivedPositions[0].metadata.baseFeeCollected, '1.25');
    assert.strictEqual(archivedPositions[0].metadata.quoteFeeCollected, '2.50');
  });

  test('should handle applyStrategy suggesting close only', async () => {
    // Reset state
    lastCloseDecision = null;
    lastOpenDecision = null;
    applyCalls = [];
    tickCount = 0;
    tickMarkets = [];
    firstTickAction = 'close';

    const res = await runRequest({ action: 'applyStrategy', strategyId: 'strategy_123' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.appliedAction, 'close');
    assert.strictEqual(tickCount, 1); // Ticked once
    assert.deepStrictEqual(applyCalls, ['close']); // Only close should be dispatched
  });

  test('should handle applyStrategy suggesting skip only', async () => {
    // Reset state
    lastCloseDecision = null;
    lastOpenDecision = null;
    applyCalls = [];
    tickCount = 0;
    tickMarkets = [];
    firstTickAction = 'skip';

    const res = await runRequest({ action: 'applyStrategy', strategyId: 'strategy_123' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.appliedAction, 'skip');
    assert.strictEqual(tickCount, 1);
    assert.deepStrictEqual(applyCalls, []); // No execution dispatched
  });
});
