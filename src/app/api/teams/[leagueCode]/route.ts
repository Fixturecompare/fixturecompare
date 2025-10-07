import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueCode: string } }
) {
  const { leagueCode } = params
  
  // Resolve API token from environment (prefer server-only secret if set)
  const apiToken = process.env.FOOTBALL_API_TOKEN || process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN

  if (!apiToken) {
    return NextResponse.json(
      { error: 'API token not configured. Please set FOOTBALL_API_TOKEN (preferred) or NEXT_PUBLIC_FOOTBALL_API_TOKEN.' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${API_BASE_URL}/competitions/${leagueCode}/teams`, {
      headers: {
        'X-Auth-Token': apiToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
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

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

