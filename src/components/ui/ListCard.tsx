'use client';

import Link from 'next/link';
import { Heart, Gamepad2 } from 'lucide-react';
import { GameList } from '@/lib/types';
import { getGameById } from '@/lib/mockData';

interface ListCardProps {
  list: GameList;
  variant?: 'featured' | 'grid';
}

function formatLikes(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}

export default function ListCard({ list, variant = 'grid' }: ListCardProps) {
  const coverGames = list.gameIds.slice(0, 4).map((id) => getGameById(id));
  const isFeatured = variant === 'featured';

  return (
    <Link
      href={`/lists/${list.id}`}
      className={`group block rounded-sm border border-border bg-bg-card/80 backdrop-blur-xl overflow-hidden
        transition-all duration-500 hover:-translate-y-1 hover:border-border-light
        ${isFeatured ? 'md:col-span-2' : ''}`}
    >
      {/* Cover grid */}
      <div className={`grid grid-cols-2 gap-0.5 bg-border ${isFeatured ? 'h-48 md:h-56' : 'h-40'}`}>
        {Array.from({ length: 4 }).map((_, i) => {
          const game = coverGames[i];
          return (
            <div key={i} className="relative overflow-hidden bg-bg-elevated">
              {game ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-text-muted/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2">
        {isFeatured && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent-orange bg-accent-orange/10 rounded px-1.5 py-0.5">
            Featured
          </span>
        )}

        <h3 className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-accent-orange transition-colors">
          {list.title}
        </h3>

        {list.description && (
          <p className="text-xs text-text-secondary line-clamp-2">
            {list.description}
          </p>
        )}

        {/* Creator */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-accent-teal/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-accent-teal">
              {list.creatorUsername.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-text-secondary truncate">
            {list.creatorUsername}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-1 text-text-muted">
            <Heart className="w-3 h-3" />
            <span className="text-xs">{formatLikes(list.likes)}</span>
          </div>
          <div className="flex items-center gap-1 text-text-muted">
            <Gamepad2 className="w-3 h-3" />
            <span className="text-xs">{list.gameIds.length} games</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
