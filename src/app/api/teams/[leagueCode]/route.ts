import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'
const TTL_MS = 60 * 60 * 1000 // 60 minutes
type CacheEntry = { data: any; expires: number }
const cache: Map<string, CacheEntry> = new Map()

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

async function fetchWithRetry(url: string, init: RequestInit, attempts = 2) {
  let lastError: any
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (!res.ok) {
        // Pass through non-OK for caller to handle (so we can log status/body)
        return res
      }
      return res
    } catch (err) {
      lastError = err
    }
    // backoff 200ms, 500ms
    await delay(i === 0 ? 200 : 500)
  }
  throw lastError
}

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueCode: string } }
) {
  const { leagueCode } = params
  
  // Resolve API token from environment (prefer server-only secret if set)
  const apiToken = process.env.FOOTBALL_API_TOKEN || process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN
  console.log("🔍 Using API token (partial):", apiToken ? `${apiToken.slice(0,5)}...${apiToken.slice(-5)}` : "none")

  if (!apiToken) {
    return NextResponse.json(
      { error: 'API token not configured. Please set FOOTBALL_API_TOKEN (preferred) or NEXT_PUBLIC_FOOTBALL_API_TOKEN.' },
      { status: 500 }
    )
  }

  // Serve from cache if fresh
  const cacheKey = leagueCode
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > now) {
    return NextResponse.json({ teams: cached.data }, { headers: { 'x-cache': 'hit' } })
  }

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/competitions/${leagueCode}/teams`, {
      headers: {
        'X-Auth-Token': apiToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let upstreamMessage = ''
      try {
        const maybeJson = await response.json()
        upstreamMessage = maybeJson?.message || JSON.stringify(maybeJson)
      } catch {
        try {
          upstreamMessage = await response.text()
        } catch {
          upstreamMessage = ''
        }
      }
      console.error(`❌ Upstream teams error: status=${response.status} ${response.statusText} message=${upstreamMessage}`)
      // Serve stale cache if available
      if (cached) {
        console.warn('⚠️ Serving stale teams cache due to upstream error')
        return NextResponse.json({ teams: cached.data }, { headers: { 'x-cache': 'stale' } })
      }
      return NextResponse.json(
        { error: 'Upstream teams request failed', status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    
    // Transform the API response to match our expected format
    const teams = data.teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      shortName: team.shortName || team.name,
      logo: team.crest || '⚽',
      leagueId: leagueCode
    }))

    // Update cache
    cache.set(cacheKey, { data: teams, expires: now + TTL_MS })

    return NextResponse.json({ teams }, { headers: { 'x-cache': cached ? 'refresh' : 'miss' } })
  } catch (error) {
    console.error('Error fetching teams:', error)
    // Serve stale cache if available
    if (cached) {
      console.warn('⚠️ Serving stale teams cache due to fetch error')
      return NextResponse.json({ teams: cached.data }, { headers: { 'x-cache': 'stale' } })
    }
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

