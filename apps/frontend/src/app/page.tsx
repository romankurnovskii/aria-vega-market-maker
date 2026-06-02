/**
 * @file page.tsx
 * @description Route entry point that composes the Aria Vega terminal container.
 *
 * @features
 * - Renders AriaVegaContainer as the sole page content
 * - Thin route shell with no logic of its own
 */

import { AriaVegaContainer } from './containers/AriaVegaContainer';

export const dynamic = 'force-dynamic';

export default function AriaVegaTerminalPage() {
  return <AriaVegaContainer />;
}
