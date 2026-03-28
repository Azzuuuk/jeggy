'use client';

import Link from 'next/link';
import { Gamepad2, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-accent-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent-orange/5 blur-[100px] pointer-events-none" />

      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JeggyLogo.png" alt="Jeggy" className="h-16 w-auto opacity-20 mb-8" />

      {/* 404 number */}
      <h1 className="text-[120px] sm:text-[160px] font-black font-[family-name:var(--font-mono)] leading-none mb-2 bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none">
        404
      </h1>

      {/* Message */}
      <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-3">
        This page rolled a critical miss
      </h2>
      <p className="text-sm sm:text-base text-text-muted mb-10 max-w-md leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Maybe it&apos;s on a side quest?
      </p>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-accent-green/10 text-accent-green border border-accent-green/20 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-green/20 transition-colors"
        >
          <Home size={16} />
          Go Home
        </Link>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 bg-white/[0.04] text-text-primary border border-white/10 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/[0.08] transition-colors"
        >
          <Gamepad2 size={16} />
          Browse Games
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-white/[0.04] text-text-muted border border-white/10 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/[0.08] transition-colors"
        >
          <Search size={16} />
          Search
        </Link>
      </div>
    </div>
  );
}
