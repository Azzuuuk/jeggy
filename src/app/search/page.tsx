'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';
import SearchBar from '@/components/ui/SearchBar';
import { Search, Gamepad2, ListOrdered, Star, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { getRatingColor } from '@/components/ui/ColorCodedRating';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const GameRequestModal = dynamic(() => import('@/components/ui/GameRequestModal'), { ssr: false });

type SearchTab = 'all' | 'games' | 'users' | 'lists';

interface ListResult {
  id: string;
  title: string;
  description: string | null;
  game_ids: string[];
  username: string;
}

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [gameResults, setGameResults] = useState<SupabaseGame[]>([]);
  const [listResults, setListResults] = useState<ListResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGameRequest, setShowGameRequest] = useState(false);
  const { user } = useAuth();

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGameResults([]);
      setListResults([]);
      setUserResults([]);
      return;
    }

    setLoading(true);
    const term = q.trim();

    const [gamesRes, listsRes, usersRes] = await Promise.all([
      supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating, genres, developers, platforms, release_year')
        .or(`name.ilike.%${term}%,genres.cs.{${term}},themes.cs.{${term}},developers.cs.{${term}}`)
        .order('igdb_rating_count', { ascending: false, nullsFirst: false })
        .limit(40),
      supabase
        .from('lists')
        .select('id, title, description, game_ids, user_id, profiles!lists_user_id_fkey(username)')
        .eq('is_public', true)
        .ilike('title', `%${term}%`)
        .limit(20),
      supabase
        .from('profiles')
        .select('id, username, display_name, bio')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20),
    ]);

    setGameResults((gamesRes.data || []) as SupabaseGame[]);
    setListResults(
      (listsRes.data || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        game_ids: l.game_ids || [],
        username: l.profiles?.username || 'Unknown',
      })),
    );
    setUserResults(usersRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const totalResults = gameResults.length + userResults.length + listResults.length;

  const tabs: { key: SearchTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalResults },
    { key: 'games', label: 'Games', count: gameResults.length },
    { key: 'users', label: 'Users', count: userResults.length },
    { key: 'lists', label: 'Lists', count: listResults.length },
  ];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[400px] h-[400px] -top-32 left-1/3 bg-[radial-gradient(circle,rgba(204,255,0,0.08)_0%,transparent_70%)]" />

      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {query ? (
        <>
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              Search results for &ldquo;{query}&rdquo;
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {loading ? 'Searching...' : `Found ${gameResults.length} game${gameResults.length !== 1 ? 's' : ''} and ${listResults.length} list${listResults.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-300 relative ${
                  activeTab === tab.key
                    ? 'text-accent-orange'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange rounded-t" />
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
            </div>
          ) : totalResults > 0 ? (
            <div className="space-y-10">
              {/* Games */}
              {(activeTab === 'all' || activeTab === 'games') && gameResults.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <div className="flex items-center gap-2 mb-4">
                      <Gamepad2 size={18} className="text-accent-orange" />
                      <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary">Games</h2>
                      <span className="text-xs text-text-muted">({gameResults.length})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {gameResults.map(game => (
                      <Link
                        key={game.id}
                        href={`/games/${game.slug}`}
                        className="game-card-glow group w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30"
                      >
                        <div className="relative h-[250px] rounded-sm overflow-hidden bg-bg-elevated">
                          {game.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No Cover</div>
                          )}
                        </div>
                        <div className="mt-1.5 text-center">
                          <p className="text-sm text-text-primary truncate">{game.name}</p>
                          {game.average_rating > 0 && (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <Star size={10} className="text-accent-orange fill-accent-orange" />
                              <span className="text-xs font-bold font-[family-name:var(--font-mono)]" style={{ color: getRatingColor(game.average_rating) }}>
                                {game.average_rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-text-muted">/ 10</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Users */}
              {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={18} className="text-accent-orange" />
                      <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary">Users</h2>
                      <span className="text-xs text-text-muted">({userResults.length})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userResults.map(u => (
                      <Link
                        key={u.id}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-4 rounded-sm border border-border bg-bg-card/80 backdrop-blur-xl p-4 hover:-translate-y-1 hover:border-text-muted transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                          {(u.display_name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-text-primary">{u.display_name || u.username}</div>
                          <div className="text-xs text-text-muted">@{u.username}</div>
                          {u.bio && <p className="text-xs text-text-secondary mt-1 line-clamp-1">{u.bio}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Lists */}
              {(activeTab === 'all' || activeTab === 'lists') && listResults.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <div className="flex items-center gap-2 mb-4">
                      <ListOrdered size={18} className="text-accent-orange" />
                      <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary">Lists</h2>
                      <span className="text-xs text-text-muted">({listResults.length})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listResults.map(list => (
                      <Link
                        key={list.id}
                        href={`/lists/${list.id}`}
                        className="block rounded-sm border border-border bg-bg-card/80 backdrop-blur-xl p-4 hover:-translate-y-1 hover:border-text-muted transition-all duration-300"
                      >
                        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] text-text-primary hover:text-accent-orange transition-all duration-300 line-clamp-2">
                          {list.title}
                        </h3>
                        {list.description && (
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1">{list.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                          <span>by {list.username}</span>
                          <span>·</span>
                          <span>{list.game_ids.length} games</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search size={48} className="text-text-muted mb-4" />
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">No results for &ldquo;{query}&rdquo;</h2>
              <p className="text-text-secondary text-sm max-w-md mb-6">
                Try different keywords, browse our game library, or request the game to be added
              </p>
              <div className="flex gap-3">
                <Link
                  href="/games"
                  className="px-5 py-2.5 rounded-sm bg-accent-green text-black text-sm font-medium hover:bg-accent-green-hover transition-all duration-300"
                >
                  Browse All Games
                </Link>
                {user && (
                  <button
                    onClick={() => setShowGameRequest(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25 rounded-sm text-sm font-semibold transition-all duration-300"
                  >
                    <Plus size={14} /> Request Game
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={48} className="text-text-muted mb-4" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary mb-2">Search for games & lists</h2>
          <p className="text-text-secondary text-sm max-w-md">
            Find games by title, developer, genre, or theme. Discover curated lists from the community.
          </p>
        </div>
      )}

      {showGameRequest && (
        <GameRequestModal searchQuery={query} onClose={() => setShowGameRequest(false)} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8"><p className="text-text-muted">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
