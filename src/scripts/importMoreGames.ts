/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * IGDB Game Import Script - Batch 2 (next 500+ games)
 * 
 * Usage: npm run import-more-games
 * 
 * Fetches additional popular games from IGDB that are NOT already in the database.
 * Requires: SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET in .env.local
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
  console.error('❌ Missing environment variables!')
  console.error('Required in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌')
  console.error('  IGDB_CLIENT_ID:', IGDB_CLIENT_ID ? '✅' : '❌')
  console.error('  IGDB_CLIENT_SECRET:', IGDB_CLIENT_SECRET ? '✅' : '❌')
  process.exit(1)
}

const TARGET_NEW_GAMES = 5000

let accessToken: string | null = null

async function getIGDBToken(): Promise<string> {
  console.log('🔑 Getting IGDB access token...')
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Failed to get IGDB token: ${err}`)
  }
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
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`IGDB API error: ${error}`)
  }
  return response.json()
}

function getImageUrl(imageId: string, size = 'cover_big') {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

async function fetchExistingGameIds(): Promise<Set<number>> {
  console.log('📊 Fetching existing game IDs from Supabase...')
  const ids = new Set<number>()
  let offset = 0
  const batchSize = 1000

  while (true) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id&offset=${offset}&limit=${batchSize}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    const data = await response.json()
    if (!data || data.length === 0) break
    data.forEach((g: { id: number }) => ids.add(g.id))
    offset += batchSize
    if (data.length < batchSize) break
  }

  console.log(`✅ Found ${ids.size} existing games in database\n`)
  return ids
}

async function insertToSupabase(gameData: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(gameData),
  })
  if (response.ok || response.status === 201) {
    return { ok: true }
  }
  const errorText = await response.text()
  return { ok: false, error: errorText }
}

interface IGDBGame {
  id: number
  name: string
  slug: string
  summary?: string
  storyline?: string
  first_release_date?: number
  cover?: { image_id: string }
  screenshots?: { image_id: string }[]
  genres?: { name: string }[]
  platforms?: { name: string }[]
  game_modes?: { name: string }[]
  themes?: { name: string }[]
  involved_companies?: { company: { name: string }; developer: boolean; publisher: boolean }[]
  rating?: number
  rating_count?: number
  aggregated_rating?: number
}

async function importMoreGames() {
  console.log('🎮 JEGGY - Import 3000 MORE Games from IGDB\n')
  console.log('═══════════════════════════════════════\n')

  // Step 1: Get existing game IDs so we skip them
  const existingIds = await fetchExistingGameIds()

  // Step 2: Fetch games in batches from IGDB, skipping existing ones
  // IGDB allows max 500 per request, so we fetch in pages until we have enough new games
  const newGames: IGDBGame[] = []
  let igdbOffset = 0
  const igdbBatchSize = 500
  // Lower the threshold each round so we get progressively less popular but still well-known games
  const ratingThresholds = [50, 25, 10, 5, 3, 2, 1]
  let thresholdIndex = 0

  console.log(`🎯 Target: ${TARGET_NEW_GAMES} new games (skipping ${existingIds.size} existing)\n`)

  while (newGames.length < TARGET_NEW_GAMES && thresholdIndex < ratingThresholds.length) {
    const minRatings = ratingThresholds[thresholdIndex]
    const remaining = TARGET_NEW_GAMES - newGames.length

    console.log(`📡 Fetching batch from IGDB (offset ${igdbOffset}, min ratings: ${minRatings})...`)

    const igdbQuery = `
      fields 
        id, name, slug, summary, storyline, first_release_date,
        cover.image_id,
        screenshots.image_id,
        genres.name,
        platforms.name,
        game_modes.name,
        themes.name,
        involved_companies.company.name,
        involved_companies.developer,
        involved_companies.publisher,
        rating, rating_count, aggregated_rating;
      where rating_count > ${minRatings} & cover != null;
      sort rating_count desc;
      offset ${igdbOffset};
      limit ${igdbBatchSize};
    `

    const games: IGDBGame[] = await queryIGDB('games', igdbQuery)
    console.log(`   Got ${games.length} games from IGDB`)

    if (games.length === 0) {
      // Move to next threshold
      console.log(`   No more games at threshold ${minRatings}, lowering...`)
      thresholdIndex++
      igdbOffset = 0
      continue
    }

    // Filter out existing games
    const fresh = games.filter(g => !existingIds.has(g.id))
    console.log(`   ${fresh.length} are new (${games.length - fresh.length} already exist)`)

    // Take only what we need
    const toAdd = fresh.slice(0, remaining)
    newGames.push(...toAdd)

    // Mark these as "existing" so we don't double-add
    toAdd.forEach(g => existingIds.add(g.id))

    console.log(`   Running total: ${newGames.length}/${TARGET_NEW_GAMES}\n`)

    igdbOffset += igdbBatchSize

    // Small delay between IGDB requests (4 requests/sec limit)
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  if (newGames.length === 0) {
    console.log('⚠️  No new games found to import.')
    return
  }

  console.log(`📥 Importing ${newGames.length} new games into Supabase...\n`)

  let imported = 0
  let errors = 0

  for (let i = 0; i < newGames.length; i++) {
    const game = newGames[i]

    try {
      const releaseYear = game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null

      const developers = game.involved_companies
        ?.filter(ic => ic.developer)
        .map(ic => ic.company.name) || []

      const publishers = game.involved_companies
        ?.filter(ic => ic.publisher)
        .map(ic => ic.company.name) || []

      const gameData = {
        id: game.id,
        name: game.name,
        slug: game.slug,
        summary: game.summary || null,
        storyline: game.storyline || null,
        first_release_date: game.first_release_date || null,
        release_year: releaseYear,
        cover_url: game.cover ? getImageUrl(game.cover.image_id) : null,
        screenshots: game.screenshots?.map(s => getImageUrl(s.image_id, 'screenshot_big')) || [],
        genres: game.genres?.map(g => g.name) || [],
        platforms: game.platforms?.map(p => p.name) || [],
        game_modes: game.game_modes?.map(gm => gm.name) || [],
        themes: game.themes?.map(t => t.name) || [],
        developers,
        publishers,
        igdb_rating: game.rating ? parseFloat(game.rating.toFixed(2)) : null,
        igdb_rating_count: game.rating_count || null,
        metacritic_score: game.aggregated_rating ? Math.round(game.aggregated_rating) : null,
      }

      const result = await insertToSupabase(gameData)

      if (result.ok) {
        imported++
        if (imported % 50 === 0 || imported === 1) {
          console.log(`   ✅ ${imported}/${newGames.length} — Latest: "${game.name}"`)
        }
      } else {
        errors++
        if (errors <= 10) {
          console.error(`   ❌ Error importing "${game.name}": ${result.error?.substring(0, 120)}`)
        }
      }

      // Rate limit: small delay between Supabase inserts
      await new Promise(resolve => setTimeout(resolve, 150))
    } catch (err: unknown) {
      errors++
      if (errors <= 10) {
        console.error(`   ❌ Error processing "${game.name}": ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log('\n═══════════════════════════════════════')
  console.log('✅ IMPORT COMPLETE!\n')
  console.log(`   Existing games before:  ${existingIds.size - newGames.length}`)
  console.log(`   New games fetched:      ${newGames.length}`)
  console.log(`   Successfully imported:  ${imported}`)
  console.log(`   Errors:                 ${errors}`)
  console.log(`   Total games now:        ~${existingIds.size - newGames.length + imported}`)
  console.log('\n═══════════════════════════════════════\n')
}

importMoreGames()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message || err)
    process.exit(1)
  })
