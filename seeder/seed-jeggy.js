/* eslint-disable no-console */

/**
 * JEGGY PLATFORM SEEDER
 * 
 * Creates 50 realistic fake users with varied activity levels,
 * human-sounding reviews, themed lists, and social connections.
 * 
 * Usage: node seeder/seed-jeggy.js
 * Cleanup: node seeder/seed-jeggy.js --cleanup
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ═══════════════════════════════════════════════════════════════
// DATA: Usernames, bios, reviews, lists
// ═══════════════════════════════════════════════════════════════

const USERS = [
  // POWER USERS (10) — 40-60 ratings, 8-12 reviews, 3-5 lists
  { username: 'lunar_echo',      display: 'Luna',           bio: 'souls-like masochist 💀 | 100%ing everything since 2012', tier: 'power' },
  { username: 'bowsdodo',        display: null,             bio: 'playing games i\'ll never finish', tier: 'power' },
  { username: 'certified_clown', display: 'CC',             bio: 'hot takes only 🔥 | if you agree with me you\'re wrong too', tier: 'power' },
  { username: 'pixel_witch',     display: 'Aria',           bio: 'cozy games only 🌸 | no fps allowed | cat mom', tier: 'power' },
  { username: 'alex2k',          display: 'Alex Turner',    bio: 'RPG addict | coffee enthusiast ☕ | eternal backlog', tier: 'power' },
  { username: 'neon_dreams',     display: null,             bio: 'speedrunner in training | pb or bust', tier: 'power' },
  { username: 'ratio_king',      display: 'King',           bio: 'story > gameplay, fight me', tier: 'power' },
  { username: 'cosmic.owl',      display: 'Owl',            bio: 'jrpg collector | send help | nier is peak', tier: 'power' },
  { username: 'indie.rat',       display: null,             bio: 'indie game shill | wishlist is my personality', tier: 'power' },
  { username: 'chaos_bean',      display: 'Bean',           bio: 'horror games at 3am | regret at 3:01am', tier: 'power' },

  // ACTIVE USERS (20) — 20-35 ratings, 3-6 reviews, 1-3 lists
  { username: 'hannah909',       display: 'Hannah',         bio: 'here for vibes ✨', tier: 'active' },
  { username: 'danny_07',        display: 'Danny',          bio: 'platinum trophy hunter | 47 and counting', tier: 'active' },
  { username: 'midnight_gamer',  display: null,             bio: null, tier: 'active' },
  { username: 'touch_grass',     display: null,             bio: 'touch grass? no ❤️', tier: 'active' },
  { username: 'jess.plays',      display: 'Jessica',        bio: 'narrative games >>> shooters', tier: 'active' },
  { username: 'tom.exe',         display: 'Tom',            bio: 'fighting game scrub | learning tekken', tier: 'active' },
  { username: 'mia.png',         display: 'Mia Chen',       bio: 'metroidvania enjoyer | hollow knight changed me', tier: 'active' },
  { username: 'soft.goblin',     display: null,             bio: 'plays on easy mode, no shame 💅', tier: 'active' },
  { username: 'mesh.network',    display: 'Mesh',           bio: null, tier: 'active' },
  { username: 'sunny.void',      display: 'Sunny',          bio: 'roguelike addict | one more run i swear', tier: 'active' },
  { username: 'glitch.garden',   display: null,             bio: 'backlog: 200+ games | help', tier: 'active' },
  { username: 'vapor.wav',       display: 'V',              bio: null, tier: 'active' },
  { username: 'retro.pulse',     display: 'Retro',          bio: 'pokemon master since 98 | gen 2 peak', tier: 'active' },
  { username: 'void.walker',     display: null,             bio: 'elder scrolls lore expert | ask me anything', tier: 'active' },
  { username: 'star.catcher',    display: 'Star',           bio: 'co-op games are the way 🎮', tier: 'active' },
  { username: 'lost.signal',     display: null,             bio: null, tier: 'active' },
  { username: 'moon.rabbit',     display: 'Mika',           bio: 'anime games but make it tasteful', tier: 'active' },
  { username: 'digital.nomad',   display: 'Nomad',          bio: 'playing from a different country every month ✈️', tier: 'active' },
  { username: 'coffee.addict',   display: null,             bio: 'gaming fuel: 4 espressos minimum', tier: 'active' },
  { username: 'nova.core',       display: 'Nova',           bio: 'sci-fi games or i don\'t care', tier: 'active' },

  // CASUAL USERS (15) — 8-15 ratings, 1-2 reviews, maybe 1 list
  { username: 'atlas.moth',      display: null,             bio: null, tier: 'casual' },
  { username: 'echo.chamber',    display: 'Echo',           bio: 'i play what twitter tells me to', tier: 'casual' },
  { username: 'data.dream',      display: null,             bio: null, tier: 'casual' },
  { username: 'neon.knight',     display: 'NK',             bio: 'cyberpunk stan', tier: 'casual' },
  { username: 'synth.wave',      display: null,             bio: 'soundtrack > game sometimes', tier: 'casual' },
  { username: 'ghost.protocol',  display: 'Ghost',          bio: null, tier: 'casual' },
  { username: 'cyber.monk',      display: null,             bio: 'zen gaming | no rage', tier: 'casual' },
  { username: 'art.less',        display: 'Art',            bio: null, tier: 'casual' },
  { username: 'moth.light',      display: null,             bio: 'drawn to pretty games like a moth', tier: 'casual' },
  { username: 'glitch.witch',    display: 'Glitch',         bio: 'breaking games since 2005', tier: 'casual' },
  { username: 'static.bloom',    display: null,             bio: null, tier: 'casual' },
  { username: 'void.fish',       display: 'Fish',           bio: 'underwater games hit different', tier: 'casual' },
  { username: 'dream.log',       display: null,             bio: null, tier: 'casual' },
  { username: 'bit.rot',         display: 'Bit',            bio: 'retro games only', tier: 'casual' },
  { username: 'markyyyy',        display: 'Mark',           bio: null, tier: 'casual' },

  // LURKERS (5) — 3-8 ratings, 0-1 reviews, no lists
  { username: 'aspidalflame',    display: null,             bio: null, tier: 'lurker' },
  { username: 'urban.myth',      display: null,             bio: null, tier: 'lurker' },
  { username: 'silk.road',       display: null,             bio: '...', tier: 'lurker' },
  { username: 'pixel.heart',     display: 'Pixel',          bio: null, tier: 'lurker' },
  { username: 'game.hopper',     display: null,             bio: 'i start games', tier: 'lurker' },
];

// Genre-based user preferences (determines which games they're drawn to)
const USER_PREFERENCES = {
  power: [
    { bias: ['RPG', 'Adventure'], weight: 0.4 },
    { bias: ['Shooter', 'Adventure'], weight: 0.3 },
    { bias: ['Indie', 'Puzzle', 'Platform'], weight: 0.5 },
    { bias: ['Simulator', 'Adventure'], weight: 0.3 },
    { bias: ['RPG', 'Strategy'], weight: 0.4 },
    { bias: ['Platform', 'Racing'], weight: 0.3 },
    { bias: ['RPG', 'Visual Novel'], weight: 0.5 },
    { bias: ['RPG', 'Turn-based strategy (TBS)'], weight: 0.5 },
    { bias: ['Indie', 'Adventure'], weight: 0.5 },
    { bias: ['Adventure', 'Puzzle'], weight: 0.4 },
  ],
  active: Array(20).fill(null).map(() => ({
    bias: shuffle(['RPG', 'Adventure', 'Shooter', 'Platform', 'Strategy', 'Puzzle', 'Indie', 'Simulator', 'Sport', 'Fighting']).slice(0, 2),
    weight: 0.3 + Math.random() * 0.2,
  })),
  casual: Array(15).fill(null).map(() => ({
    bias: shuffle(['RPG', 'Adventure', 'Shooter', 'Platform', 'Strategy', 'Puzzle']).slice(0, 1),
    weight: 0.2 + Math.random() * 0.2,
  })),
  lurker: Array(5).fill(null).map(() => ({
    bias: ['Adventure'],
    weight: 0.15,
  })),
};

// Rating personality: how each user rates
function getRatingStyle() {
  const styles = [
    { name: 'generous', center: 8.2, spread: 1.2 },
    { name: 'harsh',    center: 6.0, spread: 1.5 },
    { name: 'balanced', center: 7.2, spread: 1.8 },
    { name: 'extreme',  center: 7.5, spread: 3.0 },
    { name: 'high',     center: 8.8, spread: 0.8 },
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

function generateRating(style) {
  const raw = style.center + (Math.random() - 0.5) * 2 * style.spread;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

// ═══════════════════════════════════════════════════════════════
// REVIEWS — Human-sounding, varied, game-specific where possible
// ═══════════════════════════════════════════════════════════════

// Map game IDs to specific reviews (for major titles)
const GAME_SPECIFIC_REVIEWS = {
  // Elden Ring (119133)
  119133: [
    { r: [9,10], text: "died to margit 47 times and i regret nothing. this game is pain but the good kind" },
    { r: [9,10], text: "200 hours in and i just found a whole area i missed. fromsoft you beautiful maniacs" },
    { r: [8,9],  text: "the open world actually works here. no question marks, no busywork, just vibes and death" },
    { r: [7,8],  text: "incredible game but the late game bosses are genuinely unfair. still love it somehow" },
    { r: [6,7],  text: "i know im supposed to love this but honestly the difficulty just exhausted me after a while. beautiful game though" },
  ],
  // The Witcher 3 (1942)
  1942: [
    { r: [9,10], text: "played this in 2015, replayed it in 2024, still the best RPG ever made. geralt my beloved" },
    { r: [9,10], text: "the bloody baron questline alone is better than most entire games" },
    { r: [8,9],  text: "combat is mid but literally everything else is a masterpiece" },
    { r: [7,8],  text: "great game but 150 hours is a LOT. finished it but barely" },
  ],
  // Red Dead Redemption 2 (25076)
  25076: [
    { r: [9,10], text: "i cried at the end. i cried at the horse. i cried at the sunrise. rockstar broke me" },
    { r: [9,10], text: "arthur morgan is the best character in any game ever made and i will die on this hill" },
    { r: [8,9],  text: "slow? yes. boring? never. this game taught me patience" },
    { r: [7,8],  text: "gameplay can be clunky but the story and world carry everything" },
    { r: [5,6],  text: "gorgeous game but i fell asleep twice during missions. not for me" },
  ],
  // GTA V (1020)
  1020: [
    { r: [9,10], text: "rockstar peaked. the heists, the satire, the world. 10 years later and nothing comes close" },
    { r: [8,9],  text: "trevor is still one of the most unhinged characters in gaming. perfection" },
    { r: [7,8],  text: "great single player but they abandoned it for gta online money. pain" },
  ],
  // God of War (19560)
  19560: [
    { r: [9,10], text: "BOY. that's it. that's the review" },
    { r: [9,10], text: "the one-shot camera is insane. the dad story hit me way harder than expected" },
    { r: [8,9],  text: "went from hack and slash to a mature narrative masterpiece. what a glow up" },
  ],
  // Portal 2 (72)
  72: [
    { r: [10,10], text: "$20 for a perfect game. valve doesn't miss (except at counting to 3)" },
    { r: [9,10], text: "the co-op ruined a friendship but it was worth it" },
    { r: [9,10], text: "glados is the best villain in gaming. funny, terrifying, iconic" },
  ],
  // Skyrim (472)
  472: [
    { r: [9,10], text: "bought this 4 times on 4 platforms. no regrets. see you in the next remaster" },
    { r: [8,9],  text: "the mods carry this game from great to legendary tbh" },
    { r: [7,8],  text: "combat is rough but the exploration and freedom make up for everything" },
    { r: [6,7],  text: "buggy mess that i've poured 500 hours into. what does that say about me" },
  ],
  // Hollow Knight (26226 or whatever ID)
  // Hades (111469)
  111469: [
    { r: [9,10], text: "'one more run' i said. that was 6 hours ago. supergiant you beautiful maniacs" },
    { r: [9,10], text: "a roguelike that makes you WANT to die to see more story. genius" },
    { r: [8,9],  text: "the voice acting alone is worth the price" },
  ],
  // Stardew Valley (17000)
  17000: [
    { r: [9,10], text: "started playing at 8pm, looked up and it was 4am. my crops are thriving but my sleep schedule is dead" },
    { r: [9,10], text: "one person made this. ONE PERSON. and it's better than games by 500 person studios" },
    { r: [8,9],  text: "the most relaxing game ever created. my therapist should prescribe this" },
  ],
  // Celeste (26413)
  26413: [
    { r: [9,10], text: "a game about climbing a mountain that made me cry about mental health. gaming is art" },
    { r: [9,10], text: "$20 for the tightest platforming ever made. b-sides broke me though" },
    { r: [8,9],  text: "assist mode exists and there is zero shame in using it. the story matters more" },
  ],
  // Dark Souls (2368)
  2368: [
    { r: [9,10], text: "git gud: the game. took me 80 hours. felt like a god. immediately started NG+" },
    { r: [9,10], text: "the world design is still unmatched. everything connects. pure genius" },
    { r: [7,8],  text: "i respect it more than i enjoy it tbh. landmark game though" },
  ],
  // The Last of Us (1009)
  1009: [
    { r: [9,10], text: "the giraffe scene. that's all i need to say" },
    { r: [9,10], text: "naughty dog said 'what if a zombie game made you question everything' and then delivered" },
    { r: [8,9],  text: "gameplay is fine but the story and characters are all-time" },
  ],
  // Breath of the Wild (7346)
  7346: [
    { r: [10,10], text: "i see a mountain, i go to that mountain. no marker needed. this is freedom" },
    { r: [9,10], text: "nintendo reinvented open worlds by going back to basics. genius honestly" },
    { r: [8,9],  text: "weapon durability is the only thing keeping this from a perfect 10" },
  ],
  // Minecraft (121)
  121: [
    { r: [9,10], text: "been playing since alpha. this game raised me more than my parents did" },
    { r: [8,9],  text: "the greatest creative tool disguised as a game" },
  ],
};

// Generic reviews for games without specific ones
const GENERIC_REVIEWS_BY_RATING = {
  high: [ // 8-10
    "absolutely loved every second of this. rare that a game keeps me this engaged start to finish",
    "went in blind and it blew me away. do yourself a favor and play this",
    "this is what happens when developers actually care. you can feel the passion in every detail",
    "finished it and immediately wanted to start over. that's the highest compliment i can give",
    "been gaming for 20 years and this is up there with the best. no exaggeration",
    "took a day off work to finish this. zero regrets",
    "the kind of game that makes you remember why you play games",
    "stayed up till 4am on a work night. worth it",
    "chef's kiss. no notes. perfect experience",
    "made me feel things i wasn't prepared to feel",
    "this game gets it. it just gets it",
    "everyone needs to play this at least once",
    "gameplay loop is so addicting i forgot to eat",
    "genuinely one of the best games i've played in years",
    "the devs understood the assignment completely",
  ],
  mid: [ // 6-7
    "solid game but nothing that blew my mind. enjoyed my time with it",
    "good not great. scratched an itch but probably won't replay",
    "fun while it lasted but kind of forgot about it after finishing",
    "has some great ideas but the execution is inconsistent",
    "i can see why people love this but it didn't fully click for me",
    "worth playing on sale. not at full price though",
    "the first half is incredible, second half falls off hard",
    "decent game dragged down by some frustrating design choices",
    "i wanted to love this more than i did",
    "enjoyable but forgettable. sorry",
  ],
  low: [ // 1-5
    "tried really hard to like this but it just didn't work for me at all",
    "the reviews lied to me. this is mid at best",
    "i know everyone loves this but i genuinely don't see it",
    "uninstalled after 3 hours. life is too short",
    "not bad per se but extremely overhyped",
    "wanted a refund but stuck it out. regret that decision",
    "the definition of style over substance",
    "had potential but wasted it on every possible level",
  ],
};

// List templates
const LIST_TEMPLATES = [
  { title: 'games that made me cry', desc: 'in no particular order bc i can\'t decide', minGames: 5, maxGames: 10 },
  { title: 'cozy vibes only', desc: 'for when the world is too much', minGames: 4, maxGames: 8 },
  { title: 'play these high i dare you', desc: 'trust the process', minGames: 4, maxGames: 7 },
  { title: 'underrated gems you slept on', desc: 'stop sleeping', minGames: 5, maxGames: 12 },
  { title: 'best soundtracks period', desc: 'headphones required', minGames: 5, maxGames: 10 },
  { title: 'games i\'ll never finish but keep installed', desc: 'don\'t judge me', minGames: 4, maxGames: 8 },
  { title: 'comfort games for bad days', desc: 'medicine', minGames: 4, maxGames: 7 },
  { title: 'games that need a sequel RIGHT NOW', desc: 'developers please i\'m begging', minGames: 5, maxGames: 10 },
  { title: '10/10 no notes', desc: 'perfection exists', minGames: 3, maxGames: 6 },
  { title: 'most overrated games ever', desc: 'yes these are all correct opinions. fight me', minGames: 4, maxGames: 8 },
  { title: 'hidden gems under 10 hours', desc: 'for the busy gamers', minGames: 4, maxGames: 8 },
  { title: 'games that ruined my sleep schedule', desc: 'one more turn. one more run. one more quest', minGames: 4, maxGames: 8 },
  { title: 'games to play with your partner', desc: 'tested and approved', minGames: 3, maxGames: 7 },
  { title: 'i shouldn\'t have waited this long to play these', desc: 'past me was an idiot', minGames: 4, maxGames: 8 },
  { title: 'best boss fights in gaming', desc: 'controllers were harmed in the making of this list', minGames: 5, maxGames: 10 },
  { title: 'games that made me a better person somehow', desc: 'sounds cringe but it\'s true', minGames: 3, maxGames: 6 },
  { title: 'perfect games to binge in a weekend', desc: 'friday night sorted', minGames: 4, maxGames: 8 },
  { title: 'games where the story actually matters', desc: 'not just cutscene, skip, kill, repeat', minGames: 5, maxGames: 10 },
  { title: 'anxiety-inducing games ranked by stress level', desc: 'my therapist would not approve', minGames: 4, maxGames: 8 },
  { title: 'peak gaming. that\'s it. that\'s the list', desc: null, minGames: 3, maxGames: 5 },
];

// Statuses (DB uses lowercase snake_case)
const STATUSES = ['played', 'playing', 'completed', '100_percent', 'want_to_play', 'dropped'];
const STATUS_WEIGHTS = [0.2, 0.1, 0.3, 0.05, 0.15, 0.05]; // most are completed/played

// Platforms for gaming sessions
const SESSION_PLATFORMS = ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch', 'PlayStation 4'];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function randomPastDate(minDaysAgo, maxDaysAgo) {
  const daysAgo = minDaysAgo + Math.floor(Math.random() * (maxDaysAgo - minDaysAgo));
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// ═══════════════════════════════════════════════════════════════
// TIER CONFIGS
// ═══════════════════════════════════════════════════════════════

const TIER_CONFIG = {
  power:  { minRatings: 40, maxRatings: 60, minReviews: 8,  maxReviews: 12, minLists: 3, maxLists: 5, minFollows: 20, maxFollows: 35 },
  active: { minRatings: 20, maxRatings: 35, minReviews: 3,  maxReviews: 6,  minLists: 1, maxLists: 3, minFollows: 10, maxFollows: 20 },
  casual: { minRatings: 8,  maxRatings: 15, minReviews: 1,  maxReviews: 2,  minLists: 0, maxLists: 1, minFollows: 5,  maxFollows: 10 },
  lurker: { minRatings: 3,  maxRatings: 8,  minReviews: 0,  maxReviews: 1,  minLists: 0, maxLists: 0, minFollows: 2,  maxFollows: 5 },
};

function randBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ═══════════════════════════════════════════════════════════════
// SEED EMAIL DOMAIN (to avoid any real email conflicts)
// ═══════════════════════════════════════════════════════════════
const SEED_EMAIL_DOMAIN = 'seeduser.jeggy.local';

// ═══════════════════════════════════════════════════════════════
// MAIN SEEDER
// ═══════════════════════════════════════════════════════════════

async function seedJeggy() {
  console.log('\n🎮 JEGGY PLATFORM SEEDER');
  console.log('════════════════════════════════════════\n');

  // ── Step 0: Fetch top games ──────────────────────────────
  console.log('📊 Fetching popular games...');
  const { data: allGames, error: gErr } = await supabase
    .from('games')
    .select('id, name, slug, cover_url, genres, average_rating, igdb_rating_count, platforms')
    .not('cover_url', 'is', null)
    .gt('igdb_rating_count', 0)
    .order('igdb_rating_count', { ascending: false, nullsFirst: false })
    .limit(200);
  
  if (gErr || !allGames || allGames.length === 0) {
    console.error('❌ Failed to fetch games:', gErr);
    process.exit(1);
  }

  // Split into tiers for selection: top 50 are AAA blockbusters, next 50 are popular, rest are varied
  const topTier = allGames.slice(0, 50);
  const midTier = allGames.slice(50, 120);
  const deepCuts = allGames.slice(120, 200);
  console.log(`   ✅ Loaded ${allGames.length} games (${topTier.length} top / ${midTier.length} mid / ${deepCuts.length} deep)\n`);

  // ── Step 1: Create auth users + profiles ──────────────────
  console.log('👥 Creating users...');
  const createdUsers = [];
  let prefIdx = { power: 0, active: 0, casual: 0, lurker: 0 };

  for (const u of USERS) {
    try {
      const email = `${u.username.replace(/\./g, '_')}@${SEED_EMAIL_DOMAIN}`;

      // Create auth user (email_confirm: true so they're "confirmed")
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: 'SeedUser2024!_' + u.username,
        email_confirm: true,
        user_metadata: { is_seed: true },
      });

      if (authErr) {
        // If user already exists, skip
        if (authErr.message?.includes('already been registered')) {
          console.log(`   ⏭️  ${u.username} already exists, skipping`);
          continue;
        }
        throw authErr;
      }

      const userId = authData.user.id;
      const joinDate = randomPastDate(14, 180); // 2 weeks to 6 months ago

      // Create profile
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: userId,
        username: u.username,
        display_name: u.display || u.username,
        bio: u.bio,
        avatar_url: Math.random() > 0.3 
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
          : null,
        created_at: joinDate,
        updated_at: joinDate,
      });

      if (profErr) throw profErr;

      createdUsers.push({
        ...u,
        id: userId,
        email,
        joinDate,
        ratingStyle: getRatingStyle(),
        pref: USER_PREFERENCES[u.tier][prefIdx[u.tier]] || { bias: ['Adventure'], weight: 0.2 },
      });
      prefIdx[u.tier]++;

      process.stdout.write(`   ✅ ${createdUsers.length}/${USERS.length} ${u.username}\r`);
    } catch (err) {
      console.error(`   ❌ ${u.username}: ${err.message}`);
    }
  }
  console.log(`\n   Created ${createdUsers.length} users\n`);

  if (createdUsers.length === 0) {
    console.error('❌ No users created. Aborting.');
    process.exit(1);
  }

  // ── Step 2: Ratings + Statuses ─────────────────────────────
  console.log('⭐ Adding ratings...');
  let totalRatings = 0;
  const userGameSelections = new Map(); // userId -> [{ gameId, rating, status }]

  for (const user of createdUsers) {
    const cfg = TIER_CONFIG[user.tier];
    const numRatings = randBetween(cfg.minRatings, cfg.maxRatings);
    
    // Select games biased by user preference
    const selectedGames = selectGamesForUser(user, numRatings, topTier, midTier, deepCuts);
    const entries = [];

    for (const game of selectedGames) {
      const rating = generateRating(user.ratingStyle);
      const status = pickWeighted(STATUSES, STATUS_WEIGHTS);
      const createdAt = randomPastDate(1, 150);

      entries.push({
        user_id: user.id,
        game_id: game.id.toString(),
        rating,
        status: rating ? (status === 'want_to_play' ? 'completed' : status) : status,
        liked: rating >= 9 && Math.random() > 0.3,
        date_played: status !== 'want_to_play' ? createdAt.split('T')[0] : null,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }

    userGameSelections.set(user.id, entries.map(e => ({
      gameId: parseInt(e.game_id),
      rating: e.rating,
      game: allGames.find(g => g.id === parseInt(e.game_id)),
    })));

    // Batch insert
    const { error } = await supabase.from('user_games').insert(entries);
    if (error) {
      console.error(`   ❌ Ratings for ${user.username}: ${error.message}`);
    } else {
      totalRatings += entries.length;
    }
  }
  console.log(`   ✅ ${totalRatings} ratings created\n`);

  // ── Step 3: Reviews ────────────────────────────────────────
  console.log('📝 Writing reviews...');
  let totalReviews = 0;

  for (const user of createdUsers) {
    const cfg = TIER_CONFIG[user.tier];
    const numReviews = randBetween(cfg.minReviews, cfg.maxReviews);
    if (numReviews === 0) continue;

    const userGames = userGameSelections.get(user.id) || [];
    if (userGames.length === 0) continue;

    // Pick games to review (prefer ones they rated highly or strongly)
    const reviewCandidates = shuffle(userGames).slice(0, numReviews);

    for (const { gameId, rating, game } of reviewCandidates) {
      const reviewText = getReviewText(gameId, rating);
      const createdAt = randomPastDate(1, 120);

      // Update the user_games entry with the review
      const { error } = await supabase
        .from('user_games')
        .update({ review: reviewText, updated_at: createdAt })
        .eq('user_id', user.id)
        .eq('game_id', gameId.toString());

      if (!error) {
        totalReviews++;
        
        // Create activity for the review
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'reviewed_game',
          game_id: gameId.toString(),
          game_name: game?.name || 'Unknown',
          game_cover_url: game?.cover_url || null,
          rating,
          review: reviewText.substring(0, 200),
          created_at: createdAt,
        });
      }
    }
  }
  console.log(`   ✅ ${totalReviews} reviews written\n`);

  // ── Step 4: Lists ──────────────────────────────────────────
  console.log('📋 Creating lists...');
  let totalLists = 0;
  const availableTemplates = shuffle([...LIST_TEMPLATES]);

  for (const user of createdUsers) {
    const cfg = TIER_CONFIG[user.tier];
    const numLists = randBetween(cfg.minLists, cfg.maxLists);
    if (numLists === 0) continue;

    const userGames = userGameSelections.get(user.id) || [];
    if (userGames.length < 3) continue;

    for (let i = 0; i < numLists; i++) {
      const template = availableTemplates.pop() || pick(LIST_TEMPLATES);
      const numGames = randBetween(template.minGames, Math.min(template.maxGames, userGames.length));
      const listGames = shuffle(userGames).slice(0, numGames);
      const createdAt = randomPastDate(1, 90);

      const { error } = await supabase.from('lists').insert({
        user_id: user.id,
        title: template.title,
        description: template.desc,
        game_ids: listGames.map(g => g.gameId.toString()),
        ranking_style: Math.random() > 0.7 ? 'tiered' : 'numbered',
        is_public: true,
        created_at: createdAt,
        updated_at: createdAt,
      });

      if (!error) {
        totalLists++;
        
        // Activity for list creation
        const firstGame = listGames[0]?.game;
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
  console.log(`   ✅ ${totalLists} lists created\n`);

  // ── Step 5: Follows ────────────────────────────────────────
  console.log('🤝 Creating follow connections...');
  let totalFollows = 0;
  let followTriggerBroken = false;

  for (const user of createdUsers) {
    if (followTriggerBroken) break;
    const cfg = TIER_CONFIG[user.tier];
    const numFollows = randBetween(cfg.minFollows, Math.min(cfg.maxFollows, createdUsers.length - 1));
    const candidates = createdUsers.filter(u => u.id !== user.id);
    const toFollow = shuffle(candidates).slice(0, numFollows);

    const follows = toFollow.map(target => ({
      follower_id: user.id,
      following_id: target.id,
      created_at: randomPastDate(1, 120),
    }));

    if (follows.length > 0) {
      const { error } = await supabase.from('follows').insert(follows);
      if (!error) {
        totalFollows += follows.length;
      } else if (error.message?.includes('notifications')) {
        // DB trigger on follows table is broken — it creates notifications with invalid type
        followTriggerBroken = true;
        console.log('   ⚠️  Follows table has a broken notification trigger.');
        console.log('   ⚠️  Run this SQL in Supabase Dashboard → SQL Editor to fix:');
        console.log('   ────────────────────────────────────────');
        console.log('   DROP TRIGGER IF EXISTS on_new_follow ON follows;');
        console.log('   ────────────────────────────────────────');
        console.log('   Then re-run: node seeder/seed-jeggy.js --follows-only');
      } else {
        // Other error — try one-by-one to skip dupes
        for (const f of follows) {
          const { error: e2 } = await supabase.from('follows').insert(f);
          if (!e2) totalFollows++;
        }
      }
    }
  }
  console.log(`   ✅ ${totalFollows} follow connections\n`);

  // ── Step 6: Gaming sessions (selective) ────────────────────
  console.log('🎯 Logging gaming sessions...');
  let totalSessions = 0;

  for (const user of createdUsers) {
    if (user.tier === 'lurker') continue; // Lurkers don't log sessions
    
    const numSessions = user.tier === 'power' ? randBetween(5, 10) :
                        user.tier === 'active' ? randBetween(2, 5) : randBetween(1, 3);
    
    const userGames = userGameSelections.get(user.id) || [];
    const sessionGames = shuffle(userGames).slice(0, numSessions);

    for (const { gameId, game } of sessionGames) {
      const hours = Math.round((0.5 + Math.random() * 4) * 10) / 10;
      const sessionDate = randomPastDate(1, 30);
      const notes = Math.random() > 0.6 ? pick([
        'good session', 'finally beat that boss', 'just vibing',
        'learning the mechanics', 'co-op with friends', 'speedrun attempt',
        'exploring new area', 'side quests day', 'story progress',
        null,
      ]) : null;

      const { error } = await supabase.from('gaming_sessions').insert({
        user_id: user.id,
        game_id: gameId.toString(),
        hours_played: hours,
        session_date: sessionDate.split('T')[0],
        session_note: notes,
        platform: pick(SESSION_PLATFORMS),
        is_public: true,
        created_at: sessionDate,
      });

      if (!error) totalSessions++;
    }
  }
  console.log(`   ✅ ${totalSessions} gaming sessions\n`);

  // ── Step 7: Rating activities ──────────────────────────────
  console.log('📣 Creating feed activities...');
  let totalActivities = 0;
  let activityErrorLogged = false;

  for (const user of createdUsers) {
    const userGames = (userGameSelections.get(user.id) || []).slice(0, 8); // Max 8 rating activities per user
    
    for (const { gameId, rating, game } of userGames) {
      if (Math.random() > 0.6) continue; // Only ~40% of ratings generate activities
      
      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'rated_game',
        game_id: gameId.toString(),
        game_name: game?.name || 'Unknown',
        game_cover_url: game?.cover_url || null,
        rating,
        created_at: randomPastDate(1, 60),
      });

      if (!error) totalActivities++;
      else if (totalActivities === 0 && !activityErrorLogged) {
        console.log(`   ⚠️  Activity error: ${error.message}`);
        activityErrorLogged = true;
      }
    }
  }
  console.log(`   ✅ ${totalActivities} feed activities\n`);

  // ── Step 8: Update game aggregate ratings ──────────────────
  console.log('📈 Updating game aggregate ratings...');
  await updateGameAggregates(allGames);
  console.log('   ✅ Game ratings recalculated\n');

  // ── Step 9: Mount Rushmore (top 4 games) ───────────────────
  console.log('🏔️  Setting up Mount Rushmore...');
  let totalMR = 0;

  for (const user of createdUsers) {
    if (user.tier === 'lurker') continue;
    
    const userGames = userGameSelections.get(user.id) || [];
    const topGamesForUser = userGames
      .filter(g => g.rating >= 8)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    if (topGamesForUser.length >= 2) {
      const { error } = await supabase.from('profiles').update({
        mount_rushmore_games: topGamesForUser.map(g => g.gameId.toString()),
      }).eq('id', user.id);
      
      if (!error) totalMR++;
    }
  }
  console.log(`   ✅ ${totalMR} Mount Rushmores set\n`);

  // ── DONE ───────────────────────────────────────────────────
  console.log('════════════════════════════════════════');
  console.log('✅ SEEDING COMPLETE!\n');
  console.log(`   Users:             ${createdUsers.length}`);
  console.log(`   Ratings:           ${totalRatings}`);
  console.log(`   Reviews:           ${totalReviews}`);
  console.log(`   Lists:             ${totalLists}`);
  console.log(`   Follows:           ${totalFollows}`);
  console.log(`   Gaming Sessions:   ${totalSessions}`);
  console.log(`   Feed Activities:   ${totalActivities}`);
  console.log(`   Mount Rushmores:   ${totalMR}`);
  console.log('\n════════════════════════════════════════\n');
  console.log('📧 Seed emails use domain:', SEED_EMAIL_DOMAIN);
  console.log('🧹 To cleanup: node seeder/seed-jeggy.js --cleanup\n');
}

// ═══════════════════════════════════════════════════════════════
// GAME SELECTION — Biased by user preferences
// ═══════════════════════════════════════════════════════════════

function selectGamesForUser(user, count, topTier, midTier, deepCuts) {
  const selected = new Set();
  const games = [];

  // Everyone rates some top-tier games (40-60%)
  const topCount = Math.ceil(count * (0.4 + Math.random() * 0.2));
  const midCount = Math.ceil(count * (0.2 + Math.random() * 0.15));
  const deepCount = Math.max(0, count - topCount - midCount);

  function addGames(pool, n) {
    const shuffled = shuffle(pool);
    let added = 0;
    for (const game of shuffled) {
      if (added >= n) break;
      if (selected.has(game.id)) continue;
      
      // Apply genre bias
      const matchesBias = game.genres?.some(g => user.pref.bias.some(b => g.includes(b)));
      if (matchesBias || Math.random() > user.pref.weight) {
        selected.add(game.id);
        games.push(game);
        added++;
      }
    }
    // Fill remaining if bias filtered too much
    for (const game of shuffled) {
      if (added >= n) break;
      if (selected.has(game.id)) continue;
      selected.add(game.id);
      games.push(game);
      added++;
    }
  }

  addGames(topTier, topCount);
  addGames(midTier, midCount);
  addGames(deepCuts, deepCount);

  return games.slice(0, count);
}

// ═══════════════════════════════════════════════════════════════
// REVIEW TEXT SELECTION
// ═══════════════════════════════════════════════════════════════

const usedReviewIndices = new Map(); // gameId -> Set of used indices

function getReviewText(gameId, rating) {
  // Try game-specific first
  const specific = GAME_SPECIFIC_REVIEWS[gameId];
  if (specific) {
    const matching = specific.filter(r => rating >= r.r[0] && rating <= r.r[1]);
    if (matching.length > 0) {
      // Avoid reusing same review for same game
      if (!usedReviewIndices.has(gameId)) usedReviewIndices.set(gameId, new Set());
      const used = usedReviewIndices.get(gameId);
      const available = matching.filter((_, i) => !used.has(i));
      if (available.length > 0) {
        const chosen = pick(available);
        used.add(matching.indexOf(chosen));
        return chosen.text;
      }
    }
  }

  // Fall back to generic
  const pool = rating >= 8 ? GENERIC_REVIEWS_BY_RATING.high :
               rating >= 6 ? GENERIC_REVIEWS_BY_RATING.mid :
                             GENERIC_REVIEWS_BY_RATING.low;
  return pick(pool);
}

// ═══════════════════════════════════════════════════════════════
// RECALCULATE GAME AGGREGATES — Bayesian average with IGDB prior
// ═══════════════════════════════════════════════════════════════

async function updateGameAggregates(games) {
  const gameIds = games.map(g => g.id);
  
  for (const gameId of gameIds) {
    // Get all ratings for this game
    const { data: ratings } = await supabase
      .from('user_games')
      .select('rating')
      .eq('game_id', gameId.toString())
      .not('rating', 'is', null);
    
    if (!ratings || ratings.length === 0) continue;

    const userAvg = ratings.reduce((s, r) => s + parseFloat(r.rating), 0) / ratings.length;
    const userCount = ratings.length;
    const reviewCount = (await supabase
      .from('user_games')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId.toString())
      .not('review', 'is', null)).count || 0;

    // Bayesian: blend user ratings with IGDB prior
    const game = games.find(g => g.id === gameId);
    const igdbPrior = game?.average_rating || 7;
    const priorWeight = 5; // IGDB prior counts as 5 phantom votes
    const bayesian = ((igdbPrior * priorWeight) + (userAvg * userCount)) / (priorWeight + userCount);

    await supabase
      .from('games')
      .update({
        average_rating: Math.round(bayesian * 10) / 10,
        total_ratings: userCount,
        total_reviews: reviewCount,
      })
      .eq('id', gameId);
  }
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP — Remove all seed data
// ═══════════════════════════════════════════════════════════════

async function cleanup() {
  console.log('\n🧹 CLEANING UP SEED DATA...\n');

  // Find all seed users by email domain
  let page = 1;
  let seedUserIds = [];
  
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (!data || !data.users || data.users.length === 0) break;
    
    const seedUsers = data.users.filter(u => u.email?.endsWith(`@${SEED_EMAIL_DOMAIN}`));
    seedUserIds.push(...seedUsers.map(u => u.id));
    
    if (data.users.length < 50) break;
    page++;
  }

  if (seedUserIds.length === 0) {
    console.log('   No seed users found. Nothing to clean up.\n');
    return;
  }

  console.log(`   Found ${seedUserIds.length} seed users to remove\n`);

  // Delete in order: activities, sessions, follows, lists, user_games, profiles, auth users
  for (const table of ['activities', 'gaming_sessions', 'follows', 'list_comments', 'lists', 'user_games']) {
    const col = table === 'follows' ? 'follower_id' : 'user_id';
    const { error } = await supabase.from(table).delete().in(col, seedUserIds);
    if (table === 'follows') {
      // Also delete where they are followed
      await supabase.from('follows').delete().in('following_id', seedUserIds);
    }
    console.log(`   ${table}: ${error ? '❌ ' + error.message : '✅ cleared'}`);
  }

  // Delete profiles
  const { error: profErr } = await supabase.from('profiles').delete().in('id', seedUserIds);
  console.log(`   profiles: ${profErr ? '❌ ' + profErr.message : '✅ cleared'}`);

  // Delete auth users
  let deleted = 0;
  for (const uid of seedUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (!error) deleted++;
  }
  console.log(`   auth users: ✅ ${deleted} deleted`);

  // Recalculate game aggregates for affected games
  console.log('\n   📈 Recalculating game aggregates...');
  const { data: allGames } = await supabase
    .from('games')
    .select('id, name, average_rating, igdb_rating, igdb_rating_count')
    .gt('total_ratings', 0)
    .limit(200);
  
  if (allGames) {
    for (const game of allGames) {
      const { data: ratings } = await supabase
        .from('user_games')
        .select('rating')
        .eq('game_id', game.id.toString())
        .not('rating', 'is', null);
      
      if (!ratings || ratings.length === 0) {
        // Reset to IGDB seeded rating
        const seeded = game.igdb_rating ? Math.round(game.igdb_rating / 10 * 10) / 10 : 0;
        await supabase.from('games').update({
          average_rating: seeded,
          total_ratings: 0,
          total_reviews: 0,
        }).eq('id', game.id);
      } else {
        const avg = ratings.reduce((s, r) => s + parseFloat(r.rating), 0) / ratings.length;
        const igdbPrior = game.igdb_rating ? game.igdb_rating / 10 : 7;
        const priorWeight = 5;
        const bayesian = ((igdbPrior * priorWeight) + (avg * ratings.length)) / (priorWeight + ratings.length);
        
        const reviewCount = (await supabase
          .from('user_games')
          .select('id', { count: 'exact', head: true })
          .eq('game_id', game.id.toString())
          .not('review', 'is', null)).count || 0;

        await supabase.from('games').update({
          average_rating: Math.round(bayesian * 10) / 10,
          total_ratings: ratings.length,
          total_reviews: reviewCount,
        }).eq('id', game.id);
      }
    }
  }
  console.log('   ✅ Aggregates recalculated');

  console.log('\n✅ CLEANUP COMPLETE!\n');
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════

const isCleanup = process.argv.includes('--cleanup');
const isFollowsOnly = process.argv.includes('--follows-only');

async function followsOnly() {
  console.log('\n🤝 FOLLOWS-ONLY MODE\n');
  
  // Find existing seed users
  let page = 1;
  const seedUsers = [];
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (!data || !data.users || data.users.length === 0) break;
    const seeds = data.users.filter(u => u.email?.endsWith(`@${SEED_EMAIL_DOMAIN}`));
    for (const u of seeds) {
      const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', u.id).single();
      if (profile) seedUsers.push({ id: u.id, username: profile.username, tier: 'active' });
    }
    if (data.users.length < 50) break;
    page++;
  }
  
  if (seedUsers.length === 0) { console.log('No seed users found.'); return; }
  console.log(`Found ${seedUsers.length} seed users. Creating follows...`);

  // Assign tiers based on order
  const tiers = ['power', 'power', 'power', 'power', 'power', 'power', 'power', 'power', 'power', 'power',
    ...Array(20).fill('active'), ...Array(15).fill('casual'), ...Array(5).fill('lurker')];
  seedUsers.forEach((u, i) => { u.tier = tiers[i] || 'casual'; });

  let totalFollows = 0;
  for (const user of seedUsers) {
    const cfg = TIER_CONFIG[user.tier];
    const numFollows = randBetween(cfg.minFollows, Math.min(cfg.maxFollows, seedUsers.length - 1));
    const candidates = seedUsers.filter(u => u.id !== user.id);
    const toFollow = shuffle(candidates).slice(0, numFollows);

    for (const target of toFollow) {
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: target.id,
      });
      if (!error) totalFollows++;
      else if (totalFollows === 0 && target === toFollow[0]) {
        console.log(`   ⚠️  Error: ${error.message}`);
        console.log('   Trigger still broken. Run the SQL fix first.');
        return;
      }
    }
  }
  console.log(`   ✅ ${totalFollows} follow connections created\n`);
}

(isCleanup ? cleanup() : isFollowsOnly ? followsOnly() : seedJeggy())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ FATAL:', err.message || err);
    process.exit(1);
  });
