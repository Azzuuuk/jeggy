/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * Import New & Trending Games from IGDB
 * 
 * Targets: recently released popular games (2025-2026) + specific titles by name
 * Usage: npx tsx src/scripts/importNewGames.ts
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

function getImageUrl(imageId: string, size = 'cover_big') {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

async function upsertToSupabase(gameData: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
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
  if (response.ok || response.status === 201) return { ok: true }
  return { ok: false, error: await response.text() }
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
  hypes?: number
  follows?: number
}

function transformGame(game: IGDBGame) {
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null
  const developers = game.involved_companies?.filter(ic => ic.developer).map(ic => ic.company.name) || []
  const publishers = game.involved_companies?.filter(ic => ic.publisher).map(ic => ic.company.name) || []

  return {
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
}

const IGDB_FIELDS = `
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
    rating, rating_count, aggregated_rating, hypes, follows;
`

async function importNewGames() {
  console.log('🎮 JEGGY — Import New & Trending Games\n')
  console.log('═══════════════════════════════════════\n')

  await getIGDBToken()
  console.log('✅ IGDB token obtained\n')

  const allGames: IGDBGame[] = []

  // 1) Search for specific titles known to be new/popular
  const specificTitles = [
    'Crimson Desert',
    'Clair Obscur: Expedition 33',
    'Doom: The Dark Ages',
    'Monster Hunter Wilds',
    'Assassin\'s Creed Shadows',
    'Death Stranding 2: On the Beach',
    'Ghost of Yotei',
    'Grand Theft Auto VI',
    'Kingdom Come: Deliverance II',
    'Avowed',
    'Civilization VII',
    'Fable',
    'Like a Dragon: Pirate Yakuza in Hawaii',
    'Atomfall',
    'Split Fiction',
    'Subnautica 2',
    'The Outer Worlds 2',
    'Metroid Prime 4: Beyond',
    'Judas',
    'Borderlands 4',
    'The First Berserker: Khazan',
    'Fragpunk',
    'Towerborne',
    'Dune: Awakening',
    'Onimusha: Way of the Sword',
    'Marvel Rivals',
    'Indiana Jones and the Great Circle',
    'Stalker 2: Heart of Chornobyl',
    'Black Myth: Wukong',
    'Star Wars Outlaws',
    'Dragon Ball: Sparking! Zero',
    'Silent Hill 2',
    'Metaphor: ReFantazio',
    'Astro Bot',
    'Wuthering Waves',
    'Zenless Zone Zero',
    'The Plucky Squire',
    'Neva',
    'Balatro',
    'Animal Well',
    'Helldivers 2',
    'Final Fantasy VII Rebirth',
    'Palworld',
    'Tekken 8',
    'Persona 3 Reload',
    'Prince of Persia: The Lost Crown',
    'Hades II',
    'Elden Ring: Shadow of the Erdtree',
  ]

  console.log(`🔍 Searching for ${specificTitles.length} specific titles...\n`)

  for (const title of specificTitles) {
    try {
      const escaped = title.replace(/"/g, '\\"')
      const query = `search "${escaped}"; ${IGDB_FIELDS} where cover != null; limit 5;`
      const results: IGDBGame[] = await queryIGDB('games', query)
      const match = results.find(g => g.name.toLowerCase() === title.toLowerCase()) || results[0]
      if (match) {
        allGames.push(match)
        console.log(`   ✅ ${match.name} (${match.id}) — ${match.first_release_date ? new Date(match.first_release_date * 1000).toLocaleDateString() : 'TBA'}`)
      } else {
        console.log(`   ⚠️  "${title}" — not found on IGDB`)
      }
      await new Promise(r => setTimeout(r, 260))
    } catch (err) {
      console.log(`   ❌ Error searching "${title}": ${err instanceof Error ? err.message : err}`)
    }
  }

  // 2) Fetch recently released popular games (2025+)
  console.log('\n📡 Fetching recent popular releases (2025+)...\n')
  const jan2025 = Math.floor(new Date('2025-01-01').getTime() / 1000)

  for (let offset = 0; offset < 1000; offset += 500) {
    const query = `${IGDB_FIELDS}
      where first_release_date >= ${jan2025} & cover != null & (rating_count > 0 | hypes > 5 | follows > 10);
      sort first_release_date desc;
      offset ${offset};
      limit 500;
    `
    const games: IGDBGame[] = await queryIGDB('games', query)
    console.log(`   Batch at offset ${offset}: ${games.length} games`)
    allGames.push(...games)
    if (games.length < 500) break
    await new Promise(r => setTimeout(r, 300))
  }

  // 3) Fetch highly hyped upcoming games
  console.log('\n📡 Fetching hyped upcoming/recent games...\n')
  const nowUnix = Math.floor(Date.now() / 1000)
  const query3 = `${IGDB_FIELDS}
    where cover != null & (hypes > 20 | follows > 50) & first_release_date > ${jan2025};
    sort hypes desc;
    limit 500;
  `
  const hyped: IGDBGame[] = await queryIGDB('games', query3)
  console.log(`   Found ${hyped.length} hyped games`)
  allGames.push(...hyped)

  // Deduplicate by IGDB ID
  const deduped = new Map<number, IGDBGame>()
  allGames.forEach(g => { if (!deduped.has(g.id)) deduped.set(g.id, g) })
  const uniqueGames = Array.from(deduped.values())
  console.log(`\n📊 Total unique games to upsert: ${uniqueGames.length}\n`)

  // 4) Upsert into Supabase
  let imported = 0
  let errors = 0

  for (const game of uniqueGames) {
    try {
      const gameData = transformGame(game)
      const result = await upsertToSupabase(gameData)
      if (result.ok) {
        imported++
        if (imported % 50 === 0 || imported <= 3) {
          console.log(`   ✅ ${imported}/${uniqueGames.length} — "${game.name}"`)
        }
      } else {
        errors++
        if (errors <= 10) console.error(`   ❌ "${game.name}": ${result.error?.substring(0, 100)}`)
      }
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      errors++
    }
  }

  console.log('\n═══════════════════════════════════════')
  console.log('✅ IMPORT COMPLETE!\n')
  console.log(`   Games processed:       ${uniqueGames.length}`)
  console.log(`   Successfully upserted: ${imported}`)
  console.log(`   Errors:                ${errors}`)
  console.log('\n═══════════════════════════════════════\n')
}

importNewGames()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ FATAL:', err.message || err)
    process.exit(1)
  })
