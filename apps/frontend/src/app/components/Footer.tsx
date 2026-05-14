/**
 * @file Footer.tsx
 * @description Marquee footer ticker displaying the Aria Vega branding and API connection URL.
 *
 * @features
 * - Infinite horizontal scrolling marquee text
 * - Displays connection URL for the control server
 *
 * @sideEffects None
 */

interface FooterProps {
  apiUrl: string;
}

export const Footer = ({ apiUrl }: FooterProps) => {
  return (
    <footer className="mt-4 border-y border-[#0D0D0D] bg-[#0D0D0D] text-[#FF4500] py-1 overflow-hidden relative z-10 font-bold text-[10px] tracking-widest uppercase shrink-0">
      <div className="marquee-content whitespace-nowrap">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="mx-8">
            Aria Vega Market Maker // DLMM Strategy Executor // No Ghost Positions // Write-Ahead Intents // Connected to{' '}
            {apiUrl} //
          </span>
        ))}
      </div>
    </footer>
  );
};