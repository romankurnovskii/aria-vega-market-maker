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
import { JsonFileStore, JsonPositionStore } from '@lp-system/persistence';
import { TrailingUsdcStrategy, ExperimentalRestakeStrategy } from '@lp-system/strategy';
import { OrchestratorRegistry, OrchestratorFactory, ExecutionGate } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import { startDiscovery, startTickLoop } from './lifecycle.js';
import { startHttpServer } from './server.js';

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
  const executionGate = new ExecutionGate();

  // 6. Executor initialization
  const executor = new HummingbotExecutor(HUMMINGBOT_API_URL, walletAddress);

  // 7. Core Loops & Web Control Plane Activation
  await startDiscovery(walletAddress, positionProvider, positionStore, factory, store, registry);

  startTickLoop(
    TICK_INTERVAL_MS,
    walletAddress,
    positionProvider,
    positionStore,
    registry,
    executionGate,
    executor,
    store,
    factory
  );

  startHttpServer(store, registry, executor, factory, positionProvider, walletAddress, positionStore);

  // 8. Graceful Shutdown handlers
  process.on('SIGINT', () => {
    logger.info('[Engine] Received SIGINT shutdown request. Gracefully closing daemon...');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info('[Engine] Received SIGTERM shutdown request. Gracefully closing daemon...');
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('[Engine] Fatal crash during startup execution:', error);
  process.exit(1);
});
