'use client';

import { create } from 'zustand';

export interface PoolMeta {
  address: string;
  name: string;
  tokenXMint: string;
  tokenYMint: string;
  tokenXSym: string;
  tokenYSym: string;
  binStep: number;
  baseFee: number;
  feeRate: number;
}

export interface Position {
  id: string;
  pool: string;
  minBin: number;
  maxBin: number;
  binCount: number;
  rangePercent: number;
  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  activeBin?: number;
  status: string;
  state: string;
  tokenX: { amount: string; decimals: number; mint?: string; tokenAddress?: string } | null | undefined;
  tokenY: { amount: string; decimals: number; mint?: string; tokenAddress?: string } | null | undefined;
  openedAt?: number;
  poolActivePrice?: number;
  raw: Record<string, unknown>;
  pnlData?: Record<string, unknown>;
  _wallet?: string;
}

export interface EvalLogEntry {
  id: number;
  timestamp: string;
  action: string;
  strategyId?: string;
  positionId?: string;
  result?: unknown;
  error?: string;
  transactionSignatures?: string[];
  pendingSuggestion?: { action: string; openParams?: Record<string, unknown> };
}

interface AppStore {
  poolMetaByAddress: Record<string, PoolMeta>;
  positionsByPool: Record<string, Position[]>;
  setPoolMeta: (address: string, meta: PoolMeta) => void;
  setPositionsByPool: (positions: Position[]) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  poolMetaByAddress: {},
  positionsByPool: {},

  setPoolMeta: (address: string, meta: PoolMeta) =>
    set((state) => ({
      poolMetaByAddress: { ...state.poolMetaByAddress, [address]: meta },
    })),

  setPositionsByPool: (positions: Position[]) => {
    const byPool: Record<string, Position[]> = {};
    for (const p of positions) {
      if (!byPool[p.pool]) byPool[p.pool] = [];
      byPool[p.pool].push(p);
    }
    set({ positionsByPool: byPool });
  },
}));
