import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'
const TTL_MS = 10 * 60 * 1000 // 10 minutes
type CacheEntry = { data: any; expires: number }
const cache: Map<string, CacheEntry> = new Map()

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

async function fetchWithRetry(url: string, init: RequestInit, attempts = 2) {
  let lastError: any
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (!res.ok) return res
      return res
    } catch (err) {
      lastError = err
    }
    await delay(i === 0 ? 200 : 500)
  }
  throw lastError
}

// Domestic league codes we want to include
const DOMESTIC_LEAGUES = ['PL', 'PD', 'SA', 'FL1', 'BL1']

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params
  const { searchParams } = new URL(request.url)
  const leagueCode = searchParams.get('leagueCode')
  
  // Resolve API token from environment (prefer server-only secret if set)
  const apiToken = process.env.FOOTBALL_API_TOKEN || process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN
  if (!apiToken) {
    return NextResponse.json(
      { error: 'API token not configured. Please set FOOTBALL_API_TOKEN (preferred) or NEXT_PUBLIC_FOOTBALL_API_TOKEN.' },
      { status: 500 }
    )
  }

  // Cache key includes team and optional leagueCode filter
  const cacheKey = `${teamId}:${leagueCode || 'ALL'}`
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > now) {
    return NextResponse.json({ fixtures: cached.data }, { headers: { 'x-cache': 'hit' } })
  }

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/teams/${teamId}/matches?status=SCHEDULED&limit=10`, {
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
        try { upstreamMessage = await response.text() } catch { upstreamMessage = '' }
      }
      console.error(`❌ Upstream fixtures error: status=${response.status} ${response.statusText} message=${upstreamMessage}`)
      if (cached) {
        console.warn('⚠️ Serving stale fixtures cache due to upstream error')
        return NextResponse.json({ fixtures: cached.data }, { headers: { 'x-cache': 'stale' } })
      }
      return NextResponse.json(
        { error: 'Upstream fixtures request failed', status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    
    // Filter for domestic league fixtures only
    const domesticMatches = data.matches.filter((match: any) => {
      // If a specific league code is provided, only include matches from that league
      if (leagueCode) {
        return match.competition.code === leagueCode
      }
      // Otherwise, include all domestic leagues
      return DOMESTIC_LEAGUES.includes(match.competition.code)
    })
    
    // Transform the API response to match our expected format
    const fixtures = domesticMatches.slice(0, 5).map((match: any) => {
      const isHome = match.homeTeam.id === parseInt(teamId)
      const opponent = isHome ? match.awayTeam : match.homeTeam
      
      return {
        id: match.id,
        opponent: opponent.name,
        opponentShortName: opponent.shortName || opponent.name,
        opponentLogo: opponent.crest || '⚽',
        home: isHome,
        date: match.utcDate.split('T')[0],
        time: new Date(match.utcDate).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        league: match.competition.name,
        leagueCode: match.competition.code,
        status: match.status.toLowerCase(),
        gameweek: match.matchday
      }
    })

    // Update cache
    cache.set(cacheKey, { data: fixtures, expires: now + TTL_MS })

    return NextResponse.json({ fixtures }, { headers: { 'x-cache': cached ? 'refresh' : 'miss' } })
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    if (cached) {
      console.warn('⚠️ Serving stale fixtures cache due to fetch error')
      return NextResponse.json({ fixtures: cached.data }, { headers: { 'x-cache': 'stale' } })
    }
    return NextResponse.json(
      { error: 'Failed to fetch fixtures' },
      { status: 500 }
    )
  }
}

