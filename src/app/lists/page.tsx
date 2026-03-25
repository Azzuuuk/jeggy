'use client';

import { useState, useEffect } from 'react';
import { Search, ListOrdered, Plus, Heart, ArrowUpDown, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ListSummary {
  id: string;
  title: string;
  description: string | null;
  game_ids: string[];
  ranking_style: string;
  created_at: string;
  likes_count: number;
  creator_username: string;
}

type SortOption = 'recent' | 'likes' | 'games';

export default function BrowseListsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLists() {
      setLoading(true);
      try {
        let query = supabase
          .from('lists')
          .select('id, title, description, game_ids, ranking_style, created_at, likes_count, profiles!lists_user_id_fkey(username)')
          .eq('is_public', true);

        if (searchQuery.length >= 2) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        switch (sortBy) {
          case 'likes':
            query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(60);
        if (error) throw error;

        let parsed: ListSummary[] = (data || []).map((row: any) => ({
          ...row,
          likes_count: row.likes_count || 0,
          creator_username: row.profiles?.username ?? 'unknown',
        }));

        if (sortBy === 'games') {
          parsed.sort((a, b) => (b.game_ids?.length || 0) - (a.game_ids?.length || 0));
        }

        setLists(parsed);

        // Batch-fetch covers for first 5 game_ids of each list
        const allIds = new Set<number>();
        parsed.forEach((l) => l.game_ids?.slice(0, 5).forEach((id) => allIds.add(parseInt(id))));
        if (allIds.size > 0) {
          const { data: games } = await supabase
            .from('games')
            .select('id, cover_url')
            .in('id', [...allIds]);
          const map: Record<string, string> = {};
          games?.forEach((g) => { if (g.cover_url) map[g.id.toString()] = g.cover_url; });
          setCoverMap(map);
        }
      } catch (err) {
        console.error('Error fetching lists:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchLists, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy]);

  return (
    <div className="min-h-screen pb-12 relative overflow-hidden">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[500px] h-[500px] -top-40 left-1/4 bg-[radial-gradient(circle,rgba(99,102,241,0.09)_0%,transparent_70%)]" />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-bg-elevated to-bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2 flex items-center justify-center gap-2"><ListOrdered size={28} className="text-accent-teal" /> Community Lists</h1>
          <p className="text-text-secondary mb-8">Tier lists, rankings, and hot takes from the community</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-sm bg-bg-card/80 backdrop-blur-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange transition-all duration-300"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mt-8 mb-6">
          <div className="flex items-center gap-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-3 py-1.5">
            <ArrowUpDown size={14} className="text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-text-primary text-sm focus:outline-none cursor-pointer"
            >
              <option value="recent" className="bg-bg-card">Most Recent</option>
              <option value="likes" className="bg-bg-card">Most Liked</option>
              <option value="games" className="bg-bg-card">Most Games</option>
            </select>
          </div>

          {user && (
            <Link
              href="/lists/create"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-orange hover:bg-accent-orange/90 text-black text-sm font-medium rounded-sm transition-all duration-300"
            >
              <Plus size={16} />
              Create List
            </Link>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm overflow-hidden animate-pulse">
                <div className="h-28 bg-bg-elevated" />
                <div className="p-4">
                  <div className="h-4 bg-bg-elevated rounded w-3/4 mb-2" />
                  <div className="h-3 bg-bg-elevated rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : lists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => {
              const covers = list.game_ids?.slice(0, 4).map((id) => coverMap[id]).filter(Boolean) || [];
              const extraCount = (list.game_ids?.length || 0) - 4;

              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm overflow-hidden hover:border-accent-orange/50 transition-all duration-300 group"
                >
                  {/* Cover art strip */}
                  <div className="relative h-28 bg-[#1a1a2e] flex">
                    {covers.length > 0 ? (
                      <>
                        {covers.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="h-full flex-1 object-cover min-w-0"
                          />
                        ))}
                        {extraCount > 0 && (
                          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-[10px] text-white font-bold px-1.5 py-0.5 rounded">
                            +{extraCount} more
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full text-text-muted text-xs">
                        No games yet
                      </div>
                    )}
                    {/* Gradient fade at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg-card to-transparent" />
                    {/* Badge */}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      list.ranking_style === 'tiered'
                        ? 'bg-yellow-500/90 text-black'
                        : 'bg-accent-green/90 text-black'
                    }`}>
                      {list.ranking_style === 'tiered' ? 'Tier' : '# Ranked'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold font-[family-name:var(--font-display)] text-text-primary group-hover:text-accent-orange transition-all duration-300 line-clamp-1">
                      {list.title}
                    </h3>
                    {list.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-1">{list.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                      <span>@{list.creator_username}</span>
                      <span>{list.game_ids?.length || 0} games</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <Heart size={12} className={list.likes_count > 0 ? 'text-red-400 fill-red-400' : ''} />
                        <span>{list.likes_count}</span>
                      </div>
                      <span>{new Date(list.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ListOrdered size={48} className="mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">
              {searchQuery ? 'No lists match your search' : 'No lists yet — create the first one!'}
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {searchQuery ? 'Try adjusting your search.' : 'Make a tier list, rank your favorites, drop your hot takes'}
            </p>
            {!searchQuery && user && (
              <Link href="/lists/create" className="inline-block px-6 py-3 bg-accent-green hover:bg-accent-green-hover text-black rounded-sm font-semibold transition-all duration-300">
                ✨ Create Your First List
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
