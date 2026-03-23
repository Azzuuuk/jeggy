'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, SkipForward, CheckCircle } from 'lucide-react';
import { getRatingColor } from '@/components/ui/ColorCodedRating';

export default function TasteQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [games, setGames] = useState<any[]>([]);
  const [ratingsGiven, setRatingsGiven] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchQuizGames = useCallback(async () => {
    try {
      // Get already-rated game IDs so we skip them
      let ratedIds: number[] = [];
      if (user) {
        const { data: rated } = await supabase
          .from('user_games')
          .select('game_id')
          .eq('user_id', user.id)
          .not('rating', 'is', null);
        ratedIds = rated?.map(r => parseInt(r.game_id)) || [];
      }

      const { data, error } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, summary, genres, release_year, average_rating')
        .gte('average_rating', 7)
        .gte('igdb_rating_count', 50)
        .order('igdb_rating_count', { ascending: false })
        .limit(80);

      if (error) throw error;

      // Filter out already-rated, then pick 20 diverse ones
      const unrated = (data || []).filter(g => !ratedIds.includes(g.id));
      setGames(unrated.slice(0, 20));
    } catch (error) {
      console.error('Error fetching quiz games:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuizGames();
  }, [fetchQuizGames]);

  const handleRate = async (rating: number) => {
    const game = games[currentIndex];
    if (!user || !game) return;

    try {
      await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          game_id: game.id.toString(),
          rating,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id' });
    } catch (error) {
      console.error('Error saving rating:', error);
    }

    setRatingsGiven(prev => prev + 1);
    advance();
  };

  const advance = () => {
    if (currentIndex < games.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push('/');
    }
  };

  const handleFinish = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={48} className="text-accent-green mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">All caught up!</h1>
          <p className="text-text-secondary mb-6">You&apos;ve already rated the most popular games.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-accent-green hover:bg-accent-green-hover text-black rounded-sm font-semibold transition-all duration-300">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentGame = games[currentIndex];
  const progress = ((currentIndex + 1) / games.length) * 100;

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted font-[family-name:var(--font-mono)]">
              {currentIndex + 1} of {games.length}
            </span>
            <span className="text-sm text-text-muted font-[family-name:var(--font-mono)]">{ratingsGiven} rated</span>
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-none overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-green to-accent-teal transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Game Card */}
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Cover */}
          <div className="mx-auto md:mx-0">
            <div className="w-[220px] md:w-[280px] aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated shadow-2xl">
              {currentGame.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentGame.cover_url} alt={currentGame.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">No Cover</div>
              )}
            </div>
          </div>

          {/* Info + Rating */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">{currentGame.name}</h1>
            <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
              {currentGame.release_year && <span>{currentGame.release_year}</span>}
              {currentGame.genres?.length > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span>{currentGame.genres.slice(0, 3).join(', ')}</span>
                </>
              )}
            </div>

            {currentGame.summary && (
              <p className="text-sm text-text-secondary leading-relaxed mb-6 line-clamp-3">{currentGame.summary}</p>
            )}

            <p className="text-sm text-text-primary font-medium mb-4">How would you rate this game?</p>

            {/* Rating Buttons — 2 rows of 5 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className="py-3.5 rounded-sm font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: getRatingColor(rating) }}
                >
                  {rating}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={advance}
                className="flex-1 py-3 bg-bg-elevated border border-border rounded-sm font-semibold text-sm text-text-muted hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2"
              >
                <SkipForward size={14} /> Haven&apos;t Played / Skip
              </button>
              {ratingsGiven >= 5 && (
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 bg-accent-green hover:bg-accent-green-hover rounded-sm font-semibold text-sm text-black transition-all duration-300 flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Done ({ratingsGiven} rated)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
