/**
 * @file AriaVegaContainer.tsx
 * @description Smart container that owns all data fetching, state management, and event handling for the Aria Vega terminal.
 *
 * @features
 * - Fetches health, positions, assignments, strategies, and steps from the API on mount + interval
 * - Manages active tab state and connection errors
 * - Dispatches strategy assignment, evaluation, and revocation actions
 * - Passes typed data and callbacks to presentational child components
 *
 * @dependencies useState, useEffect, useMemo (React)
 * @sideEffects Interval-based polling every 5s; fetch calls to /api/health, /positions, /assignments, /strategies, /steps
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TerminalSquare } from 'lucide-react';

import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { PositionsView } from '../components/PositionsView';
import { WalletsView } from '../components/WalletsView';
import { AssignmentsView } from '../components/AssignmentsView';
import { StrategiesView } from '../components/StrategiesView';
import { StepsView } from '../components/StepsView';

import { Footer } from '../components/Footer';
import { useAppStore, EvalLogEntry } from '../stores/app-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

/**
 * Formats a token amount string with the given decimals into a human-readable number.
 *
 * @param amountStr - The raw amount as a string (e.g. from on-chain data)
 * @param decimals - The number of decimals the token uses
 * @returns A formatted string with 2–6 decimal places
 */
export const formatAmount = (amountStr: string, decimals: number): string => {
  if (!amountStr) return '0.00';
  const amt = parseFloat(amountStr) / Math.pow(10, decimals);
  return amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

export const getTokenSymbol = (tokenObj?: { mint?: string; tokenAddress?: string } | null): string => {
  if (!tokenObj) return 'TOKEN';
  const addr = tokenObj.tokenAddress || tokenObj.mint;
  if (!addr) return 'TOKEN';
  if (addr === 'So11111111111111111111111111111111111111112') return 'SOL';
  if (addr === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 'USDC';
  if (addr === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') return 'USDT';
  return addr.slice(0, 4).toUpperCase();
};

export interface HealthData {
  epoch: number;
  status: string;
}

interface Wallet {
  chain: string;
  address: string;
  is_default: boolean;
  portfolio?: Record<string, unknown>;
}

interface Position {
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
  tokenX: { amount: string; decimals: number; mint?: string } | null | undefined;
  tokenY: { amount: string; decimals: number; mint?: string } | null | undefined;
  openedAt?: number;
  poolActivePrice?: number;
  raw: Record<string, unknown>;
  pnlData?: Record<string, unknown>;
  _wallet?: string;
}

export interface Assignment {
  id: string;
  positionId: string;
  strategyId: string;
  mode: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  risk: string;
}

interface Step {
  id: string;
  type: string;
  description: string;
}

interface AriaVegaData {
  health: HealthData;
  positions: Position[];
  assignments: Assignment[];
  strategies: Strategy[];
  steps: Step[];
  wallets: Wallet[];
}

interface RawApiPosition {
  id: string;
  poolAddress: string;
  lowerBinId?: number;
  upperBinId?: number;
  lowerBound?: number;
  upperBound?: number;
  binCount?: number;
  rangePercent?: number;
  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  activeBin?: number;
  openedAt?: number;
  poolActivePrice?: number;
  isInRange?: boolean;
  state?: string;
  tokenX?: { amount: string; decimals: number; mint?: string; tokenAddress?: string };
  tokenY?: { amount: string; decimals: number; mint?: string; tokenAddress?: string };
  pnlData?: Record<string, unknown>;
  metadata?: { pnl?: Record<string, unknown> };
  binStep?: number;
  baseFee?: number;
  feeRate?: number;
  [key: string]: unknown;
}

export const AriaVegaContainer = () => {
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [data, setData] = useState<AriaVegaData>({
    assignments: [],
    positions: [],
    strategies: [],
    steps: [],
    wallets: [],
    health: { epoch: 0, status: '' },
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [evalLogs, setEvalLogs] = useState<EvalLogEntry[]>([]);

  // Fetch all state from API
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

      // Fetch portfolio data for each wallet concurrently
      const portfoliosResults = await Promise.all(
        wallets.map((w) =>
          fetch(`${API_URL}/wallets/${w.address}/portfolio`)
            .then((r) => r.json())
            .then((d) => ({ wallet: w.address, portfolio: d }))
            .catch(() => ({ wallet: w.address, portfolio: undefined }))
        )
      );

      // Merge portfolio data into wallets
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

      // Enrich strategies with standard names and risk levels
      const metadataMap: Record<string, { name: string; risk: string }> = {
        'trailing-usdc': { name: 'Trailing USDC', risk: 'Low' },
        'experimental-restake': { name: 'Experimental Restake', risk: 'High' },
        'spot-balanced': { name: 'Spot Balanced', risk: 'Medium' },
      };
      const enrichedStrategies = (strategiesRes.strategies || []).map((s: { id: string; description?: string }) => {
        const meta = metadataMap[s.id] || {
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

      // Enrich steps
      const stepMeta: Record<string, { type: string; description: string }> = {
        InitializationCheckStep: { type: 'Validation', description: 'Confirms position alive & holds valid assets.' },
        TrailingRangeCheckStep: { type: 'Monitor', description: 'Monitors if active bin moved out of bounds.' },
        RangeCalculatorStep: { type: 'Compute', description: 'Computes new balanced bin range.' },
        AmountCalculatorStep: { type: 'Compute', description: 'Identifies asset allocations needed.' },
      };
      const enrichedSteps = (stepsRes.availableSteps || []).map((stepId: string) => {
        const meta = stepMeta[stepId] || { type: 'Custom', description: 'Stateless logical workflow execution unit.' };
        return {
          id: stepId,
          type: meta.type,
          description: meta.description,
        };
      });

      // Map positions, tagged with wallet address
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

      // Populate Zustand store with pool metadata and positions
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

  useEffect(() => {
    syncState();

    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      syncState();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Handles assigning a strategy to a position.
   * Removes any existing assignment for the position first, then creates a new one.
   *
   * @param positionId - The target position ID
   * @param strategyId - The strategy to assign (or 'NONE' to unassign)
   * @param mode - The orchestration mode ('active' or 'monitor')
   */
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

  /**
   * Generic handler for performing actions on a position (evaluate, removeLiquidity, etc.)
   * uses the unified POST /positions/:id/actions endpoint.
   *
   * @param positionId - The target position ID
   * @param action - The action string (evaluate, removeLiquidity, applySuggestion)
   * @param body - Additional payload (e.g. strategyId)
   */
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

  /**
   * Applies a strategy suggestion (close, open, or close+open with parameters).
   */
  const handleApplySuggestion = (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => {
    return handlePositionAction(positionId, 'applySuggestion', {
      strategyId,
      suggestion, // The backend expects 'suggestion' in req.body
      pendingSuggestion: suggestion, // Keep for log display if needed
    });
  };

  /**
   * Shorthand for evaluating a strategy.
   */
  const handleEvaluateStrategy = (positionId: string, strategyId: string) => {
    return handlePositionAction(positionId, 'evaluate', { strategyId });
  };

  /**
   * Shorthand for removing liquidity.
   */
  const handleRemoveLiquidity = (positionId: string) => {
    return handlePositionAction(positionId, 'removeLiquidity');
  };

  /**
   * Revokes an existing assignment by ID.
   *
   * @param id - The assignment ID to delete
   */
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

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb flex items-center justify-center wireframe-grid">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border border-[#0D0D0D] animate-spin mb-6 flex items-center justify-center">
            <div className="w-6 h-6 bg-[#FF4500]"></div>
          </div>
          <h1 className="font-syne text-2xl font-bold uppercase tracking-widest animate-pulse">Aria Vega</h1>
          {connectionError && <p className="text-xs text-[#FF4500] mt-4 max-w-sm text-center">{connectionError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:max-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb selection:bg-[#FF4500] selection:text-[#F4F4F0] p-4 flex flex-col wireframe-grid relative overflow-auto lg:overflow-hidden">
      <div className="scanline"></div>

      <Header health={data.health} assignments={data.assignments} wallets={data.wallets} />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0">
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="flex items-center justify-center p-2 border border-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#F4F4F0] transition-colors"
            title={isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <TerminalSquare size={16} />
          </button>
          {isSidebarVisible && <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}
        </div>

        <main className="flex-1 border-t border-l border-[#0D0D0D] bg-[#F4F4F0] p-4 relative flex flex-col min-h-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#0D0D0D]"></div>

          <h2 className="font-syne text-xl font-bold uppercase mb-4 pb-2 border-b border-[#0D0D0D] flex justify-between items-center shrink-0">
            {activeTab.replace('-', ' ')}
          </h2>

          <div className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'positions' && (
              <PositionsView
                positions={data.positions}
                assignments={data.assignments}
                strategies={data.strategies}
                onAssign={handleAssignStrategy}
                onEvaluate={handleEvaluateStrategy}
                onRemoveLiquidity={handleRemoveLiquidity}
                onApplySuggestion={handleApplySuggestion}
                evalLogs={evalLogs}
              />
            )}
            {activeTab === 'wallets' && <WalletsView wallets={data.wallets} />}
            {activeTab === 'assignments' && (
              <AssignmentsView
                assignments={data.assignments}
                onDelete={handleDeleteAssignment}
                evalLogs={evalLogs}
                onApplySuggestion={handleApplySuggestion}
              />
            )}
            {activeTab === 'strategies' && <StrategiesView strategies={data.strategies} />}
            {activeTab === 'steps' && <StepsView steps={data.steps} />}
          </div>
        </main>
      </div>

      <Footer apiUrl={API_URL} />
    </div>
  );
};
