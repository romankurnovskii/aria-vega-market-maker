import { test } from 'node:test';
import assert from 'node:assert';
import { AsyncFileMutex } from './mutex.js';

// Helper to wait a short time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('AsyncFileMutex - serializes concurrent operations on the same key', async () => {
  const mutex = new AsyncFileMutex();
  const executionOrder: number[] = [];
  const key = '/path/to/some/file.json';

  // Queue three concurrent operations
  const op1 = mutex.runExclusive(key, async () => {
    await delay(50);
    executionOrder.push(1);
    return 'one';
  });

  const op2 = mutex.runExclusive(key, async () => {
    await delay(10);
    executionOrder.push(2);
    return 'two';
  });

  const op3 = mutex.runExclusive(key, async () => {
    executionOrder.push(3);
    return 'three';
  });

  const results = await Promise.all([op1, op2, op3]);

  // Assert that even though delay for op1 was longest and op3 was shortest,
  // they completed sequentially in strict FIFO queue order: 1, then 2, then 3.
  assert.deepStrictEqual(executionOrder, [1, 2, 3]);
  assert.deepStrictEqual(results, ['one', 'two', 'three']);
});

test('AsyncFileMutex - runs operations on different keys in parallel', async () => {
  const mutex = new AsyncFileMutex();
  const started: string[] = [];
  const completed: string[] = [];

  const keyA = '/path/to/fileA.json';
  const keyB = '/path/to/fileB.json';

  const opA = mutex.runExclusive(keyA, async () => {
    started.push('A');
    await delay(30);
    completed.push('A');
  });

  const opB = mutex.runExclusive(keyB, async () => {
    started.push('B');
    await delay(10);
    completed.push('B');
  });

  await Promise.all([opA, opB]);

  // Because they are on different keys, they should start concurrently (both starting before either finishes)
  assert.deepStrictEqual(started, ['A', 'B']);
  // Since B has a shorter delay, B should complete before A
  assert.deepStrictEqual(completed, ['B', 'A']);
});

test('AsyncFileMutex - releases lock and bubbles up errors', async () => {
  const mutex = new AsyncFileMutex();
  const key = '/path/to/faulty/file.json';
  const executionOrder: string[] = [];

  const op1 = mutex.runExclusive(key, async () => {
    executionOrder.push('op1_start');
    await delay(10);
    throw new Error('Op1 failed!');
  });

  const op2 = mutex.runExclusive(key, async () => {
    executionOrder.push('op2_run');
    return 'op2_success';
  });

  // Verify op1 throws the correct error
  await assert.rejects(op1, /Op1 failed!/);

  // Verify op2 still executes successfully after op1 failed
  const result2 = await op2;
  assert.strictEqual(result2, 'op2_success');
  assert.deepStrictEqual(executionOrder, ['op1_start', 'op2_run']);
});
