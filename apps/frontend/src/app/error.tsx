/**
 * @file error.tsx
 * @description Next.js error boundary UI — displays a fallback page when an
 *              unhandled render error occurs in any client component.
 *
 * @features
 * - Catches and logs render errors to console
 * - Renders "Something went wrong" message with a retry button
 * - Uses reset() to attempt recovery
 */

'use client';

import React, { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb p-4">
      <h2 className="font-syne text-2xl font-bold uppercase mb-4 text-[#FF4500]">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="bg-[#0D0D0D] text-[#F4F4F0] py-2 px-6 text-sm font-bold uppercase hover:bg-[#FF4500] hover:text-[#0D0D0D] transition-colors border border-[#0D0D0D]"
      >
        Try again
      </button>
    </div>
  );
}
