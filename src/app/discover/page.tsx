'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import Link from 'next/link';
import { Users, TrendingUp, Sparkles, Gamepad2, Compass, Flame, Target } from 'lucide-react';
import { calculateGamingDNA, findHotTakes, type GamingDNA } from '@/lib/gamingDNA';

interface DiscoverUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  games_count: number;
  recent_activity: number;
  top_games: { name: string; cover_url: string | null }[];
}

interface SimilarUser extends DiscoverUser {
  shared_games: number;
  similarity_score: number;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [trendingUsers, setTrendingUsers] = useState<DiscoverUser[]>([]);
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamingDNA, setGamingDNA] = useState<GamingDNA | null>(null);
  const [hotTakes, setHotTakes] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
    if (user) {
      calculateGamingDNA(user.id).then(setGamingDNA).catch(console.error);
      findHotTakes(user.id, 6).then(setHotTakes).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTrendingGamers(), fetchSimilarGamers()]);
    setLoading(false);
  };

  const fetchTrendingGamers = async () => {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      // Get recent activities to find trending users
      const { data: recentActs } = await supabase
        .from('activities')
        .select('user_id')
        .gte('created_at', twoWeeksAgo.toISOString());

      // Also get recent game logs
      const { data: recentGames } = await supabase
        .from('user_games')
        .select('user_id')
        .gte('updated_at', twoWeeksAgo.toISOString());

      const activityCounts: Record<string, number> = {};
      (recentActs || []).forEach((a) => {
        activityCounts[a.user_id] = (activityCounts[a.user_id] || 0) + 1;
      });
      (recentGames || []).forEach((g) => {
        activityCounts[g.user_id] = (activityCounts[g.user_id] || 0) + 1;
      });

      if (user) delete activityCounts[user.id];

      const topIds = Object.entries(activityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([uid]) => uid);

      if (!topIds.length) {
        // Fallback: users with most total games rated
        const { data: allGames } = await supabase
          .from('user_games')
          .select('user_id')
          .not('rating', 'is', null);

        if (!allGames?.length) return;
        const counts: Record<string, number> = {};
        allGames.forEach((g) => { counts[g.user_id] = (counts[g.user_id] || 0) + 1; });
        if (user) delete counts[user.id];

        const fallbackIds = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12)
          .map(([uid]) => uid);

        if (!fallbackIds.length) return;
        await enrichAndSetTrending(fallbackIds, counts);
        return;
      }

      await enrichAndSetTrending(topIds, activityCounts);
    } catch (err) {
      console.error('Trending gamers error:', err);
    }
  };

  const enrichAndSetTrending = async (userIds: string[], activityCounts: Record<string, number>) => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .in('id', userIds);

    if (!profiles?.length) return;

    // Get total games count per user
    const { data: gameCounts } = await supabase
      .from('user_games')
      .select('user_id')
      .in('user_id', userIds)
      .not('rating', 'is', null);

    const totalGames: Record<string, number> = {};
    (gameCounts || []).forEach((g) => {
      totalGames[g.user_id] = (totalGames[g.user_id] || 0) + 1;
    });

    // Get top 3 rated games per user for preview
    const { data: topRated } = await supabase
      .from('user_games')
      .select('user_id, game_id, rating')
      .in('user_id', userIds)
      .not('rating', 'is', null)
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .limit(100);

    const userTopGameIds: Record<string, string[]> = {};
    (topRated || []).forEach((ug) => {
      if (!userTopGameIds[ug.user_id]) userTopGameIds[ug.user_id] = [];
      if (userTopGameIds[ug.user_id].length < 3) userTopGameIds[ug.user_id].push(ug.game_id);
    });

    const allGameIds = [...new Set(Object.values(userTopGameIds).flat())];
    let gameMap: Record<string, { name: string; cover_url: string | null }> = {};
    if (allGameIds.length > 0) {
      const { data: games } = await supabase
        .from('games')
        .select('id, name, cover_url')
        .in('id', allGameIds.map(Number));
      (games || []).forEach((g) => { gameMap[g.id.toString()] = { name: g.name, cover_url: g.cover_url }; });
    }

    setTrendingUsers(
      profiles
        .map((p) => ({
          ...p,
          games_count: totalGames[p.id] || 0,
          recent_activity: activityCounts[p.id] || 0,
          top_games: (userTopGameIds[p.id] || []).map((gid) => gameMap[gid] || { name: 'Unknown', cover_url: null }),
        }))
        .sort((a, b) => b.recent_activity - a.recent_activity),
    );
  };

  const fetchSimilarGamers = async () => {
    if (!user) return;
    try {
      const { data: myGames } = await supabase
        .from('user_games')
        .select('game_id, rating')
        .eq('user_id', user.id)
        .gte('rating', 7);

      if (!myGames?.length) return;

      const myGameIds = myGames.map((g) => g.game_id);

      const { data: othersGames } = await supabase
        .from('user_games')
        .select('user_id, game_id')
        .in('game_id', myGameIds)
        .gte('rating', 7)
        .neq('user_id', user.id);

      if (!othersGames?.length) return;

      const scores: Record<string, number> = {};
      othersGames.forEach((ug) => {
        scores[ug.user_id] = (scores[ug.user_id] || 0) + 1;
      });

      const topIds = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([uid]) => uid);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .in('id', topIds);

      if (!profiles?.length) return;

      // Get games count + top games for each
      const { data: gameCounts } = await supabase
        .from('user_games')
        .select('user_id')
        .in('user_id', topIds)
        .not('rating', 'is', null);

      const totalGames: Record<string, number> = {};
      (gameCounts || []).forEach((g) => {
        totalGames[g.user_id] = (totalGames[g.user_id] || 0) + 1;
      });

      const { data: topRated } = await supabase
        .from('user_games')
        .select('user_id, game_id, rating')
        .in('user_id', topIds)
        .not('rating', 'is', null)
        .gte('rating', 7)
        .order('rating', { ascending: false })
        .limit(100);

      const userTopGameIds: Record<string, string[]> = {};
      (topRated || []).forEach((ug) => {
        if (!userTopGameIds[ug.user_id]) userTopGameIds[ug.user_id] = [];
        if (userTopGameIds[ug.user_id].length < 3) userTopGameIds[ug.user_id].push(ug.game_id);
      });

      const allGameIds = [...new Set(Object.values(userTopGameIds).flat())];
      let gameMap: Record<string, { name: string; cover_url: string | null }> = {};
      if (allGameIds.length > 0) {
        const { data: games } = await supabase
          .from('games')
          .select('id, name, cover_url')
          .in('id', allGameIds.map(Number));
        (games || []).forEach((g) => { gameMap[g.id.toString()] = { name: g.name, cover_url: g.cover_url }; });
      }

      setSimilarUsers(
        profiles
          .map((p) => ({
            ...p,
            games_count: totalGames[p.id] || 0,
            recent_activity: 0,
            shared_games: scores[p.id],
            similarity_score: Math.round((scores[p.id] / myGameIds.length) * 100),
            top_games: (userTopGameIds[p.id] || []).map((gid) => gameMap[gid] || { name: 'Unknown', cover_url: null }),
          }))
          .sort((a, b) => b.shared_games - a.shared_games),
      );
    } catch (err) {
      console.error('Similar gamers error:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[600px] h-[600px] -top-48 left-1/2 -translate-x-1/2 bg-[radial-gradient(circle,rgba(204,255,0,0.08)_0%,transparent_70%)]" />
      <div className="ambient-orb w-[400px] h-[400px] top-[500px] -right-32 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 text-center relative z-[1]">
        <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary flex items-center justify-center gap-2"><Compass size={26} className="text-accent-orange" /> Discover</h1>
        <p className="text-sm text-text-secondary mt-1">Your taste, your tribe, your next game</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Gaming DNA Summary — top of discover */}
            {user && gamingDNA && gamingDNA.totalRatings >= 5 && (
              <section className="mb-12">
                <div className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-accent-orange" />
                      <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary">Your Taste Profile</h2>
                    </div>
                    <Link href="/discover/taste-quiz" className="text-xs text-accent-green hover:underline">
                      Refine taste
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    <div className="bg-bg-primary border border-border rounded-sm p-4 text-center">
                      <p className="text-base sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-text-primary truncate">{gamingDNA.personality.label.replace('The ', '')}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Gamer Type</p>
                    </div>
                    <div className="bg-bg-primary border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-accent-orange">{gamingDNA.avgRating.toFixed(1)}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Avg Rating</p>
                    </div>
                    <div className="bg-bg-primary border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-text-primary">{gamingDNA.mainstreamAlignment}%</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Mainstream</p>
                    </div>
                    <div className="bg-bg-primary border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-accent-green">{gamingDNA.totalRatings}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Rated</p>
                    </div>
                  </div>

                  {/* Top genres bar */}
                  {gamingDNA.topGenres.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {gamingDNA.topGenres.slice(0, 6).map(g => (
                        <span key={g.name} className="px-2.5 py-1 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-sm text-xs font-medium">
                          {g.name} {g.percentage}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Hot Takes */}
            {hotTakes.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={18} className="text-accent-orange" />
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary">Your Hot Takes</h2>
                </div>
                <p className="text-xs text-text-muted mb-5">Where you diverge from the crowd</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {hotTakes.map((take: any) => (
                    <Link key={take.game_id} href={`/games/${take.game_slug}`} className="group">
                      <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated ring-1 ring-accent-orange/20 group-hover:ring-accent-orange/50 transition-all">
                        {take.game_cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={take.game_cover} alt={take.game_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">?</div>
                        )}
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-accent-orange text-[9px] font-bold text-black">
                          {take.difference.toFixed(1)}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-accent-green">{take.your_rating}</span>
                            <span className="text-text-muted">vs</span>
                            <span className="font-bold text-text-secondary">{take.community_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-primary mt-1 truncate">{take.game_name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Onboarding nudge for users without enough data */}
            {user && (!gamingDNA || gamingDNA.totalRatings < 5) && (
              <section className="mb-12">
                <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-sm p-6 text-center">
                  <Compass size={32} className="text-accent-orange mx-auto mb-3" />
                  <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">Discover Your Gaming DNA</h3>
                  <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">
                    Rate at least 5 games to unlock your taste profile, hot takes, and personalized discovery.
                  </p>
                  <Link href="/discover/taste-quiz" className="inline-block px-6 py-2.5 bg-accent-orange hover:bg-accent-orange-hover rounded-sm font-semibold text-sm text-black transition-all duration-300">
                    Take the Taste Quiz
                  </Link>
                </div>
              </section>
            )}
            {/* Trending Gamers */}
            {trendingUsers.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-accent-orange" />
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary">Trending Gamers</h2>
                </div>
                <p className="text-xs text-text-muted mb-5">Most active in the community right now</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingUsers.map((u) => (
                    <GamerCard key={u.id} user={u} badge={
                      <span className="px-2 py-0.5 bg-accent-orange/10 text-accent-orange rounded-sm text-xs font-medium flex items-center gap-1">
                        <TrendingUp size={11} /> {u.recent_activity} recent
                      </span>
                    } />
                  ))}
                </div>
              </section>
            )}

            {/* Similar Taste */}
            {similarUsers.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-accent-teal" />
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary">Similar Taste</h2>
                </div>
                <p className="text-xs text-text-muted mb-5">Gamers who love the same games as you</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarUsers.map((u) => (
                    <GamerCard key={u.id} user={u} badge={
                      <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green rounded-sm text-xs font-medium">
                        {u.similarity_score}% match · {u.shared_games} shared
                      </span>
                    } />
                  ))}
                </div>
              </section>
            )}

            {/* Not logged in nudge */}
            {!user && trendingUsers.length > 0 && (
              <div className="text-center py-8 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm mb-8">
                <p className="text-text-secondary text-sm mb-3">Sign in to see gamers with similar taste</p>
                <Link href="/login" className="inline-block px-5 py-2 bg-accent-green text-black rounded-sm text-sm font-medium hover:opacity-90 transition-opacity">
                  Sign In
                </Link>
              </div>
            )}

            {/* Full empty state */}
            {trendingUsers.length === 0 && similarUsers.length === 0 && (
              <div className="text-center py-16 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">No gamers yet</h3>
                <p className="text-text-secondary text-sm mb-6">Rate some games and come back — we&apos;ll find your people</p>
                <Link href="/games" className="inline-block px-6 py-2.5 bg-accent-green hover:opacity-90 text-black rounded-sm font-medium text-sm transition-opacity">
                  Browse Games
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GamerCard({ user, badge }: { user: DiscoverUser | SimilarUser; badge: React.ReactNode }) {
  const { isFollowing, toggleFollow, loading } = useFollow(user.id);

  return (
    <div className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5 hover:border-border-light transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.username} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-text-primary hover:text-accent-green transition-all duration-300 truncate">
              {user.display_name || user.username}
            </div>
            <div className="text-xs text-text-muted">@{user.username}</div>
          </div>
        </Link>
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all duration-300 flex-shrink-0 ${
            isFollowing
              ? 'bg-bg-elevated border border-border text-text-secondary hover:text-red-400 hover:border-red-400/30'
              : 'bg-accent-green text-black hover:opacity-90'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {user.bio && (
        <p className="text-xs text-text-secondary mb-3 line-clamp-2">{user.bio}</p>
      )}

      {/* Top games preview */}
      {user.top_games.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          {user.top_games.map((g, i) => (
            <div key={i} className="w-8 h-11 rounded overflow-hidden bg-bg-elevated flex-shrink-0" title={g.name}>
              {g.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-text-muted">?</div>
              )}
            </div>
          ))}
          <span className="text-xs text-text-muted ml-1">{user.games_count} games rated</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {badge}
      </div>
    </div>
  );
}
