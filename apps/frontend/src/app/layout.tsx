/**
 * @file layout.tsx
 * @description Root layout component for the Next.js app shell. Sets HTML structure,
 *              global CSS import, and metadata for the terminal dashboard.
 *
 * @features
 * - Defines root <html> and <body> tags with Tailwind classes
 * - Provides site-wide metadata (title, description)
 * - Imports global CSS
 */

import type { Metadata } from 'next';
import './globals.css';

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'Aria Vega Market Maker',
  description: 'Aria Vega Market Maker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
