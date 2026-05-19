import { Router } from 'express';
import { IExecutor, OpenParams, Decision } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { getBinIdFromPrice, getMarketSnapshot, meteoraProvider } from '@lp-system/providers';

const logger = getLogger('router-gateway');

/**
 * Creates the gateway router handling operations where position is not yet known.
 */
export function createGatewayRouter(executor: IExecutor, getMarketSnapshotFn = getMarketSnapshot): Router {
  const router = Router();

  /**
   * POST /gateway/open
   * Open a new liquidity position.
   */
  router.post('/open', async (req, res) => {
    const {
      pool_address,
      lower_price,
      upper_price,
      base_token_amount,
      quote_token_amount,
      slippage_pct,
      wallet_address,
      extra_params,
    } = req.body;

    if (!pool_address) {
      res.status(400).json({ error: 'Missing pool_address' });
      return;
    }

    try {
      const { decimalsX, decimalsY, tokenXMint, tokenYMint, binStep } =
        await meteoraProvider.getPoolTokenMetadata(pool_address);

      // Calculate bin IDs (required by OpenParams interface)
      const lowerBinId = getBinIdFromPrice(lower_price, binStep, decimalsX, decimalsY);
      const upperBinId = getBinIdFromPrice(upper_price, binStep, decimalsX, decimalsY);

      const openParams: OpenParams = {
        poolAddress: pool_address,
        lowerBound: lowerBinId,
        upperBound: upperBinId,
        tokenXAmount: base_token_amount.toString(),
        tokenYAmount: quote_token_amount.toString(),
        lowerBoundPrice: lower_price,
        upperBoundPrice: upper_price,
        metadata: {
          slippageTolerance: slippage_pct,
          tokenXMint,
          tokenYMint,
          walletAddress: wallet_address,
          ...extra_params,
        },
      };

      const decision: Decision = {
        positionId: 'new', // Dummy ID for new position
        action: 'open',
        openParams,
        sourceAssignmentId: 'manual',
        evaluatedAt: Date.now(),
      };

      const market = await getMarketSnapshotFn(pool_address);
      const execRecord = await executor.apply(decision, market);

      if (execRecord.status === 'failed') {
        res.status(500).json({ error: execRecord.error || 'Execution failed' });
        return;
      }

      res.json({
        status: 'success',
        transactionSignatures: execRecord.txSignatures || [],
        newPositionId: execRecord.newPositionId,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[Gateway] Failed to open position: ${msg}`);
      res.status(500).json({ error: msg });
    }
  });

  /**
   * GET /gateway/pool/:address
   * Fetch pool info and market snapshot.
   */
  router.get('/pool/:address', async (req, res) => {
    const { address } = req.params;
    try {
      const poolInfo = await meteoraProvider.getPoolInfo(address);
      const market = await getMarketSnapshotFn(address);
      res.json({
        poolInfo,
        market,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[Gateway] Failed to fetch pool info for ${address}: ${msg}`);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
