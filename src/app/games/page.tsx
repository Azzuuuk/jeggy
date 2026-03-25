'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SupabaseGame, SortOption } from '@/lib/types';
import { ArrowUpDown, SlidersHorizontal, Star, Search, X, ChevronDown, Gamepad2, Clock, Users, Plus } from 'lucide-react';
import { getRatingColor } from '@/components/ui/ColorCodedRating';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const GameRequestModal = dynamic(() => import('@/components/ui/GameRequestModal'), { ssr: false });

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Popular' },
  { value: 'rating-desc', label: 'Top Rated' },
  { value: 'rating-asc', label: 'Lowest Rated' },
  { value: 'release-desc', label: 'Newest' },
  { value: 'title-asc', label: 'A → Z' },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialSort = (searchParams.get('sort') as SortOption) || 'relevance';
  const { user } = useAuth();

  const [games, setGames] = useState<SupabaseGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [timeToBeatFilter, setTimeToBeatFilter] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userRatings, setUserRatings] = useState<Map<string, number>>(new Map());
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [showGameRequest, setShowGameRequest] = useState(false);

  const PAGE_SIZE = 60;

  const buildQuery = useCallback(() => {
    let query = supabase.from('games').select('id, name, slug, cover_url, average_rating, genres, platforms, release_year, time_to_beat_main, igdb_rating_count, game_modes, first_release_date', { count: 'exact' });

    if (searchQuery.trim()) {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }
    if (selectedGenres.length > 0) {
      query = query.overlaps('genres', selectedGenres);
    }
    if (selectedPlatforms.length > 0) {
      query = query.overlaps('platforms', selectedPlatforms);
    }

    if (timeToBeatFilter !== 'all') {
      if (timeToBeatFilter === 'short') {
        query = query.gte('time_to_beat_main', 0).lte('time_to_beat_main', 10);
      } else if (timeToBeatFilter === 'medium') {
        query = query.gte('time_to_beat_main', 10).lte('time_to_beat_main', 30);
      } else if (timeToBeatFilter === 'long') {
        query = query.gte('time_to_beat_main', 30).lte('time_to_beat_main', 60);
      } else if (timeToBeatFilter === 'epic') {
        query = query.gte('time_to_beat_main', 60);
      }
    }

    switch (sort) {
      case 'rating-desc':
        query = query.order('average_rating', { ascending: false }).order('total_ratings', { ascending: false });
        break;
      case 'rating-asc':
        query = query.order('average_rating', { ascending: true });
        break;
      case 'release-desc':
        query = query.order('release_year', { ascending: false, nullsFirst: false });
        break;
      case 'title-asc':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('igdb_rating_count', { ascending: false });
    }

    return query;
  }, [sort, searchQuery, selectedGenres, selectedPlatforms, timeToBeatFilter]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const { data, error, count } = await buildQuery().range(0, PAGE_SIZE - 1);
    if (!error && data) {
      setGames(data as SupabaseGame[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [buildQuery]);

  const loadMore = async () => {
    setLoadingMore(true);
    const from = games.length;
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (!error && data) {
      setGames(prev => [...prev, ...(data as SupabaseGame[])]);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    const fetchGenres = async () => {
      const { data } = await supabase.from('games').select('genres');
      if (data) {
        const genreSet = new Set<string>();
        data.forEach(g => g.genres?.forEach((genre: string) => genreSet.add(genre)));
        setAllGenres(Array.from(genreSet).sort());
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  useEffect(() => {
    if (!user || games.length === 0) return;
    const fetchUserRatings = async () => {
      const gameIds = games.map(g => g.id.toString());
      const { data } = await supabase
        .from('user_games')
        .select('game_id, rating')
        .eq('user_id', user.id)
        .in('game_id', gameIds)
        .not('rating', 'is', null);
      if (data) {
        setUserRatings(new Map(data.map(r => [r.game_id, r.rating])));
      }
    };
    fetchUserRatings();
  }, [user, games]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedPlatforms([]);
    setTimeToBeatFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedPlatforms.length > 0 || timeToBeatFilter !== 'all' || searchQuery.trim().length > 0;

  const popularPlatforms = ['PC (Microsoft Windows)', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch'];
  const displayGenres = expandedGenres ? allGenres : allGenres.slice(0, 12);

  return (
    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[500px] h-[500px] -top-40 -left-32 bg-[radial-gradient(circle,rgba(204,255,0,0.08)_0%,transparent_70%)]" />
      <div className="ambient-orb w-[400px] h-[400px] top-[800px] -right-40 bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="mb-8 lg:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
              Browse Games
            </h1>
            <p className="text-text-muted text-sm mt-1 font-[family-name:var(--font-mono)]">
              {totalCount > 0 ? '10,000+ games' : 'Loading...'}
            </p>
          </div>
          {/* Search — desktop */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 transition-all duration-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Sort pills + filter toggle */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  sort === opt.value
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'bg-bg-card border border-border text-text-muted hover:text-text-primary hover:border-border-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-medium border transition-all duration-300 flex-shrink-0 ${
              hasActiveFilters
                ? 'bg-accent-orange/15 border-accent-orange/30 text-accent-orange'
                : 'bg-bg-card border-border text-text-muted hover:text-text-primary'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters{hasActiveFilters ? ` (${selectedGenres.length + selectedPlatforms.length})` : ''}
          </button>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {selectedGenres.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-teal/10 border border-accent-teal/20 text-accent-teal rounded-sm text-xs font-medium hover:bg-accent-teal/20 transition-all duration-300">
                {g} <X size={11} />
              </button>
            ))}
            {selectedPlatforms.map(p => (
              <button key={p} onClick={() => togglePlatform(p)} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange rounded-sm text-xs font-medium hover:bg-accent-orange/20 transition-all duration-300">
                {p.replace('(Microsoft Windows)', '').replace('X|S', 'X').trim()} <X size={11} />
              </button>
            ))}
            {timeToBeatFilter !== 'all' && (
              <button onClick={() => setTimeToBeatFilter('all')} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-teal/10 border border-accent-teal/20 text-accent-teal rounded-sm text-xs font-medium hover:bg-accent-teal/20 transition-all duration-300">
                {timeToBeatFilter === 'short' ? '0-10h' : timeToBeatFilter === 'medium' ? '10-30h' : timeToBeatFilter === 'long' ? '30-60h' : '60h+'} <X size={11} />
              </button>
            )}
            <button onClick={clearFilters} className="text-xs text-text-muted hover:text-text-primary transition-all duration-300 underline underline-offset-2">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-8 lg:gap-10">
        {/* Filter sidebar — desktop */}
        <aside className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:relative lg:bg-transparent lg:backdrop-blur-none' : 'hidden lg:block'}`}>
          <div
            className={`${showMobileFilters ? 'absolute left-0 top-0 h-full w-72 bg-bg-primary overflow-y-auto p-5 lg:relative lg:w-auto lg:p-0' : ''} w-52 flex-shrink-0 space-y-8`}
            onClick={e => e.stopPropagation()}
          >
            {showMobileFilters && (
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h3 className="font-bold text-text-primary">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-text-muted hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Genres */}
            <div>
              <h3 className="text-[11px] font-bold font-[family-name:var(--font-mono)] uppercase tracking-widest text-text-muted mb-3">Genre</h3>
              <div className="space-y-0.5">
                {displayGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-all duration-300 ${
                      selectedGenres.includes(genre)
                        ? 'bg-accent-teal/10 text-accent-teal font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
                {allGenres.length > 12 && (
                  <button
                    onClick={() => setExpandedGenres(!expandedGenres)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-muted hover:text-accent-green transition-all duration-300"
                  >
                    <ChevronDown size={12} className={`transition-transform ${expandedGenres ? 'rotate-180' : ''}`} />
                    {expandedGenres ? 'Show less' : `${allGenres.length - 12} more`}
                  </button>
                )}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <h3 className="text-[11px] font-bold font-[family-name:var(--font-mono)] uppercase tracking-widest text-text-muted mb-3">Platform</h3>
              <div className="space-y-0.5">
                {popularPlatforms.map(platform => (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-all duration-300 ${
                      selectedPlatforms.includes(platform)
                        ? 'bg-accent-orange/10 text-accent-orange font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    {platform.replace('(Microsoft Windows)', '').replace('X|S', 'X').trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Time to Beat */}
            <div>
              <h3 className="text-[11px] font-bold font-[family-name:var(--font-mono)] uppercase tracking-widest text-text-muted mb-3">Time to Beat</h3>
              <div className="space-y-0.5">
                {[
                  { value: 'all', label: 'All Games' },
                  { value: 'short', label: 'Short (0-10h)' },
                  { value: 'medium', label: 'Medium (10-30h)' },
                  { value: 'long', label: 'Long (30-60h)' },
                  { value: 'epic', label: 'Epic (60h+)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeToBeatFilter(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-all duration-300 ${
                      timeToBeatFilter === opt.value
                        ? 'bg-accent-teal/10 text-accent-teal font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {showMobileFilters && (
            <div className="absolute inset-0 -z-10 lg:hidden" onClick={() => setShowMobileFilters(false)} />
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-text-muted font-[family-name:var(--font-mono)]">
              {loading ? 'Loading...' : `Showing ${games.length.toLocaleString()} of 10,000+`}
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-bg-elevated rounded-sm" />
                  <div className="h-3.5 bg-bg-elevated rounded mt-2.5 w-4/5" />
                  <div className="h-3 bg-bg-elevated rounded mt-1.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : games.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
                {games.map(game => {
                  const userRating = userRatings.get(game.id.toString());
                  return (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated ring-1 ring-white/5 group-hover:ring-accent-orange/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent-orange/5">
                        {game.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.cover_url}
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                            No Cover
                          </div>
                        )}
                        {/* Rating badge */}
                        {game.average_rating > 0 && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center gap-1">
                            <Star size={10} className="text-accent-orange fill-accent-orange" />
                            <span className="text-xs font-bold font-[family-name:var(--font-mono)]" style={{ color: getRatingColor(game.average_rating) }}>
                              {game.average_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {/* User rating badge */}
                        {userRating && (
                          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-accent-orange/90 text-[10px] font-bold text-black">
                            You: {userRating}
                          </div>
                        )}
                        {/* Hover overlay with quick stats */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center gap-3 text-[10px] text-text-primary font-[family-name:var(--font-mono)]">
                              {game.average_rating > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star size={9} className="text-accent-orange fill-accent-orange" />
                                  {game.average_rating.toFixed(1)}
                                </span>
                              )}
                              {game.total_ratings > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Users size={9} />
                                  {game.total_ratings.toLocaleString()}
                                </span>
                              )}
                              {game.time_to_beat_main && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={9} />
                                  {game.time_to_beat_main}h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-accent-orange transition-all duration-300">{game.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1">
                          {game.average_rating > 0 && (
                            <span className="font-bold font-[family-name:var(--font-mono)]" style={{ color: getRatingColor(game.average_rating) }}>
                              {game.average_rating.toFixed(1)}
                            </span>
                          )}
                          {game.average_rating > 0 && game.release_year && <span>·</span>}
                          {game.release_year && <span>{game.release_year}</span>}
                        </div>
                        {game.platforms && game.platforms.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {game.platforms.slice(0, 3).map(p => (
                              <span key={p} className="text-[9px] text-text-muted bg-white/5 rounded px-1 py-0.5">{p}</span>
                            ))}
                            {game.platforms.length > 3 && (
                              <span className="text-[9px] text-text-muted">+{game.platforms.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* Load More */}
              {games.length < totalCount && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-10 py-3 bg-bg-card border border-border rounded-sm text-sm font-semibold text-text-primary hover:border-accent-orange hover:text-accent-orange transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-acid border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `Load More`
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Gamepad2 size={48} className="text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No games match your filters
              </h3>
              <p className="text-text-secondary text-sm max-w-md mb-4">
                Try adjusting your search or filters, or request the game to be added
              </p>
              <div className="flex gap-3">
                <button onClick={clearFilters} className="text-sm text-accent-green hover:underline transition-all duration-300">
                  Clear all filters
                </button>
                {user && searchQuery && (
                  <button
                    onClick={() => setShowGameRequest(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25 rounded-sm text-sm font-semibold transition-all duration-300"
                  >
                    <Plus size={14} /> Request &ldquo;{searchQuery}&rdquo;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showGameRequest && (
        <GameRequestModal searchQuery={searchQuery} onClose={() => setShowGameRequest(false)} />
      )}
    </div>
  );
}

export default function BrowseGamesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12"><p className="text-text-muted">Loading...</p></div>}>
      <BrowseContent />
    </Suspense>
  );
}
