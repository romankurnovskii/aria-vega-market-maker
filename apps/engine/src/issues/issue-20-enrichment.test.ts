/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

import {
  Position,
  IStore,
  IOrchestratorRegistry,
  IExecutor,
  IPositionProvider,
  IPositionStore,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';

const MOCK_WALLET = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';

test('Issue #20: GET /positions returns enriched position data with price info', async (t) => {
  const positions: Position[] = [
    {
      id: 'pos_test_1',
      poolAddress: 'pool_test_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 100,
      upperBound: 110,
      tokenX: { tokenAddress: 'tokenX', mint: 'tokenX', decimals: 9, amount: '1000000000' },
      tokenY: { tokenAddress: 'tokenY', mint: 'tokenY', decimals: 6, amount: '1000000' },
      isInRange: true,
      openedAt: Date.now(),
      metadata: {},
    },
  ];

  const mockPositionStore = {
    getKnown: async () => positions,
    saveKnown: async () => {},
    archivePosition: async () => {},
    getArchived: async () => [],
  };

  const mockPositionProvider = {
    getPositions: async () => positions,
    getPosition: async () => positions[0],
    getPoolInfo: async () => ({
      poolAddress: 'pool_test_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      tokenXAddress: 'tokenX',
      tokenYAddress: 'tokenY',
      feeRate: 100,
      activeBound: 105,
    }),
    getMarketSnapshot: async () => ({
      poolAddress: 'pool_test_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      activeBound: 105,
      price: 1.5,
      priceHistory: [],
      feeRate: 100,
      capturedAt: Date.now(),
      activeBinId: 105,
    }),
  };

  const mockStore: Partial<IStore> = {
    getAssignments: async () => [],
    saveAssignment: async () => {},
    deleteAssignment: async () => {},
    getTasks: async () => [],
    saveTask: async () => {},
    deleteTask: async () => {},
    getExecutionRecords: async () => [],
    saveExecutionRecord: async () => {},
    archiveTask: async () => {},
  };

  const mockRegistry: Partial<IOrchestratorRegistry> = {
    register: () => {},
    deregister: () => {},
    deregisterByAssignmentId: () => {},
    getForPosition: () => [],
    get: () => undefined,
    getAll: () => [],
  };

  const mockExecutor: Partial<IExecutor> = {
    apply: async () => ({
      id: 'exec_1',
      decision: { positionId: 'pos_1', action: 'open', sourceAssignmentId: 'asg_1', evaluatedAt: Date.now() },
      txSignatures: ['sig_1'],
      status: 'success',
      executedAt: Date.now(),
    }),
    setReEvaluate: () => {},
  };

  const mockFactory: Partial<OrchestratorFactory> = {
    create: () => ({ id: 'orch_1' } as any),
    getAvailableStrategies: () => [],
  };

  const { startHttpServer } = await import('../server.js');
  const app = startHttpServer(
    mockStore as IStore,
    mockRegistry as IOrchestratorRegistry,
    mockExecutor as IExecutor,
    mockFactory as OrchestratorFactory,
    mockPositionProvider as IPositionProvider,
    MOCK_WALLET,
    mockPositionStore as IPositionStore
  );

  const response = await request(app).get('/positions');

  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(response.body.positions));
  assert.ok(response.body.positions.length > 0, 'No positions returned');

  const pos = response.body.positions[0];

  assert.ok(typeof pos.lowerBoundPrice === 'number', 'lowerBoundPrice should be a number');
  assert.ok(typeof pos.upperBoundPrice === 'number', 'upperBoundPrice should be a number');
  assert.ok(typeof pos.activeBin === 'number', 'activeBin should be a number');
  assert.ok(typeof pos.binCount === 'number', 'binCount should be a number');
  assert.ok(typeof pos.rangePercent === 'number', 'rangePercent should be a number');

  assert.strictEqual(pos.binCount, 11, 'binCount should be upperBound - lowerBound + 1');
  assert.ok(pos.lowerBoundPrice < pos.upperBoundPrice, 'lowerBoundPrice should be less than upperBoundPrice');
  assert.ok(pos.rangePercent > 0, 'rangePercent should be positive');
});
