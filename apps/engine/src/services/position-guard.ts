/**
 * @file position-guard.ts
 * @description Concurrency control to prevent concurrent evaluations or rebalances on the same position.
 *
 * @features
 * - tryAcquire/release for position-level locking
 * - runExclusive wrapper
 */

export class PositionGuard {
  private activeLocks = new Set<string>();

  /**
   * Attempts to acquire the lock for a position.
   * @param positionId The position identifier
   * @returns true if acquired, false if already locked
   */
  public tryAcquire(positionId: string): boolean {
    if (this.activeLocks.has(positionId)) {
      return false;
    }
    this.activeLocks.add(positionId);
    return true;
  }

  /**
   * Releases the lock for a position.
   * @param positionId The position identifier
   */
  public release(positionId: string): void {
    this.activeLocks.delete(positionId);
  }

  /**
   * Runs an operation exclusively for a position, throwing an error if it's already locked.
   * @param positionId The position identifier
   * @param operation The asynchronous operation to run
   * @returns The result of the operation
   */
  public async runExclusive<T>(positionId: string, operation: () => Promise<T>): Promise<T> {
    if (!this.tryAcquire(positionId)) {
      throw new Error(`Position ${positionId} is currently locked by another operation.`);
    }
    try {
      return await operation();
    } finally {
      this.release(positionId);
    }
  }
}

export const positionGuard = new PositionGuard();
