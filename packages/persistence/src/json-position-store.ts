/**
 * @file json-position-store.ts
 * @description JSON file-based implementation of IPositionStore for persisting known positions.
 *
 * @features
 * - Loads/saves Position[] to known_positions.json in the configured directory
 * - Creates directory automatically on write; returns [] on missing file
 * - Simple disk-based cache for position discovery diffing
 *
 * @dependencies IPositionStore, Position (from @lp-system/core), fs/promises, path
 * @sideEffects Writes to ./data/known_positions.json on saveKnown()
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPositionStore, Position } from '@lp-system/core';

/**
 * JsonPositionStore: persists known positions to a local JSON file.
 * Used by the discovery loop to track which positions are currently tracked vs newly closed.
 */
export class JsonPositionStore implements IPositionStore {
  private knownPositionsPath: string;

  /**
   * Constructs the store with a directory path where known_positions.json will be stored.
   *
   * @param {string} directoryPath - Base directory for persistence files.
   */
  constructor(private directoryPath: string) {
    this.knownPositionsPath = path.join(directoryPath, 'known_positions.json');
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
   * Reads all known positions from disk.
   * Returns [] if the file does not exist.
   *
   * @returns {Promise<Position[]>} Array of persisted Position objects.
   */
  public async getKnown(): Promise<Position[]> {
    try {
      const data = await fs.readFile(this.knownPositionsPath, 'utf-8');
      return JSON.parse(data) as Position[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Serializes and writes the entire known positions list to disk.
   *
   * @param {Position[]} positions - Full list of currently tracked positions.
   */
  public async saveKnown(positions: Position[]): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.knownPositionsPath, JSON.stringify(positions, null, 2), 'utf-8');
  }
}
