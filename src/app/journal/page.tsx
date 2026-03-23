'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { journalEntries, getGameById } from '@/lib/mockData';
import { Star, Plus, Calendar } from 'lucide-react';

function formatMonthYear(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderStars(rating: number) {
  const maxStars = 5;
  const scaled = rating / 2; // 10-scale to 5-star
  const full = Math.floor(scaled);
  const half = scaled - full >= 0.5;
  const empty = maxStars - full - (half ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-px">
      {Array.from({ length: full }, (_, i) => (
        <Star key={`f${i}`} className="w-3.5 h-3.5 fill-accent-orange text-accent-orange" />
      ))}
      {half && (
        <span className="relative w-3.5 h-3.5">
          <Star className="w-3.5 h-3.5 text-text-muted absolute inset-0" />
          <span className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="w-3.5 h-3.5 fill-accent-orange text-accent-orange" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`e${i}`} className="w-3.5 h-3.5 text-text-muted" />
      ))}
    </span>
  );
}

export default function JournalPage() {
  const sorted = useMemo(
    () => [...journalEntries].sort((a, b) => b.datePlayed.localeCompare(a.datePlayed)),
    []
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sorted>();
    sorted.forEach((entry) => {
      const key = formatMonthYear(entry.datePlayed);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return Array.from(map.entries());
  }, [sorted]);

  const stats = useMemo(() => {
    const count = sorted.length;
    const avg = count > 0 ? (sorted.reduce((s, e) => s + e.rating, 0) / count).toFixed(1) : '0';
    const platforms = new Set(sorted.map((e) => e.platform)).size;
    return { count, avg, platforms };
  }, [sorted]);

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[400px] h-[400px] -top-32 -right-24 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)] text-text-primary">YOUR JOURNAL</h1>
          <p className="text-text-secondary mt-2">A diary of every game you play</p>
        </div>
        <button
          onClick={() => alert('Add entry coming soon!')}
          className="flex items-center gap-2 bg-accent-green text-black px-4 py-2 rounded-sm text-sm font-medium hover:bg-accent-green/90 transition-all duration-300 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Stats Summary */}
      <p className="text-sm text-text-muted mt-4 font-[family-name:var(--font-mono)]">
        {stats.count} games logged · {stats.avg} average rating · {stats.platforms} platforms
      </p>

      {/* Journal Entries */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-4xl mb-4">📅</span>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary mb-2">Your journal is empty</h3>
          <p className="text-sm text-text-secondary mb-6">
            Start logging games you play to build your gaming timeline.
          </p>
          <button
            onClick={() => alert('Add entry coming soon!')}
            className="bg-accent-green text-black px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent-green/90 transition-all duration-300"
          >
            + Add Your First Game
          </button>
        </div>
      ) : (
        <div>
          {grouped.map(([month, entries], gi) => (
            <div key={month}>
              <h2 className={`text-xs uppercase tracking-widest font-semibold font-[family-name:var(--font-display)] text-text-muted mb-4 border-b border-border pb-2 ${gi === 0 ? 'mt-8' : 'mt-8'}`}>
                {month}
              </h2>
              <div className="space-y-3">
                {entries.map((entry) => {
                  const game = getGameById(entry.gameId);
                  if (!game) return null;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 py-2">
                      {/* Date */}
                      <span className="text-sm text-text-muted w-16 flex-shrink-0 pt-1">
                        {formatDay(entry.datePlayed)}
                      </span>

                      {/* Cover */}
                      <div className="w-12 h-16 rounded overflow-hidden bg-bg-elevated flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={game.coverImage}
                          alt={game.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/games/${game.id}`}
                            className="text-base font-semibold text-text-primary hover:text-accent-teal transition-all duration-300"
                          >
                            {game.title}
                          </Link>
                          {renderStars(entry.rating)}
                          <span className="text-sm text-accent-orange font-bold font-[family-name:var(--font-mono)]">{entry.rating}/10</span>
                          <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-secondary">
                            {entry.platform}
                          </span>
                          {entry.liked && <span title="Liked">❤️</span>}
                        </div>
                        {entry.review && (
                          <p className="text-sm text-text-secondary italic mt-1 truncate">
                            &ldquo;{entry.review}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
