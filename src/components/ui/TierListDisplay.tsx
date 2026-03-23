'use client';

import { getGameById } from '@/lib/mockData';
import Link from 'next/link';

interface TierListDisplayProps {
  tiers: {
    S: string[];
    A: string[];
    B: string[];
    C: string[];
    D: string[];
  };
}

const tierConfig = {
  S: { color: '#fbbf24', label: 'MASTERPIECE' },
  A: { color: '#CCFF00', label: 'EXCELLENT' },
  B: { color: '#6366F1', label: 'GREAT' },
  C: { color: '#3b82f6', label: 'GOOD' },
  D: { color: '#6b7280', label: 'AVERAGE' },
} as const;

type TierKey = keyof typeof tierConfig;

export default function TierListDisplay({ tiers }: TierListDisplayProps) {
  const tierKeys: TierKey[] = ['S', 'A', 'B', 'C', 'D'];

  return (
    <div>
      {tierKeys.map((tier) => {
        const gameIds = tiers[tier];
        if (!gameIds || gameIds.length === 0) return null;

        const { color, label } = tierConfig[tier];
        const games = gameIds
          .map((id) => getGameById(id))
          .filter((g): g is NonNullable<typeof g> => g !== undefined);

        if (games.length === 0) return null;

        return (
          <div
            key={tier}
            className="bg-bg-card rounded-sm border border-border p-4 mb-4"
          >
            <div
              className="mb-3"
              style={{ borderLeft: `4px solid ${color}`, paddingLeft: '12px' }}
            >
              <span
                className="text-sm uppercase tracking-wider font-bold"
                style={{ color }}
              >
                {tier} TIER
              </span>
              <span className="text-text-muted text-sm ml-2">— {label}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="w-20 h-28 rounded-sm overflow-hidden transition-transform hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
