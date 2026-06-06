/**
 * @file page.tsx
 * @description Next.js App Router entry point for the Strategy Builder UI.
 *              Accepts an optional `id` search param to auto-load a saved strategy.
 */
import { Metadata } from 'next';
import { StrategyBuilderContainer } from '../../containers/StrategyBuilderContainer';

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'Strategy Builder | Aria Vega',
  description: 'Visual drag-and-drop strategy pipeline builder',
};

export const dynamic = 'force-dynamic';

export default async function StrategyBuilderPage(props: {
  searchParams: Promise<{ id?: string }>;
}) {
  const searchParams = await props.searchParams;
  return <StrategyBuilderContainer initialStrategyId={searchParams?.id} />;
}
