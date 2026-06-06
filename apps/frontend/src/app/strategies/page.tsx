/**
 * @file page.tsx
 * @description Next.js App Router entry point for the Strategies listing page.
 *              Fetches strategies from the API and renders them in a card grid.
 *
 * @features
 * - Fetches strategies from the Aria Vega API
 * - Enriches raw strategies with display metadata (name, risk)
 * - Shows a loading state while fetching
 * - Renders StrategiesView with a "Back to Dashboard" link
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StrategiesView } from '../components/strategies/StrategiesView';
import type { Strategy } from '../types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

/** Enrichment metadata for known built-in strategies. */
const STRATEGY_META: Record<string, { name: string; risk: string }> = {
  'spot-balanced': { name: 'Spot Balanced', risk: 'Medium' },
};

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/strategies`)
      .then((r) => r.json())
      .then((data) => {
        const enriched = (data.strategies || []).map((s: { id: string; description?: string }) => {
          const meta = STRATEGY_META[s.id] || {
            name: s.id
              .split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
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
        setStrategies(enriched);
      })
      .catch(() => setStrategies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border border-[#0D0D0D] animate-spin flex items-center justify-center">
            <div className="w-6 h-6 bg-[#FF4500]"></div>
          </div>
        </div>
      ) : (
        <div className="p-4 max-w-4xl mx-auto flex flex-col min-h-screen">
          <div className="mb-4">
            <Link href="/" className="text-sm uppercase tracking-widest font-bold hover:text-[#FF4500] transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex-1 flex flex-col">
            <StrategiesView strategies={strategies} />
          </div>
        </div>
      )}
    </div>
  );
}
