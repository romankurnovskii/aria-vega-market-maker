/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-empty */
// ISSUE #12: SolanaExecutor.close skips fee claim due to shouldClaimAndClose: false

import { test, describe } from 'node:test';
import assert from 'node:assert';

const MOCK_WALLET_ADDRESS = 'HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh';
const MOCK_POSITION_ID = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_POOL_ADDRESS = 'GpCoz6vVv9kH8R4sLWev4M7wD7vT1Kz2Ff7LveX8Pz9k';

interface ExecutorCall {
  method: string;
  args: any;
}

interface MockProvider {
  calls: ExecutorCall[];
  getOnChainPositions: () => Promise<any>;
  buildClaimFeesTransactions: (params: any) => Promise<any[]>;
  buildRemoveLiquidityTransactions: (params: any) => Promise<any[]>;
  buildClosePositionTransaction: (params: any) => Promise<any[]>;
  getDlmmInstance: () => Promise<any>;
}

function createMockProvider(): MockProvider {
  const calls: ExecutorCall[] = [];
  return {
    calls,
    getOnChainPositions: async () => ({
      [MOCK_POSITION_ID]: {
        publicKey: { toBase58: () => MOCK_POSITION_ID },
        positionData: { lowerBinId: 100, upperBinId: 200 },
      },
    }),
    buildClaimFeesTransactions: async (params: any) => {
      calls.push({ method: 'buildClaimFeesTransactions', args: params });
      return [{ add: () => {} }];
    },
    buildRemoveLiquidityTransactions: async (params: any) => {
      calls.push({ method: 'buildRemoveLiquidityTransactions', args: params });
      return [{ serialize: () => Buffer.alloc(100) }];
    },
    buildClosePositionTransaction: async (params: any) => {
      calls.push({ method: 'buildClosePositionTransaction', args: params });
      return [];
    },
    getDlmmInstance: async () => ({
      tokenX: { publicKey: { toBase58: () => 'So11111111111111111111111111111111111111112' } },
      tokenY: { publicKey: { toBase58: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8GH4t3YuBPADk4ws' } },
    }),
  };
}

function createMockRpcPool() {
  return {
    execute: async (fn: any) => {
      return fn({
        getLatestBlockhash: async () => ({ blockhash: 'test' }),
        simulateTransaction: async () => ({ value: { err: null, unitsConsumed: 1000 } }),
        sendRawTransaction: async () => 'test_sig',
        getSignatureStatus: async () => ({ value: { confirmationStatus: 'confirmed' } }),
        getBalance: async () => 1_000_000_000,
        getParsedTokenAccountsByOwner: async () => ({ value: [] }),
      });
    },
  };
}

describe('ISSUE #12: SolanaExecutor.close fee claim behavior', () => {
  test('ISSUE #12: SolanaExecutor.close should use atomic shouldClaimAndClose: true', async () => {
    const provider = createMockProvider();
    const mockRpcPool = createMockRpcPool();
    const mockKeypair = { publicKey: { toBase58: () => MOCK_WALLET_ADDRESS } };

    const SolanaExecutor = (await import('@lp-system/executor')).SolanaExecutor;
    const executor = new SolanaExecutor(mockRpcPool as any, mockKeypair as any, provider as any);

    const decision = {
      positionId: MOCK_POSITION_ID,
      action: 'close' as const,
      sourceAssignmentId: 'assign_test',
      evaluatedAt: Date.now(),
    };

    const market = {
      poolAddress: MOCK_POOL_ADDRESS,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      activeBound: 1000,
    };

    try {
      await executor.apply(decision, market as any);
    } catch (_e) {}

    const removeCall = provider.calls.find((c) => c.method === 'buildRemoveLiquidityTransactions');
    assert.strictEqual(
      removeCall?.args.shouldClaimAndClose,
      true,
      'ISSUE #12: buildRemoveLiquidityTransactions should use shouldClaimAndClose: true for atomic fee claim and PDA closure'
    );
  });

  test('ISSUE #12: Regression guard - close+open should NOT be executed directly', async () => {
    const provider = createMockProvider();
    const mockRpcPool = createMockRpcPool();
    const mockKeypair = { publicKey: { toBase58: () => MOCK_WALLET_ADDRESS } };

    const SolanaExecutor = (await import('@lp-system/executor')).SolanaExecutor;
    const executor = new SolanaExecutor(mockRpcPool as any, mockKeypair as any, provider as any);

    const decision = {
      positionId: MOCK_POSITION_ID,
      action: 'close+open' as const,
      sourceAssignmentId: 'assign_test',
      evaluatedAt: Date.now(),
    };

    const market = {
      poolAddress: MOCK_POOL_ADDRESS,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      activeBound: 1000,
    };

    let errorThrown = false;
    let errorMessage = '';

    try {
      const res = await executor.apply(decision, market as any);
      if (res.status === 'failed') {
        errorThrown = true;
        errorMessage = res.error || '';
      }
    } catch (e: any) {
      errorThrown = true;
      errorMessage = e.message;
    }

    assert.strictEqual(
      errorThrown,
      true,
      'close+open action should throw an error as it must be decomposed via task intent architecture'
    );
    assert.ok(
      errorMessage.includes('close+open') || errorMessage.includes('unsupported'),
      'Error should mention close+open is unsupported'
    );
  });

  test('ISSUE #12: Edge case - no fees accumulated should not cause error', async () => {
    const provider = createMockProvider();
    const mockRpcPool = createMockRpcPool();
    const mockKeypair = { publicKey: { toBase58: () => MOCK_WALLET_ADDRESS } };

    const SolanaExecutor = (await import('@lp-system/executor')).SolanaExecutor;

    const decision = {
      positionId: MOCK_POSITION_ID,
      action: 'close' as const,
      sourceAssignmentId: 'assign_test',
      evaluatedAt: Date.now(),
    };

    const market = {
      poolAddress: MOCK_POOL_ADDRESS,
      chain: 'solana' as const,
      protocol: 'meteora_dlmm' as const,
      activeBound: 1000,
    };

    let executionSucceeded = false;
    const rpcPoolWithFlag = {
      execute: async (fn: any) => {
        executionSucceeded = true;
        return mockRpcPool.execute(fn);
      },
    };

    const executorWithFlag = new SolanaExecutor(rpcPoolWithFlag as any, mockKeypair as any, provider as any);
    await executorWithFlag.apply(decision, market as any);

    assert.ok(
      executionSucceeded,
      'ISSUE #12: Fee claim should handle zero-fees gracefully (claimFees returns empty or succeeds)'
    );
  });
});
