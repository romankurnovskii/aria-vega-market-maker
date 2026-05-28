/**
 * @file index.ts
 * @description Public API surface for the @lp-system/persistence package.
 *
 * @features
 * - Re-exports JsonFileStore (IStore), JsonPositionStore (IPositionStore), and JsonLineageStore (ILineageStore)
 *
 * @dependencies None
 * @sideEffects None
 */
export { JsonFileStore } from './json-file-store.js';
export { JsonPositionStore } from './json-position-store.js';
export { JsonLineageStore } from './json-lineage-store.js';
export { JsonStrategyStore } from './json-strategy-store.js';
export { fileMutex, AsyncFileMutex } from './mutex.js';
