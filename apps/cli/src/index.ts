import { parseArgs } from 'node:util';
import { HummingbotProvider } from '@lp-system/providers';
import { HummingbotExecutor } from '@lp-system/executor';

function parseDecimalToRaw(decimal: string, decimals: number): string {
  const parts = decimal.split('.');
  let raw = parts[0];
  const fraction = parts[1] || '';
  raw += fraction.padEnd(decimals, '0').slice(0, decimals);
  return raw.replace(/^0+/, '') || '0';
}
import { RangeCalculatorStep, AmountCalculatorStep } from '@lp-system/steps';
import { Decision, Position, StepContext } from '@lp-system/core';

type CliAction = 'addLiquidity' | 'removeLiquidity';

interface CliOptions {
  action: CliAction;
  pool: string;
  tokenX: string;
  tokenY: string;
  amountX: string;
  amountY: string;
  rangeLower: string;
  rangeUpper: string;
  positionId: string;
  help: boolean;
  rpcUrl?: string;
  priorityFee?: string;
}

const HELP_TEXT = `
Liquidity Provision CLI Tool
=======================

Usage:
  avmm --action <action> [options]

Mandatory Option:
  --action      Action to perform: 'addLiquidity' or 'removeLiquidity'

Options for --action addLiquidity:
  --pool        Pool address (required)
  --tokenX      Token X mint address (required)
  --tokenY      Token Y mint address (required)
  --amountX     Token X amount (human readable, e.g. 0.1) (required)
  --amountY     Token Y amount (human readable, e.g. 10) (required)
  --rangeLower  Lower price range percentage (e.g., -0.2) (required)
  --rangeUpper  Upper price range percentage (e.g., 0) (required)

Options for --action removeLiquidity:
  --pool        Pool address (required)
  --positionId  Position address to close (required)

Global Options:
  --rpcUrl      Solana RPC URL (overrides RPC_URL env)
  --priorityFee Priority fee in micro-lamports (default: 0)
  --help        Show this help message

Environment Variables:
  RPC_URL             Solana RPC URL
  HUMMINGBOT_API_URL  Hummingbot API URL (default: http://localhost:8000)
`;

function validateAddLiquidity(options: CliOptions): void {
  const required = ['pool', 'tokenX', 'tokenY', 'amountX', 'amountY', 'rangeLower', 'rangeUpper'] as const;
  for (const key of required) {
    if (!options[key]) {
      throw new Error(`Missing required option for addLiquidity: --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    }
  }
}

function validateRemoveLiquidity(options: CliOptions): void {
  if (!options.pool) {
    throw new Error('Missing required option for removeLiquidity: --pool');
  }
  if (!options.positionId) {
    throw new Error('Missing required option for removeLiquidity: --positionId');
  }
}

function createTemplatePosition(options: CliOptions, decimalsX: number, decimalsY: number): Position {
  return {
    id: 'new-position',
    poolAddress: options.pool,
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 0,
    upperBound: 0,
    tokenX: { amount: '0', decimals: decimalsX, mint: options.tokenX || '', tokenAddress: options.tokenX || '' },
    tokenY: { amount: '0', decimals: decimalsY, mint: options.tokenY || '', tokenAddress: options.tokenY || '' },
    isInRange: false,
    openedAt: 0,
    state: 'CLOSED',
    metadata: {},
  };
}

async function executeAction(options: CliOptions): Promise<void> {
  const hummingbotApiUrl = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

  const positionProvider = new HummingbotProvider(hummingbotApiUrl);
  const walletAddress = await positionProvider.getWalletAddress();
  const executor = new HummingbotExecutor(hummingbotApiUrl, walletAddress);

  const snapshot = await positionProvider.getMarketSnapshot(options.pool);

  if (options.action === 'addLiquidity') {
    validateAddLiquidity(options);
    const poolInfo = await positionProvider.getPoolInfo(options.pool);
    const rawAmountX = parseDecimalToRaw(options.amountX, poolInfo.tokenX.decimals);
    const rawAmountY = parseDecimalToRaw(options.amountY, poolInfo.tokenY.decimals);

    console.log(`[addLiquidity] Calculating range for pool: ${options.pool}`);
    const initialContext: StepContext = {
      position: createTemplatePosition(options, poolInfo.tokenX.decimals, poolInfo.tokenY.decimals),
      market: snapshot,
      params: {
        rangePercent: (parseFloat(options.rangeUpper) - parseFloat(options.rangeLower)) * 100,
        tokenXAmount: rawAmountX,
        tokenYAmount: rawAmountY,
      },
      signal: 'close+open',
    };

    const rangeStep = new RangeCalculatorStep();
    const amountStep = new AmountCalculatorStep();

    let context = await rangeStep.execute(initialContext);
    context = await amountStep.execute(context);

    if (!context.openParams) throw new Error('Failed to calculate liquidity parameters.');

    const decision: Decision = {
      positionId: 'new',
      action: 'open',
      sourceAssignmentId: 'cli-manual',
      evaluatedAt: Date.now(),
      openParams: {
        ...context.openParams,
        metadata: { slippageTolerance: 1 },
      },
    };

    console.log(`[addLiquidity] Executing open transaction...`);
    const result = await executor.apply(decision, snapshot);
    if (result.status === 'success') {
      console.log(`Success! New Position TX: ${result.txSignatures.join(', ')}`);
    } else {
      throw new Error(`Execution failed: ${result.error}`);
    }
  } else if (options.action === 'removeLiquidity') {
    validateRemoveLiquidity(options);

    const decision: Decision = {
      positionId: options.positionId,
      action: 'close',
      sourceAssignmentId: 'cli-manual',
      evaluatedAt: Date.now(),
    };

    console.log(`[removeLiquidity] Executing full close and claim for position: ${options.positionId}`);
    const result = await executor.apply(decision, snapshot);
    if (result.status === 'success') {
      console.log(`Success! Liquidity removed and fees claimed. TX: ${result.txSignatures.join(', ')}`);
    } else {
      throw new Error(`Execution failed: ${result.error}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    const { values } = parseArgs({
      options: {
        action: { type: 'string' },
        pool: { type: 'string', short: 'p' },
        tokenX: { type: 'string' },
        tokenY: { type: 'string' },
        amountX: { type: 'string' },
        amountY: { type: 'string' },
        rangeLower: { type: 'string' },
        rangeUpper: { type: 'string' },
        positionId: { type: 'string' },
        rpcUrl: { type: 'string' },
        priorityFee: { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
      },
      strict: false,
    });

    const options = values as unknown as CliOptions;
    if (options.help) {
      console.log(HELP_TEXT);
      return;
    }

    if (!options.action) {
      throw new Error('Missing mandatory option: --action. Use --help for usage information.');
    }

    if (options.action !== 'addLiquidity' && options.action !== 'removeLiquidity') {
      throw new Error(`Invalid action: '${options.action}'. Must be 'addLiquidity' or 'removeLiquidity'.`);
    }

    await executeAction(options);
  } catch (error) {
    console.error('Fatal Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
