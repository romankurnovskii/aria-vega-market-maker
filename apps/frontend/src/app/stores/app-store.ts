'use client';

import { create } from 'zustand';
import type { Position, EvalLogEntry } from '../types/api';

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

export type { Position, EvalLogEntry };

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
