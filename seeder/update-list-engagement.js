/**
 * Adds realistic comments and likes to seed user lists.
 * Comments match the list theme — some praise, some roasts, some debates.
 * 
 * Usage: node seeder/update-list-engagement.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function randomPastDate(minDays, maxDays) {
  const d = new Date();
  d.setDate(d.getDate() - (minDays + Math.floor(Math.random() * (maxDays - minDays))));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

// ── Comment templates keyed by list title keywords ──────────
// {game} gets replaced with a random game name from the list
const THEMED_COMMENTS = {
  'rpg': [
    'the {game} placement is a war crime',
    '{game} in S tier?? finally someone with taste',
    'you put {game} WHERE??? we need to talk',
    'solid list but {game} deserves higher',
    'this is the most correct rpg ranking i\'ve ever seen',
    'lost all credibility when i saw {game} that low',
    'W list. {game} at the top where it belongs',
    'i physically recoiled at the {game} placement',
  ],
  'souls': [
    '{game} above bloodborne??? blocked',
    'you clearly haven\'t beaten {game} if that\'s where you put it',
    'D tier {game} is insane but i respect the honesty',
    'fellow masochist. respect',
    'this list understands pain',
  ],
  'shooter': [
    '{game} in C tier is genuinely criminal',
    'finally someone who rates {game} properly',
    'half of these aren\'t even shooters lol',
    'i see {game} in S tier, i upvote. simple',
    'controversial but honestly fair',
    'L take on {game} but the rest is solid',
  ],
  'platformer': [
    '{game} placement is perfect no notes',
    'celeste fans stay winning',
    'where is hollow knight??',
    'the mario disrespect in this list...',
    '{game} that low is a choice and a bad one',
  ],
  'indie': [
    '{game} is so underrated glad to see it here',
    'indie devs carrying the entire industry',
    'add {game} it deserves to be on every indie list',
    'this list understands. like actually understands',
    'small studios big Ws',
  ],
  'strategy': [
    'civ players and their "one more turn" at 4am',
    '{game} ranking is correct and i will hear no arguments',
    'this is the list of someone who has lost sleep',
    'solid but {game} deserves S tier',
  ],
  'horror': [
    'played {game} with the lights off. never again',
    'this list is a guide to not sleeping',
    '{game} that high?? it wasn\'t even scary',
    'respect for including {game}',
  ],
  'open world': [
    '{game} map was mid but the vibes were immaculate',
    'bigger map ≠ better game and this list gets it',
    '{game} placement is perfect',
    'ubisoft open worlds in shambles looking at this list',
  ],
  'nintendo': [
    'the nostalgia is hitting hard with this one',
    '{game} in anything below S tier is a crime against childhood',
    'no wii sports?? list invalid',
    'this list just unlocked core memories',
    'galaxy 2 erasure smh',
  ],
  'narrative': [
    '{game} made me cry and i\'m not ashamed',
    'finally a list that values story over graphics',
    'whoever made this list has impeccable taste',
    '{game} deserved higher but otherwise solid',
  ],
  'fighting': [
    '{game} mains punching the air rn',
    'this is a vibes ranking not a tournament ranking',
    'the disrespect to {game}...',
    'based list honestly',
  ],
  'cozy': [
    'this list is a warm hug',
    '{game} cured my depression no joke',
    'need this energy after a long day',
    'add stardew valley and this list is perfect',
  ],
  'hack': [
    '{game} combat is unmatched',
    'button mashing appreciation post',
    'W list, {game} is addicting',
  ],
  'racing': [
    '{game} at the top where it belongs',
    'this list has taste',
    'forza horizon erasure',
  ],
};

// Generic comments for any list
const GENERIC_PRAISE = [
  'W list',
  'finally a good list on this platform',
  'saved. bookmarked. screenshotted.',
  'this is it. this is the list',
  'you understood the assignment',
  'i agree with like 90% of this',
  'taste. you have it',
  'actually a really solid list',
  'subscribed to your opinion',
  'based and correct',
];

const GENERIC_ROAST = [
  'i have never disagreed with a list more in my life',
  'this list is a cry for help',
  'who hurt you',
  'objectively wrong but points for confidence',
  'L list but entertaining',
  'i need whatever you\'re smoking',
  'my eyes. my poor eyes',
  'the audacity of this ranking',
  'i disagree with this list on a spiritual level',
  'ratio',
];

const GENERIC_NEUTRAL = [
  'interesting takes',
  'some of these i agree with, some... no',
  'adding a few of these to my backlog',
  'never played {game}, worth it?',
  'been meaning to try {game}',
  'this list just reminded me i need to finish {game}',
];

// Numbered list specific comments
const NUMBERED_COMMENTS = [
  'solid picks honestly',
  '{game} on this list is so real',
  'the way {game} made it but not [other game]...',
  'adding all of these to my list',
  'half of these are already on my backlog lol',
  'ok i need to play {game} apparently',
  'this list gets it',
  '{game} is SUCH a good pick for this',
];

// Match list title to comment pool
function getThemedComments(title) {
  const t = title.toLowerCase();
  const pools = [];
  
  for (const [keyword, comments] of Object.entries(THEMED_COMMENTS)) {
    if (t.includes(keyword)) pools.push(...comments);
  }
  
  // For tiered lists specifically
  if (pools.length > 0) return pools;
  
  // Fallback: use numbered + generic
  return [...NUMBERED_COMMENTS];
}

async function main() {
  console.log('\n💬 ADDING LIST ENGAGEMENT');
  console.log('══════════════════════════════════════\n');

  // 1. Get all lists (except the user's real list)
  const { data: lists } = await supabase
    .from('lists')
    .select('id, title, user_id, game_ids, ranking_style, tiers, created_at');

  if (!lists?.length) {
    console.error('❌ No lists found');
    process.exit(1);
  }
  console.log(`📋 Found ${lists.length} lists\n`);

  // 2. Get all seed users
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, username');
  
  const seedUsers = [];
  for (const p of allProfiles || []) {
    const { data } = await supabase.auth.admin.getUserById(p.id);
    if (data?.user?.email?.endsWith('@seeduser.jeggy.local')) {
      seedUsers.push(p);
    }
  }
  console.log(`👥 ${seedUsers.length} seed users available\n`);

  const seedIds = new Set(seedUsers.map(u => u.id));

  // 3. Get game names for comment templating
  const allGameIds = [...new Set(lists.flatMap(l => l.game_ids.map(Number)))];
  const { data: games } = await supabase
    .from('games')
    .select('id, name')
    .in('id', allGameIds);
  const gameMap = new Map((games || []).map(g => [g.id, g.name]));

  // 4. Clean existing seed comments and likes on these lists
  console.log('🗑️  Cleaning old engagement...');
  const listIds = lists.map(l => l.id);
  
  // Delete seed user comments
  await supabase.from('list_comments').delete().in('user_id', [...seedIds]).in('list_id', listIds);
  // Delete seed user likes
  await supabase.from('list_likes').delete().in('user_id', [...seedIds]).in('list_id', listIds);
  // Reset likes_count
  for (const l of lists) {
    await supabase.from('lists').update({ likes_count: 0 }).eq('id', l.id);
  }
  console.log('   Done\n');

  // 5. Add comments and likes to each list
  console.log('✨ Adding engagement...\n');
  let totalComments = 0;
  let totalLikes = 0;

  for (const list of lists) {
    // Get game names from this list
    const listGameNames = list.game_ids
      .map(id => gameMap.get(Number(id)))
      .filter(Boolean);

    const fillGame = (text) => {
      if (!text.includes('{game}') || listGameNames.length === 0) return text;
      return text.replace('{game}', pick(listGameNames));
    };

    // Pick commenters (not the list owner, 2-6 comments per list)
    const eligibleCommenters = seedUsers.filter(u => u.id !== list.user_id);
    const numComments = randBetween(2, 6);
    const commenters = [];
    const used = new Set();
    while (commenters.length < numComments && commenters.length < eligibleCommenters.length) {
      const c = pick(eligibleCommenters);
      if (!used.has(c.id)) {
        used.add(c.id);
        commenters.push(c);
      }
    }

    // Build comment pool for this list
    const themedPool = getThemedComments(list.title);
    const fullPool = [
      ...themedPool, ...themedPool, // weight themed higher
      ...GENERIC_PRAISE,
      ...GENERIC_ROAST,
      ...GENERIC_NEUTRAL,
    ];

    // Ensure variety: ~50% themed/praise, ~30% roast, ~20% neutral
    const usedComments = new Set();
    for (const commenter of commenters) {
      let comment;
      let attempts = 0;
      do {
        const roll = Math.random();
        if (roll < 0.5) {
          comment = fillGame(pick([...themedPool, ...GENERIC_PRAISE]));
        } else if (roll < 0.8) {
          comment = fillGame(pick(GENERIC_ROAST));
        } else {
          comment = fillGame(pick(GENERIC_NEUTRAL));
        }
        attempts++;
      } while (usedComments.has(comment) && attempts < 20);
      
      usedComments.add(comment);

      // Comment date: after list creation, spread over days
      const listDate = new Date(list.created_at);
      const commentDate = new Date(listDate.getTime() + randBetween(1, 30) * 24 * 60 * 60 * 1000);
      if (commentDate > new Date()) commentDate.setTime(Date.now() - randBetween(1, 7) * 24 * 60 * 60 * 1000);

      const { error } = await supabase.from('list_comments').insert({
        list_id: list.id,
        user_id: commenter.id,
        content: comment,
        created_at: commentDate.toISOString(),
        updated_at: commentDate.toISOString(),
      });

      if (!error) totalComments++;
    }

    // Likes: 3-15 per list
    const numLikes = randBetween(3, 15);
    const likers = new Set();
    let likeAttempts = 0;
    while (likers.size < numLikes && likers.size < eligibleCommenters.length && likeAttempts < 50) {
      const liker = pick(eligibleCommenters);
      if (liker.id !== list.user_id) likers.add(liker.id);
      likeAttempts++;
    }

    for (const likerId of likers) {
      const { error } = await supabase.from('list_likes').insert({
        list_id: list.id,
        user_id: likerId,
      });
      if (!error) totalLikes++;
    }

    // Update likes_count on the list
    await supabase.from('lists').update({ likes_count: likers.size }).eq('id', list.id);

    console.log(`   ${list.title}: ${commenters.length} comments, ${likers.size} likes`);
  }

  console.log(`\n✅ Added ${totalComments} comments and ${totalLikes} likes across ${lists.length} lists\n`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
