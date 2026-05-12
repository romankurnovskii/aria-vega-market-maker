/**
 * @file mutex.ts
 * @description Asynchronous read-modify-write lock for file operations.
 *
 * @features
 * - Sequential (FIFO) promise-chained lock per unique string key (e.g., file path)
 * - Releases memory (deletes map entry) when no operations are pending
 * - Zero-dependency standard ES module
 */

export class AsyncFileMutex {
  private locks = new Map<string, Promise<void>>();

  /**
   * Executes a function exclusively for a given key (e.g., file path).
   * Ensures FIFO execution order and prevents race conditions.
   * Cleans up the lock queue reference once it completes.
   *
   * @param {string} key - Unique identifier (e.g. file path) for the lock.
   * @param {() => Promise<T>} operation - Asynchronous function to execute exclusively.
   * @returns {Promise<T>} Resolution of the operation.
   */
  public async runExclusive<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previousLock = this.locks.get(key) || Promise.resolve();

    let releaseLock!: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Chain the new lock. We catch errors so that the queue chain never breaks.
    this.locks.set(
      key,
      previousLock.then(() => nextLock).catch(() => nextLock)
    );

    try {
      // Wait for the previous operation on this key to finish
      await previousLock;
      // Run the exclusive operation
      return await operation();
    } finally {
      // Release the lock for the next item in queue
      releaseLock();

      // Memory cleanup: if no other promise is waiting, we can clean up the map entry
      const currentLock = this.locks.get(key);
      if (currentLock === nextLock) {
        this.locks.delete(key);
      }
    }
  }
}

// Export a singleton instance to be shared across all stores
export const fileMutex = new AsyncFileMutex();
