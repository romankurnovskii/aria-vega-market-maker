/**
 * @file AriaVegaContainer.tsx
 * @description Presentation-layer container. Data fetching, state, and action handlers
 *              are delegated to the useAriaVegaApi hook. This component manages only
 *              UI state (active tab, sidebar visibility) and layout composition.
 */

'use client';

import React, { useState } from 'react';
import { TerminalSquare } from 'lucide-react';

import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { PositionsView } from '../components/positions/PositionsView';
import { WalletsView } from '../components/wallets/WalletsView';
import { AssignmentsView } from '../components/assignments/AssignmentsView';
import { StrategiesView } from '../components/strategies/StrategiesView';
import { StepsView } from '../components/steps/StepsView';
import { Footer } from '../components/layout/Footer';
import { API_URL, useAriaVegaApi } from '../hooks/useAriaVegaApi';

export const AriaVegaContainer = () => {
  const [activeTab, setActiveTab] = useState('positions');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const {
    data,
    loading,
    connectionError,
    evalLogs,
    handleAssignStrategy,
    handleEvaluateStrategy,
    handleApplyStrategy,
    handleApplySuggestion,
    handleDeleteAssignment,
    handleOpenPosition,
  } = useAriaVegaApi();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb flex items-center justify-center wireframe-grid">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border border-[#0D0D0D] animate-spin mb-6 flex items-center justify-center">
            <div className="w-6 h-6 bg-[#FF4500]"></div>
          </div>
          <h1 className="font-syne text-2xl font-bold uppercase tracking-widest animate-pulse">Aria Vega</h1>
          {connectionError && <p className="text-sm text-[#FF4500] mt-4 max-w-sm text-center">{connectionError}</p>}
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
                lineage={data.lineage}
                assignments={data.assignments}
                strategies={data.strategies}
                onAssign={handleAssignStrategy}
                onEvaluate={handleEvaluateStrategy}
                onApplyStrategy={handleApplyStrategy}
                onApplySuggestion={handleApplySuggestion}
                onOpenPosition={handleOpenPosition}
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
