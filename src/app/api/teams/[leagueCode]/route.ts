import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueCode: string } }
) {
  const { leagueCode } = params
  
  try {
    const response = await fetch(`${API_BASE_URL}/competitions/${leagueCode}/teams`, {
      headers: {
        'X-Auth-Token': process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN!,
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
