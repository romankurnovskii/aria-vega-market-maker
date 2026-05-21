/**
 * @file app-store.ts
 * @description Global Zustand store for pool metadata and position data keyed by pool address.
 *
 * @features
 * - PoolMetaByAddress — maps pool address to pool metadata (name, tokens, fee params)
 * - PositionsByPool — maps pool address to an array of Position objects
 * - setPoolMeta — upserts pool metadata for a given address
 * - setPositionsByPool — rebuilds the positions map from a flat position list
 *
 * @dependencies Zustand
 * @sideEffects None — pure client-side state only
 */

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
