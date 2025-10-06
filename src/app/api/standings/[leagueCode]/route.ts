import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueCode: string } }
) {
  try {
    const { leagueCode } = params
    const apiToken = process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${leagueCode}/standings`,
      {
        headers: {
          'X-Auth-Token': apiToken,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
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

    return NextResponse.json({
      standings: [{
        table: transformedStandings
      }]
    })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}
