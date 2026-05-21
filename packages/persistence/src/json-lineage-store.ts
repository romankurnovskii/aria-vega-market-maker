/**
 * @file json-lineage-store.ts
 * @description JSON file-based implementation of ILineageStore with file-path scoped async mutex protection.
 *
 * @features
 * - Thread-safe atomic read-modify-write operations for PositionLineageRecord entities
 * - Slices/searches lineage records by position ID (either closed or new)
 * - Uses shared AsyncFileMutex singleton `fileMutex` to serialize same-file disk accesses.
 *
 * @dependencies ILineageStore, PositionLineageRecord (from @lp-system/core), fileMutex (from ./mutex.js)
 * @sideEffects Mutates file system (reads/writes JSON files under data directory)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ILineageStore, PositionLineageRecord } from '@lp-system/core';
import { fileMutex } from './mutex.js';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('json-lineage-store');

/**
 * Options for configuring namespaced storage files.
 */
export interface StoreOptions {
  wallet?: string;
  env?: string;
}

/**
 * Truncates and formats a wallet public key to a compact representation.
 * E.g., HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh -> HU5H_YUQh
 *
 * @param {string} wallet - Full Solana public key or identifier.
 * @returns {string} Sliced version of the public key.
 */
function getShortWallet(wallet: string): string {
  if (wallet.length <= 8) return wallet;
  return `${wallet.slice(0, 4)}_${wallet.slice(-4)}`;
}

/**
 * JsonLineageStore: persists position close->open rebalance transitions to a local JSON file under lock.
 * Ensures concurrent calls do not overlap.
 */
export class JsonLineageStore implements ILineageStore {
  private lineagePath: string;

  /**
   * Constructs the lineage store with a directory path and optional namespacing options.
   *
   * @param {string} directoryPath - Base directory where files live.
   * @param {StoreOptions} [options] - Optional namespacing configuration.
   */
  constructor(
    private directoryPath: string,
    options?: StoreOptions
  ) {
    const parts: string[] = [];
    if (options?.wallet) {
      parts.push(getShortWallet(options.wallet));
    }
    if (options?.env) {
      parts.push(options.env);
    }
    const prefix = parts.length > 0 ? `${parts.join('_')}_` : '';
    this.lineagePath = path.join(directoryPath, `${prefix}lineage.json`);
  }

  /**
   * Ensures the data directory exists before write operations.
   *
   * @private
   */
  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directoryPath, { recursive: true });
  }

  /**
   * Reads all lineage records from disk under lock.
   * Returns [] if the file does not exist.
   *
   * @returns {Promise<PositionLineageRecord[]>} Array of persisted lineage records.
   */
  public async getLineage(): Promise<PositionLineageRecord[]> {
    return fileMutex.runExclusive(this.lineagePath, async () => {
      try {
        const data = await fs.readFile(this.lineagePath, 'utf-8');
        return JSON.parse(data) as PositionLineageRecord[];
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          logger.warn(`[JsonLineageStore] JSON parsing failed for lineage. Auto-recovering with empty array.`);
          return [];
        }
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Appends a new lineage record to the ledger under lock.
   *
   * @param {PositionLineageRecord} record - The rebalance transition lineage record.
   */
  public async saveLineageRecord(record: PositionLineageRecord): Promise<void> {
    return fileMutex.runExclusive(this.lineagePath, async () => {
      await this.ensureDirectory();
      let records: PositionLineageRecord[] = [];
      try {
        const data = await fs.readFile(this.lineagePath, 'utf-8');
        records = JSON.parse(data) as PositionLineageRecord[];
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          logger.warn(`[JsonLineageStore] JSON parsing failed for lineage on write. Resetting.`);
        } else if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
          throw error;
        }
      }
      records.push(record);
      await fs.writeFile(this.lineagePath, JSON.stringify(records, null, 2), 'utf-8');
      logger.info(`[JsonLineageStore] Saved lineage record: ${record.closedPositionId} -> ${record.newPositionId}`);
    });
  }

  /**
   * Retrieves all lineage records relating to a specific position ID (closed or new).
   *
   * @param {string} positionId - Position ID to query.
   * @returns {Promise<PositionLineageRecord[]>} Lineage chain segments involving the position.
   */
  public async getLineageForPosition(positionId: string): Promise<PositionLineageRecord[]> {
    const all = await this.getLineage();
    return all.filter((r) => r.closedPositionId === positionId || r.newPositionId === positionId);
  }
}
