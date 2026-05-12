/**
 * @file index.ts
 * @description Public API surface for the @lp-system/persistence package.
 *
 * @features
 * - Re-exports JsonFileStore (IStore implementation) and JsonPositionStore (IPositionStore implementation)
 *
 * @dependencies None
 * @sideEffects None
 */
export { JsonFileStore } from './json-file-store.js';
export { JsonPositionStore } from './json-position-store.js';
export { fileMutex, AsyncFileMutex } from './mutex.js';
