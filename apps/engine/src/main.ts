/**
 * @file main.ts
 * @description Engine entry point: boots the full Solana CLMM automation system.
 *
 * @features
 * - Initializes all layers: providers (RPC + API), persistence, strategy, orchestration, executor
 * - Starts three concurrent systems: discovery loop, tick loop, HTTP server
 * - Registers SIGINT/SIGTERM handlers for graceful shutdown
 *
 * @dependencies All @lp-system packages: providers, core, persistence, strategy, orchestration, executor
 * @sideEffects Winston logging to console/files, starts HTTP server on PORT, spawns intervals
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
import { IRpcProvider } from '@lp-system/core';

const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS) || 120_000;
const METEORA_API_URL = 'https://dlmm.datapi.meteora.ag';
const HELIUS_URL = process.env.HELIUS_URL;
const HELIUS_URL_2 = process.env.HELIUS_URL_2;
const SOLANA_URL = process.env.SOLANA_URL;

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

  if (isProduction) {
    if (!privateKeyBase64) {
      logger.error(
        `[Keypair] FATAL: PRIVATE_KEY_BASE64 is missing in production. Crashing to prevent silent failures.`
      );
      process.exit(1);
    }
    try {
      const secretKey = Buffer.from(privateKeyBase64, 'base64');
      keypair = Keypair.fromSecretKey(secretKey);
      logger.info(
        `[Keypair] Successfully loaded signing wallet keypair. PublicKey: ${keypair.publicKey.toBase58()}`
      );
    } catch (error: unknown) {
      logger.error(
        `[Keypair] FATAL: Invalid private key configured in production. Crashing to prevent silent failures. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      process.exit(1);
    }
  } else {
    if (privateKeyBase64) {
      try {
        const secretKey = Buffer.from(privateKeyBase64, 'base64');
        keypair = Keypair.fromSecretKey(secretKey);
        logger.info(
          `[Keypair] Successfully loaded signing wallet keypair. PublicKey: ${keypair.publicKey.toBase58()}`
        );
      } catch (error: unknown) {
        logger.error(
          `[Keypair] Failed to parse private key from Base64: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        logger.info(`[Keypair] Falling back to a random keypair for simulation/development.`);
        keypair = Keypair.generate();
      }
    } else {
      logger.warn(
        `[Keypair] PRIVATE_KEY_BASE64 is empty. Generating a random keypair for simulation/development.`
      );
      keypair = Keypair.generate();
    }
  }

  // 1. Derivation as Source of Truth
  // We prioritize the derived public key from the loaded keypair to
  // ensure it is valid and perfectly matches the signer.
  const walletAddress = keypair.publicKey.toBase58();

  // 2. Logging and Validation
  if (process.env.WALLET_PUBKEY && process.env.WALLET_PUBKEY.trim() !== walletAddress) {
    logger.warn(
      `[Config] WALLET_PUBKEY env var (${process.env.WALLET_PUBKEY.trim()}) differs from Private Key derivation (${walletAddress}). Using derived address for safety.`
    );
  }

  logger.info(`[Config] Operational Wallet: ${walletAddress}`);
  logger.info(`[Config] Tick Interval: ${TICK_INTERVAL_MS / 1000}s`);

  // 1. Providers initialization
  const rpcProviders: IRpcProvider[] = [];
  if (SOLANA_URL) rpcProviders.push(new SolanaRpcProvider(SOLANA_URL));
  if (HELIUS_URL) rpcProviders.push(new HeliusRpcProvider(HELIUS_URL));
  if (HELIUS_URL_2) rpcProviders.push(new HeliusRpcProvider(HELIUS_URL_2));
  const rpcPool = new RpcPool(rpcProviders);

  const positionProvider = new MeteoraApiProvider(METEORA_API_URL, walletAddress);
  const onChainProvider = new MeteoraOnChainProvider(rpcPool);

  // 2. Persistence Layer initialization
  // Saving persistence database in ./data directory inside root workspace
  const store = new JsonFileStore('./data', { wallet: walletAddress, env: APP_ENV });
  const positionStore = new JsonPositionStore('./data', {
    wallet: walletAddress,
    env: APP_ENV,
  });

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
  const executor = new SolanaExecutor(rpcPool, keypair, onChainProvider, {
    priorityFeeMicroLamports: 1000,
  });

  // 6. Core Loops & Web Control Plane Activation
  await startDiscovery(
    walletAddress,
    positionProvider,
    positionStore,
    factory,
    store,
    registry
  );

  startTickLoop(
    TICK_INTERVAL_MS,
    walletAddress,
    positionProvider,
    positionStore,
    registry,
    executionGate,
    executor,
    store,
    rpcPool
  );

  startHttpServer(store, registry, executor, factory, positionProvider, walletAddress);

  // 7. Graceful Shutdown handlers
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
