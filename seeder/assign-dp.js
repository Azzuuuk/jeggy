/**
 * Assigns profile pictures (dp1-dp10) to the 10 most active (power tier) seed users.
 * 
 * Run: node seeder/assign-dp.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Power-tier seed users (most active) — map to dp images
const POWER_USERS = [
  'lunar_echo',
  'bowsdodo',
  'certified_clown',
  'pixel_witch',
  'alex2k',
  'neon_dreams',
  'ratio_king',
  'cosmic.owl',
  'indie.rat',
  'chaos_bean',
];

// Image filenames in public/
const DP_IMAGES = [
  '/dp1.jpg',
  '/dp2.jpg',
  '/dp3.jpg',
  '/dp4.png',
  '/dp5.png',
  '/dp6.png',
  '/dp7.png',
  '/dp8.webp',
  '/dp9.jpeg',
  '/dp10.webp',
];

async function assignDPs() {
  console.log('\n🖼️  Assigning profile pictures to power users...\n');

  for (let i = 0; i < POWER_USERS.length; i++) {
    const username = POWER_USERS[i];
    const avatarUrl = DP_IMAGES[i];

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('username', username)
      .select('username, avatar_url')
      .single();

    if (error) {
      console.log(`   ❌ ${username}: ${error.message}`);
    } else if (data) {
      console.log(`   ✅ ${username} → ${avatarUrl}`);
    } else {
      console.log(`   ⚠️  ${username}: not found`);
    }
  }

  console.log('\n✨ Done!\n');
}

assignDPs();
