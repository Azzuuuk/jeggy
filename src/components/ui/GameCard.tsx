'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Game } from '@/lib/types';
import { getRatingColor } from './ColorCodedRating';

interface GameCardProps {
  game: Game;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  showRating?: boolean;
  showQuickRate?: boolean;
  onQuickLog?: (game: Game) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toString();
}

const platformAbbr: Record<string, string> = {
  'PS5': 'PS5',
  'Xbox Series X': 'Xbox',
  'PC': 'PC',
  'Switch': 'Switch',
  'Mobile': 'Mobile',
};

export default function GameCard({
  game,
  size = 'md',
  showTitle = true,
  showRating = false,
  showQuickRate = true,
}: GameCardProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  const imageHeights = { sm: 'h-[180px]', md: 'h-[250px]', lg: 'h-[300px]' };

  const year = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;
  const platform = game.platforms?.[0] ? (platformAbbr[game.platforms[0]] ?? game.platforms[0]) : null;

  const handleStarClick = (e: React.MouseEvent, star: number) => {
    e.preventDefault();
    e.stopPropagation();
    setUserRating(star * 2);
  };

  return (
    <div className="game-card-glow group w-full transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Link href={`/games/${game.id}`} className="block">
        <div className={`relative ${imageHeights[size]} rounded-sm overflow-hidden bg-bg-elevated border border-transparent group-hover:border-accent-orange/20`}>
          {/* Cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Hover overlay */}
          {showQuickRate && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-white leading-tight truncate">{game.title}</p>
                <p className="text-xs text-white/70">
                  {year}{platform ? ` · ${platform}` : ''}
                </p>
                <div
                  className="flex items-center gap-0.5 pt-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-0 transition-transform hover:scale-110"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={(e) => handleStarClick(e, star)}
                      aria-label={`Rate ${star * 2} out of 10`}
                    >
                      <Star
                        size={24}
                        className={
                          star <= (hoverRating || (userRating !== null ? userRating / 2 : 0))
                            ? 'text-accent-orange'
                            : 'text-white/40'
                        }
                        fill={
                          star <= (hoverRating || (userRating !== null ? userRating / 2 : 0))
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/50">Rate this</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {showTitle && (
        <div className="mt-1.5 text-center">
          <p className="text-sm text-text-primary truncate">{game.title}</p>
          {showRating && (
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span
                className="text-xs font-bold"
                style={{ color: getRatingColor(game.averageRating) }}
              >
                ⭐ {game.averageRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-text-muted">/ 10</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
