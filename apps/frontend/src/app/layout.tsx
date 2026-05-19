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
