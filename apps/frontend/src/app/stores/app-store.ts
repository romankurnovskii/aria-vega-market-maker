/**
 * @file app-store.ts
 * @description Global Zustand store for pool metadata, position data, and toast notifications.
 *
 * @features
 * - PoolMetaByAddress — maps pool address to pool metadata (name, tokens, fee params)
 * - PositionsByPool — maps pool address to an array of Position objects
 * - Toasts — array of active toast notifications (success, error, warning, info)
 * - setPoolMeta — upserts pool metadata for a given address
 * - setPositionsByPool — rebuilds the positions map from a flat position list
 * - addToast — appends a new toast notification and automatically sets a timeout to remove it
 * - removeToast — removes a toast notification by ID
 *
 * @dependencies Zustand
 * @sideEffects Automatically schedules timeouts for removing toasts
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export type { Position, EvalLogEntry };

interface AppStore {
  poolMetaByAddress: Record<string, PoolMeta>;
  positionsByPool: Record<string, Position[]>;
  toasts: ToastMessage[];
  setPoolMeta: (address: string, meta: PoolMeta) => void;
  setPositionsByPool: (positions: Position[]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  poolMetaByAddress: {},
  positionsByPool: {},
  toasts: [],

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

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    const duration = toast.duration ?? 6000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
