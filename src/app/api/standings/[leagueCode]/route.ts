import { NextRequest, NextResponse } from 'next/server'

const TTL_MS = 60 * 60 * 1000 // 60 minutes
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

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueCode: string } }
) {
  try {
    const { leagueCode } = params
    const apiToken = process.env.FOOTBALL_API_TOKEN || process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token not configured. Please set FOOTBALL_API_TOKEN (preferred) or NEXT_PUBLIC_FOOTBALL_API_TOKEN.' },
        { status: 500 }
      )
    }

    // Serve cache if fresh
    const cacheKey = leagueCode
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > now) {
      return NextResponse.json({
        standings: [{ table: cached.data }]
      }, { headers: { 'x-cache': 'hit' } })
    }

    const response = await fetchWithRetry(
      `https://api.football-data.org/v4/competitions/${leagueCode}/standings`,
      {
        headers: {
          'X-Auth-Token': apiToken,
        },
      }
    )

    if (!response.ok) {
      let upstreamMessage = ''
      try {
        const maybeJson = await response.json()
        upstreamMessage = maybeJson?.message || JSON.stringify(maybeJson)
      } catch {
        try { upstreamMessage = await response.text() } catch { upstreamMessage = '' }
      }
      console.error(`❌ Upstream standings error: status=${response.status} ${response.statusText} message=${upstreamMessage}`)
      if (cached) {
        console.warn('⚠️ Serving stale standings cache due to upstream error')
        return NextResponse.json({ standings: [{ table: cached.data }] }, { headers: { 'x-cache': 'stale' } })
      }
      return NextResponse.json(
        { error: 'Upstream standings request failed', status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    
    // Extract the league table (first standing table)
    const standings = data.standings?.[0]?.table || []
    
    // Transform to simpler format
    const transformedStandings = standings.map((team: any) => ({
      id: team.team.id,
      name: team.team.name,
      shortName: team.team.shortName,
      crest: team.team.crest,
      position: team.position,
      points: team.points,
      playedGames: team.playedGames,
      won: team.won,
      draw: team.draw,
      lost: team.lost,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalDifference
    }))

    // Update cache
    cache.set(cacheKey, { data: transformedStandings, expires: now + TTL_MS })

    return NextResponse.json({
      standings: [{ table: transformedStandings }]
    }, { headers: { 'x-cache': cached ? 'refresh' : 'miss' } })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}

