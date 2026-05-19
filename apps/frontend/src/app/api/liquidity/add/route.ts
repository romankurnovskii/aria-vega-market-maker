/**
 * @file route.ts
 * @description API route for adding liquidity to a position.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('add-liquidity');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positionId, tokenXAmount, tokenYAmount, slippage } = body;

    logger.info('[Add Liquidity] Starting liquidity addition for position:', positionId);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

    const response = await fetch(`${API_URL}/positions/${positionId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'openLiquidity',
        tokenXAmount,
        tokenYAmount,
        slippageTolerance: slippage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[Add Liquidity] Failed:', data.error || 'Unknown error');
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to add liquidity' },
        { status: response.status }
      );
    }

    logger.info('[Add Liquidity] Success for position:', positionId);
    return NextResponse.json({ success: true, result: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    logger.error('[Add Liquidity] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
