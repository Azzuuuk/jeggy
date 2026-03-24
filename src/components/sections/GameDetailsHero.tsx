'use client';

import { useState } from 'react';
import { Clock, Swords, Users, ShieldCheck, Bookmark, Play, Check, X, Share2, PenLine, ChevronDown } from 'lucide-react';
import { Game, GameStatus, PriceEntry } from '@/lib/types';
import ColorCodedRating from '../ui/ColorCodedRating';
import RatingInputHalf from '../ui/RatingInputHalf';

interface GameDetailsHeroProps {
  game: Game;
}

export default function GameDetailsHero({ game }: GameDetailsHeroProps) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions: { label: GameStatus; icon: React.ReactNode; color: string }[] = [
    { label: 'Playing', icon: <Play size={14} />, color: 'bg-accent-teal/15 text-accent-teal border-accent-teal/30' },
    { label: 'Played', icon: <Check size={14} />, color: 'bg-green-500/15 text-green-400 border-green-500/30' },
    { label: 'Completed', icon: <Check size={14} />, color: 'bg-accent-teal/15 text-accent-teal border-accent-teal/30' },
    { label: '100% Completed', icon: <Check size={14} />, color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    { label: 'Want to Play', icon: <Bookmark size={14} />, color: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30' },
    { label: 'Dropped', icon: <X size={14} />, color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  ];

  const effectivePrices = Object.values(game.price)
    .filter((p): p is PriceEntry => p !== undefined)
    .map(p => p.onSale && p.salePrice ? p.salePrice : p.price);
  const lowestPrice = effectivePrices.length > 0 ? Math.min(...effectivePrices) : null;
  const storeCount = Object.keys(game.price).length;

  return (
    <>
      <section className="relative">
        {/* Blurred cover background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.coverImage}
            alt=""
            className="w-full h-full object-cover scale-110 blur-xl opacity-30"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-bg-primary/85 to-bg-primary" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-10">
            {/* Cover image */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-[220px] sm:w-[250px] lg:w-[280px] rounded-sm overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={game.coverImage} alt={game.title} className="w-full aspect-[3/4] object-cover" />
              </div>
            </div>

            {/* Info column */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Title + meta */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{game.title}</h1>
                <p className="text-text-secondary mt-1.5">
                  {game.developer} · {game.publisher} · {new Date(game.releaseDate).getFullYear()}
                </p>
              </div>

              {/* Platform + Genre pills */}
              <div className="flex flex-wrap gap-2">
                {game.platforms.map(p => (
                  <span key={p} className="px-2.5 py-1 text-xs rounded-md bg-bg-elevated/80 text-text-secondary border border-border">
                    {p}
                  </span>
                ))}
                {game.genres.map(g => (
                  <span key={g} className="px-2.5 py-1 text-xs rounded-md bg-bg-card border border-border text-text-secondary hover:border-accent-teal hover:text-accent-teal transition-colors cursor-pointer">
                    {g}
                  </span>
                ))}
              </div>

              {/* Rating display */}
              <ColorCodedRating
                rating={game.averageRating}
                size="lg"
                showLabel
                showBar
                totalRatings={game.totalRatings}
              />

              {/* Quick stats */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {game.gameModes.map(mode => (
                  <div key={mode} className="flex items-center gap-1.5 text-text-secondary">
                    <Users size={13} className="text-text-muted" />
                    <span>{mode}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Clock size={13} className="text-text-muted" />
                  <span>~{game.timeToBeat}h</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Swords size={13} className="text-text-muted" />
                  <span>{game.difficulty}</span>
                </div>
                {game.crossPlatform && (
                  <div className="flex items-center gap-1.5 text-accent-teal">
                    <ShieldCheck size={13} />
                    <span>Cross-Platform</span>
                  </div>
                )}
              </div>

              {/* Price */}
              {lowestPrice !== null && (
                <div>
                  <p className="font-medium text-text-primary">From ${lowestPrice.toFixed(2)}</p>
                  <p className="text-xs text-text-muted">{storeCount} stores</p>
                </div>
              )}

              {/* Rating input */}
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Rate this game</p>
                <RatingInputHalf value={userRating} onChange={setUserRating} size="md" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md border transition-all ${
                      status
                        ? statusOptions.find(s => s.label === status)?.color || 'border-border text-text-secondary'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    {status ? statusOptions.find(s => s.label === status)?.icon : <Bookmark size={14} />}
                    {status || 'Add to List'}
                    <ChevronDown size={12} />
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                      <div className="absolute top-full mt-1 left-0 z-20 w-48 bg-bg-card border border-border rounded-sm shadow-xl overflow-hidden">
                        {statusOptions.map(opt => (
                          <button
                            key={opt.label}
                            onClick={() => { setStatus(status === opt.label ? null : opt.label); setShowStatusDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
                              status === opt.label ? opt.color : 'text-text-secondary hover:bg-bg-elevated'
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-md bg-accent-orange text-black hover:bg-accent-orange-hover transition-colors">
                  <PenLine size={12} />
                  Write Review
                </button>

                <button className="flex items-center justify-center px-2 py-2 text-xs rounded-md border border-border text-text-muted hover:text-text-primary hover:border-border-light transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
