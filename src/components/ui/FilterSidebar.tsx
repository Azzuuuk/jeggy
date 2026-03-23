'use client';

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Platform, GameMode, FilterState } from '@/lib/types';
import { allGenres } from '@/lib/mockData';
import Button from './Button';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const platforms: Platform[] = ['PC', 'PS5', 'Xbox Series X', 'Switch', 'Mobile'];
const gameModes: GameMode[] = ['Single-player', 'Local Co-op', 'Online Co-op', 'PvP'];

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const togglePlatform = (platform: Platform) => {
    const updated = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    onFilterChange({ ...filters, platforms: updated });
  };

  const toggleGenre = (genre: string) => {
    const updated = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFilterChange({ ...filters, genres: updated });
  };

  const toggleGameMode = (mode: GameMode) => {
    const updated = filters.gameModes.includes(mode)
      ? filters.gameModes.filter(m => m !== mode)
      : [...filters.gameModes, mode];
    onFilterChange({ ...filters, gameModes: updated });
  };

  const clearFilters = () => {
    onFilterChange({
      platforms: [],
      genres: [],
      gameModes: [],
      crossPlatform: null,
      priceRange: [0, 70],
      minRating: 0,
      releaseYearRange: [2010, 2026],
    });
  };

  const activeCount = filters.platforms.length + filters.genres.length +
    filters.gameModes.length + (filters.crossPlatform !== null ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Filters</h3>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-accent-orange hover:text-accent-orange-hover transition-colors">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Platforms */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Platform</h4>
        <div className="space-y-2">
          {platforms.map(p => (
            <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.platforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="w-4 h-4 rounded border-border bg-bg-elevated text-accent-orange accent-[#CCFF00] cursor-pointer"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{p}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Genre</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {allGenres.map(g => (
            <label key={g} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.genres.includes(g)}
                onChange={() => toggleGenre(g)}
                className="w-4 h-4 rounded border-border bg-bg-elevated text-accent-orange accent-[#CCFF00] cursor-pointer"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Game Modes */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Game Mode</h4>
        <div className="space-y-2">
          {gameModes.map(m => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.gameModes.includes(m)}
                onChange={() => toggleGameMode(m)}
                className="w-4 h-4 rounded border-border bg-bg-elevated text-accent-orange accent-[#CCFF00] cursor-pointer"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cross-Platform */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Cross-Platform</h4>
        <div className="flex gap-2">
          {[
            { label: 'Any', value: null },
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => onFilterChange({ ...filters, crossPlatform: opt.value as boolean | null })}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                filters.crossPlatform === opt.value
                  ? 'bg-accent-orange/15 border-accent-orange text-accent-orange'
                  : 'border-border text-text-secondary hover:text-text-primary hover:border-border-light'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Minimum Rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
        </h4>
        <input
          type="range"
          min={0}
          max={9}
          step={1}
          value={filters.minRating}
          onChange={e => onFilterChange({ ...filters, minRating: Number(e.target.value) })}
          className="w-full accent-[#CCFF00]"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>Any</span>
          <span>9+</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span className="bg-accent-orange text-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-24 bg-bg-card rounded-sm border border-border p-5">
          {content}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-bg-card border-l border-border p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
