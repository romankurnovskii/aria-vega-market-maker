/**
 * @file main.ts
 * @description Engine entry point: boots the full Solana CLMM automation system.
 *
 * @features
 * - Initializes all layers: providers (RPC + API), persistence, strategy, orchestration, executor
 * - Bootstraps a demo assignment on first run (writes to data/assignments.json)
 * - Starts three concurrent systems: discovery loop, tick loop, HTTP server
 * - Registers SIGINT/SIGTERM handlers for graceful shutdown
 *
 * @dependencies All @lp-system packages: providers, core, persistence, strategy, orchestration, executor
 * @sideEffects Winston logging to console/files, writes initial demo assignment to disk, starts HTTP server on PORT, spawns intervals
 */
import {
  MeteoraApiProvider,
  MeteoraOnChainProvider,
  HeliusRpcProvider,
  SolanaRpcProvider,
  RpcPool,
} from '@lp-system/providers';
import { Keypair } from '@solana/web3.js';
import { JsonFileStore, JsonPositionStore } from '@lp-system/persistence';
import { TrailingUsdcStrategy } from '@lp-system/strategy';
import {
  OrchestratorRegistry,
  OrchestratorFactory,
  ExecutionGate,
} from '@lp-system/orchestration';
import { SolanaExecutor } from '@lp-system/executor';
import { getLogger } from '@lp-system/logger';
import { startDiscovery, startTickLoop } from './lifecycle.js';
import { startHttpServer } from './server.js';

const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS) || 10000;
const METEORA_API_URL = process.env.METEORA_API_URL || 'https://dlmm.datapi.meteora.ag';
const HELIUS_URL =
  process.env.HELIUS_URL ||
  process.env.HELIO_URL ||
  'https://mainnet.helius-rpc.com/?api-key=xxx';
const SOLANA_URL = process.env.SOLANA_URL || 'https://api.mainnet-beta.solana.com';

const logger = getLogger('engine');

/**
 * Main application bootstrap: wires all layers and starts event loops.
 */
async function main() {
  logger.info('====================================================');
  logger.info('       SOLANA CLMM LP AUTOMATION SYSTEM             ');
  logger.info('====================================================');

  const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'dev';
  const isProduction = APP_ENV === 'prod' || APP_ENV === 'production';

  // Load or generate keypair
  let keypair: Keypair;
  const privateKeyBase64 = process.env.PRIVATE_KEY_BASE64;
  if (privateKeyBase64) {
    try {
      const secretKey = Buffer.from(privateKeyBase64, 'base64');
      keypair = Keypair.fromSecretKey(secretKey);
      logger.info(`[Keypair] Successfully loaded signing wallet keypair. PublicKey: ${keypair.publicKey.toBase58()}`);
    } catch (error: any) {
      logger.error(`[Keypair] Failed to parse private key from Base64: ${error.message}`);
      if (isProduction) {
        logger.error(`[Keypair] FATAL: Invalid private key configured in production. Crashing to prevent silent failures.`);
        process.exit(1);
      }
      logger.info(`[Keypair] Falling back to a random keypair for simulation/development.`);
      keypair = Keypair.generate();
    }
  } else {
    if (isProduction) {
      logger.error(`[Keypair] FATAL: PRIVATE_KEY_BASE64 is missing in production. Crashing to prevent silent failures.`);
      process.exit(1);
    }
    logger.warn(`[Keypair] PRIVATE_KEY_BASE64 is empty. Generating a random keypair for simulation/development.`);
    keypair = Keypair.generate();
  }

  const walletAddress = process.env.WALLET_PUBKEY || keypair.publicKey.toBase58();

  logger.info(`[Config] Target Wallet: ${walletAddress}`);
  logger.info(`[Config] Tick Interval: ${TICK_INTERVAL_MS}ms`);

  // 1. Providers initialization
  const helius = new HeliusRpcProvider(HELIUS_URL);
  const solana = new SolanaRpcProvider(SOLANA_URL);
  const rpcPool = new RpcPool([helius, solana]);
  const positionProvider = new MeteoraApiProvider(METEORA_API_URL);
  const onChainProvider = new MeteoraOnChainProvider(rpcPool);

  // 2. Persistence Layer initialization
  // Saving persistence database in ./data directory inside root workspace
  const store = new JsonFileStore('./data', { wallet: walletAddress, env: APP_ENV });
  const positionStore = new JsonPositionStore('./data', { wallet: walletAddress, env: APP_ENV });

  // 3. Strategy initialization
  const trailingUsdcStrategy = new TrailingUsdcStrategy({ rangePercent: 20 });

  // 4. Orchestration Layer initialization
  const registry = new OrchestratorRegistry();
  const factory = new OrchestratorFactory(
    { 'trailing-usdc': trailingUsdcStrategy }, // Maps strategy ID to strategy instance
    { rangePercent: 20 }
  );
  const executionGate = new ExecutionGate();

  // 5. Executor initialization
  const executor = new SolanaExecutor(rpcPool, keypair, onChainProvider, { priorityFeeMicroLamports: 1000 });

  // 6. Bootstrap Initial Configuration Data
  // We write a default mock assignment to data/assignments.json if it is empty,
  // so the bot runs out-of-the-box on the first start!
  const currentAssignments = await store.getAssignments();
  if (currentAssignments.length === 0) {
    logger.info('[Bootstrap] Storing initial mock assignment for demonstration...');
    await store.saveAssignment({
      id: 'assignment_demo_101',
      strategyId: 'trailing-usdc',
      positionId: '9tA6m91FvP35G9A7eS982Yhd6pE35Z678WjLmoB67Pqr', // matches position created in Meteora mock
      mode: 'active',
      createdAt: Date.now(),
    });
  }

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
    store
  );

  startHttpServer(store, registry, executor, factory, positionProvider);

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
