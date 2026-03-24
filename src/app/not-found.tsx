'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JeggyLogo.png" alt="Jeggy" className="h-20 w-auto opacity-30 mb-6" />
      <h1 className="text-6xl font-bold font-[family-name:var(--font-mono)] text-accent-orange mb-2">404</h1>
      <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] text-primary mb-2">
        Looks like this page rolled a critical miss
      </h2>
      <p className="text-sm text-secondary mb-8 max-w-md">
        The page you&apos;re looking for has wandered off the map. Maybe it&apos;s on a side quest?
      </p>
      <div className="flex gap-3">
        <Link
          href="/games"
          className="bg-accent-orange text-black px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
        >
          Browse Games
        </Link>
        <Link
          href="/"
          className="border border-border text-text-muted px-5 py-2.5 rounded-sm hover:text-text-primary transition-all duration-300"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
