/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * Backfill time_to_beat data from IGDB for all existing games.
 *
 * Usage: npx tsx src/scripts/backfillTimeToBeat.ts
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
  console.log('🔑 Getting IGDB access token...')
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!response.ok) throw new Error(`Failed to get IGDB token: ${await response.text()}`)
  const data = await response.json()
  accessToken = data.access_token
  console.log('✅ Token obtained\n')
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
  if (!response.ok) throw new Error(`IGDB API error: ${await response.text()}`)
  return response.json()
}

interface IGDBTimeToBeat {
  id: number
  game_id: number
  hastily?: number
  normally?: number
  completely?: number
}

async function backfill() {
  console.log('🎮 Starting time to beat backfill...\n')

  // Get all game IDs from database
  const allIds: number[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id')
      .order('id')
      .range(offset, offset + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    allIds.push(...data.map((g: { id: number }) => g.id))
    offset += 1000
  }

  console.log(`📊 Found ${allIds.length} games to process\n`)

  const batchSize = 500
  let updated = 0
  let noData = 0

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batchIds = allIds.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(allIds.length / batchSize)

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batchIds.length} games)...`)

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

      console.log(`   ✓ Updated: ${updated} | No data: ${noData}`)
    } catch (err) {
      console.error(`   ❌ Batch error:`, err)
    }

    // IGDB rate limit: 4 requests/sec
    await new Promise(r => setTimeout(r, 260))
  }

  console.log('\n✅ Backfill complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   No data: ${noData}`)
}

backfill().catch(console.error)
