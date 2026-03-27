/**
 * Updates all seed users' avatars to use DiceBear v9 styles
 * matching the avatar picker in the platform.
 * 
 * Usage: node seeder/update-avatars.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STYLES = ['bottts', 'shapes', 'icons', 'rings'];
const BG_COLORS = ['CCFF00', '6366F1', 'FF9F7C', 'ef4444', '40bcad', 'F472B6', 'ff8000', 'a78bfa'];
const SEEDS = ['ace', 'bolt', 'nova', 'hex', 'flux', 'arc', 'zen', 'orb', 'pip', 'dot', 'ray', 'ink'];

function buildAvatarUrl(style, seed, bgColor) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bgColor}&size=128`;
}

// Deterministic but varied selection based on username hash
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function main() {
  console.log('🎨 Updating seed user avatars to DiceBear v9...');

  // Get all seed users (email ends with @seeduser.jeggy.local)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .like('username', '%');  // get all — we'll filter by avatar_url pattern

  if (error) {
    console.error('Failed to fetch profiles:', error.message);
    process.exit(1);
  }

  // Filter to seed users (have old dicebear v7 avataaars URL or null avatar)
  const seedUsers = users.filter(u => 
    u.avatar_url?.includes('dicebear.com/7.x/avataaars') || 
    (u.avatar_url === null && u.username !== 'azzuuuk') // skip real users
  );

  console.log(`Found ${seedUsers.length} seed users to update`);

  let updated = 0;
  for (const user of seedUsers) {
    const h = hashCode(user.username);
    const style = STYLES[h % STYLES.length];
    const seed = SEEDS[(h >> 4) % SEEDS.length];
    const bg = BG_COLORS[(h >> 8) % BG_COLORS.length];
    const newUrl = buildAvatarUrl(style, seed, bg);

    const { error: upErr } = await supabase
      .from('profiles')
      .update({ avatar_url: newUrl })
      .eq('id', user.id);

    if (upErr) {
      console.error(`  ✗ ${user.username}: ${upErr.message}`);
    } else {
      updated++;
    }
  }

  console.log(`✅ Updated ${updated}/${seedUsers.length} avatars`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
