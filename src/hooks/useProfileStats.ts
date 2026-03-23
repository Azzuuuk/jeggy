'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProfileStats {
  gamesPlayed: number;
  reviewsWritten: number;
  avgRating: number;
  listsCreated: number;
  estimatedTimeToBeat: number;
}

const EMPTY_STATS: ProfileStats = {
  gamesPlayed: 0,
  reviewsWritten: 0,
  avgRating: 0,
  listsCreated: 0,
  estimatedTimeToBeat: 0,
};

export function useProfileStats(userId: string | undefined) {
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [gamesResult, listsResult] = await Promise.all([
        supabase
          .from('user_games')
          .select('rating, review, game_id, status')
          .eq('user_id', userId),
        supabase
          .from('lists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      const gamesData = gamesResult.data;
      const listsCount = listsResult.count;

      if (gamesData && gamesData.length > 0) {
        const gamesPlayed = gamesData.length;
        const reviewsWritten = gamesData.filter(
          (g) => g.review && g.review.trim().length > 0,
        ).length;
        const ratedGames = gamesData.filter((g) => g.rating != null && g.rating > 0);
        const ratingsSum = ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0);
        const avgRating = ratedGames.length > 0 ? ratingsSum / ratedGames.length : 0;

        // Fetch time to beat for completed games
        const completedIds = gamesData
          .filter(g => g.status === 'completed' || g.status === '100_percent')
          .map(g => parseInt(g.game_id));
        let estimatedTimeToBeat = 0;
        if (completedIds.length > 0) {
          const { data: ttbGames } = await supabase
            .from('games')
            .select('time_to_beat_main')
            .in('id', completedIds)
            .not('time_to_beat_main', 'is', null);
          estimatedTimeToBeat = Math.round(
            ttbGames?.reduce((sum, g) => sum + parseFloat(g.time_to_beat_main), 0) || 0
          );
        }

        setStats({
          gamesPlayed,
          reviewsWritten,
          avgRating: parseFloat(avgRating.toFixed(1)),
          listsCreated: listsCount || 0,
          estimatedTimeToBeat,
        });
      } else {
        setStats({ ...EMPTY_STATS, listsCreated: listsCount || 0 });
      }
    } catch (err) {
      console.error('useProfileStats error:', err);
      // Don't reset to empty — keep previous stats on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
