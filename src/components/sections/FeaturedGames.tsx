'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Clock, Swords } from 'lucide-react';
import { Game } from '@/lib/types';
import Button from '../ui/Button';

interface FeaturedGamesProps {
  games: Game[];
}

export default function FeaturedGames({ games }: FeaturedGamesProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % games.length);
  }, [games.length]);

  const prev = () => {
    setCurrent(prev => (prev - 1 + games.length) % games.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const game = games[current];
  if (!game) return null;

  return (
    <section className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden">
      {/* Background image */}
      {games.map((g, i) => (
        <div
          key={g.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={g.coverImage}
            alt=""
            className="w-full h-full object-cover scale-110 blur-sm"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
        <div className="flex items-center gap-8 lg:gap-12 w-full">
          {/* Cover art */}
          <Link href={`/games/${game.id}`} className="hidden sm:block flex-shrink-0 group">
            <div className="w-[200px] lg:w-[240px] rounded-sm overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.coverImage}
                alt={game.title}
                className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent-orange font-semibold mb-2">Featured</p>
              <Link href={`/games/${game.id}`}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight hover:text-accent-orange transition-colors">
                  {game.title}
                </h1>
              </Link>
              <p className="text-text-secondary text-sm mt-2">
                {game.developer} · {new Date(game.releaseDate).getFullYear()}
              </p>
            </div>

            <p className="text-text-secondary text-sm sm:text-base leading-relaxed line-clamp-2 max-w-xl">
              {game.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-accent-orange fill-accent-orange" />
                <span className="font-bold text-white">{game.averageRating.toFixed(1)}</span>
                <span className="text-text-muted">/ 10</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock size={14} />
                <span>{game.timeToBeat}h to beat</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Swords size={14} />
                <span>{game.difficulty}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {game.genres.map(g => (
                <span key={g} className="px-2.5 py-1 text-xs rounded-md bg-white/10 text-white/80 backdrop-blur-sm">
                  {g}
                </span>
              ))}
              {game.crossPlatform && (
                <span className="px-2.5 py-1 text-xs rounded-md bg-accent-teal/20 text-accent-teal">
                  Cross-Platform
                </span>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={`/games/${game.id}`}>
                <Button variant="primary" size="lg">View Details</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
          aria-label="Previous game"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
          aria-label="Next game"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {games.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-accent-orange' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
