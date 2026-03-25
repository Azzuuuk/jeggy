/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * Backfill average_rating (from IGDB) and time_to_beat for games missing them.
 * 
 * - Seeds average_rating = igdb_rating / 10 (rounded to 1 decimal) for games with average_rating = 0
 * - Fetches time_to_beat from IGDB for games missing it
 * 
 * Usage: npx tsx src/scripts/backfillNewGames.ts
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

let accessToken: string | null = null

async function getIGDBToken(): Promise<string> {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!response.ok) throw new Error(`Token error: ${await response.text()}`)
  const data = await response.json()
  accessToken = data.access_token
  return accessToken!
}

async function queryIGDB(endpoint: string, query: string) {
  if (!accessToken) await getIGDBToken()
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': IGDB_CLIENT_ID!,
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    body: query,
  })
  if (!response.ok) throw new Error(`IGDB error: ${await response.text()}`)
  return response.json()
}

// ─── PART 1: Seed average_rating from igdb_rating ────────────────────────────

async function seedRatings() {
  console.log('⭐ PART 1: Seeding average_rating from IGDB ratings\n')

  // Get all games where average_rating = 0 and igdb_rating exists
  const allGames: { id: number; igdb_rating: number }[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, igdb_rating')
      .eq('average_rating', 0)
      .not('igdb_rating', 'is', null)
      .gt('igdb_rating', 0)
      .order('id')
      .range(offset, offset + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    allGames.push(...data)
    offset += 1000
  }

  console.log(`   Found ${allGames.length} games needing rating seed\n`)

  let updated = 0
  let errors = 0

  // Batch update in groups
  for (const game of allGames) {
    // Same formula as existing seeded games: igdb_rating (0-100) → average_rating (0-10)
    const seededRating = Math.round(game.igdb_rating / 10 * 10) / 10

    const { error: upErr } = await supabase
      .from('games')
      .update({ average_rating: seededRating })
      .eq('id', game.id)

    if (upErr) {
      errors++
      if (errors <= 5) console.error(`   ❌ Error updating ${game.id}: ${upErr.message}`)
    } else {
      updated++
      if (updated % 100 === 0) console.log(`   ✅ Seeded ${updated}/${allGames.length}`)
    }
  }

  console.log(`\n   ✅ Ratings seeded: ${updated}`)
  console.log(`   ❌ Errors: ${errors}\n`)
}

// ─── PART 2: Backfill time_to_beat from IGDB ─────────────────────────────────

interface IGDBTimeToBeat {
  id: number
  game_id: number
  hastily?: number
  normally?: number
  completely?: number
}

async function backfillTimeToBeat() {
  console.log('⏱️  PART 2: Backfilling time_to_beat from IGDB\n')

  // Get all game IDs that are missing time_to_beat
  const allIds: number[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id')
      .is('time_to_beat_main', null)
      .order('id')
      .range(offset, offset + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    allIds.push(...data.map((g: { id: number }) => g.id))
    offset += 1000
  }

  console.log(`   Found ${allIds.length} games missing time_to_beat\n`)

  const batchSize = 500
  let updated = 0
  let noData = 0

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batchIds = allIds.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(allIds.length / batchSize)

    try {
      const ttbResults: IGDBTimeToBeat[] = await queryIGDB(
        'game_time_to_beats',
        `fields game_id, hastily, normally, completely; where game_id = (${batchIds.join(',')}); limit 500;`
      )

      const ttbMap = new Map<number, IGDBTimeToBeat>()
      for (const t of ttbResults) {
        ttbMap.set(t.game_id, t)
      }

      for (const id of batchIds) {
        const ttb = ttbMap.get(id)
        if (!ttb) { noData++; continue }

        const main = ttb.normally ? Math.round(ttb.normally / 3600 * 10) / 10 : null
        const completionist = ttb.completely ? Math.round(ttb.completely / 3600 * 10) / 10 : null

        if (!main && !completionist) { noData++; continue }

        const { error: upErr } = await supabase
          .from('games')
          .update({
            time_to_beat_main: main,
            time_to_beat_completionist: completionist,
            time_to_beat_source: 'igdb',
          })
          .eq('id', id)

        if (upErr) {
          console.error(`   ❌ Error updating ${id}: ${upErr.message}`)
        } else {
          updated++
        }
      }

      if (batchNum % 3 === 0 || batchNum === totalBatches) {
        console.log(`   📦 Batch ${batchNum}/${totalBatches} — Updated: ${updated} | No data: ${noData}`)
      }
    } catch (err) {
      console.error(`   ❌ Batch ${batchNum} error:`, err instanceof Error ? err.message : err)
    }

    await new Promise(r => setTimeout(r, 260))
  }

  console.log(`\n   ✅ Time-to-beat updated: ${updated}`)
  console.log(`   ⬜ No IGDB data: ${noData}\n`)
}

// ─── RUN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 JEGGY — Backfill Ratings & Time-to-Beat\n')
  console.log('═══════════════════════════════════════\n')

  await getIGDBToken()
  console.log('✅ IGDB token obtained\n')

  await seedRatings()
  await backfillTimeToBeat()

  console.log('═══════════════════════════════════════')
  console.log('✅ ALL DONE!\n')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ FATAL:', err.message || err)
    process.exit(1)
  })
