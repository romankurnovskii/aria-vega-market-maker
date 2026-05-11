/**
 * @file circuit-breaker.ts
 * @description Circuit breaker implementation to halt system operation after repeated failures.
 *
 * @features
 * - Tracks consecutive failures and trips after configurable threshold (default: 5)
 * - isTripped() guard prevents further operations when tripped
 * - recordSuccess() resets failure count; reset() clears trip state
 *
 * @dependencies None
 * @sideEffects Logs failure count and trip events to console
 */
export class CircuitBreaker {
  private tripped = false;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;

  /**
   * Returns whether the circuit breaker is currently tripped ( halted ).
   *
   * @returns {boolean} True if halted, false otherwise.
   */
  public isTripped(): boolean {
    return this.tripped;
  }

  /**
   * Records a failure, increments counter, and trips if threshold exceeded.
   *
   * @param {any} error - The error that occurred (logged for observability).
   */
  public recordFailure(error: any): void {
    this.consecutiveFailures++;
    console.error(`[CircuitBreaker] Failure recorded: ${error?.message || error}. Consecutive count: ${this.consecutiveFailures}`);
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.tripped = true;
      console.error(`[CircuitBreaker] TRIPPED! Maximum consecutive failures exceeded. System halted.`);
    }
  }

  /**
   * Records a success, resetting the failure counter.
   */
  public recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  /**
   * Fully resets the circuit breaker to closed state and clears failures.
   */
  public reset(): void {
    this.tripped = false;
    this.consecutiveFailures = 0;
    console.log('[CircuitBreaker] Circuit breaker reset to healthy closed state.');
  }
}
