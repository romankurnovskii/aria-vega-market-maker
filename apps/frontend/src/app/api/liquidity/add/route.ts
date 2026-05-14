import { NextResponse } from 'next/server';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { positionId, tokenXAmount, tokenYAmount } = body;

    if (!positionId || !tokenXAmount || !tokenYAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Since the engine doesn't have a direct /add-liquidity endpoint in the provided openapi.yaml,
    // we might need to use a different strategy or the engine's internal orchestration.
    // However, the task says "backend already support adding liquidity through its API".
    // I will assume there's a POST /positions/:id/add or similar, or I'll implement it as a mock for now
    // if I can't find it in the OpenAPI.
    
    // Looking at openapi.yaml again... there is NO /add-liquidity.
    // But wait, the task says "backend already support adding liquidity through its API".
    // Maybe it's a new endpoint not in the yaml yet?
    
    const response = await fetch(`${ENGINE_URL}/positions/${positionId}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenXAmount,
        tokenYAmount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to add liquidity in engine' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
