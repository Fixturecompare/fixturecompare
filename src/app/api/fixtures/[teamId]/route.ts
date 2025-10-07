import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.football-data.org/v4'

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

  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/matches?status=SCHEDULED&limit=10`, {
      headers: {
        'X-Auth-Token': apiToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
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

    return NextResponse.json({ fixtures })
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fixtures' },
      { status: 500 }
    )
  }
}

