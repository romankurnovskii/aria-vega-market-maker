/**
 * @file json-file-store.ts
 * @description JSON file-based implementation of IStore for assignments and execution records.
 *
 * @features
 * - get/save/delete operations for Assignment entities
 * - get/save operations for ExecutionRecord history
 * - Auto-creates data directory; returns [] on missing files
 * - Uses in-memory array merge for assignment upserts
 *
 * @dependencies IStore, Assignment, ExecutionRecord (from @lp-system/core), fs/promises, path
 * @sideEffects Writes to ./data/assignments.json and ./data/executions.json
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { IStore, Assignment, ExecutionRecord } from '@lp-system/core';

/**
 * JsonFileStore: file-system backed store for assignments and execution records.
 * Used by the engine lifecycle and HTTP server endpoints.
 */
export class JsonFileStore implements IStore {
  private assignmentsPath: string;
  private executionsPath: string;

  /**
   * Constructs the store with a directory path for persistence files.
   *
   * @param {string} directoryPath - Base directory where assignments.json and executions.json live.
   */
  constructor(private directoryPath: string) {
    this.assignmentsPath = path.join(directoryPath, 'assignments.json');
    this.executionsPath = path.join(directoryPath, 'executions.json');
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
   * Reads the assignments array from disk. Returns [] if file is missing.
   *
   * @returns {Promise<Assignment[]>} All persisted assignments.
   */
  public async getAssignments(): Promise<Assignment[]> {
    try {
      const data = await fs.readFile(this.assignmentsPath, 'utf-8');
      return JSON.parse(data) as Assignment[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Inserts or updates an assignment in the persistent store.
   *
   * @param {Assignment} assignment - The assignment to persist (matches by ID).
   */
  public async saveAssignment(assignment: Assignment): Promise<void> {
    await this.ensureDirectory();
    const assignments = await this.getAssignments();
    const index = assignments.findIndex((a) => a.id === assignment.id);
    if (index >= 0) {
      assignments[index] = assignment;
    } else {
      assignments.push(assignment);
    }
    await fs.writeFile(this.assignmentsPath, JSON.stringify(assignments, null, 2), 'utf-8');
  }

  /**
   * Removes an assignment by ID.
   *
   * @param {string} id - Assignment identifier to delete.
   */
  public async deleteAssignment(id: string): Promise<void> {
    await this.ensureDirectory();
    const assignments = await this.getAssignments();
    const filtered = assignments.filter((a) => a.id !== id);
    await fs.writeFile(this.assignmentsPath, JSON.stringify(filtered, null, 2), 'utf-8');
  }

  /**
   * Reads all execution records from disk. Returns [] if file is missing.
   *
   * @returns {Promise<ExecutionRecord[]>} Full execution history.
   */
  public async getExecutionRecords(): Promise<ExecutionRecord[]> {
    try {
      const data = await fs.readFile(this.executionsPath, 'utf-8');
      return JSON.parse(data) as ExecutionRecord[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Appends a single execution record to the history file.
   *
   * @param {ExecutionRecord} record - Execution outcome to persist.
   */
  public async saveExecutionRecord(record: ExecutionRecord): Promise<void> {
    await this.ensureDirectory();
    const records = await this.getExecutionRecords();
    records.push(record);
    await fs.writeFile(this.executionsPath, JSON.stringify(records, null, 2), 'utf-8');
  }
}
