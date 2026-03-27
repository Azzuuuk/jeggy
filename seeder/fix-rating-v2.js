/**
 * Fix rating curve v2: accounts for IGDB rating count as trust factor.
 *
 * Problem: IGDB ratings are inflated for niche games with few votes.
 *   "Trailer Park King" has IGDB 100 with 47 ratings → shouldn't be 9.3 on Jeggy.
 *   "Dark Souls III" has IGDB 87 with 1820 ratings → shouldn't be only 8.0.
 *
 * Solution: Bayesian weighted average mixing IGDB rating with a neutral prior.
 *   score = (count * igdb + prior_count * prior_rating) / (count + prior_count)
 *   Then map to Jeggy's 0-10 scale with a gentler curve.
 *
 * Target outcomes:
 *   Elden Ring (IGDB 93, 2017 votes) → ~9.1-9.2
 *   Dark Souls III (IGDB 87, 1820 votes) → ~8.5-8.6
 *   Hades (IGDB 89, 1589 votes) → ~8.7-8.8
 *   Trailer Park King (IGDB 100, 47 votes) → ~8.0-8.3 (deflated)
 *   Silly Survivors (IGDB 100, 6 votes) → ~7.5 (heavily deflated)
 *
 * Usage: node seeder/fix-rating-v2.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bayesian prior: pulls games toward 7.0 (neutral "good")
const PRIOR_RATING = 70; // on 0-100 scale
const PRIOR_COUNT = 150; // how strongly to pull toward prior (higher = more deflation for low-count games)

function bayesianScore(igdbRating, ratingCount) {
  if (!igdbRating) return 0;
  const count = ratingCount || 0;
  // Weighted average between IGDB rating and neutral prior
  const weighted = (count * igdbRating + PRIOR_COUNT * PRIOR_RATING) / (count + PRIOR_COUNT);
  return weighted;
}

// Convert bayesian score (0-100) to Jeggy (0-10) with mild compression at top
function scoreToJeggy(score) {
  if (score <= 0) return 0;
  // Gentle curve: just divide by 10 but cap at 9.5
  // Score of 95 → 9.5, 90 → 9.0, 85 → 8.5, 80 → 8.0, etc.
  const raw = score / 10;
  // Soft cap: compress above 9.0 slightly
  if (raw > 9.0) return 9.0 + (raw - 9.0) * 0.5; // 9.5→9.25, 10→9.5
  return raw;
}

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }
function gaussRand() { return (Math.random() + Math.random() + Math.random()) / 3; }

async function main() {
  console.log('\n📊 FIXING RATING CURVE v2 (Bayesian)');
  console.log('══════════════════════════════════════\n');

  // Preview the mapping
  console.log('Mapping preview (IGDB rating | count → Jeggy):');
  const previews = [
    [100, 6], [100, 47], [100, 500], [100, 5000],
    [95, 100], [95, 1000], [95, 5000],
    [93, 2000], [93, 5000],
    [91, 1000], [89, 1500], [87, 1800],
    [85, 500], [80, 300], [75, 200], [70, 100], [60, 50],
  ];
  for (const [igdb, count] of previews) {
    const bs = bayesianScore(igdb, count);
    const jeggy = scoreToJeggy(bs).toFixed(1);
    console.log(`   IGDB ${igdb} (${count} votes) → weighted ${bs.toFixed(0)} → Jeggy ${jeggy}`);
  }
  console.log('');

  // 1. Get seed user IDs
  console.log('👥 Finding seed users...');
  const { data: allProfiles } = await supabase.from('profiles').select('id');
  const seedIds = [];
  for (const p of allProfiles || []) {
    const { data } = await supabase.auth.admin.getUserById(p.id);
    if (data?.user?.email?.endsWith('@seeduser.jeggy.local')) seedIds.push(p.id);
  }
  const seedIdSet = new Set(seedIds);
  console.log(`   ${seedIds.length} seed users\n`);

  // 2. Fetch ALL games with ratings in batches
  console.log('📦 Fetching all games...');
  let allGames = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('games')
      .select('id, name, average_rating, igdb_rating, igdb_rating_count')
      .gt('average_rating', 0)
      .range(offset, offset + 999);
    if (!data?.length) break;
    allGames = allGames.concat(data);
    offset += 1000;
    if (data.length < 1000) break;
  }
  console.log(`   ${allGames.length} games\n`);

  // 3. Get all user ratings
  console.log('⭐ Fetching user ratings...');
  const { data: allUserRatings } = await supabase
    .from('user_games')
    .select('id, user_id, game_id, rating')
    .gt('rating', 0);
  
  const ratingsByGame = new Map();
  for (const r of allUserRatings || []) {
    if (!ratingsByGame.has(r.game_id)) ratingsByGame.set(r.game_id, []);
    ratingsByGame.get(r.game_id).push(r);
  }
  console.log(`   ${(allUserRatings || []).length} ratings across ${ratingsByGame.size} games\n`);

  // 4. Compute new average for every game and batch by target value
  console.log('🔧 Computing new ratings...');
  
  // Group games by target rating for batch updates
  const batchMap = new Map(); // target_rating → [game_ids]
  const userRatedGames = new Map(); // game_id → { target, ratings }
  
  for (const game of allGames) {
    if (!game.igdb_rating) continue;
    
    const bs = bayesianScore(game.igdb_rating, game.igdb_rating_count);
    const target = parseFloat(clamp(scoreToJeggy(bs), 1.0, 9.5).toFixed(1));
    const gameIdStr = game.id.toString();
    
    if (ratingsByGame.has(gameIdStr)) {
      // Game has user ratings — handle individually
      userRatedGames.set(gameIdStr, { target, game, ratings: ratingsByGame.get(gameIdStr) });
    } else {
      // IGDB-only — batch update
      if (game.average_rating !== target) {
        if (!batchMap.has(target)) batchMap.set(target, []);
        batchMap.get(target).push(game.id);
      }
    }
  }

  // 5. Batch update IGDB-only games
  console.log(`   Batch updating ${[...batchMap.values()].reduce((s, a) => s + a.length, 0)} IGDB-only games...`);
  let batchUpdated = 0;
  for (const [targetRating, gameIds] of batchMap) {
    // Supabase .in() has a limit, chunk to 100
    for (let i = 0; i < gameIds.length; i += 100) {
      const chunk = gameIds.slice(i, i + 100);
      const { error } = await supabase
        .from('games')
        .update({ average_rating: targetRating })
        .in('id', chunk);
      if (!error) batchUpdated += chunk.length;
    }
  }
  console.log(`   ✅ ${batchUpdated} IGDB-only games updated\n`);

  // 6. Fix seed user ratings + recalculate averages for user-rated games
  console.log(`   Adjusting ${userRatedGames.size} user-rated games...`);
  let userRatingsFixed = 0;
  let gamesRecalculated = 0;
  
  for (const [gameIdStr, { target, game, ratings }] of userRatedGames) {
    const newRatings = [];
    
    for (const r of ratings) {
      if (seedIdSet.has(r.user_id)) {
        const variance = target >= 8.5 ? 0.8 : 1.2;
        const off = (gaussRand() - 0.5) * 2 * variance;
        const newRating = clamp(Math.round(target + off), 1, 10);
        newRatings.push(newRating);
        
        if (newRating !== r.rating) {
          await supabase.from('user_games').update({ rating: newRating }).eq('id', r.id);
          userRatingsFixed++;
        }
      } else {
        newRatings.push(r.rating); // keep real user ratings
      }
    }
    
    const avg = parseFloat((newRatings.reduce((s, v) => s + v, 0) / newRatings.length).toFixed(1));
    await supabase.from('games').update({ average_rating: avg }).eq('id', game.id);
    gamesRecalculated++;
  }
  
  console.log(`   ✅ ${userRatingsFixed} seed ratings adjusted`);
  console.log(`   ✅ ${gamesRecalculated} game averages recalculated\n`);

  // 7. Verification
  console.log('✅ VERIFICATION:');
  const checks = [
    'Grand Theft Auto V', 'The Legend of Zelda: Tears of the Kingdom',
    'Elden Ring', 'Bloodborne', 'Red Dead Redemption 2',
    'The Last of Us', 'The Last of Us Part II', 'God of War Ragnarök',
    'Hades', 'Celeste', 'The Witcher 3: Wild Hunt',
    'Dark Souls III', 'Hollow Knight', 'Portal 2',
    'Half-Life 2', 'Sekiro: Shadows Die Twice',
    'Super Mario Odyssey', 'Minecraft',
    'Doom Eternal', 'Baldur\'s Gate III',
    'Disco Elysium', 'Persona 5 Royal',
    // Niche games that should be deflated
    'Trailer Park King', 'Silly Survivors', 'American Chopper',
    'Oxide: Survival Island', 'Resonite', 'Lizards Must Die',
  ];
  for (const name of checks) {
    const { data } = await supabase.from('games').select('name, average_rating, igdb_rating, igdb_rating_count').eq('name', name).maybeSingle();
    if (data) {
      const tag = (data.igdb_rating_count || 0) < 100 ? ' [niche]' : '';
      console.log(`   ${(data.average_rating||0).toFixed(1)} | ${data.name} (IGDB: ${(data.igdb_rating||0).toFixed(0)}, ${data.igdb_rating_count || 0} votes)${tag}`);
    }
  }

  // Distribution
  console.log('\n📊 Distribution:');
  let all = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('games').select('average_rating').gt('average_rating', 0).range(offset, offset + 999);
    if (!data?.length) break;
    all = all.concat(data);
    offset += 1000;
    if (data.length < 1000) break;
  }
  
  const dist = { '9.0+': 0, '8.5-8.9': 0, '8.0-8.4': 0, '7.5-7.9': 0, '7.0-7.4': 0, '6.0-6.9': 0, '5.0-5.9': 0, '<5.0': 0 };
  all.forEach(g => {
    const r = g.average_rating;
    if (r >= 9.0) dist['9.0+']++;
    else if (r >= 8.5) dist['8.5-8.9']++;
    else if (r >= 8.0) dist['8.0-8.4']++;
    else if (r >= 7.5) dist['7.5-7.9']++;
    else if (r >= 7.0) dist['7.0-7.4']++;
    else if (r >= 6.0) dist['6.0-6.9']++;
    else if (r >= 5.0) dist['5.0-5.9']++;
    else dist['<5.0']++;
  });
  Object.entries(dist).forEach(([k, v]) => console.log(`   ${k}: ${v} games`));
  console.log(`   Total: ${all.length}\n`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
