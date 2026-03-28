'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent-orange/5 blur-[100px] pointer-events-none" />

      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JeggyLogo.png" alt="Jeggy" className="h-16 w-auto opacity-20 mb-8" />

      {/* Error icon */}
      <h1 className="text-[100px] sm:text-[140px] font-black font-[family-name:var(--font-mono)] leading-none mb-2 bg-gradient-to-b from-red-400/30 to-red-400/5 bg-clip-text text-transparent select-none">
        500
      </h1>

      {/* Message */}
      <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-3">
        Something went wrong
      </h2>
      <p className="text-sm sm:text-base text-text-muted mb-10 max-w-md leading-relaxed">
        An unexpected error occurred. Try refreshing the page, or head back home.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-accent-green/10 text-accent-green border border-accent-green/20 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-green/20 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white/[0.04] text-text-primary border border-white/10 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/[0.08] transition-colors"
        >
          <Home size={16} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
