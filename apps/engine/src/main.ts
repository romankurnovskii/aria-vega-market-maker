/**
 * @file main.ts
 * @description Engine entry point: boots the full automation system using Hummingbot API.
 *
 * @features
 * - Initializes Hummingbot provider and executor
 * - Gets wallet address from Hummingbot API (creates if not exists)
 * - Starts three concurrent systems: discovery loop, tick loop, HTTP server
 * - Registers SIGINT/SIGTERM handlers for graceful shutdown
 *
 * @dependencies All @lp-system packages: providers, core, persistence, strategy, orchestration, executor
 * @sideEffects Winston logging to console/files, starts HTTP server on PORT, spawns intervals
 */

import { HummingbotProvider } from '@lp-system/providers';
import { HummingbotExecutor } from '@lp-system/executor';
import { JsonFileStore, JsonPositionStore, JsonLineageStore } from '@lp-system/persistence';
import { TrailingUsdcStrategy, ExperimentalRestakeStrategy } from '@lp-system/strategy';
import { OrchestratorRegistry, OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import { startHttpServer } from './server.js';
import { PositionSyncService } from './services/position-sync.js';
import { TickLoopService } from './services/tick-loop.js';

const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS) || 120_000;
const HUMMINGBOT_API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

const logger = getLogger('engine');

/**
 * Main application bootstrap: wires all layers and starts event loops.
 */
async function main() {
  logger.info('====================================================');
  logger.info('       ARIA VEGA MARKET MAKER (HUMMINGBOT)         ');
  logger.info('====================================================');

  const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'dev';

  logger.info(`[Config] Tick Interval: ${TICK_INTERVAL_MS / 1000}s`);
  logger.info(`[Config] Hummingbot API URL: ${HUMMINGBOT_API_URL}`);

  // 1. Providers initialization
  const positionProvider = new HummingbotProvider(HUMMINGBOT_API_URL);

  // 2. Get wallet address from Hummingbot API
  const walletAddress = await positionProvider.getWalletAddress();
  logger.info(`[Config] Operational Wallet: ${walletAddress}`);

  // 3. Persistence Layer initialization
  const store = new JsonFileStore('./data', { wallet: walletAddress, env: APP_ENV });
  const positionStore = new JsonPositionStore('./data', {
    wallet: walletAddress,
    env: APP_ENV,
  });
  const lineageStore = new JsonLineageStore('./data', { wallet: walletAddress, env: APP_ENV });

  // 4. Strategy initialization
  const trailingUsdcStrategy = new TrailingUsdcStrategy({ rangePercent: 20 });
  const experimentalRestakeStrategy = new ExperimentalRestakeStrategy();

  // 5. Orchestration Layer initialization
  const registry = new OrchestratorRegistry();
  const factory = new OrchestratorFactory(
    {
      'trailing-usdc': trailingUsdcStrategy,
      'experimental-restake': experimentalRestakeStrategy,
    },
    { rangePercent: 20 }
  );

  // 5.5 Restore persisted assignments → orchestrators
  const assignments = await store.getAssignments();
  for (const assignment of assignments) {
    try {
      const orchestrator = factory.create(assignment);
      registry.register(orchestrator);
      logger.info(`[Engine] Restored orchestrator for assignment ${assignment.id} → position ${assignment.positionId}`);
    } catch (err) {
      logger.warn(`[Engine] Failed to restore orchestrator for assignment ${assignment.id}: ${err}`);
    }
  }
  logger.info(`[Engine] Restored ${registry.getAll().length} orchestrators from ${assignments.length} assignments.`);
  // 6. Executor initialization
  const executor = new HummingbotExecutor(HUMMINGBOT_API_URL, walletAddress);

  // 7. Position sync service — background fetcher that keeps the store updated

  const positionSync = new PositionSyncService(positionProvider, positionStore);
  positionSync.addWallet(walletAddress);
  positionSync.start();

  // 7.5 Background Tick Loop Service
  const tickLoop = new TickLoopService(
    registry,
    positionProvider,
    executor,
    store,
    positionStore,
    lineageStore,
    factory,
    walletAddress,
    TICK_INTERVAL_MS
  );
  tickLoop.start();

  // 8. Web Control Plane Activation

  startHttpServer(store, registry, executor, factory, positionProvider, walletAddress, lineageStore, positionStore);

  // 9. Graceful Shutdown handlers
  process.on('SIGINT', () => {
    logger.info('[Engine] Received SIGINT shutdown request. Gracefully closing daemon...');
    positionSync.stop();
    tickLoop.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info('[Engine] Received SIGTERM shutdown request. Gracefully closing daemon...');
    positionSync.stop();
    tickLoop.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('[Engine] Fatal crash during startup execution:', error);
  process.exit(1);
});
