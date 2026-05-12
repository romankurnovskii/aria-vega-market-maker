import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { JsonFileStore } from './json-file-store.js';
import { Assignment, RebalanceTask } from '@lp-system/core';

const TEST_DATA_DIR = path.join(import.meta.dirname, '../../test-data-concurrency');

// Clean up helper
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

test('JsonFileStore - concurrent saveAssignment updates are atomic and no updates are lost', async () => {
  const store = new JsonFileStore(TEST_DATA_DIR);

  // Define 10 distinct assignments to save concurrently
  const assignments: Assignment[] = Array.from({ length: 10 }, (_, i) => ({
    id: `assign_${i}`,
    strategyId: 'active-restake',
    positionId: `pos_${i}`,
    walletAddress: 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh',
    lowerBound: 100,
    upperBound: 200,
    targetLiquidityX: '1000',
    targetLiquidityY: '1000',
    metadata: {},
    openedAt: Date.now(),
    mode: 'active',
    createdAt: Date.now(),
  }));

  // Perform concurrent saves
  await Promise.all(assignments.map((assignment) => store.saveAssignment(assignment)));

  // Retrieve assignments and assert that ALL 10 were saved without any being lost due to race conditions
  const saved = await store.getAssignments();
  assert.strictEqual(saved.length, 10);

  for (let i = 0; i < 10; i++) {
    const found = saved.find((a) => a.id === `assign_${i}`);
    assert.ok(found, `Assignment assign_${i} was lost!`);
  }
});

test('JsonFileStore - concurrent saveTask updates are atomic and no updates are lost', async () => {
  const store = new JsonFileStore(TEST_DATA_DIR);

  const tasks: RebalanceTask[] = Array.from({ length: 10 }, (_, i) => ({
    id: `task_${i}`,
    assignmentId: `assign_${i}`,
    status: 'pending_close',
    originalPositionId: `pos_${i}`,
    intent: {
      positionId: `pos_${i}`,
      action: 'close',
      sourceAssignmentId: `assign_${i}`,
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
    events: [],
  }));

  await Promise.all(tasks.map((task) => store.saveTask(task)));

  const saved = await store.getTasks();
  assert.strictEqual(saved.length, 10);

  for (let i = 0; i < 10; i++) {
    const found = saved.find((t) => t.id === `task_${i}`);
    assert.ok(found, `Task task_${i} was lost!`);
  }
});
