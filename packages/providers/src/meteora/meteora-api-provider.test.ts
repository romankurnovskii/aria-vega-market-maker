/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert';
import { MeteoraApiProvider } from './meteora-api-provider';
import { parseDecimalToRaw } from './meteora.utils';

test('getPositions returns an empty array when API returns no positions (no mock fallback)', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/portfolio/open')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return {
        ok: true,
        json: async () => ({ positions: [] }),
      } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    const positions = await provider.getPositions('mock_wallet');

    // Assert that the returned positions array is empty (fails under old code)
    assert.strictEqual(positions.length, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

// ✅ GOOD: Mock at correct level - The Fix
test('getPositions should handle empty portfolio (GOOD MOCK)', async () => {
  // Mock only the slow external operation (fetch), preserve behavior test needs
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/portfolio/open')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return {
        ok: true,
        json: async () => ({ positions: [] }),
      } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    const positions = await provider.getPositions('mock_wallet');

    // Test actual implementation with mocked fetch - passes for right reason ✓
    assert.strictEqual(positions.length, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('getPosition throws an error when position is not found (no mock fallback)', async () => {
  const originalFetch = global.fetch;
  const originalWallet = process.env.WALLET_PUBKEY;

  try {
    process.env.WALLET_PUBKEY = 'mock_wallet';
    global.fetch = async (url: any) => {
      if (url.includes('/portfolio/open')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return {
        ok: true,
        json: async () => ({ positions: [] }),
      } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');

    // Assert that getPosition throws an error (fails under old code which returned mock)
    await assert.rejects(async () => {
      await provider.getPosition('some-random-id');
    }, /Position some-random-id not found/);
  } finally {
    global.fetch = originalFetch;
    process.env.WALLET_PUBKEY = originalWallet;
  }
});

test('getPositions dynamically fetches pool token metadata and maps position tokens correctly', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/pools/test-pool-addr')) {
        return {
          ok: true,
          json: async () => ({
            token_x: { decimals: 6, address: 'onChainTokenXMint' },
            token_y: { decimals: 6, address: 'onChainTokenYMint' },
          }),
        } as any;
      }
      if (url.includes('/positions/test-pool-addr/pnl')) {
        return {
          ok: true,
          json: async () => ({
            positions: [
              {
                address: 'pos-addr-1',
                pool_address: 'test-pool-addr',
                lower_bin_id: 100,
                upper_bin_id: 200,
                amount_x: '1000',
                amount_y: '2000',
                is_in_range: true,
                opened_at: 123456789,
              },
            ],
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    const positions = await provider.getPositions('mock_wallet', 'test-pool-addr');

    assert.strictEqual(positions.length, 1);
    const pos = positions[0];
    assert.strictEqual(pos.id, 'pos-addr-1');
    assert.strictEqual(pos.tokenX.decimals, 6);
    assert.strictEqual(pos.tokenY.decimals, 6);
    assert.strictEqual(pos.tokenX.amount, '1000');
    assert.strictEqual(pos.tokenY.amount, '2000');
    assert.strictEqual(pos.tokenX.mint, 'onChainTokenXMint');
    assert.strictEqual(pos.tokenY.mint, 'onChainTokenYMint');
  } finally {
    global.fetch = originalFetch;
  }
});

test('parseDecimalToRaw converts decimal strings to raw integers without precision loss', () => {
  assert.strictEqual(parseDecimalToRaw('2.978076', 6), '2978076');
  assert.strictEqual(parseDecimalToRaw('0.03127759', 9), '31277590');
  assert.strictEqual(parseDecimalToRaw('100', 6), '100000000');
  assert.strictEqual(parseDecimalToRaw('0.5', 2), '50');
  assert.strictEqual(parseDecimalToRaw('0', 6), '0');
  assert.strictEqual(parseDecimalToRaw('', 6), '0');
  assert.strictEqual(parseDecimalToRaw('1.2345678', 4), '12345');
});

test('getPositions maps positions with unrealizedPnl, isOutOfRange, and positionAddress correctly', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/pools/test-pool-addr-2')) {
        return {
          ok: true,
          json: async () => ({
            token_x: { decimals: 9, address: 'mintX' },
            token_y: { decimals: 6, address: 'mintY' },
          }),
        } as any;
      }
      if (url.includes('/positions/test-pool-addr-2/pnl')) {
        return {
          ok: true,
          json: async () => ({
            positions: [
              {
                positionAddress: '77aEZeqjbhYG784TB2foz8rv58bPsqLVCB2mGhNFBGfj',
                lowerBinId: -5896,
                upperBinId: -5871,
                isOutOfRange: true,
                createdAt: 1778488215,
                unrealizedPnl: {
                  balances: 2.9773754983893865,
                  balancesSol: '0.03101105313408857',
                  balanceTokenX: {
                    amount: '0',
                    usd: '0',
                    amountSol: '0',
                  },
                  balanceTokenY: {
                    amount: '2.978076',
                    usd: '2.9773754983893865',
                    amountSol: '0.03101105313408857',
                  },
                },
              },
            ],
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    const positions = await provider.getPositions('mock_wallet', 'test-pool-addr-2');

    assert.strictEqual(positions.length, 1);
    const pos = positions[0];
    assert.strictEqual(pos.id, '77aEZeqjbhYG784TB2foz8rv58bPsqLVCB2mGhNFBGfj');
    assert.strictEqual(pos.isInRange, false);
    assert.strictEqual(pos.openedAt, 1778488215000);
    assert.strictEqual(pos.tokenX.amount, '0');
    assert.strictEqual(pos.tokenY.amount, '2978076');
    assert.strictEqual(pos.tokenX.decimals, 9);
    assert.strictEqual(pos.tokenY.decimals, 6);
  } finally {
    global.fetch = originalFetch;
  }
});

test('getPositions propagates error when open portfolio endpoint returns non-ok status', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/portfolio/open')) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as any;
      }
      return { ok: true, json: async () => [] } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    await assert.rejects(async () => {
      await provider.getPositions('mock_wallet');
    }, /Failed to fetch open portfolio: HTTP 429 Too Many Requests/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('integration: getPositions with real API structure', async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url: any) => {
      // Simulate real Meteora API structure
      if (url.includes('/portfolio/open')) {
        return {
          ok: true,
          json: async () => ({
            pools: [{ pool_address: 'pool1' }],
            offset: 0,
            total: 1,
          }),
        } as any;
      }
      if (url.includes('/positions/pool1/pnl')) {
        return {
          ok: true,
          json: async () => ({
            positions: [
              {
                position_address: 'pos1',
                pool_address: 'pool1',
                lower_bin_id: 100,
                upper_bin_id: 200,
                amount_x: '1000',
                amount_y: '2000',
                is_in_range: true,
                opened_at: 1234567890,
              },
            ],
          }),
        } as any;
      }
      if (url.includes('/pools/pool1')) {
        return {
          ok: true,
          json: async () => ({
            token_x: { decimals: 6, address: 'onChainTokenXMint' },
            token_y: { decimals: 6, address: 'onChainTokenYMint' },
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    const positions = await provider.getPositions('wallet1');

    // Assert real integration behavior
    assert.deepStrictEqual(positions, [
      {
        chain: 'solana',
        id: 'pos1',
        isInRange: true,
        lowerBinId: 100,
        lowerBound: 100,
        metadata: {
          feeX: '0',
          feeY: '0',
          leverage: 10,
        },
        openedAt: 1234567890,
        pnlData: {
          position_address: 'pos1',
          pool_address: 'pool1',
          lower_bin_id: 100,
          upper_bin_id: 200,
          amount_x: '1000',
          amount_y: '2000',
          is_in_range: true,
          opened_at: 1234567890,
        },
        poolAddress: 'pool1',
        protocol: 'meteora_dlmm',
        tokenX: {
          amount: '1000',
          decimals: 6,
          mint: 'onChainTokenXMint',
          tokenAddress: 'onChainTokenXMint',
        },
        tokenY: {
          amount: '2000',
          decimals: 6,
          mint: 'onChainTokenYMint',
          tokenAddress: 'onChainTokenYMint',
        },
        upperBinId: 200,
        upperBound: 200,
      },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('getPositions propagates error when pool pnl endpoint returns non-ok status', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (url: any) => {
      if (url.includes('/positions/test-pool/pnl')) {
        return {
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
        } as any;
      }
      return { ok: true, json: async () => [] } as any;
    };

    const provider = new MeteoraApiProvider('https://dummy-api.meteora.ag');
    await assert.rejects(async () => {
      await provider.getPositions('mock_wallet', 'test-pool');
    }, /Failed to fetch positions PnL from Datapi for pool test-pool: HTTP 502 Bad Gateway/);
  } finally {
    global.fetch = originalFetch;
  }
});
