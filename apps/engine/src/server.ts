/**
 * @file server.ts
 * @description Express HTTP server: exposes REST endpoints for monitoring and control.
 *
 * @features
 * - GET /assignments — list all persistent assignments
 * - POST /assignments — create and register a new assignment (persists + registers orchestrator)
 * - DELETE /assignments/:id — delete assignment and deregister orchestrator
 * - GET /health — liveness probe returning timestamp
 *
 * @dependencies express, cors, IStore, IOrchestratorRegistry, IExecutor, OrchestratorFactory, IPositionProvider (from @lp-system/core)
 * @sideEffects Mutates persistent store (assignments.json) and in-memory registry on POST/DELETE
 */
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import { IStore, IOrchestratorRegistry, IExecutor, IPositionProvider, IPositionStore } from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import {
  createAssignmentsRouter,
  createIntrospectionRouter,
  handlePositionsRouter,
  createWalletsRouter,
  createGatewayRouter,
} from './routes/index.js';

const logger = getLogger('server');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Starts the HTTP control plane server.
 *
 * @param {IStore} store - Persistent assignment and execution record store.
 * @param {IOrchestratorRegistry} registry - In-memory orchestrator registry (mutated on POST/DELETE).
 * @param {IExecutor} executor - Transaction executor.
 * @param {OrchestratorFactory} factory - Creates orchestrators for new assignments.
 * @param {IPositionProvider} positionProvider - On-chain data source for ad-hoc evaluation.
 * @param {string} walletAddress - Active wallet address.
 * @param {IPositionStore} [positionStore] - Optional persistent position cache containing active/failed states.
 * @returns {express.Application} Configured Express app instance (also starts listening).
 */
export function startHttpServer(
  store: IStore,
  registry: IOrchestratorRegistry,
  executor: IExecutor,
  factory: OrchestratorFactory,
  positionProvider: IPositionProvider,
  walletAddress: string,
  positionStore?: IPositionStore
): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  app.use('/assignments', createAssignmentsRouter(store, registry, factory));
  app.use('/', createIntrospectionRouter(factory));
  app.use('/wallets', createWalletsRouter(positionProvider));
  app.use('/gateway', createGatewayRouter(executor));
  app.use('/positions', handlePositionsRouter(positionProvider, executor, registry, factory, positionStore, walletAddress));

  const swaggerDocument = YAML.load(path.join(__dirname, '../src/openapi.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  app.listen(PORT, () => {
    logger.info(`[HTTP Server] Operational and listening on port ${PORT} (loaded: ${executor.constructor.name})`);
  });

  return app;
}
