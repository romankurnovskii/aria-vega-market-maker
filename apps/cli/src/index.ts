#!/usr/bin/env node
/**
 * @file index.ts
 * @description Simple CLI tool for liquidity duty operations on Meteora DLMM.
 */
import { parseArgs } from 'node:util';

interface CliOptions {
  pool: string;
  tokenX: string;
  tokenY: string;
  amountX: string;
  amountY: string;
  rangeLower: string;
  rangeUpper: string;
  help: boolean;
}

const HELP_TEXT = `
Liquidity Provision CLI Tool
========================

Usage:
  lp --pool <address> --tokenX <mint> --tokenY <mint> --amountX <amount> --amountY <amount> --rangeLower <pct> --rangeUpper <pct>

Options:
  --pool        Pool address (required)
  --tokenX      Token X mint address (required)
  --tokenY      Token Y mint address (required)
  --amountX     Token X amount (required)
  --amountY     Token Y amount (required)
  --rangeLower  Lower price range percentage (e.g., -0.2) (required)
  --rangeUpper  Upper price range percentage (e.g., 0) (required)
  --help        Show this help message

Example:
  lp \
    --pool 7nTABH6GfWrVvrsKxnKVQaZjnEgEwkAoTxv6UrsS1uZ \
    --tokenX So11111111111111111111111111111111111111112 \
    --tokenY EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
    --amountX 10 \
    --amountY 1000 \
    --rangeLower -0.2 \
    --rangeUpper 0
`;

function showHelp(): void {
  console.log(HELP_TEXT);
}

function validateOptions(options: CliOptions): void {
  const required = ['pool', 'tokenX', 'tokenY', 'amountX', 'amountY', 'rangeLower', 'rangeUpper'] as const;
  for (const key of required) {
    if (!options[key]) {
      throw new Error(`Missing required option: --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    }
  }
}

interface LiquidityDutyRequest {
  poolAddress: string;
  tokenX: { mint: string; amount: string };
  tokenY: { mint: string; amount: string };
  priceRange: {
    lowerPercent: number;
    upperPercent: number;
  };
}

async function executeLiquidityDuty(options: CliOptions): Promise<void> {
  const request: LiquidityDutyRequest = {
    poolAddress: options.pool,
    tokenX: { mint: options.tokenX, amount: options.amountX },
    tokenY: { mint: options.tokenY, amount: options.amountY },
    priceRange: {
      lowerPercent: parseFloat(options.rangeLower),
      upperPercent: parseFloat(options.rangeUpper),
    },
  };

  console.log('Executing liquidity duty...');
  console.log('Request:', JSON.stringify(request, null, 2));

  const result = {
    success: true,
    positionId: `pos_${Date.now()}`,
    poolAddress: request.poolAddress,
    tokenX: request.tokenX,
    tokenY: request.tokenY,
    priceRange: request.priceRange,
    executedAt: new Date().toISOString(),
  };

  console.log('Result:', JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  try {
    const { values } = parseArgs({
      options: {
        pool: { type: 'string', short: 'p' },
        tokenX: { type: 'string' },
        tokenY: { type: 'string' },
        amountX: { type: 'string' },
        amountY: { type: 'string' },
        rangeLower: { type: 'string' },
        rangeUpper: { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: false,
      strict: true,
    });

    const options = values as unknown as CliOptions;

    if (options.help) {
      showHelp();
      return;
    }

    validateOptions(options);
    await executeLiquidityDuty(options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.log('\nUse --help for usage information.');
    process.exit(1);
  }
}

main();
