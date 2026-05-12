import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { JsonPositionStore } from './json-position-store.js';
import { Position } from '@lp-system/core';

const TEST_DATA_DIR = path.join(import.meta.dirname, '../../test-data-position-store');

async function cleanTestDir() {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

test.beforeEach(async () => {
  await cleanTestDir();
});

test.afterEach(async () => {
  await cleanTestDir();
});

test('JsonPositionStore - saveKnown retains CLOSED and FAILED states instead of filtering them out', async () => {
  const store = new JsonPositionStore(TEST_DATA_DIR);

  const positions: Position[] = [
    {
      id: 'pos_open',
      poolAddress: 'pool_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 10,
      upperBound: 20,
      tokenX: { tokenAddress: 'x', mint: 'x', decimals: 9, amount: '100' },
      tokenY: { tokenAddress: 'y', mint: 'y', decimals: 6, amount: '100' },
      isInRange: true,
      openedAt: Date.now(),
      state: 'OPEN',
      metadata: {},
    },
    {
      id: 'pos_closed',
      poolAddress: 'pool_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 10,
      upperBound: 20,
      tokenX: { tokenAddress: 'x', mint: 'x', decimals: 9, amount: '100' },
      tokenY: { tokenAddress: 'y', mint: 'y', decimals: 6, amount: '100' },
      isInRange: true,
      openedAt: Date.now(),
      state: 'CLOSED',
      metadata: {},
    },
    {
      id: 'pos_failed',
      poolAddress: 'pool_1',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      lowerBound: 10,
      upperBound: 20,
      tokenX: { tokenAddress: 'x', mint: 'x', decimals: 9, amount: '100' },
      tokenY: { tokenAddress: 'y', mint: 'y', decimals: 6, amount: '100' },
      isInRange: true,
      openedAt: Date.now(),
      state: 'FAILED',
      metadata: {},
    },
  ];

  await store.saveKnown(positions);

  const saved = await store.getKnown();

  // We assert that closed and failed positions are NOT dropped by saveKnown.
  const closedPos = saved.find((p) => p.id === 'pos_closed');
  const failedPos = saved.find((p) => p.id === 'pos_failed');

  assert.ok(closedPos, 'CLOSED position should be retained in known positions store');
  assert.strictEqual(closedPos.state, 'CLOSED');

  assert.ok(failedPos, 'FAILED position should be retained in known positions store');
  assert.strictEqual(failedPos.state, 'FAILED');
});
