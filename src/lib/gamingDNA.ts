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

    // Fetch game details including data needed for personality detection
    const gameIds = [...new Set(userGames.map(ug => parseInt(ug.game_id)))].filter(id => !isNaN(id));
    const { data: gamesData } = await supabase
      .from('games')
      .select('id, genres, average_rating, igdb_rating_count, release_year, time_to_beat_main')
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

    // Game-level stats for personality detection
    const currentYear = new Date().getFullYear();
    const releaseYears: number[] = [];
    let obscureCount = 0;
    let recentCount = 0;
    const ttbValues: number[] = [];

    userGames.forEach(ug => {
      const game = gameMap.get(ug.game_id);
      if (!game) return;
      if (game.release_year) {
        releaseYears.push(game.release_year);
        if (currentYear - game.release_year <= 2) recentCount++;
      }
      if (game.igdb_rating_count != null && game.igdb_rating_count < 100) obscureCount++;
      if (game.time_to_beat_main != null && game.time_to_beat_main > 0) ttbValues.push(game.time_to_beat_main);
    });

    const medianReleaseYear = releaseYears.length > 0
      ? releaseYears.sort((a, b) => a - b)[Math.floor(releaseYears.length / 2)]
      : currentYear;
    const avgTTB = ttbValues.length > 0
      ? ttbValues.reduce((s, v) => s + v, 0) / ttbValues.length
      : 0;

    const personality = determineGamerPersonality({
      avgRating,
      totalRatings: userGames.length,
      topGenres,
      mainstreamAlignment,
      ratingDistribution,
      obscurePercent: userGames.length > 0 ? (obscureCount / userGames.length) * 100 : 0,
      recentPercent: userGames.length > 0 ? (recentCount / userGames.length) * 100 : 0,
      medianReleaseYear,
      currentYear,
      avgTTB,
      gamesWithTTB: ttbValues.length,
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
  obscurePercent: number;
  recentPercent: number;
  medianReleaseYear: number;
  currentYear: number;
  avgTTB: number;
  gamesWithTTB: number;
}) {
  const {
    avgRating, totalRatings, topGenres, mainstreamAlignment,
    ratingDistribution, obscurePercent, recentPercent,
    medianReleaseYear, currentYear, avgTTB, gamesWithTTB,
  } = data;
  const ratingSpread = Object.keys(ratingDistribution).length;

  // Count extreme ratings (≤4 or ≥9)
  let extremeCount = 0;
  Object.entries(ratingDistribution).forEach(([rating, count]) => {
    const r = parseInt(rating);
    if (r <= 4 || r >= 9) extremeCount += count;
  });
  const extremePercent = totalRatings > 0 ? (extremeCount / totalRatings) * 100 : 0;

  // --- Distinctive volume + behavior ---

  if (totalRatings >= 75 && ratingSpread >= 7) {
    return {
      label: 'The Completionist',
      description: 'You play and rate everything. No game left behind, no score left ungiven.',
    };
  }

  if (extremePercent > 50 && totalRatings >= 15 && ratingSpread >= 4) {
    return {
      label: 'All or Nothing',
      description: 'Masterpiece or trash. You don\'t do "it was okay."',
    };
  }

  // --- Strong rating patterns ---

  if (avgRating > 8.5 && totalRatings >= 10) {
    return {
      label: 'Hype Machine',
      description: 'Everything you play is amazing and you want the world to know.',
    };
  }

  if (avgRating < 6.0 && totalRatings >= 15) {
    return {
      label: 'The Critic',
      description: 'Your standards are higher than most studios\' budgets.',
    };
  }

  if (avgRating >= 6.5 && avgRating <= 7.5 && ratingSpread >= 5 && totalRatings >= 20) {
    return {
      label: 'Perfectly Balanced',
      description: 'You use the full scale like it was designed. Respect.',
    };
  }

  // --- Game selection patterns (need enough data) ---

  if (obscurePercent > 50 && totalRatings >= 10) {
    return {
      label: 'Crate Digger',
      description: 'You find games most people don\'t even know exist. The algorithm fears you.',
    };
  }

  if (recentPercent > 60 && totalRatings >= 10) {
    return {
      label: 'Day-One Addict',
      description: 'If it just dropped, you\'ve already rated it. Sleep is optional.',
    };
  }

  if (currentYear - medianReleaseYear >= 8 && totalRatings >= 10) {
    return {
      label: 'Old Soul',
      description: 'Still playing the greats while everyone chases the new. Timeless taste.',
    };
  }

  if (avgTTB > 35 && gamesWithTTB >= 5) {
    return {
      label: 'Marathon Runner',
      description: 'Short games don\'t exist in your world. You\'re here for the long haul.',
    };
  }

  // --- Taste patterns ---

  if (mainstreamAlignment < 40 && totalRatings >= 10) {
    return {
      label: 'Main Character',
      description: 'Everyone else is wrong and you have the ratings to prove it.',
    };
  }

  if (topGenres.length > 0 && topGenres[0].percentage > 50 && totalRatings >= 8) {
    return {
      label: 'One-Trick',
      description: `${topGenres[0].name} is not a genre, it\'s a lifestyle. You get it.`,
    };
  }

  if (topGenres.length >= 5 && topGenres[0].percentage < 30 && totalRatings >= 8) {
    return {
      label: 'Genre Nomad',
      description: 'RPG Monday, horror Tuesday, farming sim Wednesday. You can\'t be boxed in.',
    };
  }

  // --- Broad catches (ensure minimal fallback) ---

  if (avgRating >= 7.0 && totalRatings >= 5) {
    return {
      label: 'Certified Fan',
      description: 'You genuinely love games and your ratings show it. Keep going.',
    };
  }

  if (avgRating < 7.0 && totalRatings >= 8) {
    return {
      label: 'Tough Crowd',
      description: 'You don\'t hand out praise easily. Games have to earn it.',
    };
  }

  // --- Low volume ---

  if (totalRatings < 5) {
    return {
      label: 'Tutorial Mode',
      description: 'You just started. Rate a few more and your real type will emerge.',
    };
  }

  if (totalRatings < 15) {
    return {
      label: 'The Explorer',
      description: 'Building your profile one rating at a time. The picture is forming.',
    };
  }

  // --- Fallback (virtually unreachable) ---
  return {
    label: 'Gaming Baby',
    description: 'Still figuring out your vibe. Keep rating and your type will lock in.',
  };
}

function getEmptyDNA(): GamingDNA {
  return {
    totalRatings: 0,
    avgRating: 0,
    totalHours: 0,
    topGenres: [],
    personality: {
      label: 'Mr. I Don\'t Rate Games',
      description: 'You\'re here but your ratings aren\'t. Fix that.',
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
