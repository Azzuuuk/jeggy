'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseGame } from '@/lib/types';
import { Search, X, GripVertical } from 'lucide-react';
import { createActivity } from '@/lib/activities';

type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

interface SelectedGame extends SupabaseGame {
  tier?: Tier;
}

const inputClasses =
  'w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30 outline-none transition-all duration-300';

// TierMaker-style colors: warm→cool gradient
const TIER_COLORS: Record<Tier, string> = {
  S: '#ff7f7f',
  A: '#ffbf7f',
  B: '#ffdf7f',
  C: '#ffff7f',
  D: '#bfff7f',
};

export default function CreateListPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGames, setSelectedGames] = useState<SelectedGame[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [rankingStyle, setRankingStyle] = useState<'numbered' | 'tiered'>('numbered');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupabaseGame[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragGameId, setDragGameId] = useState<number | null>(null);
  const [dragOverTier, setDragOverTier] = useState<Tier | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  // Debounced Supabase search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating')
        .ilike('name', `%${searchQuery}%`)
        .limit(10);
      setSearchResults((data || []) as SupabaseGame[]);
      setShowDropdown((data || []).length > 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addGame = (game: SupabaseGame) => {
    if (selectedGames.some((g) => g.id === game.id)) return;
    setSelectedGames((prev) => [...prev, { ...game, tier: rankingStyle === 'tiered' ? 'S' : undefined }]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeGame = (gameId: number) => {
    setSelectedGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const moveGame = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= selectedGames.length) return;
    const next = [...selectedGames];
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedGames(next);
  };

  const updateTier = (gameId: number, tier: Tier) => {
    setSelectedGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, tier } : g)));
  };

  const handlePublish = async () => {
    if (!user || !title.trim() || selectedGames.length === 0) return;
    setSaving(true);

    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createList', user.id);
      if (!rl.success) { alert(rl.message); setSaving(false); return; }
      const gameIds = selectedGames.map((g) => g.id.toString());
      let tiers = null;
      if (rankingStyle === 'tiered') {
        tiers = {
          S: selectedGames.filter((g) => g.tier === 'S').map((g) => g.id.toString()),
          A: selectedGames.filter((g) => g.tier === 'A').map((g) => g.id.toString()),
          B: selectedGames.filter((g) => g.tier === 'B').map((g) => g.id.toString()),
          C: selectedGames.filter((g) => g.tier === 'C').map((g) => g.id.toString()),
          D: selectedGames.filter((g) => g.tier === 'D').map((g) => g.id.toString()),
        };
      }

      const { data, error } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          game_ids: gameIds,
          ranking_style: rankingStyle,
          tiers,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      createActivity({
        userId: user.id,
        activityType: 'created_list',
        listId: data.id,
        listTitle: data.title,
        metadata: { game_count: gameIds.length, ranking_style: rankingStyle },
      });

      router.push(`/lists/${data.id}`);
    } catch (err) {
      console.error('Error creating list:', err);
      alert('Failed to create list');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const gamesByTier = rankingStyle === 'tiered'
    ? (['S', 'A', 'B', 'C', 'D'] as Tier[]).reduce((acc, t) => {
        acc[t] = selectedGames.filter((g) => g.tier === t);
        return acc;
      }, {} as Record<Tier, SelectedGame[]>)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">Create a New List</h1>
        <p className="text-text-secondary mt-1">Curate your perfect collection</p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            List Title <span className="text-accent-orange">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g., Best Co-op Games for PS5"
            className={inputClasses}
          />
          <p className={`text-right text-xs mt-1 ${title.length >= 80 ? 'text-accent-orange' : 'text-text-muted'}`}>
            {title.length}/100
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Describe what makes this list special..."
            className={inputClasses + ' resize-none'}
          />
          <p className={`text-right text-xs mt-1 ${description.length >= 450 ? 'text-accent-orange' : 'text-text-muted'}`}>
            {description.length}/500
          </p>
        </div>

        {/* Ranking Style */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Ranking Style</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRankingStyle('numbered')}
              className={`flex-1 py-3 rounded-sm border text-sm font-medium transition-all duration-300 ${
                rankingStyle === 'numbered'
                  ? 'border-accent-green bg-accent-green/10 text-accent-green'
                  : 'border-border text-text-secondary hover:border-border-light'
              }`}
            >
              # Numbered (1, 2, 3...)
            </button>
            <button
              type="button"
              onClick={() => setRankingStyle('tiered')}
              className={`flex-1 py-3 rounded-sm border text-sm font-medium transition-all duration-300 ${
                rankingStyle === 'tiered'
                  ? 'border-accent-green bg-accent-green/10 text-accent-green'
                  : 'border-border text-text-secondary hover:border-border-light'
              }`}
            >
              Tier-based (S, A, B, C, D)
            </button>
          </div>
        </div>

        {/* Add Games */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Games <span className="text-accent-orange">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games to add..."
                className={inputClasses + ' pl-10'}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {showDropdown && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => addGame(game)}
                    disabled={selectedGames.some((g) => g.id === game.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-elevated transition-all duration-300 text-left disabled:opacity-40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.cover_url || '/placeholder.jpg'}
                      alt={game.name}
                      className="w-10 h-14 rounded object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{game.name}</p>
                      <p className="text-xs text-text-muted truncate">{game.developers?.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Games */}
          <div className="mt-3 space-y-2">
            {selectedGames.length === 0 ? (
              <div className="border border-dashed border-border rounded-sm px-4 py-8 text-center text-text-muted text-sm">
                No games added yet. Search above to add games!
              </div>
            ) : rankingStyle === 'numbered' ? (
              selectedGames.map((game, index) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 bg-bg-elevated border border-border rounded-sm px-3 py-2"
                >
                  <span className="text-sm text-text-muted w-5 text-right flex-shrink-0">{index + 1}</span>
                  <GripVertical size={16} className="text-text-muted flex-shrink-0" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={game.cover_url || '/placeholder.jpg'} alt={game.name} className="w-10 h-14 rounded object-cover flex-shrink-0" />
                  <span className="text-sm font-medium text-text-primary truncate flex-1">{game.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => moveGame(index, 'up')} disabled={index === 0} className="px-2 py-1 text-xs bg-bg-card border border-border rounded hover:bg-bg-elevated disabled:opacity-30 transition-all duration-300">↑</button>
                    <button onClick={() => moveGame(index, 'down')} disabled={index === selectedGames.length - 1} className="px-2 py-1 text-xs bg-bg-card border border-border rounded hover:bg-bg-elevated disabled:opacity-30 transition-all duration-300">↓</button>
                  </div>
                  <button onClick={() => removeGame(game.id)} className="text-text-muted hover:text-red-400 transition-all duration-300 flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ))
            ) : (
              /* TierMaker-style tier editor with drag & drop */
              <div className="border border-[#1a1a1a] rounded-sm overflow-hidden mt-3">
              {(['S', 'A', 'B', 'C', 'D'] as Tier[]).map((tier) => {
                const color = TIER_COLORS[tier];
                const isOver = dragOverTier === tier;
                return (
                <div
                  key={tier}
                  className={`flex border-b border-[#1a1a1a] last:border-b-0 min-h-[90px] transition-all ${isOver ? 'ring-2 ring-white/30 ring-inset' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTier(tier); }}
                  onDragLeave={() => setDragOverTier(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverTier(null);
                    if (dragGameId !== null) updateTier(dragGameId, tier);
                    setDragGameId(null);
                  }}
                >
                  {/* Tier label block */}
                  <div
                    className="w-[72px] sm:w-[88px] flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-3xl sm:text-4xl font-black text-black/80 select-none">{tier}</span>
                  </div>
                  {/* Items area */}
                  <div className={`flex-1 flex flex-wrap items-start content-start gap-[3px] p-[3px] min-h-[90px] transition-colors ${isOver ? 'bg-[#252545]' : 'bg-[#1a1a2e]'}`}>
                    {gamesByTier && gamesByTier[tier].length === 0 ? (
                      <div className="flex items-center justify-center w-full h-full text-text-muted text-xs py-4">
                        {isOver ? 'Release to drop here' : 'Drag games here'}
                      </div>
                    ) : (
                      gamesByTier && gamesByTier[tier].map((game) => (
                        <div
                          key={game.id}
                          draggable
                          onDragStart={() => setDragGameId(game.id)}
                          onDragEnd={() => { setDragGameId(null); setDragOverTier(null); }}
                          className={`relative group cursor-grab active:cursor-grabbing ${dragGameId === game.id ? 'opacity-40' : ''}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={game.cover_url || '/placeholder.jpg'} alt={game.name} className="w-[64px] h-[85px] sm:w-[72px] sm:h-[96px] object-cover pointer-events-none" />
                          {/* Name tooltip on hover */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-white text-center py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {game.name}
                          </div>
                          <button
                            onClick={() => removeGame(game.id)}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 hover:bg-red-500 rounded-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )})}
              </div>
            )}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {selectedGames.length} game{selectedGames.length !== 1 ? 's' : ''} added
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Visibility</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-accent-orange' : 'bg-bg-elevated'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm ${isPublic ? 'text-accent-orange' : 'text-text-muted'}`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button onClick={() => router.push('/lists')} className="text-text-muted hover:text-text-primary transition-all duration-300 text-sm">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={saving || !title.trim() || selectedGames.length === 0}
            className="bg-accent-orange hover:bg-accent-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium px-6 py-2.5 rounded-sm transition-all duration-300 text-sm"
          >
            {saving ? 'Creating...' : 'Publish List'}
          </button>
        </div>
      </div>
    </div>
  );
}
