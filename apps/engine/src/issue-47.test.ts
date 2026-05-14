// ISSUE #47: getPositions passes feeRate instead of binStep to getPriceFromBinId
// This test is intentionally failing under current implementation.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { startHttpServer } from './server.js';
import {
  IPositionProvider,
  Position,
  PoolInfo,
  MarketSnapshot,
  IStore,
  IOrchestratorRegistry,
  IExecutor,
  IPositionStore,
} from '@lp-system/core';
import { getPriceFromBinId } from '@lp-system/providers';

// --- Patch http.createServer to capture the HTTP server instance ---
let capturedServer: http.Server | null = null;

const originalCreateServer: any = http.createServer;
http.createServer = function (...args: any[]) {
  const server = originalCreateServer(...args);
  capturedServer = server;
  return server;
};

// Cleanup after all tests
after(() => {
  if (capturedServer) {
    capturedServer.close();
  }
  http.createServer = originalCreateServer;
});

// --- Mock data helpers ---

const mockPosition: Position = {
  id: 'test-position-47',
  poolAddress: 'pool-abc123',
  chain: 'solana',
  protocol: 'meteora_dlmm',
  lowerBound: -100,
  upperBound: 100,
  tokenX: {
    amount: '0',
    decimals: 9,
    tokenAddress: 'fake-mint-x-9decimals',
  },
  tokenY: {
    amount: '0',
    decimals: 6,
    tokenAddress: 'fake-mint-y-6decimals',
  },
  isInRange: true,
  openedAt: Date.now(),
  metadata: {},
};

const mockPoolInfo: PoolInfo = {
  poolAddress: 'pool-abc123',
  chain: 'solana',
  protocol: 'meteora_dlmm',
  feeRate: 3.95, // distinct from binStep to surface the bug
  activeBound: 0,
  tokenXAddress: 'fake-mint-x-9decimals',
  tokenYAddress: 'fake-mint-y-6decimals',
  binStep: 25, // any non‑40 value proves we don’t hard‑code 40
};

const mockMarketSnapshot: MarketSnapshot = {
  poolAddress: 'pool-abc123',
  chain: 'solana',
  protocol: 'meteora_dlmm',
  activeBound: 0,
  price: 1.0,
  feeRate: 3.95,
  capturedAt: Date.now(),
  priceHistory: [],
};

const createMockStore = (): IStore => ({
  getAssignments: async () => [],
  saveAssignment: async () => {},
  deleteAssignment: async () => {},
  getExecutionRecords: async () => [],
  saveExecutionRecord: async () => {},
  getTasks: async () => [],
  saveTask: async () => {},
  deleteTask: async () => {},
  archiveTask: async () => {},
});

const createMockRegistry = (): IOrchestratorRegistry => ({
  register: () => {},
  deregister: () => {},
  deregisterByAssignmentId: () => {},
  getForPosition: () => [],
  get: () => undefined,
  getAll: () => [],
});

const createMockExecutor = (): IExecutor => ({
  apply: async () => ({}) as any,
  setReEvaluate: () => {},
});

const mockFactory = {
  getAvailableStrategies: () => [],
};

const createMockPositionProvider = (): IPositionProvider => ({
  getPositions: async () => [mockPosition],
  getPosition: async () => mockPosition,
  getPoolInfo: async () => mockPoolInfo,
  getMarketSnapshot: async () => mockMarketSnapshot,
});

// --- Test ---

test('ISSUE #47: /positions endpoint uses binStep (not feeRate) to compute prices', async () => {
  // ISSUE #47: this test is intentionally failing under current implementation

  const store = createMockStore();
  const registry = createMockRegistry();
  const executor = createMockExecutor();
  const positionProvider = createMockPositionProvider();
  const walletAddress = 'test-wallet-47';
  const positionStore: IPositionStore | undefined = undefined;

  // Use port 0 to let OS pick an available port
  process.env.PORT = '0';

  startHttpServer(store, registry, executor, mockFactory as any, positionProvider, walletAddress, positionStore);

  // Wait for server to be listening
  await new Promise<void>((resolve, reject) => {
    if (capturedServer && capturedServer.listening) {
      resolve();
    } else if (capturedServer) {
      capturedServer.once('listening', resolve);
      capturedServer.once('error', reject);
    }
  });

  const actualPort = capturedServer!.address() as { port: number };
  const port = actualPort.port;

  // Make HTTP request to /positions
  const response = await fetch(`http://localhost:${port}/positions`);
  assert.strictEqual(response.status, 200, 'Expected HTTP 200 OK');

  const json = (await response.json()) as { positions: Array<{ lowerBoundPrice: number; upperBoundPrice: number }> };
  assert.ok(json.positions, 'Expected positions array in response');
  const enriched = json.positions[0];

  // Compute expected prices using correct binStep (from mockPoolInfo)
  const decimalsX = mockPosition.tokenX.decimals;
  const decimalsY = mockPosition.tokenY.decimals;
  const expectedLower = getPriceFromBinId(mockPosition.lowerBound, mockPoolInfo.binStep, decimalsX, decimalsY);
  const expectedUpper = getPriceFromBinId(mockPosition.upperBound, mockPoolInfo.binStep, decimalsX, decimalsY);

  // Assertions: these will fail because current code uses feeRate (3.95) as binStep
  assert.ok(
    Math.abs(enriched.lowerBoundPrice - expectedLower) < 0.001,
    `lowerBoundPrice should be computed with binStep=${mockPoolInfo.binStep}, got ${enriched.lowerBoundPrice}, expected ${expectedLower}`
  );
  assert.ok(
    Math.abs(enriched.upperBoundPrice - expectedUpper) < 0.001,
    `upperBoundPrice should be computed with binStep=${mockPoolInfo.binStep}, got ${enriched.upperBoundPrice}, expected ${expectedUpper}`
  );
});
