/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ISSUE #31: SolanaExecutor overwrites WSOL ATA balances with native SOL balances and caps WSOL deposits based on native SOL
import { test, describe } from 'node:test';
import assert from 'node:assert';
import type { Decision } from '@lp-system/core';

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_POSITION_ID = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_POOL_ADDRESS = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8GH4t3YuBPADk4ws';

function createMockProvider() {
  const calls: any[] = [];
  return {
    calls,
    getOnChainPositions: async () => ({
      [MOCK_POSITION_ID]: {
        publicKey: { toBase58: () => MOCK_POSITION_ID },
        positionData: { lowerBinId: 100, upperBinId: 200 },
      },
    }),
    buildAddLiquidityInstructions: async (params: any) => {
      calls.push({ method: 'buildAddLiquidityInstructions', args: params });
      return [{ programId: { toBase58: () => '11111111111111111111111111111111' } }];
    },
    getDlmmInstance: async () => ({
      tokenX: { publicKey: { toBase58: () => WSOL_MINT } },
      tokenY: { publicKey: { toBase58: () => USDC_MINT } },
    }),
  } as any;
}

function createMockRpcPool(wsolAtaBalance: string, nativeSolBalance: number) {
  return {
    execute: async (fn: any) => {
      return fn({
        getLatestBlockhash: async () => ({ blockhash: 'test' }),
        simulateTransaction: async () => ({ value: { err: null, unitsConsumed: 1000 } }),
        sendRawTransaction: async () => 'test_sig',
        getSignatureStatus: async () => ({ value: { confirmationStatus: 'confirmed' } }),
        getBalance: async () => nativeSolBalance,
        getParsedTokenAccountsByOwner: async () => ({
          value: [
            {
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: WSOL_MINT,
                      tokenAmount: { amount: wsolAtaBalance },
                    },
                  },
                },
              },
            },
          ],
        }),
      });
    },
  } as any;
}

describe('ISSUE #31: SolanaExecutor WSOL balance handling logic', () => {
  test('ISSUE #31: pollBalances should not overwrite WSOL ATA balance with native SOL balance', async () => {
    // ISSUE #31: this test is intentionally failing under current implementation
    const provider = createMockProvider();
    // WSOL ATA has 5 SOL (5000000000), but native SOL balance is 0
    const mockRpcPool = createMockRpcPool('5000000000', 0);
    const mockKeypair = { publicKey: { toBase58: () => MOCK_WALLET_ADDRESS } } as any;
    const SolanaExecutor = (await import('@lp-system/executor')).SolanaExecutor;
    const executor = new SolanaExecutor(mockRpcPool, mockKeypair, provider);

    // Initial X was 4 SOL (4000000000), expected delta is 0.5 SOL (500000000).
    // If pollBalances correctly reads ATA balance (5 SOL), delta is 1 SOL, which satisfies expected delta.
    // If it overwrites with native SOL (0), delta is -4 SOL, which fails and times out.
    let errorThrown = false;
    try {
      await executor.pollBalances(
        WSOL_MINT,
        USDC_MINT,
        MOCK_WALLET_ADDRESS,
        4000000000n,
        1000000000n,
        500, // 500ms timeout for fast failure
        { expectedDeltaX: 500000000n }
      );
    } catch (e) {
      errorThrown = true;
    }

    assert.strictEqual(
      errorThrown,
      false,
      'ISSUE #31: pollBalances should use WSOL ATA balance directly and not time out due to overwriting with 0 native SOL'
    );
  });

  test('ISSUE #31: apply (open) should not cap WSOL deposit amounts based on native SOL balance', async () => {
    // ISSUE #31: this test is intentionally failing under current implementation
    const provider = createMockProvider();
    // WSOL ATA has 10 SOL, but native SOL balance is 0.05 SOL (50_000_000), which is less than gasBuffer (80_000_000)
    const mockRpcPool = createMockRpcPool('10000000000', 50_000_000);
    const mockKeypair = { publicKey: { toBase58: () => MOCK_WALLET_ADDRESS }, sign: () => {} } as any;
    const SolanaExecutor = (await import('@lp-system/executor')).SolanaExecutor;
    const executor = new SolanaExecutor(mockRpcPool, mockKeypair, provider);

    const decision: Decision = {
      positionId: MOCK_POSITION_ID,
      action: 'open' as const,
      sourceAssignmentId: 'assign_test',
      openParams: {
        poolAddress: MOCK_POOL_ADDRESS,
        lowerBound: 1.0,
        upperBound: 2.0,
        tokenXAmount: '1000000000', // 1 WSOL deposit
        tokenYAmount: '500000000',
      },
      evaluatedAt: Date.now(),
    };

    const market = {
      poolAddress: MOCK_POOL_ADDRESS,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      activeBound: 1000,
      price: 100,
      priceHistory: [],
      feeRate: 100,
      capturedAt: Date.now(),
    };

    await executor.apply(decision, market);

    const addCall = provider.calls.find((c: any) => c.method === 'buildAddLiquidityInstructions');
    assert.ok(addCall, 'buildAddLiquidityInstructions should be called');
    assert.strictEqual(
      addCall.args.tokenXAmount.toString(),
      '1000000000',
      'ISSUE #31: buildAddLiquidityInstructions should use WSOL ATA amount directly without capping by native SOL balance'
    );
  });
});
