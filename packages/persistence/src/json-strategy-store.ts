/**
 * @file json-strategy-store.ts
 * @description JSON file-based implementation of IStrategyStore with file-path scoped async mutex protection.
 *
 * @features
 * - Thread-safe atomic read-modify-write operations for StrategyDefinition entities
 * - Uses shared AsyncFileMutex singleton `fileMutex` to serialize same-file disk accesses.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { IStrategyStore, StrategyDefinition } from '@lp-system/core';
import { fileMutex } from './mutex.js';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('json-strategy-store');

export interface StoreOptions {
  wallet?: string;
  env?: string;
}

function getShortWallet(wallet: string): string {
  if (wallet.length <= 8) return wallet;
  return `${wallet.slice(0, 4)}_${wallet.slice(-4)}`;
}

export class JsonStrategyStore implements IStrategyStore {
  private filePath: string;

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
    this.filePath = path.join(directoryPath, `${prefix}strategies.json`);
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directoryPath, { recursive: true });
  }

  public async getStrategies(): Promise<StrategyDefinition[]> {
    return fileMutex.runExclusive(this.filePath, async () => {
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        return JSON.parse(data) as StrategyDefinition[];
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          logger.warn(`[JsonStrategyStore] JSON parsing failed for strategies. Auto-recovering with empty array.`);
          return [];
        }
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  public async saveStrategy(definition: StrategyDefinition): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.filePath, async () => {
      let strategies: StrategyDefinition[] = [];
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        strategies = JSON.parse(data) as StrategyDefinition[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const index = strategies.findIndex((s) => s.id === definition.id);
      if (index >= 0) {
        strategies[index] = definition;
      } else {
        strategies.push(definition);
      }
      await fs.writeFile(this.filePath, JSON.stringify(strategies, null, 2), 'utf-8');
    });
  }

  public async deleteStrategy(id: string): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.filePath, async () => {
      let strategies: StrategyDefinition[] = [];
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        strategies = JSON.parse(data) as StrategyDefinition[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const filtered = strategies.filter((s) => s.id !== id);
      await fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2), 'utf-8');
    });
  }
}
