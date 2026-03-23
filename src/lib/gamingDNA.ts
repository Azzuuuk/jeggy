import { supabase } from './supabase';

export interface GamingDNA {
  totalRatings: number;
  avgRating: number;
  totalHours: number;
  topGenres: Array<{ name: string; count: number; percentage: number }>;
  personality: {
    label: string;
    description: string;
  };
  mainstreamAlignment: number;
  ratingDistribution: Record<number, number>;
}

export async function calculateGamingDNA(userId: string): Promise<GamingDNA> {
  try {
    const { data: userGames, error: ugError } = await supabase
      .from('user_games')
      .select('rating, game_id')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    if (ugError) throw ugError;
    if (!userGames || userGames.length === 0) return getEmptyDNA();

    // Fetch game details separately (game_id is text, games.id is int)
    const gameIds = [...new Set(userGames.map(ug => parseInt(ug.game_id)))].filter(id => !isNaN(id));
    const { data: gamesData } = await supabase
      .from('games')
      .select('id, genres, average_rating')
      .in('id', gameIds);

    const gameMap = new Map((gamesData || []).map(g => [g.id.toString(), g]));

    const avgRating = userGames.reduce((sum, g) => sum + parseFloat(g.rating), 0) / userGames.length;

    // Genre distribution
    const genreCounts: Record<string, number> = {};
    userGames.forEach(ug => {
      const game = gameMap.get(ug.game_id);
      if (game?.genres) {
        game.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / userGames.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Rating distribution
    const ratingDistribution: Record<number, number> = {};
    userGames.forEach(ug => {
      const rating = Math.round(parseFloat(ug.rating));
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    // Mainstream alignment
    let totalDifference = 0;
    let gamesWithCommunityRating = 0;
    userGames.forEach(ug => {
      const game = gameMap.get(ug.game_id);
      if (game?.average_rating && game.average_rating > 0) {
        totalDifference += Math.abs(parseFloat(ug.rating) - game.average_rating);
        gamesWithCommunityRating++;
      }
    });

    const avgDifference = gamesWithCommunityRating > 0
      ? totalDifference / gamesWithCommunityRating
      : 0;

    const mainstreamAlignment = Math.max(0, Math.min(100,
      Math.round(100 - (avgDifference / 10 * 100))
    ));

    const personality = determineGamerPersonality({
      avgRating,
      totalRatings: userGames.length,
      topGenres,
      mainstreamAlignment,
      ratingDistribution,
    });

    // Total hours from gaming sessions
    const { data: sessions } = await supabase
      .from('gaming_sessions')
      .select('hours_played')
      .eq('user_id', userId);

    const totalHours = sessions?.reduce((sum, s) => sum + parseFloat(s.hours_played), 0) || 0;

    return {
      totalRatings: userGames.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalHours: Math.round(totalHours),
      topGenres,
      personality,
      mainstreamAlignment,
      ratingDistribution,
    };
  } catch (error) {
    console.error('Error calculating gaming DNA:', error);
    return getEmptyDNA();
  }
}

function determineGamerPersonality(data: {
  avgRating: number;
  totalRatings: number;
  topGenres: Array<{ name: string; percentage: number }>;
  mainstreamAlignment: number;
  ratingDistribution: Record<number, number>;
}) {
  const { avgRating, totalRatings, topGenres, mainstreamAlignment, ratingDistribution } = data;
  const ratingSpread = Object.keys(ratingDistribution).length;

  if (totalRatings > 50 && ratingSpread >= 6) {
    return {
      label: 'The Completionist',
      description: 'You play and rate everything. No game left behind.',
    };
  }
  if (avgRating < 6.5 && totalRatings > 20) {
    return {
      label: 'The Critic',
      description: "You have high standards and aren't afraid to share them.",
    };
  }
  if (avgRating > 8.0) {
    return {
      label: 'The Enthusiast',
      description: 'You love gaming and find joy in most titles you play.',
    };
  }
  if (mainstreamAlignment < 50) {
    return {
      label: 'The Contrarian',
      description: 'Your taste diverges from the crowd. You see what others miss.',
    };
  }
  if (topGenres.length > 0 && topGenres[0].percentage > 50) {
    return {
      label: 'The Specialist',
      description: `You know what you like: ${topGenres[0].name} games.`,
    };
  }
  if (topGenres.length >= 5 && topGenres[0].percentage < 30) {
    return {
      label: 'The Genre Nomad',
      description: 'You explore all corners of gaming. Variety is your spice.',
    };
  }
  if (totalRatings < 20) {
    return {
      label: 'The Explorer',
      description: "You're just beginning your journey. Keep rating!",
    };
  }
  return {
    label: 'The Gamer',
    description: 'You love games and have great taste.',
  };
}

function getEmptyDNA(): GamingDNA {
  return {
    totalRatings: 0,
    avgRating: 0,
    totalHours: 0,
    topGenres: [],
    personality: {
      label: 'New Explorer',
      description: 'Start rating games to discover your gaming DNA',
    },
    mainstreamAlignment: 50,
    ratingDistribution: {},
  };
}

export async function findHotTakes(userId: string, limit: number = 10) {
  try {
    const { data: userGames, error } = await supabase
      .from('user_games')
      .select('rating, game_id')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    if (error) throw error;
    if (!userGames || userGames.length === 0) return [];

    const gameIds = [...new Set(userGames.map(ug => parseInt(ug.game_id)))].filter(id => !isNaN(id));
    const { data: gamesData } = await supabase
      .from('games')
      .select('id, name, slug, cover_url, average_rating')
      .in('id', gameIds);

    const gameMap = new Map((gamesData || []).map(g => [g.id.toString(), g]));

    return userGames
      .filter(ug => {
        const game = gameMap.get(ug.game_id);
        return game?.average_rating && game.average_rating > 0;
      })
      .map(ug => {
        const game = gameMap.get(ug.game_id)!;
        const difference = Math.abs(parseFloat(ug.rating) - game.average_rating);
        return {
          game_id: ug.game_id,
          game_name: game.name as string,
          game_slug: game.slug as string,
          game_cover: game.cover_url as string | null,
          your_rating: parseFloat(ug.rating),
          community_rating: game.average_rating as number,
          difference,
        };
      })
      .filter(take => take.difference >= 2)
      .sort((a, b) => b.difference - a.difference)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding hot takes:', error);
    return [];
  }
}

export async function findGamingTwins(userId: string, limit: number = 10) {
  try {
    const { data: userTopGames, error: utgError } = await supabase
      .from('user_games')
      .select('game_id, rating')
      .eq('user_id', userId)
      .gte('rating', 8);

    if (utgError) throw utgError;
    if (!userTopGames || userTopGames.length < 3) return [];

    const userGameIds = userTopGames.map(g => g.game_id);

    const { data: similarUsers, error: suError } = await supabase
      .from('user_games')
      .select('user_id, game_id, rating')
      .in('game_id', userGameIds)
      .gte('rating', 8)
      .neq('user_id', userId);

    if (suError) throw suError;
    if (!similarUsers) return [];

    const userScores: Record<string, { shared: number; totalDiff: number }> = {};
    similarUsers.forEach(su => {
      if (!userScores[su.user_id]) {
        userScores[su.user_id] = { shared: 0, totalDiff: 0 };
      }
      const userGame = userTopGames.find(ug => ug.game_id === su.game_id);
      if (userGame) {
        userScores[su.user_id].shared++;
        userScores[su.user_id].totalDiff += Math.abs(parseFloat(userGame.rating) - parseFloat(su.rating));
      }
    });

    // Fetch profiles for matched users
    const matchedUserIds = Object.entries(userScores)
      .filter(([, score]) => score.shared >= 3)
      .map(([uid]) => uid);

    if (matchedUserIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', matchedUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return matchedUserIds
      .map(uid => {
        const score = userScores[uid];
        const avgDiff = score.totalDiff / score.shared;
        const compatibility = Math.max(0, Math.min(100,
          Math.round(100 - (avgDiff / 10 * 100))
        ));
        const profile = profileMap.get(uid);
        return {
          user_id: uid,
          username: profile?.username as string | undefined,
          display_name: profile?.display_name as string | undefined,
          compatibility,
          sharedGames: score.shared,
        };
      })
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding gaming twins:', error);
    return [];
  }
}
