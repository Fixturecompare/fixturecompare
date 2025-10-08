import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'

export async function GET() {
  const publicToken = process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN
  const serverToken = process.env.FOOTBALL_API_TOKEN
  const token = serverToken || publicToken

  const details: any = {
    hasFOOTBALL_API_TOKEN: Boolean(serverToken),
    hasNEXT_PUBLIC_FOOTBALL_API_TOKEN: Boolean(publicToken),
    usingToken: serverToken ? 'FOOTBALL_API_TOKEN' : (publicToken ? 'NEXT_PUBLIC_FOOTBALL_API_TOKEN' : null),
    upstream: {
      status: 'unknown'
    }
  }

  if (!token) {
    return NextResponse.json({
      ok: false,
      reason: 'Missing API token',
      ...details
    }, { status: 500 })
  }

  try {
    // Lightweight check: HEAD competitions
    const headRes = await fetch(`${API_BASE_URL}/competitions`, {
      method: 'HEAD',
      headers: {
        'X-Auth-Token': token
      }
    })

    details.upstream.status = headRes.status
    details.upstream.rateLimit = {
      remaining: headRes.headers.get('X-Requests-Available-Minute'),
      reset: headRes.headers.get('X-RequestCounter-Reset')
    }

    // Optional deeper check: GET a small resource
    const testLeague = 'PL'
    const teamsRes = await fetch(`${API_BASE_URL}/competitions/${testLeague}/teams`, {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json'
      }
    })

    const ok = headRes.ok && teamsRes.ok
    const payload: any = { ok, ...details }

    if (!teamsRes.ok) {
      payload.upstreamTeams = { status: teamsRes.status }
      return NextResponse.json(payload, { status: 502 })
    }

    const teams = await teamsRes.json()
    payload.sample = {
      league: testLeague,
      teamCount: teams?.teams?.length ?? 0
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      reason: err?.message || 'Unknown error',
      ...details
    }, { status: 502 })
  }
}
