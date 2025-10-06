export interface League {
  id: string
  name: string
  code: string
}

export interface Team {
  id: number
  name: string
  logo: string
  leagueId: string
}

export interface Fixture {
  id: number
  homeTeam: string
  awayTeam: string
  homeTeamLogo: string
  awayTeamLogo: string
  date: string
  time: string
  league: string
  status: 'upcoming' | 'live' | 'completed'
  homeScore?: number
  awayScore?: number
}

export const leagues: League[] = [
  { id: 'PL', name: 'Premier League', code: 'England' },
  { id: 'PD', name: 'La Liga', code: 'Spain' },
  { id: 'SA', name: 'Serie A', code: 'Italy' },
  { id: 'FL1', name: 'Ligue 1', code: 'France' },
  { id: 'BL1', name: 'Bundesliga', code: 'Germany' }
]

export const teams: Team[] = [
  // Premier League
  { id: 1, name: 'Manchester United', logo: '🔴', leagueId: 'PL' },
  { id: 2, name: 'Liverpool', logo: '🔴', leagueId: 'PL' },
  { id: 3, name: 'Arsenal', logo: '🔴', leagueId: 'PL' },
  { id: 4, name: 'Chelsea', logo: '🔵', leagueId: 'PL' },
  { id: 5, name: 'Manchester City', logo: '🔵', leagueId: 'PL' },
  { id: 6, name: 'Tottenham', logo: '⚪', leagueId: 'PL' },
  { id: 7, name: 'Newcastle', logo: '⚫', leagueId: 'PL' },
  { id: 8, name: 'Brighton', logo: '🔵', leagueId: 'PL' },

  // La Liga
  { id: 9, name: 'Real Madrid', logo: '⚪', leagueId: 'PD' },
  { id: 10, name: 'Barcelona', logo: '🔵', leagueId: 'PD' },
  { id: 11, name: 'Atletico Madrid', logo: '🔴', leagueId: 'PD' },
  { id: 12, name: 'Sevilla', logo: '⚪', leagueId: 'PD' },
  { id: 13, name: 'Valencia', logo: '🟠', leagueId: 'PD' },
  { id: 14, name: 'Real Sociedad', logo: '🔵', leagueId: 'PD' },
  { id: 15, name: 'Villarreal', logo: '🟡', leagueId: 'PD' },
  { id: 16, name: 'Athletic Bilbao', logo: '🔴', leagueId: 'PD' },

  // Serie A
  { id: 17, name: 'Juventus', logo: '⚫', leagueId: 'SA' },
  { id: 18, name: 'AC Milan', logo: '🔴', leagueId: 'SA' },
  { id: 19, name: 'Inter Milan', logo: '🔵', leagueId: 'SA' },
  { id: 20, name: 'Napoli', logo: '🔵', leagueId: 'SA' },
  { id: 21, name: 'AS Roma', logo: '🟡', leagueId: 'SA' },
  { id: 22, name: 'Lazio', logo: '🔵', leagueId: 'SA' },
  { id: 23, name: 'Atalanta', logo: '🔵', leagueId: 'SA' },
  { id: 24, name: 'Fiorentina', logo: '🟣', leagueId: 'SA' },

  // Ligue 1
  { id: 25, name: 'Paris Saint-Germain', logo: '🔵', leagueId: 'FL1' },
  { id: 26, name: 'Marseille', logo: '🔵', leagueId: 'FL1' },
  { id: 27, name: 'Lyon', logo: '🔵', leagueId: 'FL1' },
  { id: 28, name: 'Monaco', logo: '🔴', leagueId: 'FL1' },
  { id: 29, name: 'Nice', logo: '🔴', leagueId: 'FL1' },
  { id: 30, name: 'Lille', logo: '🔴', leagueId: 'FL1' },
  { id: 31, name: 'Rennes', logo: '🔴', leagueId: 'FL1' },
  { id: 32, name: 'Strasbourg', logo: '🔵', leagueId: 'FL1' },

  // Bundesliga
  { id: 33, name: 'Bayern Munich', logo: '🔴', leagueId: 'BL1' },
  { id: 34, name: 'Borussia Dortmund', logo: '🟡', leagueId: 'BL1' },
  { id: 35, name: 'RB Leipzig', logo: '🔴', leagueId: 'BL1' },
  { id: 36, name: 'Bayer Leverkusen', logo: '🔴', leagueId: 'BL1' },
  { id: 37, name: 'Eintracht Frankfurt', logo: '🔴', leagueId: 'BL1' },
  { id: 38, name: 'Borussia Mönchengladbach', logo: '⚫', leagueId: 'BL1' },
  { id: 39, name: 'VfL Wolfsburg', logo: '🟢', leagueId: 'BL1' },
  { id: 40, name: 'SC Freiburg', logo: '🔴', leagueId: 'BL1' }
]

