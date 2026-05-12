/**
 * @file json-file-store.ts
 * @description JSON file-based implementation of IStore with file-path scoped async mutex protection.
 *
 * @features
 * - Thread-safe atomic read-modify-write operations for Assignment entities
 * - Thread-safe atomic append operations for ExecutionRecord history
 * - Thread-safe atomic read-modify-write operations for RebalanceTask queue
 * - Uses shared AsyncFileMutex singleton `fileMutex` to serialize same-file disk accesses.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { IStore, Assignment, ExecutionRecord, RebalanceTask } from '@lp-system/core';
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
 * JsonFileStore: file-system backed store for assignments, execution records, and tasks.
 * Uses path-scoped mutex locks to protect against concurrent modification race conditions.
 */
export class JsonFileStore implements IStore {
  private assignmentsPath: string;
  private executionsPath: string;
  private tasksPath: string;

  /**
   * Constructs the store with a directory path and optional namespacing options.
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
    this.assignmentsPath = path.join(directoryPath, `${prefix}assignments.json`);
    this.executionsPath = path.join(directoryPath, `${prefix}executions.json`);
    this.tasksPath = path.join(directoryPath, `${prefix}tasks.json`);
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
   * Reads the assignments array from disk under a sequential file lock.
   *
   * @returns {Promise<Assignment[]>} All persisted assignments.
   */
  public async getAssignments(): Promise<Assignment[]> {
    return fileMutex.runExclusive(this.assignmentsPath, async () => {
      try {
        const data = await fs.readFile(this.assignmentsPath, 'utf-8');
        return JSON.parse(data) as Assignment[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Inserts or updates an assignment in the persistent store under a sequential file lock.
   *
   * @param {Assignment} assignment - The assignment to persist (matches by ID).
   */
  public async saveAssignment(assignment: Assignment): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.assignmentsPath, async () => {
      let assignments: Assignment[] = [];
      try {
        const data = await fs.readFile(this.assignmentsPath, 'utf-8');
        assignments = JSON.parse(data) as Assignment[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const index = assignments.findIndex((a) => a.id === assignment.id);
      if (index >= 0) {
        assignments[index] = assignment;
      } else {
        assignments.push(assignment);
      }
      await fs.writeFile(this.assignmentsPath, JSON.stringify(assignments, null, 2), 'utf-8');
    });
  }

  /**
   * Removes an assignment by ID under a sequential file lock.
   *
   * @param {string} id - Assignment identifier to delete.
   */
  public async deleteAssignment(id: string): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.assignmentsPath, async () => {
      let assignments: Assignment[] = [];
      try {
        const data = await fs.readFile(this.assignmentsPath, 'utf-8');
        assignments = JSON.parse(data) as Assignment[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const filtered = assignments.filter((a) => a.id !== id);
      await fs.writeFile(this.assignmentsPath, JSON.stringify(filtered, null, 2), 'utf-8');
    });
  }

  /**
   * Reads all execution records from disk under a sequential file lock.
   *
   * @returns {Promise<ExecutionRecord[]>} Full execution history.
   */
  public async getExecutionRecords(): Promise<ExecutionRecord[]> {
    return fileMutex.runExclusive(this.executionsPath, async () => {
      try {
        const data = await fs.readFile(this.executionsPath, 'utf-8');
        return JSON.parse(data) as ExecutionRecord[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Appends a single execution record to the history file under a sequential file lock.
   *
   * @param {ExecutionRecord} record - Execution outcome to persist.
   */
  public async saveExecutionRecord(record: ExecutionRecord): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.executionsPath, async () => {
      let records: ExecutionRecord[] = [];
      try {
        const data = await fs.readFile(this.executionsPath, 'utf-8');
        records = JSON.parse(data) as ExecutionRecord[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      records.push(record);
      await fs.writeFile(this.executionsPath, JSON.stringify(records, null, 2), 'utf-8');
    });
  }

  /**
   * Reads all tasks from disk under a sequential file lock.
   *
   * @returns {Promise<RebalanceTask[]>} All persisted tasks.
   */
  public async getTasks(): Promise<RebalanceTask[]> {
    return fileMutex.runExclusive(this.tasksPath, async () => {
      try {
        const data = await fs.readFile(this.tasksPath, 'utf-8');
        return JSON.parse(data) as RebalanceTask[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Inserts or updates a task in the persistent store under a sequential file lock.
   *
   * @param {RebalanceTask} task - The task to persist.
   */
  public async saveTask(task: RebalanceTask): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.tasksPath, async () => {
      let tasks: RebalanceTask[] = [];
      try {
        const data = await fs.readFile(this.tasksPath, 'utf-8');
        tasks = JSON.parse(data) as RebalanceTask[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const index = tasks.findIndex((t) => t.id === task.id);
      if (index >= 0) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }
      await fs.writeFile(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
    });
  }

  /**
   * Removes a task by ID under a sequential file lock.
   *
   * @param {string} id - Task identifier to delete.
   */
  public async deleteTask(id: string): Promise<void> {
    await this.ensureDirectory();
    await fileMutex.runExclusive(this.tasksPath, async () => {
      let tasks: RebalanceTask[] = [];
      try {
        const data = await fs.readFile(this.tasksPath, 'utf-8');
        tasks = JSON.parse(data) as RebalanceTask[];
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }

      const filtered = tasks.filter((t) => t.id !== id);
      await fs.writeFile(this.tasksPath, JSON.stringify(filtered, null, 2), 'utf-8');
    });
  }
}
