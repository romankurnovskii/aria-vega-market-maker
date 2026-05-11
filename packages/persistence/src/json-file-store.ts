import * as fs from 'fs/promises';
import * as path from 'path';
import { IStore, Assignment, ExecutionRecord } from '@lp-system/core';

export class JsonFileStore implements IStore {
  private assignmentsPath: string;
  private executionsPath: string;

  constructor(private directoryPath: string) {
    this.assignmentsPath = path.join(directoryPath, 'assignments.json');
    this.executionsPath = path.join(directoryPath, 'executions.json');
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directoryPath, { recursive: true });
  }

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

  public async deleteAssignment(id: string): Promise<void> {
    await this.ensureDirectory();
    const assignments = await this.getAssignments();
    const filtered = assignments.filter((a) => a.id !== id);
    await fs.writeFile(this.assignmentsPath, JSON.stringify(filtered, null, 2), 'utf-8');
  }

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

  public async saveExecutionRecord(record: ExecutionRecord): Promise<void> {
    await this.ensureDirectory();
    const records = await this.getExecutionRecords();
    records.push(record);
    await fs.writeFile(this.executionsPath, JSON.stringify(records, null, 2), 'utf-8');
  }
}
