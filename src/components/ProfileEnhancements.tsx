'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Zap, TrendingUp, TrendingDown, BarChart3, Sparkles } from 'lucide-react';
import { calculateGamingDNA, type GamingDNA } from '@/lib/gamingDNA';

interface GenreData {
  genre: string;
  count: number;
  pct: number;
  color: string;
}

interface HotTake {
  game_name: string;
  game_slug: string;
  cover_url: string | null;
  user_rating: number;
  avg_rating: number;
  diff: number;
}

interface Props {
  userId: string;
  isOwnProfile: boolean;
}

const GENRE_COLORS = [
  '#CCFF00', '#6366F1', '#FF9F7C', '#a78bfa', '#F472B6',
  '#d9ff33', '#818cf8', '#ef4444', '#CCFF00', '#c084fc',
  '#FF9F7C', '#6366F1', '#F472B6', '#d9ff33', '#818cf8',
];

export default function ProfileEnhancements({ userId, isOwnProfile }: Props) {
  const { user } = useAuth();
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [gamingDNA, setGamingDNA] = useState<GamingDNA | null>(null);
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [ratingDist, setRatingDist] = useState<number[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRated, setTotalRated] = useState(0);
  const [compatibility, setCompatibility] = useState<number | null>(null);
  const [sharedGames, setSharedGames] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Use shared Gaming DNA calculation
      const dna = await calculateGamingDNA(userId);
      setGamingDNA(dna);

      // 1. Get user's games with ratings
      const { data: userGames } = await supabase
        .from('user_games')
        .select('game_id, rating, status')
        .eq('user_id', userId);

      if (!userGames?.length) {
        setLoading(false);
        return;
      }

      const ratedGames = userGames.filter(g => g.rating != null && g.rating > 0);
      const ratedIds = ratedGames.map(g => parseInt(g.game_id));

      // 2. Get game details for rated games
      let gameDetails: { id: number; name: string; slug: string; cover_url: string | null; genres: string[] | null; average_rating: number }[] = [];
      if (ratedIds.length > 0) {
        const { data } = await supabase
          .from('games')
          .select('id, name, slug, cover_url, genres, average_rating')
          .in('id', ratedIds);
        gameDetails = data || [];
      }

      const gameMap = new Map(gameDetails.map(g => [g.id.toString(), g]));

      // === GENRE DNA ===
      const genreCounts: Record<string, number> = {};
      ratedGames.forEach(ug => {
        const game = gameMap.get(ug.game_id);
        game?.genres?.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
      });

      const total = Object.values(genreCounts).reduce((a, b) => a + b, 0);
      const sortedGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([genre, count], i) => ({
          genre,
          count,
          pct: Math.round((count / total) * 100),
          color: GENRE_COLORS[i % GENRE_COLORS.length],
        }));
      setGenres(sortedGenres);

      // === RATING DISTRIBUTION ===
      const dist = Array(10).fill(0);
      ratedGames.forEach(g => {
        const bucket = Math.min(Math.max(Math.ceil(g.rating!) - 1, 0), 9);
        dist[bucket]++;
      });
      setRatingDist(dist);

      const ratingsSum = ratedGames.reduce((s, g) => s + (g.rating || 0), 0);
      const avg = ratedGames.length > 0 ? ratingsSum / ratedGames.length : 0;
      setAvgRating(avg);
      setTotalRated(ratedGames.length);

      // === HOT TAKES ===
      const takes: HotTake[] = [];
      ratedGames.forEach(ug => {
        const game = gameMap.get(ug.game_id);
        if (!game || game.average_rating === 0) return;
        const diff = (ug.rating || 0) - game.average_rating;
        if (Math.abs(diff) >= 2) {
          takes.push({
            game_name: game.name,
            game_slug: game.slug,
            cover_url: game.cover_url,
            user_rating: ug.rating!,
            avg_rating: game.average_rating,
            diff,
          });
        }
      });
      takes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
      setHotTakes(takes.slice(0, 4));

      // === COMPATIBILITY (only when viewing someone else's profile) ===
      if (user && user.id !== userId) {
        const { data: myGames } = await supabase
          .from('user_games')
          .select('game_id, rating')
          .eq('user_id', user.id)
          .not('rating', 'is', null);

        if (myGames?.length) {
          const myRatings = new Map(myGames.map(g => [g.game_id, g.rating as number]));
          let shared = 0;
          let totalDiff = 0;

          ratedGames.forEach(ug => {
            const myRating = myRatings.get(ug.game_id);
            if (myRating != null && ug.rating != null) {
              shared++;
              totalDiff += Math.abs(myRating - ug.rating);
            }
          });

          setSharedGames(shared);
          if (shared >= 2) {
            const avgDiff = totalDiff / shared;
            const compat = Math.round(Math.max(0, (1 - avgDiff / 5) * 100));
            setCompatibility(compat);
          }
        }
      }
    } catch (err) {
      console.error('ProfileEnhancements error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || totalRated === 0) return null;

  const maxDist = Math.max(...ratingDist, 1);

  return (
    <div className="space-y-6 mt-8">
      {/* Compatibility Banner — only when viewing someone else */}
      {compatibility !== null && (
        <div className="relative overflow-hidden bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: `linear-gradient(90deg, ${compatibility > 70 ? '#CCFF00' : compatibility > 40 ? '#6366F1' : '#ef4444'} 0%, transparent 100%)`,
          }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                compatibility > 70 ? 'bg-accent-green/15 text-accent-green' :
                compatibility > 40 ? 'bg-accent-orange/15 text-accent-orange' :
                'bg-red-500/15 text-red-400'
              }`}>
                {compatibility}%
              </div>
              <div>
                <p className="font-semibold text-text-primary">Taste Compatibility</p>
                <p className="text-xs text-text-muted">
                  Based on {sharedGames} shared game{sharedGames !== 1 ? 's' : ''}
                  {compatibility > 70 ? ' — kindred spirits!' : compatibility > 40 ? ' — some common ground' : ' — agree to disagree'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row: Personality + Rating Curve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gaming Personality */}
        {gamingDNA && gamingDNA.totalRatings >= 3 && (
          <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent-orange" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Gaming Personality</h3>
            </div>
            <p className="text-xl font-bold text-text-primary">{gamingDNA.personality.label}</p>
            <p className="text-sm text-text-muted mt-1">{gamingDNA.personality.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span>{totalRated} rated</span>
              <span>·</span>
              <span>avg {avgRating.toFixed(1)}/10</span>
              <span>·</span>
              <span>{gamingDNA.mainstreamAlignment}% mainstream</span>
            </div>
          </div>
        )}

        {/* Rating Curve */}
        {totalRated >= 3 && (
          <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-accent-teal" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Rating Distribution</h3>
            </div>
            <div className="flex items-end gap-[3px] h-16">
              {ratingDist.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(2, (count / maxDist) * 56)}px`,
                      backgroundColor: i < 3 ? '#ef4444' : i < 5 ? '#FF9F7C' : i < 7 ? '#CCFF00' : '#6366F1',
                      opacity: count > 0 ? 1 : 0.15,
                    }}
                  />
                  <span className="text-[9px] text-text-muted">{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {avgRating >= 7.5 ? 'Generous rater' : avgRating >= 5.5 ? 'Balanced rater' : 'Tough critic'}
              {' — avg '}
              <span className="font-semibold text-accent-orange">{avgRating.toFixed(1)}</span>
              /10
            </p>
          </div>
        )}
      </div>

      {/* Gamer DNA */}
      {genres.length >= 3 && (
        <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-accent-green" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Gamer DNA</h3>
          </div>
          <div className="space-y-2">
            {genres.map((g) => (
              <div key={g.genre} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-24 truncate">{g.genre}</span>
                <div className="flex-1 h-2 bg-bg-elevated rounded-none overflow-hidden">
                  <div
                    className="h-full rounded-none transition-all duration-700"
                    style={{ width: `${g.pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <span className="text-xs text-text-muted w-10 text-right font-medium">{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hot Takes */}
      {hotTakes.length > 0 && (
        <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-red-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {isOwnProfile ? 'Your Hot Takes' : 'Hot Takes'}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hotTakes.map((take) => (
              <Link
                key={take.game_slug}
                href={`/games/${take.game_slug}`}
                className="flex items-center gap-3 p-3 rounded-sm bg-bg-elevated/50 hover:bg-bg-elevated transition-all duration-300 group"
              >
                {take.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={take.cover_url} alt={take.game_name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-all duration-300 truncate">{take.game_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-accent-orange">{take.user_rating}/10</span>
                    <span className="text-[10px] text-text-muted">vs avg {take.avg_rating.toFixed(1)}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      take.diff > 0
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {take.diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {take.diff > 0 ? '+' : ''}{take.diff.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
