/**
 * @file not-found.tsx
 * @description Next.js 404 page rendered when no route matches the requested URL.
 *
 * @features
 * - Displays a minimalist "404 / Page Not Found" message
 * - Provides a link back to the home page
 * - Uses force-dynamic to avoid static generation for this path
 */

import React from 'react';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb">
      <h2 className="font-syne text-4xl font-bold uppercase mb-4">404</h2>
      <p className="text-sm uppercase tracking-widest mb-8">Page Not Found</p>
      <a
        href="/"
        className="bg-[#0D0D0D] text-[#F4F4F0] py-2 px-6 text-sm font-bold uppercase hover:bg-[#FF4500] hover:text-[#0D0D0D] transition-colors"
      >
        Return Home
      </a>
    </div>
  );
}
