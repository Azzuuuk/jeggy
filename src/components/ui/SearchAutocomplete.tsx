'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';
import { Search, X, Gamepad2, ListOrdered, User } from 'lucide-react';
import Link from 'next/link';

interface ListResult {
  id: string;
  title: string;
  username: string;
  game_count: number;
}

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
}

interface SearchAutocompleteProps {
  compact?: boolean;
  defaultValue?: string;
}

export default function SearchAutocomplete({ compact = false, defaultValue = '' }: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameResults, setGameResults] = useState<SupabaseGame[]>([]);
  const [listResults, setListResults] = useState<ListResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const totalResults = gameResults.length + userResults.length + listResults.length;

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setGameResults([]);
      setListResults([]);
      setUserResults([]);
      setShowDropdown(false);
      return;
    }

    const term = q.trim();

    const [gamesRes, listsRes, usersRes] = await Promise.all([
      supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating, genres, developers')
        .or(`name.ilike.%${term}%,genres.cs.{${term}},themes.cs.{${term}},developers.cs.{${term}}`)
        .order('igdb_rating_count', { ascending: false })
        .limit(5),
      supabase
        .from('lists')
        .select('id, title, game_ids, user_id, profiles!lists_user_id_fkey(username)')
        .eq('is_public', true)
        .ilike('title', `%${term}%`)
        .limit(3),
      supabase
        .from('profiles')
        .select('id, username, display_name')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(3),
    ]);

    const games = gamesRes.data || [];
    const lists = (listsRes.data || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      username: l.profiles?.username || 'Unknown',
      game_count: l.game_ids?.length || 0,
    }));
    const users = usersRes.data || [];

    setGameResults(games as SupabaseGame[]);
    setListResults(lists);
    setUserResults(users);
    setSelectedIndex(-1);
    setShowDropdown(games.length > 0 || lists.length > 0 || users.length > 0);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const navigateTo = (path: string) => {
    setShowDropdown(false);
    inputRef.current?.blur();
    router.push(path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < totalResults) {
      if (selectedIndex < gameResults.length) {
        navigateTo(`/games/${gameResults[selectedIndex].slug}`);
      } else if (selectedIndex < gameResults.length + userResults.length) {
        navigateTo(`/profile/${userResults[selectedIndex - gameResults.length].username}`);
      } else {
        navigateTo(`/lists/${listResults[selectedIndex - gameResults.length - userResults.length].id}`);
      }
    } else if (query.trim()) {
      navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    const maxIndex = totalResults;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter' && selectedIndex === totalResults) {
      e.preventDefault();
      navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowDropdown(false);
    setGameResults([]);
    setListResults([]);
    setUserResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center rounded-sm transition-all duration-200 ${
            focused
              ? 'bg-bg-elevated border-accent-orange ring-1 ring-accent-orange/30'
              : 'bg-bg-card/80 backdrop-blur-xl border-border hover:border-border-light'
          } border ${compact ? 'h-9' : 'h-11'}`}
        >
          <Search
            size={compact ? 16 : 18}
            className={`ml-3 flex-shrink-0 transition-all duration-300 ${
              focused ? 'text-accent-orange' : 'text-text-muted'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              setFocused(true);
              if (query.trim().length >= 2 && totalResults > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search games, genres, developers..."
            className={`flex-1 bg-transparent border-none outline-none px-3 text-text-primary placeholder:text-text-muted ${
              compact ? 'text-sm' : 'text-sm'
            }`}
            aria-label="Search games"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="mr-2 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-primary transition-all duration-300"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm shadow-xl z-50 max-h-[400px] overflow-y-auto transition-opacity duration-150">
          {gameResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted px-3 py-2">
                <Gamepad2 size={14} />
                <span>Games</span>
              </div>
              {gameResults.map((game, i) => (
                <div
                  key={game.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-300 ${
                    selectedIndex === i ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'
                  }`}
                  onClick={() => navigateTo(`/games/${game.slug}`)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  {game.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.cover_url}
                      alt={game.name}
                      className="w-8 h-11 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-11 rounded bg-bg-elevated flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{game.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {game.release_year && (
                        <span className="text-xs text-text-muted">{game.release_year}</span>
                      )}
                      {game.developers?.[0] && (
                        <span className="text-xs text-text-muted truncate">{game.developers[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {gameResults.length > 0 && (listResults.length > 0 || userResults.length > 0) && (
            <div className="border-t border-border my-1" />
          )}

          {userResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted px-3 py-2">
                <User size={14} />
                <span>Users</span>
              </div>
              {userResults.map((u, i) => {
                const idx = gameResults.length + i;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-300 ${
                      selectedIndex === idx ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'
                    }`}
                    onClick={() => navigateTo(`/profile/${u.username}`)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(u.display_name || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{u.display_name || u.username}</div>
                      <div className="text-xs text-text-muted">@{u.username}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(gameResults.length > 0 || userResults.length > 0) && listResults.length > 0 && (
            <div className="border-t border-border my-1" />
          )}

          {listResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted px-3 py-2">
                <ListOrdered size={14} />
                <span>Lists</span>
              </div>
              {listResults.map((list, i) => {
                const idx = gameResults.length + userResults.length + i;
                return (
                  <div
                    key={list.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-300 ${
                      selectedIndex === idx ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'
                    }`}
                    onClick={() => navigateTo(`/lists/${list.id}`)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <ListOrdered size={16} className="text-text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{list.title}</div>
                      <div className="text-xs text-text-muted">by {list.username} · {list.game_count} games</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-border my-1" />
          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            className={`block px-3 py-2 text-sm text-accent-orange cursor-pointer transition-all duration-300 ${
              selectedIndex === totalResults ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'
            }`}
            onClick={() => setShowDropdown(false)}
            onMouseEnter={() => setSelectedIndex(totalResults)}
          >
            View all results →
          </Link>
        </div>
      )}
    </div>
  );
}
