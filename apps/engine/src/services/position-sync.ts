/**
 * @file position-sync.ts
 * @description Background service that periodically fetches on-chain positions from a provider
 *              and syncs them into the local position store for queries and evaluation.
 *
 * @features
 * - syncPositions — fetches all positions for a wallet and upserts them into IPositionStore
 * - Can be called on a timer or triggered by external events
 *
 * @dependencies @lp-system/core (IPositionProvider, IPositionStore), @lp-system/logger
 * @sideEffects Writes position data to the IPositionStore on each sync
 */

import { IPositionProvider, IPositionStore } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('position-sync');

const SYNC_INTERVAL_MS = Number(process.env.POSITION_SYNC_INTERVAL_MS) || 5_000;
const MIN_INTERVAL_PER_WALLET_MS = Number(process.env.POSITION_SYNC_MIN_INTERVAL_PER_WALLET_MS) || 10_000;

export class PositionSyncService {
  private wallets: Set<string> = new Set();
  private lastSync: Map<string, number> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private syncInProgress = false;

  constructor(
    private provider: IPositionProvider,
    private store: IPositionStore
  ) {}

  addWallet(address: string): void {
    if (this.wallets.has(address)) return;
    this.wallets.add(address);
    logger.info(`[PositionSync] Monitoring wallet ${address}`);
  }

  removeWallet(address: string): void {
    this.wallets.delete(address);
    this.lastSync.delete(address);
    logger.info(`[PositionSync] Stopped monitoring wallet ${address}`);
  }

  getWallets(): string[] {
    return [...this.wallets];
  }

  start(): void {
    if (this.timer) return;
    logger.info(`[PositionSync] Starting sync loop every ${SYNC_INTERVAL_MS / 1000}s`);
    this.syncNext();
    this.timer = setInterval(() => this.syncNext(), SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async syncNext(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const now = Date.now();
      const candidates = [...this.wallets].filter((w) => {
        const last = this.lastSync.get(w) ?? 0;
        return now - last >= MIN_INTERVAL_PER_WALLET_MS;
      });

      if (candidates.length === 0) return;

      const wallet = candidates[0];
      logger.info(`[PositionSync] Fetching positions for wallet ${wallet}`);

      const positions = await this.provider.getPositions(wallet);
      await this.store.saveKnown(positions);
      this.lastSync.set(wallet, now);

      logger.info(`[PositionSync] Wallet ${wallet}: ${positions.length} positions synced`);
    } catch (err) {
      logger.error(`[PositionSync] Sync failed: ${err}`);
    } finally {
      this.syncInProgress = false;
    }
  }
}
