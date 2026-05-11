import * as fs from 'fs/promises';
import * as path from 'path';
import { IPositionStore, Position } from '@lp-system/core';

export class JsonPositionStore implements IPositionStore {
  private knownPositionsPath: string;

  constructor(private directoryPath: string) {
    this.knownPositionsPath = path.join(directoryPath, 'known_positions.json');
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directoryPath, { recursive: true });
  }

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

  public async saveKnown(positions: Position[]): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.knownPositionsPath, JSON.stringify(positions, null, 2), 'utf-8');
  }
}
