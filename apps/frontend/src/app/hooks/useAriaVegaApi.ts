'use client';

import { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { useApiPolling } from './useApiPolling';
import { getTokenSymbol } from '../utils/format';
import type { AriaVegaData, Wallet, Position, Assignment, RawApiPosition, EvalLogEntry } from '../types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

const INITIAL_DATA: AriaVegaData = {
  assignments: [],
  positions: [],
  strategies: [],
  steps: [],
  wallets: [],
  health: { epoch: 0, status: '' },
};

const STRATEGY_META: Record<string, { name: string; risk: string }> = {
  'trailing-usdc': { name: 'Trailing USDC', risk: 'Low' },
  'experimental-restake': { name: 'Experimental Restake', risk: 'High' },
  'spot-balanced': { name: 'Spot Balanced', risk: 'Medium' },
};

const STEP_META: Record<string, { type: string; description: string }> = {
  InitializationCheckStep: { type: 'Validation', description: 'Confirms position alive & holds valid assets.' },
  TrailingRangeCheckStep: { type: 'Monitor', description: 'Monitors if active bin moved out of bounds.' },
  RangeCalculatorStep: { type: 'Compute', description: 'Computes new balanced bin range.' },
  AmountCalculatorStep: { type: 'Compute', description: 'Identifies asset allocations needed.' },
};

export interface UseAriaVegaApiReturn {
  data: AriaVegaData;
  loading: boolean;
  connectionError: string | null;
  evalLogs: EvalLogEntry[];
  refetch: () => Promise<void>;
  handleAssignStrategy: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  handlePositionAction: (positionId: string, action: string, body?: Record<string, unknown>) => Promise<void>;
  handleApplySuggestion: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => Promise<void>;
  handleEvaluateStrategy: (positionId: string, strategyId: string) => Promise<void>;
  handleRemoveLiquidity: (positionId: string) => Promise<void>;
  handleDeleteAssignment: (id: string) => Promise<void>;
}

export const useAriaVegaApi = (): UseAriaVegaApiReturn => {
  const [data, setData] = useState<AriaVegaData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [evalLogs, setEvalLogs] = useState<EvalLogEntry[]>([]);

  const syncState = async (): Promise<void> => {
    try {
      const [healthRes, walletsRes, assignmentsRes, strategiesRes, stepsRes] = await Promise.all([
        fetch(`${API_URL}/health`)
          .then((r) => r.json())
          .catch(() => ({ status: 'offline', timestamp: Date.now() })),
        fetch(`${API_URL}/wallets`)
          .then((r) => r.json())
          .catch(() => ({ count: 0, wallets: [] })),
        fetch(`${API_URL}/assignments`)
          .then((r) => r.json())
          .catch(() => []),
        fetch(`${API_URL}/strategies`)
          .then((r) => r.json())
          .catch(() => ({ count: 0, strategies: [] })),
        fetch(`${API_URL}/steps`)
          .then((r) => r.json())
          .catch(() => ({ availableSteps: [], documentation: '' })),
      ]);

      const wallets = (walletsRes.wallets || []) as Wallet[];

      const portfoliosResults = await Promise.all(
        wallets.map((w) =>
          fetch(`${API_URL}/wallets/${w.address}/portfolio`)
            .then((r) => r.json())
            .then((d) => ({ wallet: w.address, portfolio: d }))
            .catch(() => ({ wallet: w.address, portfolio: undefined }))
        )
      );

      const portfoliosMap = new Map<string, Record<string, unknown>>();
      for (const r of portfoliosResults) {
        portfoliosMap.set(r.wallet, r.portfolio);
      }

      const walletsWithPortfolio = wallets.map((w) => ({
        ...w,
        portfolio: portfoliosMap.get(w.address) || undefined,
      })) as Wallet[];

      const positionsResults = await Promise.all(
        wallets.map((w) =>
          fetch(`${API_URL}/positions?wallet=${w.address}`)
            .then((r) => r.json())
            .then((d: { positions?: RawApiPosition[] }) => ({ wallet: w.address, positions: d.positions || [] }))
            .catch(() => ({ wallet: w.address, positions: [] as RawApiPosition[] }))
        )
      );

      const enrichedStrategies = (strategiesRes.strategies || []).map((s: { id: string; description?: string }) => {
        const meta = STRATEGY_META[s.id] || {
          name: s.id
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          risk: 'Medium',
        };
        return {
          id: s.id,
          name: meta.name,
          description: s.description || 'Custom strategy implementation',
          risk: meta.risk,
        };
      });

      const enrichedSteps = (stepsRes.availableSteps || []).map((stepId: string) => {
        const meta = STEP_META[stepId] || { type: 'Custom', description: 'Stateless logical workflow execution unit.' };
        return {
          id: stepId,
          type: meta.type,
          description: meta.description,
        };
      });

      const mappedPositions: Position[] = [];
      for (const r of positionsResults) {
        for (const pos of r.positions) {
          const minBin = pos.lowerBinId !== undefined ? pos.lowerBinId : pos.lowerBound !== undefined ? pos.lowerBound : 0;
          const maxBin = pos.upperBinId !== undefined ? pos.upperBinId : pos.upperBound !== undefined ? pos.upperBound : 0;
          const binCount = pos.binCount !== undefined ? pos.binCount : maxBin >= minBin ? maxBin - minBin + 1 : 0;
          const rangePercent = pos.rangePercent !== undefined ? pos.rangePercent : 0;

          mappedPositions.push({
            id: pos.id,
            pool: pos.poolAddress,
            minBin,
            maxBin,
            binCount,
            rangePercent,
            lowerBoundPrice: pos.lowerBoundPrice,
            upperBoundPrice: pos.upperBoundPrice,
            activeBin: pos.activeBin,
            openedAt: pos.openedAt,
            poolActivePrice: pos.poolActivePrice,
            status: pos.isInRange ? 'In Range' : 'Out of Range',
            state: pos.state || 'OPEN',
            tokenX: pos.tokenX,
            tokenY: pos.tokenY,
            raw: pos,
            pnlData: pos.pnlData || pos.metadata?.pnl || pos.metadata || pos,
            _wallet: r.wallet,
          });
        }
      }

      const setPoolMeta = useAppStore.getState().setPoolMeta;
      const setPositionsByPool = useAppStore.getState().setPositionsByPool;
      const poolAddresses = [...new Set(mappedPositions.map((p) => p.pool))];
      for (const poolAddr of poolAddresses) {
        const example = mappedPositions.find((p) => p.pool === poolAddr);
        if (!example) continue;
        const rawPos = example.raw as RawApiPosition;
        const xMint = rawPos.tokenX?.mint || rawPos.tokenX?.tokenAddress;
        const yMint = rawPos.tokenY?.mint || rawPos.tokenY?.tokenAddress;
        setPoolMeta(poolAddr, {
          address: poolAddr,
          name: `${getTokenSymbol({ mint: xMint })}-${getTokenSymbol({ mint: yMint })}`,
          tokenXMint: xMint || '',
          tokenYMint: yMint || '',
          tokenXSym: getTokenSymbol({ mint: xMint }),
          tokenYSym: getTokenSymbol({ mint: yMint }),
          binStep: rawPos.binStep || 0,
          baseFee: rawPos.baseFee || 0,
          feeRate: rawPos.feeRate || 0,
        });
      }
      setPositionsByPool(mappedPositions);

      setData({
        health: { epoch: healthRes.timestamp || Date.now(), status: healthRes.status || 'healthy' },
        positions: mappedPositions,
        assignments: assignmentsRes || [],
        strategies: enrichedStrategies,
        steps: enrichedSteps,
        wallets: walletsWithPortfolio,
      });
      setConnectionError(null);
    } catch (error: unknown) {
      console.error('Sync failed', error);
      setConnectionError('Unable to connect to the Aria Vega control server. Ensure it is running.');
    } finally {
      setLoading(false);
    }
  };

  useApiPolling(syncState, 25000);

  const handleAssignStrategy = async (positionId: string, strategyId: string, mode: string): Promise<void> => {
    try {
      const existing = data.assignments.find((a: Assignment) => a.positionId === positionId);

      if (existing) {
        const delRes = await fetch(`${API_URL}/assignments/${existing.id}`, { method: 'DELETE' });
        if (!delRes.ok) {
          console.error('Failed to delete existing assignment');
        }
      }

      if (strategyId === 'NONE') {
        syncState();
        return;
      }

      const newId = `asg_${Math.random().toString(36).substr(2, 6)}`;

      const res = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          strategyId,
          positionId,
          mode,
        }),
      });

      if (res.ok) {
        await res.json();
        syncState();
      } else {
        await res.json().catch(() => ({}));
      }
    } catch (error) {
      console.error('Assign strategy failed', error);
    }
  };

  const handlePositionAction = async (
    positionId: string,
    action: string,
    body: Record<string, unknown> = {}
  ): Promise<void> => {
    console.log(`[AriaVega] Triggering position action '${action}' for position: ${positionId}`);
    try {
      const requestUrl = `${API_URL}/positions/${positionId}/actions`;

      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...body,
        }),
      });

      const result = await res.json();
      console.log(`[AriaVega] Action result status: ${res.status}`, result);

      if (res.ok) {
        setEvalLogs((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action,
            strategyId: body.strategyId as string | undefined,
            positionId,
            result: result.result || result,
            transactionSignatures: result.transactionSignatures,
            pendingSuggestion: body.pendingSuggestion as
              | { action: string; openParams?: Record<string, unknown> }
              | undefined,
          } satisfies EvalLogEntry,
          ...prev.slice(0, 49),
        ]);

        if (action === 'removeLiquidity' || action === 'addLiquidity' || action === 'applySuggestion') {
          syncState();
        }
      } else {
        setEvalLogs((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action,
            error: result.error || result.message || 'Action failed',
            strategyId: body.strategyId as string | undefined,
            positionId,
          } satisfies EvalLogEntry,
          ...prev.slice(0, 49),
        ]);
      }
    } catch (err: unknown) {
      setEvalLogs((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action,
          error: err instanceof Error ? err.message : 'Network error',
          strategyId: body.strategyId as string | undefined,
          positionId,
        } satisfies EvalLogEntry,
        ...prev.slice(0, 49),
      ]);
    }
  };

  const handleApplySuggestion = async (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ): Promise<void> => {
    return handlePositionAction(positionId, 'applySuggestion', {
      strategyId,
      suggestion,
      pendingSuggestion: suggestion,
    });
  };

  const handleEvaluateStrategy = async (positionId: string, strategyId: string): Promise<void> => {
    return handlePositionAction(positionId, 'evaluateStrategy', { strategyId });
  };

  const handleRemoveLiquidity = async (positionId: string): Promise<void> => {
    return handlePositionAction(positionId, 'removeLiquidity');
  };

  const handleDeleteAssignment = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        syncState();
      } else {
        await res.json().catch(() => ({}));
      }
    } catch (error) {
      console.error('Delete assignment failed', error);
    }
  };

  return {
    data,
    loading,
    connectionError,
    evalLogs,
    refetch: syncState,
    handleAssignStrategy,
    handlePositionAction,
    handleApplySuggestion,
    handleEvaluateStrategy,
    handleRemoveLiquidity,
    handleDeleteAssignment,
  };
};
