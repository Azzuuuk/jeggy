/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * IGDB Game Import Script for Jeggy
 * 
 * Usage: npm run import-games
 * 
 * Fetches 500 popular games from IGDB and inserts them into the Supabase games table.
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

async function importGames() {
  console.log('🎮 JEGGY - Game Import from IGDB\n')
  console.log('═══════════════════════════════════════\n')

  // IGDB limits to 500 per request
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
    where rating_count > 100 & cover != null;
    sort rating_count desc;
    limit 500;
  `

  console.log('📡 Fetching 500 popular games from IGDB...')
  const games: IGDBGame[] = await queryIGDB('games', igdbQuery)
  console.log(`✅ Fetched ${games.length} games from IGDB\n`)

  if (games.length === 0) {
    console.log('⚠️  No games returned. Check your IGDB credentials and query.')
    return
  }

  console.log('📥 Importing into Supabase...\n')

  let imported = 0
  let errors = 0

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

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
        if (imported % 25 === 0) {
          console.log(`   Progress: ${imported}/${games.length} games imported...`)
        }
      } else {
        errors++
        if (errors <= 5) {
          console.error(`   ❌ Error importing "${game.name}": ${result.error?.substring(0, 120)}`)
        }
      }

      // Rate limit: 200ms between Supabase inserts
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err: unknown) {
      errors++
      if (errors <= 5) {
        console.error(`   ❌ Error processing "${game.name}": ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log('\n═══════════════════════════════════════')
  console.log('✅ IMPORT COMPLETE!\n')
  console.log(`   Total games processed: ${games.length}`)
  console.log(`   Successfully imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  console.log('\n═══════════════════════════════════════\n')

  if (imported > 0) {
    console.log('🎉 Your Jeggy database now has real games!')
    console.log('   Visit /games to see them in action.\n')
  }
}

importGames()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message || err)
    process.exit(1)
  })