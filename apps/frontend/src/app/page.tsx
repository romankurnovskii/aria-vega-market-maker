'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Box, Zap, Trash2, Layers, Database, ChevronRight, TerminalSquare, X } from 'lucide-react';

import AddLiquidityForm from './components/AddLiquidityForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

// Helper to format token amounts with their decimals
const formatAmount = (amountStr: string, decimals: number) => {
  if (!amountStr) return '0.00';
  const amt = parseFloat(amountStr) / Math.pow(10, decimals);
  return amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

// --- MAIN APPLICATION ---

export default function AriaVegaTerminal() {
  const [activeTab, setActiveTab] = useState('positions');
  const [data, setData] = useState<any>({ assignments: [], positions: [], strategies: [], steps: [], health: {} });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<string[]>(['[SYSTEM] Aria Vega Terminal Initializing...']);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const logEvent = (msg: string) => {
    setEvents((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  // Fetch all state from API
  const syncState = async () => {
    try {
      const [healthRes, positionsRes, assignmentsRes, strategiesRes, stepsRes] = await Promise.all([
        fetch(`${API_URL}/health`)
          .then((r) => r.json())
          .catch(() => ({ status: 'offline', timestamp: Date.now() })),
        fetch(`${API_URL}/positions`)
          .then((r) => r.json())
          .catch(() => ({ count: 0, positions: [] })),
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

      // Enrich strategies with standard names and risk levels
      const metadataMap: Record<string, { name: string; risk: string }> = {
        'trailing-usdc': { name: 'Trailing USDC', risk: 'Low' },
        'experimental-restake': { name: 'Experimental Restake', risk: 'High' },
        'spot-balanced': { name: 'Spot Balanced', risk: 'Medium' },
      };
      const enrichedStrategies = (strategiesRes.strategies || []).map((s: any) => {
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

      // Map positions
      const mappedPositions = (positionsRes.positions || []).map((pos: any) => ({
        id: pos.id,
        pool: pos.poolAddress,
        minBin: pos.lowerBinId !== undefined ? pos.lowerBinId : (pos.lowerBound !== undefined ? pos.lowerBound : 0),
        maxBin: pos.upperBinId !== undefined ? pos.upperBinId : (pos.upperBound !== undefined ? pos.upperBound : 0),
        status: pos.isInRange ? 'In Range' : 'Out of Range',
        state: pos.state || 'OPEN',
        tokenX: pos.tokenX,
        tokenY: pos.tokenY,
        raw: pos,
      }));

      setData({
        health: { epoch: healthRes.timestamp || Date.now(), status: healthRes.status || 'healthy' },
        positions: mappedPositions,
        assignments: assignmentsRes || [],
        strategies: enrichedStrategies,
        steps: enrichedSteps,
      });
      setConnectionError(null);
    } catch (error: any) {
      console.error('Sync failed', error);
      setConnectionError('Unable to connect to the Aria Vega control server. Ensure it is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logEvent('[SYS] Connecting to Aria Vega Control Server...');
    syncState();

    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      syncState();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAssignStrategy = async (positionId: string, strategyId: string, mode: string) => {
    try {
      // Find existing assignment for this position
      const existing = data.assignments.find((a: any) => a.positionId === positionId);

      if (existing) {
        logEvent(`[ASSIGN] Removing existing assignment ${existing.id}...`);
        const delRes = await fetch(`${API_URL}/assignments/${existing.id}`, { method: 'DELETE' });
        if (!delRes.ok) {
          logEvent(`[ASSIGN] Warning: failed to clear old assignment: ${delRes.statusText}`);
        }
      }

      if (strategyId === 'NONE') {
        logEvent(`[ASSIGN] Unassigned strategy from position ${positionId}`);
        syncState();
        return;
      }

      const newId = `asg_${Math.random().toString(36).substr(2, 6)}`;
      logEvent(`[ASSIGN] Requesting assignment for position ${positionId} with strategy ${strategyId}...`);

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
        const payload = await res.json();
        logEvent(`[ASSIGN] Strategy ${strategyId} bound successfully!`);
        syncState();
      } else {
        const errPayload = await res.json().catch(() => ({}));
        logEvent(`[ASSIGN] Error: ${errPayload.error || 'Failed to bind strategy'}`);
      }
    } catch (err: any) {
      logEvent(`[ASSIGN] Connection error: ${err.message || String(err)}`);
    }
  };

  const handleEvaluateStrategy = async (positionId: string, strategyId: string) => {
    try {
      const selectedPos = data.positions.find((p: any) => p.id === positionId);
      if (!selectedPos) return;

      logEvent(`[EVALUATE] Triggering manual tick evaluation for strategy ${strategyId} on position ${positionId}...`);

      const res = await fetch(`${API_URL}/strategies/${strategyId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          poolAddress: selectedPos.pool,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        logEvent(`[EVALUATE] Evaluation complete. Result status: ${result.status || 'Success'}`);
        if (result.result) {
          logEvent(`[EVALUATE] Yield: ${JSON.stringify(result.result)}`);
        }
      } else {
        logEvent(`[EVALUATE] Rejected: ${result.error || 'Evaluation error occurred'}`);
      }
    } catch (err: any) {
      logEvent(`[EVALUATE] Failed to execute: ${err.message || String(err)}`);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      logEvent(`[DELETE] Requesting revocation for assignment ${id}...`);
      const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        logEvent(`[DELETE] Revocation confirmed.`);
        syncState();
      } else {
        const errPayload = await res.json().catch(() => ({}));
        logEvent(`[DELETE] Revocation rejected: ${errPayload.error || 'Failed'}`);
      }
    } catch (err: any) {
      logEvent(`[DELETE] Failed to contact server: ${err.message || String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb flex items-center justify-center wireframe-grid">
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
    <div className="min-h-screen max-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb selection:bg-[#FF4500] selection:text-[#F4F4F0] p-4 flex flex-col wireframe-grid relative overflow-hidden">
      <div className="scanline"></div>

      {/* COMPACT HEADER SECTION */}
      <header className="border-b border-[#0D0D0D] pb-2 mb-4 flex flex-row justify-between items-end gap-4 relative z-10 shrink-0">
        <h1 className="font-syne text-2xl md:text-3xl font-extrabold uppercase leading-none tracking-tighter">
          Aria Vega{' '}
          <span className="text-transparent" style={{ WebkitTextStroke: '1px #0D0D0D' }}>
            Control
          </span>
        </h1>

        <div className="flex gap-6 text-xs border-l border-[#0D0D0D] pl-4">
          <div>
            <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Epoch</div>
            <div className="font-bold">{data.health.epoch}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Active Tasks</div>
            <div className="font-bold">{data.assignments.length}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Engine Status</div>
            <div className={`font-bold uppercase ${data.health.status === 'healthy' ? 'text-green-600' : 'text-[#FF4500]'}`}>
              {data.health.status}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-48 flex flex-col gap-1 shrink-0">
          {[
            { id: 'positions', icon: Database, label: 'Positions' },
            { id: 'assignments', icon: Layers, label: 'Assignments' },
            { id: 'strategies', icon: Zap, label: 'Strategies' },
            { id: 'steps', icon: Box, label: 'Pipeline' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 border border-[#0D0D0D] transition-all duration-200 group relative overflow-hidden ${
                activeTab === tab.id
                  ? 'bg-[#0D0D0D] text-[#F4F4F0]'
                  : 'bg-transparent hover:bg-[#0D0D0D] hover:text-[#F4F4F0]'
              }`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? 'text-[#FF4500]' : 'group-hover:text-[#FF4500]'} />
              <span className="uppercase text-xs tracking-widest font-semibold">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#FF4500]"></div>}
            </button>
          ))}
        </aside>

        {/* CONTENT AREA */}
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
                events={events}
                onAssign={handleAssignStrategy}
                onEvaluate={handleEvaluateStrategy}
                onSync={syncState}
              />
            )}
            {activeTab === 'assignments' && (
              <AssignmentsView assignments={data.assignments} onDelete={handleDeleteAssignment} />
            )}
            {activeTab === 'strategies' && <StrategiesView strategies={data.strategies} />}
            {activeTab === 'steps' && <StepsView steps={data.steps} />}
          </div>
        </main>
      </div>

      {/* FOOTER TICKER */}
      <footer className="mt-4 border-y border-[#0D0D0D] bg-[#0D0D0D] text-[#FF4500] py-1 overflow-hidden relative z-10 font-bold text-[10px] tracking-widest uppercase shrink-0">
        <div className="marquee-content whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-8">
              Aria Vega Market Maker // DLMM Strategy Executor // No Ghost Positions // Write-Ahead Intents // Connected to{' '}
              {API_URL} //
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

// --- SUB-VIEWS ---

function PositionsView({ positions, assignments, strategies, events, onAssign, onEvaluate, onSync }: any) {
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);

  const positionOrchestration = useMemo(() => {
    const map: Record<string, { strategyId: string; mode: string }> = {};
    assignments.forEach((a: any) => {
      map[a.positionId] = { strategyId: a.strategyId, mode: a.mode };
    });
    return map;
  }, [assignments]);

  const selectedPos = positions.find((p: any) => p.id === selectedPosId);
  const selectedOrch = selectedPos ? positionOrchestration[selectedPos.id] : null;

  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedMode, setSelectedMode] = useState('active');

  // Update local forms when selection changes
  useEffect(() => {
    if (selectedOrch) {
      setSelectedStrategyId(selectedOrch.strategyId);
      setSelectedMode(selectedOrch.mode);
    } else {
      setSelectedStrategyId(strategies[0]?.id || 'NONE');
      setSelectedMode('active');
    }
  }, [selectedPosId, selectedOrch, strategies]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      {/* LEFT: Positions Table */}
      <div
        className={`flex flex-col border border-[#0D0D0D] bg-white transition-all duration-300 ${selectedPosId ? 'hidden lg:flex lg:w-7/12' : 'w-full h-full'}`}
      >
        <div className="flex-1 overflow-auto">
          {positions.length === 0 ? (
            <div className="p-4 text-xs italic text-gray-500">
              No active positions fetched. Confirm liquidity provider assignments are running on-chain.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-[#0D0D0D] text-[#F4F4F0] z-10 shadow-[0_1px_0_#0D0D0D]">
                <tr>
                  <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Pos ID</th>
                  <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Target Pool</th>
                  <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Range</th>
                  <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">
                    State
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos: any) => {
                  const orch = positionOrchestration[pos.id];
                  const orchLabel = orch ? orch.mode.toUpperCase() : 'UNASSIGNED';
                  const orchClass =
                    orch?.mode === 'active'
                      ? 'text-green-600 font-bold'
                      : orch?.mode === 'monitor'
                        ? 'text-yellow-600 font-bold'
                        : 'text-gray-400';
                  const isSelected = selectedPosId === pos.id;

                  return (
                    <tr
                      key={pos.id}
                      onClick={() => setSelectedPosId(pos.id)}
                      className={`border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors cursor-pointer ${isSelected ? 'bg-[#E5E5DF]' : ''}`}
                    >
                      <td className="py-2 px-3 border-r border-gray-200 font-bold flex items-center gap-2">
                        {isSelected && <ChevronRight size={12} className="text-[#FF4500]" />}
                        <span className="truncate max-w-[120px]" title={pos.id}>
                          {pos.id}
                        </span>
                        {pos.state && pos.state !== 'OPEN' && (
                          <span className={`text-[8px] px-1 py-0.5 border scale-90 tracking-wide font-mono ${
                            pos.state === 'REBALANCING' ? 'border-yellow-500 text-yellow-600 animate-pulse bg-yellow-50' :
                            pos.state === 'CLOSING' ? 'border-orange-500 text-orange-600 animate-pulse bg-orange-50' :
                            pos.state === 'CREATING' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                            'border-red-500 text-red-600 bg-red-50'
                          }`}>
                            {pos.state}
                          </span>
                        )}
                      </td>
                      <td
                        className="py-2 px-3 border-r border-gray-200 truncate max-w-[120px] text-gray-600"
                        title={pos.pool}
                      >
                        {pos.pool}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200">
                        <span className={pos.status === 'In Range' ? 'text-green-600' : 'text-[#FF4500]'}>
                          {pos.minBin} - {pos.maxBin}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right ${orchClass}`}>{orchLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT: Position Details & Actions */}
      {selectedPos && (
        <div className="flex flex-col gap-4 w-full lg:w-5/12 h-full min-h-0 animate-in slide-in-from-right-4 duration-300">
          {/* Actions Pane */}
          <div className="border border-[#0D0D0D] bg-white p-4 shrink-0 flex flex-col gap-4">
            <div className="flex justify-between items-start border-b border-[#0D0D0D] pb-3">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target Position</div>
                <div className="font-syne font-bold text-lg truncate" title={selectedPos.id}>
                  {selectedPos.id}
                </div>
                <div className="text-xs text-gray-600 truncate mt-1">
                  Pool:{' '}
                  <span className="font-mono text-[10px]" title={selectedPos.pool}>
                    {selectedPos.pool}
                  </span>
                </div>
                {/* State machine premium badge */}
                <div className="mt-2 flex items-center">
                  <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-widest font-mono-jb ${
                    selectedPos.state === 'OPEN' ? 'border-green-500 text-green-600 bg-green-50' :
                    selectedPos.state === 'CREATING' ? 'border-blue-500 text-blue-600 bg-blue-50 animate-pulse' :
                    selectedPos.state === 'REBALANCING' ? 'border-yellow-500 text-yellow-600 bg-yellow-50 animate-pulse' :
                    selectedPos.state === 'CLOSING' ? 'border-orange-500 text-orange-600 bg-orange-50 animate-pulse' :
                    selectedPos.state === 'CLOSED' ? 'border-gray-500 text-gray-600 bg-gray-50' :
                    'border-[#FF4500] text-[#FF4500] bg-red-50'
                  }`}>
                    {selectedPos.state}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPosId(null)}
                className="p-1 border border-transparent hover:border-[#FF4500] hover:text-[#FF4500] transition-colors bg-[#F4F4F0]"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Balances Display */}
            <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-xs">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Position Balances</div>
              <div className="flex flex-col gap-1 font-mono-jb">
                <div className="flex justify-between">
                  <span className="text-gray-500">Token X:</span>
                  <span className="font-bold text-[#0D0D0D]">
                    {selectedPos.tokenX ? `${formatAmount(selectedPos.tokenX.amount, selectedPos.tokenX.decimals)}` : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token Y:</span>
                  <span className="font-bold text-[#0D0D0D]">
                    {selectedPos.tokenY ? `${formatAmount(selectedPos.tokenY.amount, selectedPos.tokenY.decimals)}` : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4500]">Orchestration & Strategy</div>
              <div className="flex flex-col gap-2">
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                  className="w-full bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
                >
                  <option value="NONE">-- No Strategy (Unassign) --</option>
                  {strategies.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="flex-1 bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
                    disabled={selectedStrategyId === 'NONE'}
                  >
                    <option value="active">Active</option>
                    <option value="monitor">Monitor</option>
                  </select>

                  <button
                    onClick={() => onAssign(selectedPos.id, selectedStrategyId, selectedMode)}
                    className="flex-1 bg-[#0D0D0D] text-[#F4F4F0] p-2 text-xs font-bold uppercase hover:bg-[#FF4500] transition-colors border border-[#0D0D0D]"
                  >
                    Set Assignment
                  </button>
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={() => onEvaluate(selectedPos.id, selectedStrategyId)}
                  disabled={selectedStrategyId === 'NONE' || !selectedOrch}
                  className="w-full flex items-center justify-center gap-2 border border-[#0D0D0D] p-2 text-xs font-bold uppercase hover:bg-[#F4F4F0] hover:text-[#FF4500] hover:border-[#FF4500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={14} /> Evaluate Ad-Hoc
                </button>
                <button
                  onClick={() => setShowAddLiquidity(true)}
                  className="w-full flex items-center justify-center gap-2 border border-[#0D0D0D] p-2 text-xs font-bold uppercase hover:bg-green-50 hover:text-green-600 hover:border-green-600 transition-colors"
                >
                  Add Liquidity
                </button>
              </div>

              {showAddLiquidity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="max-w-md w-full">
                    <AddLiquidityForm 
                      positionId={selectedPos.id} 
                      onSuccess={() => {
                        setShowAddLiquidity(false);
                        onSync();
                      }}
                      onCancel={() => setShowAddLiquidity(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events Log Pane */}
          <div className="flex-1 bg-[#0D0D0D] p-4 text-[#F4F4F0] font-mono-jb text-[10px] leading-relaxed border border-[#0D0D0D] overflow-y-auto flex flex-col min-h-[150px]">
            <div className="flex items-center gap-2 text-[#FF4500] mb-3 border-b border-gray-800 pb-2 shrink-0">
              <TerminalSquare size={14} />
              <span className="uppercase tracking-widest text-[10px]">Position Events</span>
            </div>
            <div className="space-y-2 flex-1">
              {events.map((log: string, i: number) => (
                <div key={i} className={`${i === 0 ? 'text-[#F4F4F0]' : 'text-gray-500'}`}>
                  {log}
                </div>
              ))}
              <div className="text-gray-700 animate-pulse mt-2">_</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentsView({ assignments, onDelete }: any) {
  if (assignments.length === 0)
    return <div className="text-gray-500 italic text-xs">No active assignments found. Use positions pane to create.</div>;

  return (
    <div className="flex-1 border border-[#0D0D0D] bg-white overflow-auto">
      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
        <thead className="sticky top-0 bg-[#0D0D0D] text-[#F4F4F0] z-10">
          <tr>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Assignment ID</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Target Position</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Strategy</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Mode</th>
            <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">Revoke</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((asg: any) => (
            <tr key={asg.id} className="border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors group">
              <td className="py-2 px-3 font-bold border-r border-gray-200 font-mono text-[11px]">{asg.id}</td>
              <td
                className="py-2 px-3 border-r border-gray-200 text-gray-700 font-mono text-[11px] truncate max-w-[200px]"
                title={asg.positionId}
              >
                {asg.positionId}
              </td>
              <td className="py-2 px-3 border-r border-gray-200">
                <span className="bg-[#0D0D0D] text-[#F4F4F0] px-1.5 py-0.5 text-[10px] font-mono">{asg.strategyId}</span>
              </td>
              <td className="py-2 px-3 border-r border-gray-200">
                <span
                  className={`px-1.5 py-0.5 text-[10px] border font-bold ${asg.mode === 'active' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}`}
                >
                  {asg.mode.toUpperCase()}
                </span>
              </td>
              <td className="py-1 px-3 text-right">
                <button
                  onClick={() => onDelete(asg.id)}
                  className="text-gray-400 hover:text-[#FF4500] transition-colors p-1"
                  title="Delete Assignment"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StrategiesView({ strategies }: any) {
  if (strategies.length === 0)
    return <div className="text-gray-500 italic text-xs">No strategies registered in the system.</div>;

  return (
    <div className="flex-1 overflow-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
      {strategies.map((strat: any) => (
        <div
          key={strat.id}
          className="flex flex-col justify-between border border-[#0D0D0D] bg-white p-4 shadow-[4px_4px_0_#0D0D0D]"
        >
          <div>
            <div className="flex items-start justify-between mb-2 gap-2">
              <h3 className="font-syne text-lg font-bold">{strat.name}</h3>
              <span
                className={`text-[9px] px-1.5 py-0.5 uppercase border shrink-0 ${strat.risk === 'High' ? 'border-[#FF4500] text-[#FF4500]' : 'border-[#0D0D0D] text-[#0D0D0D]'}`}
              >
                {strat.risk} RISK
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{strat.description}</p>
          </div>
          <div className="text-[9px] mt-4 pt-2 border-t border-gray-200 text-gray-400 font-mono-jb">ID: {strat.id}</div>
        </div>
      ))}
    </div>
  );
}

function StepsView({ steps }: any) {
  if (steps.length === 0) return <div className="text-gray-500 italic text-xs">No active pipeline steps registered.</div>;

  return (
    <div className="flex-1 overflow-auto pr-2 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
      {steps.map((step: any, idx: number) => (
        <div
          key={step.id}
          className="flex gap-3 border border-[#0D0D0D] bg-white p-4 relative overflow-hidden h-28 hover:bg-[#F4F4F0] transition-colors"
        >
          <div className="absolute -right-2 -bottom-4 text-7xl font-syne text-gray-100 select-none z-0">{idx + 1}</div>
          <div className="relative z-10">
            <div className="text-[9px] bg-[#0D0D0D] text-[#F4F4F0] px-1.5 py-0.5 inline-block mb-2 uppercase">
              {step.type}
            </div>
            <h4 className="font-bold text-sm mb-1 truncate">{step.id}</h4>
            <p className="text-xs text-gray-600 max-w-[85%]">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
