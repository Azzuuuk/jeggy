'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, Gamepad2, Clock, ListOrdered, MessageCircle, Compass, Flame, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRatingColor } from '@/components/ui/ColorCodedRating';
import { calculateGamingDNA, findHotTakes, type GamingDNA } from '@/lib/gamingDNA';
import { getCached, setCache } from '@/lib/cache';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <LoggedInHome userId={user.id} />;
}

function GameCoverCard({ game }: { game: SupabaseGame }) {
  return (
    <Link
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
            <span className="text-xs font-bold" style={{ color: getRatingColor(game.average_rating) }}>
              {game.average_rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-text-muted">/ 10</span>
          </div>
        )}
        {game.release_year && (
          <p className="text-[10px] text-text-muted mt-0.5">{game.release_year}</p>
        )}
      </div>
    </Link>
  );
}

function LoggedInHome({ userId }: { userId: string }) {
  const [topRated, setTopRated] = useState<SupabaseGame[]>([]);
  const [popular, setPopular] = useState<SupabaseGame[]>([]);
  const [recent, setRecent] = useState<SupabaseGame[]>([]);
  const [lists, setLists] = useState<{ id: string; title: string; description: string | null; game_ids: string[]; username: string }[]>([]);
  const [userGameCount, setUserGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ gamesRated: 0, hoursPlayed: 0, listsCreated: 0, reviewsWritten: 0 });
  const [recommendedGames, setRecommendedGames] = useState<SupabaseGame[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; username: string } | null>(null);
  const [gamingDNA, setGamingDNA] = useState<GamingDNA | null>(null);
  const [hotTakes, setHotTakes] = useState<{ game_id: string; game_name: string; game_slug: string; game_cover: string | null; your_rating: number; community_rating: number; difference: number }[]>([]);
  const [dnaCollapsed, setDnaCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('jeggy:dna-collapsed') === 'true';
    return false;
  });

  useEffect(() => {
    const fetchAll = async () => {
      const GAME_FIELDS = 'id, name, slug, cover_url, average_rating, igdb_rating_count, release_year, genres';

      // Cache global data (same for all users)
      const cachedTop = getCached<SupabaseGame[]>('home:topRated');
      const cachedPop = getCached<SupabaseGame[]>('home:popular');
      const cachedRec = getCached<SupabaseGame[]>('home:recent');

      const needsGlobalFetch = !cachedTop || !cachedPop || !cachedRec;

      const [topRes, popRes, recRes, listsRes, countRes, profileRes] = await Promise.all([
        needsGlobalFetch
          ? supabase.from('games').select(GAME_FIELDS).gt('average_rating', 0).order('average_rating', { ascending: false }).limit(6)
          : { data: cachedTop },
        needsGlobalFetch
          ? supabase.from('games').select(GAME_FIELDS).order('igdb_rating_count', { ascending: false }).limit(12)
          : { data: cachedPop },
        needsGlobalFetch
          ? supabase.from('games').select(GAME_FIELDS).not('release_year', 'is', null).order('first_release_date', { ascending: false, nullsFirst: false }).limit(10)
          : { data: cachedRec },
        supabase
          .from('lists')
          .select('id, title, description, game_ids, user_id, profiles!lists_user_id_fkey(username)')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('user_games')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .or('rating.not.is.null,status.not.is.null,liked.eq.true'),
        supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single(),
      ]);

      const top = topRes.data || [];
      const pop = popRes.data || [];
      const rec = recRes.data || [];
      if (needsGlobalFetch) {
        setCache('home:topRated', top);
        setCache('home:popular', pop);
        setCache('home:recent', rec);
      }

      setTopRated(top as SupabaseGame[]);
      setPopular(pop as SupabaseGame[]);
      setRecent(rec as SupabaseGame[]);
      setLists(
        (listsRes.data || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          game_ids: l.game_ids || [],
          username: l.profiles?.username || 'Unknown',
        })),
      );
      setUserGameCount(countRes.count || 0);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);

        const [ratedRes, sessionsRes, listsRes, reviewsRes] = await Promise.all([
          supabase.from('user_games').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('rating', 'is', null),
          supabase.from('gaming_sessions').select('hours_played').eq('user_id', userId).gte('session_date', startOfMonth.toISOString().split('T')[0]),
          supabase.from('lists').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('user_games').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('review', 'is', null),
        ]);

        setStats({
          gamesRated: ratedRes.count || 0,
          hoursPlayed: Math.round(sessionsRes.data?.reduce((sum, s) => sum + parseFloat(s.hours_played), 0) || 0),
          listsCreated: listsRes.count || 0,
          reviewsWritten: reviewsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchUserStats();
  }, [userId]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data: topRatedByUser } = await supabase
          .from('user_games')
          .select('game_id')
          .eq('user_id', userId)
          .gte('rating', 8)
          .limit(5);

        if (!topRatedByUser || topRatedByUser.length === 0) {
          const { data: fallback } = await supabase
            .from('games')
            .select('id, name, slug, cover_url, average_rating, igdb_rating_count, genres')
            .gt('average_rating', 8)
            .order('igdb_rating_count', { ascending: false })
            .limit(5);
          setRecommendedGames((fallback || []) as SupabaseGame[]);
          return;
        }

        const topGameIds = topRatedByUser.map(g => parseInt(g.game_id));
        const { data: topGames } = await supabase.from('games').select('genres').in('id', topGameIds);
        const uniqueGenres = [...new Set(topGames?.flatMap(g => g.genres || []) || [])];

        const { data: ratedGameIds } = await supabase.from('user_games').select('game_id').eq('user_id', userId);
        const ratedIds = ratedGameIds?.map(g => parseInt(g.game_id)) || [];

        const { data: recs } = await supabase
          .from('games')
          .select('id, name, slug, cover_url, average_rating, igdb_rating_count, genres')
          .gt('average_rating', 7)
          .order('igdb_rating_count', { ascending: false })
          .limit(50);

        const filtered = recs?.filter(game =>
          !ratedIds.includes(game.id) && game.genres?.some((genre: string) => uniqueGenres.includes(genre))
        ).slice(0, 5) || [];
        setRecommendedGames((filtered.length > 0 ? filtered : (recs?.filter(g => !ratedIds.includes(g.id)).slice(0, 5) || [])) as SupabaseGame[]);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };
    fetchRecommendations();
  }, [userId]);

  // Fetch Gaming DNA and Hot Takes
  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const [dna, takes] = await Promise.all([
          calculateGamingDNA(userId),
          findHotTakes(userId, 6),
        ]);
        setGamingDNA(dna);
        setHotTakes(takes);
      } catch (error) {
        console.error('Error fetching gaming DNA:', error);
      }
    };
    fetchDNA();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-[250px] bg-bg-elevated rounded-sm" />
              <div className="h-4 bg-bg-elevated rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[500px] h-[500px] -top-40 -right-40 bg-[radial-gradient(circle,rgba(204,255,0,0.09)_0%,transparent_70%)]" />
      <div className="ambient-orb w-[400px] h-[400px] top-[600px] -left-48 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      {/* Gaming DNA Hero — shown when user has rated 5+ games */}
      {gamingDNA && gamingDNA.totalRatings >= 5 ? (
        <section className="mt-8 mb-10">
          <div className="relative overflow-hidden bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-orange via-accent-teal to-accent-orange" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2 font-[family-name:var(--font-display)]">
                  <Compass size={20} className="text-accent-orange" />
                  Your Gaming DNA
                </h2>
                <div className="flex items-center gap-3">
                  <Link href={profile ? `/profile/${profile.username}` : '/settings'} className="text-xs text-accent-green hover:underline">
                    Full Profile
                  </Link>
                  <button
                    onClick={() => {
                      const next = !dnaCollapsed;
                      setDnaCollapsed(next);
                      localStorage.setItem('jeggy:dna-collapsed', String(next));
                    }}
                    className="p-1 rounded hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary"
                    aria-label={dnaCollapsed ? 'Expand Gaming DNA' : 'Minimize Gaming DNA'}
                  >
                    <ChevronDown size={18} className={`transition-transform duration-300 ${dnaCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
              {!dnaCollapsed && (
                <>
              <p className="text-sm text-text-muted mb-6">Based on {gamingDNA.totalRatings} games you&apos;ve rated</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gamer Personality */}
                <Link href="/discover" className="block bg-gradient-to-br from-accent-orange/5 to-accent-teal/5 border border-accent-orange/20 rounded-sm p-6 transition-all duration-300 hover:border-accent-orange/40 hover:scale-[1.02] cursor-pointer group">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-3">Your Gamer Type</p>
                  <div className="text-2xl font-bold text-text-primary mb-1">{gamingDNA.personality.label}</div>
                  <p className="text-sm text-text-secondary mb-4">{gamingDNA.personality.description}</p>
                  <div className="space-y-2.5 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Games Rated</span>
                      <span className="text-sm font-bold text-text-primary font-[family-name:var(--font-mono)]">{gamingDNA.totalRatings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Avg Rating</span>
                      <span className="text-sm font-bold text-accent-orange font-[family-name:var(--font-mono)]">{gamingDNA.avgRating.toFixed(1)}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Mainstream</span>
                      <span className="text-sm font-bold text-text-primary font-[family-name:var(--font-mono)]">{gamingDNA.mainstreamAlignment}%</span>
                    </div>
                    {gamingDNA.totalHours > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Hours Logged</span>
                        <span className="text-sm font-bold text-accent-green font-[family-name:var(--font-mono)]">{gamingDNA.totalHours}h</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Top Genres */}
                <Link href="/games" className="block bg-gradient-to-br from-accent-teal/5 to-accent-orange/5 border border-accent-teal/20 rounded-sm p-6 transition-all duration-300 hover:border-accent-teal/40 hover:scale-[1.02] cursor-pointer group">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-4">Top Genres</p>
                  <div className="space-y-3">
                    {gamingDNA.topGenres.slice(0, 5).map(genre => (
                      <div key={genre.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{genre.name}</span>
                          <span className="text-xs text-text-muted">{genre.percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-bg-elevated rounded-none overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-orange to-accent-teal rounded-none"
                            style={{ width: `${genre.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>

                {/* Rating Distribution */}
                <Link href={profile ? `/profile/${profile.username}?tab=Games` : '/settings'} className="block bg-gradient-to-br from-accent-orange/5 to-accent-teal/3 border border-accent-orange/20 rounded-sm p-6 transition-all duration-300 hover:border-accent-orange/40 hover:scale-[1.02] cursor-pointer group">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-4">Your Ratings</p>
                  <div className="space-y-1.5">
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => {
                      const count = gamingDNA.ratingDistribution[score] || 0;
                      const maxCount = Math.max(...Object.values(gamingDNA.ratingDistribution), 1);
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={score} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-muted w-4 text-right">{score}</span>
                          <div className="flex-1 bg-bg-elevated rounded-none h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent-orange to-accent-orange/40 rounded-none"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {count > 0 && <span className="text-[10px] text-text-muted w-4">{count}</span>}
                        </div>
                      );
                    })}
                  </div>
                </Link>
              </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Stats Banner — for users with < 5 ratings */}
          <div className="relative overflow-hidden bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm mt-8 mb-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-green via-accent-teal to-accent-orange animate-pulse" />
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
                Welcome back, {profile?.display_name || profile?.username || 'Gamer'}
              </h2>
              <p className="text-sm text-text-muted mt-1">Here&apos;s your gaming snapshot</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { val: stats.gamesRated, label: 'Games Rated', icon: <Star size={16} />, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
                  { val: `${stats.hoursPlayed}h`, label: 'This Month', icon: <Clock size={16} />, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
                  { val: stats.listsCreated, label: 'Lists', icon: <ListOrdered size={16} />, color: 'text-accent-green', bg: 'bg-accent-green/10' },
                  { val: stats.reviewsWritten, label: 'Reviews', icon: <MessageCircle size={16} />, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-sm p-4 text-center transition-transform hover:scale-[1.02]`}>
                    <div className={`inline-flex items-center justify-center ${s.color} mb-2`}>{s.icon}</div>
                    <div className={`text-2xl font-bold ${s.color} font-[family-name:var(--font-mono)]`}>{s.val}</div>
                    <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Onboarding nudge */}
          <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-sm p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-orange/15 flex items-center justify-center flex-shrink-0">
                <Compass size={20} className="text-accent-orange" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary mb-1 font-[family-name:var(--font-display)]">Discover Your Gaming DNA</h3>
                <p className="text-text-secondary text-sm mb-3">
                  Rate at least 5 games to unlock your gaming personality, taste profile, and hot takes.
                  You&apos;ve rated {gamingDNA?.totalRatings || 0} so far.
                </p>
                <div className="flex gap-3">
                  <Link href="/discover/taste-quiz" className="px-4 py-2 bg-accent-orange hover:bg-accent-orange-hover rounded-sm font-semibold text-sm text-black transition-colors">
                    Quick Rate Games
                  </Link>
                  <Link href="/games" className="px-4 py-2 bg-bg-elevated border border-border rounded-sm text-sm text-text-secondary hover:text-text-primary transition-colors">
                    Browse Games
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hot Takes — shown when DNA is available */}
      {hotTakes.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={18} className="text-accent-orange" />
            <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">Your Hot Takes</h2>
          </div>
          <p className="text-xs text-text-muted mb-5">Games where you disagree with the crowd</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {hotTakes.slice(0, 6).map(take => (
              <Link
                key={take.game_id}
                href={`/games/${take.game_slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated ring-1 ring-accent-orange/20 group-hover:ring-accent-orange/50 transition-all">
                  {take.game_cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={take.game_cover} alt={take.game_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-accent-orange text-[10px] font-bold text-black">
                    {take.difference.toFixed(1)} pts
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="text-center">
                        <div className="text-sm font-bold text-accent-green">{take.your_rating}</div>
                        <div className="text-text-muted">You</div>
                      </div>
                      <span className="text-text-muted text-[9px]">vs</span>
                      <div className="text-center">
                        <div className="text-sm font-bold text-text-secondary">{take.community_rating.toFixed(1)}</div>
                        <div className="text-text-muted">Avg</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-text-primary mt-1.5 truncate group-hover:text-accent-orange transition-colors">{take.game_name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended For You */}
      {recommendedGames.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">Recommended For You</h2>
              <p className="text-text-secondary text-sm mt-1">Based on your ratings and gaming taste</p>
            </div>
            <Link href="/discover" className="text-accent-green text-sm hover:underline">Discover more →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
            {recommendedGames.map((game) => (
              <GameCoverCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-6 font-[family-name:var(--font-display)]">
          Fresh Drops
        </h2>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {recent.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="flex-shrink-0 w-[140px] group"
              >
                <div className="h-[180px] rounded-sm overflow-hidden bg-bg-elevated">
                  {game.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.cover_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                  )}
                </div>
                <p className="text-sm text-text-primary truncate mt-1.5 text-center">{game.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">Community Favorites</h2>
            <p className="text-text-secondary text-sm mt-1">Highest rated games across the community</p>
          </div>
          <Link href="/games?sort=rating-desc" className="text-accent-green text-sm hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {topRated.map((game) => (
            <GameCoverCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-text-muted font-[family-name:var(--font-display)]">
            Most Popular
          </h2>
          <Link href="/games" className="text-accent-teal text-sm hover:underline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {popular.map((game) => (
            <GameCoverCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Community Lists */}
      {lists.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-text-muted font-[family-name:var(--font-display)]">
              Community Lists
            </h2>
            <Link href="/lists" className="text-accent-teal text-sm hover:underline">Browse lists →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5 hover:border-text-muted transition-colors group"
              >
                <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                  {list.title}
                </h3>
                {list.description && (
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">{list.description}</p>
                )}
                <p className="text-sm text-accent-teal mt-2">by {list.username}</p>
                <p className="text-xs text-text-secondary mt-1">{list.game_ids.length} games</p>
                <span className="inline-flex items-center gap-1 text-sm text-accent-teal mt-3">
                  View list <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
