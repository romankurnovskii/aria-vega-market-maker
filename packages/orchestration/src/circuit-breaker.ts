export class CircuitBreaker {
  private tripped = false;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;

  public isTripped(): boolean {
    return this.tripped;
  }

  public recordFailure(error: any): void {
    this.consecutiveFailures++;
    console.error(`[CircuitBreaker] Failure recorded: ${error?.message || error}. Consecutive count: ${this.consecutiveFailures}`);
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.tripped = true;
      console.error(`[CircuitBreaker] TRIPPED! Maximum consecutive failures exceeded. System halted.`);
    }
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  public reset(): void {
    this.tripped = false;
    this.consecutiveFailures = 0;
    console.log('[CircuitBreaker] Circuit breaker reset to healthy closed state.');
  }
}
