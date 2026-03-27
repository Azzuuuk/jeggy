/**
 * Replaces all seed-user lists with curated, thematic lists.
 * ~60% tiered (S/A/B/C/D), ~40% numbered.
 * Games are chosen by genre/theme, not random.
 *
 * Usage: node seeder/update-lists.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Genre/keyword matchers ──────────────────────────────────
function hasGenre(game, ...keywords) {
  const genres = (game.genres || []).join(' ').toLowerCase();
  const name = (game.name || '').toLowerCase();
  return keywords.some(k => genres.includes(k) || name.includes(k));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomPastDate(minDays, maxDays) {
  const d = new Date();
  d.setDate(d.getDate() - (minDays + Math.floor(Math.random() * (maxDays - minDays))));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

// Distribute game IDs across S/A/B/C/D tiers based on rating
function buildTiers(games) {
  // Sort by average_rating desc (best first)
  const sorted = [...games].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  const tiers = { S: [], A: [], B: [], C: [], D: [] };
  const len = sorted.length;

  sorted.forEach((g, i) => {
    const pct = i / len;
    const id = g.id.toString();
    if (pct < 0.15)      tiers.S.push(id);
    else if (pct < 0.35) tiers.A.push(id);
    else if (pct < 0.60) tiers.B.push(id);
    else if (pct < 0.82) tiers.C.push(id);
    else                  tiers.D.push(id);
  });

  return tiers;
}

// ── List definitions ────────────────────────────────────────
// Each has a filter function to pick relevant games
const LIST_DEFS = [
  // TIERED LISTS (~15)
  {
    title: 'RPGs ranked and i will not be apologizing',
    desc: 'my hill, dying on it',
    style: 'tiered',
    filter: g => hasGenre(g, 'role-playing', 'rpg'),
    min: 8, max: 18,
  },
  {
    title: 'every souls-like ranked by suffering',
    desc: 'controllers were harmed',
    style: 'tiered',
    filter: g => {
      const n = (g.name || '').toLowerCase();
      return n.includes('dark souls') || n.includes('elden ring') || n.includes('bloodborne') ||
             n.includes('sekiro') || n.includes('nioh') || n.includes('lies of p') ||
             n.includes('demon') || n.includes('hollow knight') || n.includes('salt and') ||
             (hasGenre(g, 'role-playing', 'hack and slash') && (g.average_rating || 0) >= 70);
    },
    min: 5, max: 12,
  },
  {
    title: 'open world tier list no cap',
    desc: 'map size ≠ quality',
    style: 'tiered',
    filter: g => hasGenre(g, 'adventure', 'role-playing') && !hasGenre(g, 'visual novel', 'point-and-click'),
    min: 8, max: 16,
  },
  {
    title: 'horror games by how hard i screamed',
    desc: 'played at 3am like an idiot',
    style: 'tiered',
    filter: g => {
      const n = (g.name || '').toLowerCase();
      return hasGenre(g, 'horror') || n.includes('resident evil') || n.includes('silent hill') ||
             n.includes('amnesia') || n.includes('outlast') || n.includes('dead space');
    },
    min: 5, max: 12,
  },
  {
    title: 'shooter tier list (controversial edition)',
    desc: 'yes i put THAT game in C tier',
    style: 'tiered',
    filter: g => hasGenre(g, 'shooter'),
    min: 8, max: 16,
  },
  {
    title: 'platformers ranked by how many times i died',
    desc: 'celeste is in S tier and it\'s not up for debate',
    style: 'tiered',
    filter: g => hasGenre(g, 'platform'),
    min: 6, max: 14,
  },
  {
    title: 'indie games tier list',
    desc: 'small studios, massive W\'s',
    style: 'tiered',
    filter: g => hasGenre(g, 'indie'),
    min: 8, max: 18,
  },
  {
    title: 'strategy games ranked by hours lost',
    desc: '"one more turn" syndrome',
    style: 'tiered',
    filter: g => hasGenre(g, 'strategy', 'tactical', 'turn-based'),
    min: 6, max: 14,
  },
  {
    title: 'fighting games tier list',
    desc: 'based on vibes not frame data',
    style: 'tiered',
    filter: g => hasGenre(g, 'fighting'),
    min: 5, max: 12,
  },
  {
    title: 'multiplayer games ranked by friendship damage',
    desc: 'some of us are no longer speaking',
    style: 'tiered',
    filter: g => hasGenre(g, 'multiplayer', 'moba', 'battle royale') || 
                 ((g.name||'').toLowerCase().match(/overwatch|valorant|fortnite|among us|mario kart|smash|rocket league|apex|pubg/)),
    min: 6, max: 14,
  },
  {
    title: 'nintendo games ranked',
    desc: 'grew up on these',
    style: 'tiered',
    filter: g => {
      const n = (g.name || '').toLowerCase();
      return n.includes('zelda') || n.includes('mario') || n.includes('metroid') ||
             n.includes('pokemon') || n.includes('kirby') || n.includes('smash') ||
             n.includes('splatoon') || n.includes('animal crossing') || n.includes('fire emblem') ||
             n.includes('donkey kong') || n.includes('pikmin') || n.includes('xenoblade');
    },
    min: 6, max: 14,
  },
  {
    title: 'best game narratives, fight me',
    desc: 'if the story didn\'t hit, it\'s not making this list',
    style: 'tiered',
    filter: g => hasGenre(g, 'adventure', 'visual novel', 'role-playing'),
    min: 7, max: 15,
  },
  {
    title: 'racing games ranked',
    desc: 'need for speed > your opinion',
    style: 'tiered',
    filter: g => hasGenre(g, 'racing'),
    min: 5, max: 10,
  },
  {
    title: 'hack and slash tier list',
    desc: 'button mashing is a valid strategy',
    style: 'tiered',
    filter: g => hasGenre(g, 'hack and slash'),
    min: 5, max: 12,
  },
  {
    title: 'cozy games tier list 🌸',
    desc: 'for when the world is too much',
    style: 'tiered',
    filter: g => hasGenre(g, 'simulator', 'puzzle', 'indie') && !hasGenre(g, 'shooter', 'fighting', 'horror'),
    min: 5, max: 10,
  },

  // NUMBERED LISTS (~10)
  {
    title: 'games that made me cry',
    desc: 'in no particular order bc i can\'t decide',
    style: 'numbered',
    filter: g => hasGenre(g, 'adventure', 'role-playing', 'visual novel'),
    min: 4, max: 8,
  },
  {
    title: 'best soundtracks period 🎵',
    desc: 'headphones required',
    style: 'numbered',
    filter: () => true,
    min: 5, max: 10,
  },
  {
    title: 'comfort games for bad days',
    desc: 'medicine',
    style: 'numbered',
    filter: g => hasGenre(g, 'simulator', 'platform', 'adventure', 'puzzle', 'indie'),
    min: 4, max: 7,
  },
  {
    title: 'games i\'ll never finish but keep installed',
    desc: 'don\'t judge me',
    style: 'numbered',
    filter: g => hasGenre(g, 'adventure', 'role-playing', 'strategy'),
    min: 3, max: 7,
  },
  {
    title: 'underrated gems you slept on',
    desc: 'stop sleeping',
    style: 'numbered',
    filter: g => hasGenre(g, 'indie', 'puzzle', 'platform', 'adventure'),
    min: 4, max: 8,
  },
  {
    title: '10/10 no notes',
    desc: 'perfection exists',
    style: 'numbered',
    filter: () => true, // pick from user's highest rated
    min: 3, max: 6,
    sortByRating: true,
  },
  {
    title: 'games that ruined my sleep schedule',
    desc: '"one more" is a lie and we all know it',
    style: 'numbered',
    filter: () => true,
    min: 4, max: 7,
  },
  {
    title: 'best boss fights in gaming',
    desc: 'controllers were sacrificed',
    style: 'numbered',
    filter: g => hasGenre(g, 'hack and slash', 'role-playing', 'shooter'),
    min: 4, max: 8,
  },
  {
    title: 'perfect weekend binge games',
    desc: 'friday night sorted',
    style: 'numbered',
    filter: () => true,
    min: 4, max: 7,
  },
  {
    title: 'games that need a sequel RIGHT NOW',
    desc: 'developers please i\'m begging',
    style: 'numbered',
    filter: () => true,
    min: 4, max: 8,
  },
];

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log('\n📋 JEGGY LIST UPDATER');
  console.log('══════════════════════════════════════\n');

  // 1. Fetch all games
  console.log('📊 Fetching games...');
  const { data: allGames, error: gErr } = await supabase
    .from('games')
    .select('id, name, slug, cover_url, genres, average_rating, igdb_rating_count, first_release_date')
    .not('cover_url', 'is', null)
    .gt('igdb_rating_count', 0)
    .order('igdb_rating_count', { ascending: false, nullsFirst: false })
    .limit(200);

  if (gErr || !allGames?.length) {
    console.error('❌ Failed to fetch games:', gErr);
    process.exit(1);
  }
  console.log(`   Loaded ${allGames.length} games\n`);

  // Build game lookup
  const gameMap = new Map(allGames.map(g => [g.id, g]));

  // 2. Get seed users
  console.log('👥 Fetching seed users...');
  const { data: seedProfiles } = await supabase
    .from('profiles')
    .select('id, username')
    .neq('username', 'azzuuuk'); // exclude real users - find seed users

  // Get auth users to confirm seed domain
  const seedUsers = [];
  for (const p of seedProfiles || []) {
    const { data } = await supabase.auth.admin.getUserById(p.id);
    if (data?.user?.email?.endsWith('@seeduser.jeggy.local')) {
      seedUsers.push(p);
    }
  }
  console.log(`   Found ${seedUsers.length} seed users\n`);

  if (seedUsers.length === 0) {
    console.error('❌ No seed users found');
    process.exit(1);
  }

  // 3. Delete existing seed user lists + related activities
  console.log('🗑️  Deleting existing seed lists...');
  const seedIds = seedUsers.map(u => u.id);
  
  // Delete list comments first
  const { data: existingLists } = await supabase
    .from('lists')
    .select('id')
    .in('user_id', seedIds);
  
  if (existingLists?.length) {
    const listIds = existingLists.map(l => l.id);
    await supabase.from('list_comments').delete().in('list_id', listIds);
  }
  
  const { count: deletedLists } = await supabase
    .from('lists')
    .delete()
    .in('user_id', seedIds)
    .select('*', { count: 'exact', head: true });

  await supabase
    .from('activities')
    .delete()
    .in('user_id', seedIds)
    .eq('activity_type', 'created_list');

  console.log(`   Deleted ${deletedLists || 0} old lists\n`);

  // 4. Get each seed user's rated games (so lists only contain games the user actually rated)
  console.log('⭐ Fetching user ratings...');
  const { data: allRatings } = await supabase
    .from('user_games')
    .select('user_id, game_id, rating')
    .in('user_id', seedIds)
    .gt('rating', 0);

  const userRatedGames = new Map();
  for (const r of allRatings || []) {
    if (!userRatedGames.has(r.user_id)) userRatedGames.set(r.user_id, []);
    // game_id is stored as string in user_games
    const numericId = parseInt(r.game_id, 10);
    const game = gameMap.get(numericId);
    if (game) {
      userRatedGames.get(r.user_id).push({ ...r, game_id_num: numericId, game });
    }
  }
  console.log(`   ${allRatings?.length || 0} total ratings across ${userRatedGames.size} users\n`);

  // 5. Create curated lists
  console.log('✨ Creating curated lists...');
  let totalCreated = 0;
  const usedTemplates = new Set();
  const templateQueue = shuffle([...LIST_DEFS]);

  // Assign lists to users — power users get 2-3, active get 1-2, rest get 0-1
  for (const user of shuffle(seedUsers)) {
    if (templateQueue.length === 0) break;

    const userRatings = userRatedGames.get(user.id) || [];
    if (userRatings.length < 5) continue; // need enough games

    const ratedGamesWithData = userRatings; // already enriched above

    // Each user gets 1-2 lists
    const numLists = Math.min(templateQueue.length, Math.random() > 0.6 ? 2 : 1);

    for (let i = 0; i < numLists; i++) {
      const template = templateQueue.pop();
      if (!template || usedTemplates.has(template.title)) continue;

      // Filter games that match this list's theme
      let candidates = ratedGamesWithData.filter(r => template.filter(r.game));
      
      // Fallback: if not enough matching games, try next user
      if (candidates.length < template.min) {
        // Put it back and try a different template
        templateQueue.unshift(template);
        continue;
      }

      // Pick games up to max
      const numGames = Math.min(
        template.max,
        Math.max(template.min, candidates.length)
      );
      // Pick games — sort by user rating if flagged, else shuffle
      const sorted = template.sortByRating
        ? candidates.sort((a, b) => b.rating - a.rating)
        : shuffle(candidates);
      const selectedGames = sorted.slice(0, numGames);
      const gameIds = selectedGames.map(g => g.game_id.toString());
      const createdAt = randomPastDate(3, 80);

      let tiers = null;
      if (template.style === 'tiered') {
        // Build tiers using the user's actual ratings
        const gamesWithRating = selectedGames.map(sg => ({
          id: sg.game_id, // keep as string
          average_rating: sg.rating * 10,
        }));
        tiers = buildTiers(gamesWithRating);
      }

      const { error } = await supabase.from('lists').insert({
        user_id: user.id,
        title: template.title,
        description: template.desc,
        game_ids: gameIds,
        ranking_style: template.style,
        tiers,
        is_public: true,
        created_at: createdAt,
        updated_at: createdAt,
      });

      if (error) {
        console.error(`   ✗ "${template.title}": ${error.message}`);
      } else {
        usedTemplates.add(template.title);
        totalCreated++;

        // Activity
        const firstGame = selectedGames[0]?.game;
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'created_list',
          list_title: template.title,
          game_name: firstGame?.name || null,
          game_cover_url: firstGame?.cover_url || null,
          created_at: createdAt,
        });
      }
    }
  }

  console.log(`\n✅ Created ${totalCreated} curated lists (${LIST_DEFS.filter(l => l.style === 'tiered').length} tiered defs / ${LIST_DEFS.filter(l => l.style === 'numbered').length} numbered defs)`);
  console.log(`   Templates used: ${usedTemplates.size}/${LIST_DEFS.length}`);
  console.log('   No duplicates, all thematically matched.\n');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
