import { Router } from 'express';
import { HummingbotProvider } from '@lp-system/providers';

export function createWalletsRouter(positionProvider: HummingbotProvider): Router {
  const router = Router();

  /**
   * GET /wallets
   * Lists all wallets registered in Hummingbot Gateway.
   */
  router.get('/', async (_req, res) => {
    try {
      const wallets = await positionProvider.listWallets();
      res.json({
        count: wallets.length,
        wallets,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  /**
   * GET /wallets/default
   * Gets the default wallet address from Hummingbot API.
   */
  router.get('/default', async (_req, res) => {
    try {
      const address = await positionProvider.getWalletAddress();
      res.json({
        chain: 'solana',
        address,
        is_default: true,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  /**
   * GET /wallets/:address/portfolio
   * Gets the open portfolio for a specific wallet from Meteora Datapi.
   */
  router.get('/:address/portfolio', async (req, res) => {
    try {
      const { address } = req.params;
      const apiRes = await fetch(`https://dlmm.datapi.meteora.ag/portfolio/open?user=${address}`, {
        headers: { Accept: 'application/json' },
      });
      if (!apiRes.ok) {
        res.status(apiRes.status).json({ error: `Datapi returned ${apiRes.status}` });
        return;
      }
      const data = await apiRes.json();
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
