/**
 * @file json-position-store.ts
 * @description JSON file-based implementation of IPositionStore with file-path scoped async mutex protection.
 *
 * @features
 * - Loads/saves Position[] to known_positions.json in the configured directory
 * - Thread-safe atomic file writing and reading using path-scoped AsyncFileMutex singleton `fileMutex`
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { IPositionStore, Position } from '@lp-system/core';
import { fileMutex } from './mutex.js';

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
 * JsonPositionStore: persists known positions to a local JSON file under lock.
 * Ensures concurrent calls do not overlap.
 */
export class JsonPositionStore implements IPositionStore {
  private knownPositionsPath: string;
  private archivePositionsPath: string;

  /**
   * Constructs the store with a directory path and optional namespacing options.
   *
   * @param {string} directoryPath - Base directory for persistence files.
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
    const filename = parts.length > 0 ? `${parts.join('_')}_positions.json` : 'known_positions.json';
    this.knownPositionsPath = path.join(directoryPath, filename);

    const archiveFilename = parts.length > 0 ? `${parts.join('_')}_position_history.json` : 'position_history.json';
    this.archivePositionsPath = path.join(directoryPath, archiveFilename);
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
   * Reads all known positions from disk under lock.
   * Returns [] if the file does not exist.
   *
   * @returns {Promise<Position[]>} Array of persisted Position objects.
   */
  public async getKnown(): Promise<Position[]> {
    return fileMutex.runExclusive(this.knownPositionsPath, async () => {
      try {
        const data = await fs.readFile(this.knownPositionsPath, 'utf-8');
        return JSON.parse(data) as Position[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Serializes and writes the entire known positions list to disk under lock.
   *
   * @param {Position[]} positions - Full list of currently tracked positions.
   */
  public async saveKnown(positions: Position[]): Promise<void> {
    const activeStates = ['OPEN', 'CREATING', 'REBALANCING', 'CLOSING'];
    const activePositions = positions.filter((p) => !p.state || activeStates.includes(p.state));
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.knownPositionsPath, async () => {
      await fs.writeFile(this.knownPositionsPath, JSON.stringify(activePositions, null, 2), 'utf-8');
    });
  }

  /**
   * Appends or updates a terminal position in the archived positions ledger under lock.
   *
   * @param {Position} position - Position object to archive.
   */
  public async archivePosition(position: Position): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.archivePositionsPath, async () => {
      let archived: Position[] = [];
      try {
        const data = await fs.readFile(this.archivePositionsPath, 'utf-8');
        archived = JSON.parse(data) as Position[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const index = archived.findIndex((p) => p.id === position.id);
      if (index >= 0) {
        archived[index] = position;
      } else {
        archived.push(position);
      }
      await fs.writeFile(this.archivePositionsPath, JSON.stringify(archived, null, 2), 'utf-8');
    });
  }

  /**
   * Reads all archived positions from disk under lock.
   * Returns [] if the file does not exist.
   *
   * @returns {Promise<Position[]>} Array of archived Position objects.
   */
  public async getArchived(): Promise<Position[]> {
    return fileMutex.runExclusive(this.archivePositionsPath, async () => {
      try {
        const data = await fs.readFile(this.archivePositionsPath, 'utf-8');
        return JSON.parse(data) as Position[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }
}