export const upcomingFixtures: Fixture[] = [
  // Premier League fixtures - 5 fixtures per team
  // Manchester United fixtures (5 fixtures)
  { id: 101, homeTeam: 'Manchester United', awayTeam: 'Liverpool', homeTeamLogo: '🔴', awayTeamLogo: '🔴', date: '2024-01-25', time: '17:30', league: 'Premier League', status: 'upcoming' },
  { id: 106, homeTeam: 'Chelsea', awayTeam: 'Manchester United', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-02-08', time: '20:00', league: 'Premier League', status: 'upcoming' },
  { id: 107, homeTeam: 'Manchester United', awayTeam: 'Arsenal', homeTeamLogo: '🔴', awayTeamLogo: '🔴', date: '2024-02-12', time: '16:30', league: 'Premier League', status: 'upcoming' },
  { id: 108, homeTeam: 'Tottenham', awayTeam: 'Manchester United', homeTeamLogo: '⚪', awayTeamLogo: '🔴', date: '2024-02-18', time: '14:00', league: 'Premier League', status: 'upcoming' },
  { id: 109, homeTeam: 'Manchester United', awayTeam: 'Newcastle', homeTeamLogo: '🔴', awayTeamLogo: '⚫', date: '2024-02-25', time: '15:00', league: 'Premier League', status: 'upcoming' },

  // Liverpool fixtures (5 fixtures - excluding the shared Man Utd match)
  { id: 105, homeTeam: 'Liverpool', awayTeam: 'Arsenal', homeTeamLogo: '🔴', awayTeamLogo: '🔴', date: '2024-02-05', time: '16:30', league: 'Premier League', status: 'upcoming' },
  { id: 110, homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-02-10', time: '17:30', league: 'Premier League', status: 'upcoming' },
  { id: 111, homeTeam: 'Liverpool', awayTeam: 'Chelsea', homeTeamLogo: '🔴', awayTeamLogo: '🔵', date: '2024-02-15', time: '20:00', league: 'Premier League', status: 'upcoming' },
  { id: 112, homeTeam: 'Brighton', awayTeam: 'Liverpool', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-02-22', time: '19:30', league: 'Premier League', status: 'upcoming' },
  { id: 113, homeTeam: 'Liverpool', awayTeam: 'Tottenham', homeTeamLogo: '🔴', awayTeamLogo: '⚪', date: '2024-03-01', time: '16:00', league: 'Premier League', status: 'upcoming' },

  // Arsenal fixtures
  { id: 102, homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeTeamLogo: '🔴', awayTeamLogo: '🔵', date: '2024-01-28', time: '15:00', league: 'Premier League', status: 'upcoming' },
  { id: 114, homeTeam: 'Newcastle', awayTeam: 'Arsenal', homeTeamLogo: '⚫', awayTeamLogo: '🔴', date: '2024-02-07', time: '20:00', league: 'Premier League', status: 'upcoming' },
  { id: 115, homeTeam: 'Arsenal', awayTeam: 'Manchester City', homeTeamLogo: '🔴', awayTeamLogo: '🔵', date: '2024-02-14', time: '17:30', league: 'Premier League', status: 'upcoming' },
  { id: 116, homeTeam: 'Tottenham', awayTeam: 'Arsenal', homeTeamLogo: '⚪', awayTeamLogo: '🔴', date: '2024-02-20', time: '16:30', league: 'Premier League', status: 'upcoming' },
  { id: 117, homeTeam: 'Arsenal', awayTeam: 'Brighton', homeTeamLogo: '🔴', awayTeamLogo: '🔵', date: '2024-02-28', time: '19:45', league: 'Premier League', status: 'upcoming' },

  // Chelsea fixtures
  { id: 118, homeTeam: 'Brighton', awayTeam: 'Chelsea', homeTeamLogo: '🔵', awayTeamLogo: '🔵', date: '2024-02-03', time: '15:00', league: 'Premier League', status: 'upcoming' },
  { id: 119, homeTeam: 'Chelsea', awayTeam: 'Tottenham', homeTeamLogo: '🔵', awayTeamLogo: '⚪', date: '2024-02-11', time: '16:30', league: 'Premier League', status: 'upcoming' },
  { id: 120, homeTeam: 'Newcastle', awayTeam: 'Chelsea', homeTeamLogo: '⚫', awayTeamLogo: '🔵', date: '2024-02-17', time: '14:00', league: 'Premier League', status: 'upcoming' },
  { id: 121, homeTeam: 'Chelsea', awayTeam: 'Manchester City', homeTeamLogo: '🔵', awayTeamLogo: '🔵', date: '2024-02-24', time: '17:30', league: 'Premier League', status: 'upcoming' },

  // Manchester City fixtures
  { id: 103, homeTeam: 'Manchester City', awayTeam: 'Tottenham', homeTeamLogo: '🔵', awayTeamLogo: '⚪', date: '2024-02-01', time: '20:00', league: 'Premier League', status: 'upcoming' },
  { id: 122, homeTeam: 'Brighton', awayTeam: 'Manchester City', homeTeamLogo: '🔵', awayTeamLogo: '🔵', date: '2024-02-09', time: '19:30', league: 'Premier League', status: 'upcoming' },
  { id: 123, homeTeam: 'Manchester City', awayTeam: 'Newcastle', homeTeamLogo: '🔵', awayTeamLogo: '⚫', date: '2024-02-16', time: '20:00', league: 'Premier League', status: 'upcoming' },
  { id: 124, homeTeam: 'Tottenham', awayTeam: 'Manchester City', homeTeamLogo: '⚪', awayTeamLogo: '🔵', date: '2024-02-23', time: '16:30', league: 'Premier League', status: 'upcoming' },

  // Tottenham fixtures
  { id: 125, homeTeam: 'Newcastle', awayTeam: 'Tottenham', homeTeamLogo: '⚫', awayTeamLogo: '⚪', date: '2024-02-04', time: '14:00', league: 'Premier League', status: 'upcoming' },
  { id: 126, homeTeam: 'Tottenham', awayTeam: 'Brighton', homeTeamLogo: '⚪', awayTeamLogo: '🔵', date: '2024-02-13', time: '20:00', league: 'Premier League', status: 'upcoming' },

  // Newcastle fixtures
  { id: 104, homeTeam: 'Newcastle', awayTeam: 'Brighton', homeTeamLogo: '⚫', awayTeamLogo: '🔵', date: '2024-02-03', time: '14:00', league: 'Premier League', status: 'upcoming' },

  // Brighton fixtures - additional fixtures to balance
  { id: 127, homeTeam: 'Brighton', awayTeam: 'Arsenal', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-02-06', time: '19:45', league: 'Premier League', status: 'upcoming' },

  // La Liga fixtures
  { id: 201, homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeTeamLogo: '⚪', awayTeamLogo: '🔵', date: '2024-01-26', time: '21:00', league: 'La Liga', status: 'upcoming' },
  { id: 202, homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla', homeTeamLogo: '🔴', awayTeamLogo: '⚪', date: '2024-01-29', time: '18:30', league: 'La Liga', status: 'upcoming' },
  { id: 203, homeTeam: 'Valencia', awayTeam: 'Real Sociedad', homeTeamLogo: '🟠', awayTeamLogo: '🔵', date: '2024-02-02', time: '19:00', league: 'La Liga', status: 'upcoming' },
  { id: 204, homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-02-04', time: '20:30', league: 'La Liga', status: 'upcoming' },

  // Serie A fixtures
  { id: 301, homeTeam: 'Juventus', awayTeam: 'AC Milan', homeTeamLogo: '⚫', awayTeamLogo: '🔴', date: '2024-01-27', time: '20:45', league: 'Serie A', status: 'upcoming' },
  { id: 302, homeTeam: 'Inter Milan', awayTeam: 'Napoli', homeTeamLogo: '🔵', awayTeamLogo: '🔵', date: '2024-01-30', time: '18:00', league: 'Serie A', status: 'upcoming' },
  { id: 303, homeTeam: 'AS Roma', awayTeam: 'Lazio', homeTeamLogo: '🟡', awayTeamLogo: '🔵', date: '2024-02-03', time: '17:30', league: 'Serie A', status: 'upcoming' },

  // Ligue 1 fixtures
  { id: 401, homeTeam: 'Paris Saint-Germain', awayTeam: 'Marseille', homeTeamLogo: '🔵', awayTeamLogo: '🔵', date: '2024-01-28', time: '21:00', league: 'Ligue 1', status: 'upcoming' },
  { id: 402, homeTeam: 'Lyon', awayTeam: 'Monaco', homeTeamLogo: '🔵', awayTeamLogo: '🔴', date: '2024-01-31', time: '19:00', league: 'Ligue 1', status: 'upcoming' },

  // Bundesliga fixtures
  { id: 501, homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeTeamLogo: '🔴', awayTeamLogo: '🟡', date: '2024-01-27', time: '18:30', league: 'Bundesliga', status: 'upcoming' },
  { id: 502, homeTeam: 'RB Leipzig', awayTeam: 'Bayer Leverkusen', homeTeamLogo: '🔴', awayTeamLogo: '🔴', date: '2024-02-01', time: '19:30', league: 'Bundesliga', status: 'upcoming' }
]

export function getTeamsByLeague(leagueId: string): Team[] {
  return teams.filter(team => team.leagueId === leagueId)
}

export function getUpcomingFixturesForTeam(teamName: string): Fixture[] {
  return upcomingFixtures.filter(fixture => 
    fixture.homeTeam === teamName || fixture.awayTeam === teamName
  )
}
