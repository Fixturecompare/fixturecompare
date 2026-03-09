declare module '@/hooks/useFootballApi' {
  export type Team = {
    id: number
    name: string
    shortName?: string
    crest?: string
  }

  export type Fixture = {
    id: number
    opponent: { name: string; crest?: string }
    isHome: boolean
    utcDate: string
    competition: { name: string }
    status: string
  }

  export function useTeams(
    league: string
  ): {
    teams: Team[]
    loading: boolean
    error?: string
    refetch: () => void
  }

  export function useFixtures(
    teamId: number | null
  ): {
    fixtures: Fixture[]
    loading: boolean
    error?: string
    refetch: () => void
  }
}
