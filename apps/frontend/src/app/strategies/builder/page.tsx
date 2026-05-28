/**
 * @file page.tsx
 * @description Next.js App Router entry point for the Strategy Builder UI.
 */
import { Metadata } from 'next';
import { StrategyBuilderContainer } from '../../containers/StrategyBuilderContainer';

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'Strategy Builder | Aria Vega',
  description: 'Visual drag-and-drop strategy pipeline builder',
};

export default function StrategyBuilderPage() {
  return <StrategyBuilderContainer />;
}
