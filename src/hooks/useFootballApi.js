// Custom React hook for Football Data API
import { useState, useEffect, useCallback } from 'react'
import { getTeams, getFixtures, getCompetition } from '@/lib/footballApi'

/**
 * Hook for fetching teams data
 * @param {string} leagueCode - Competition code
 * @returns {Object} { teams, loading, error, refetch }
 */
export const useTeams = (leagueCode) => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTeams = useCallback(async () => {
    if (!leagueCode) {
      setTeams([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getTeams(leagueCode)
      
      if (result.success) {
        setTeams(result.data.teams)
      } else {
        setError(result.error)
        setTeams([])
      }
    } catch (err) {
      setError(err.message)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [leagueCode])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams
  }
}

/**
 * Hook for fetching fixtures data
 * @param {number} teamId - Team ID
 * @returns {Object} { fixtures, loading, error, refetch }
 */
export const useFixtures = (teamId) => {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFixtures = useCallback(async () => {
    if (!teamId) {
      setFixtures([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getFixtures(teamId)
      
      if (result.success) {
        setFixtures(result.data.fixtures)
      } else {
        setError(result.error)
        setFixtures([])
      }
    } catch (err) {
      setError(err.message)
      setFixtures([])
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchFixtures()
  }, [fetchFixtures])

  return {
    fixtures,
    loading,
    error,
    refetch: fetchFixtures
  }
}

/**
 * Hook for fetching competition data
 * @param {string} leagueCode - Competition code
 * @returns {Object} { competition, loading, error, refetch }
 */
export const useCompetition = (leagueCode) => {
  const [competition, setCompetition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCompetition = useCallback(async () => {
    if (!leagueCode) {
      setCompetition(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getCompetition(leagueCode)
      
      if (result.success) {
        setCompetition(result.data)
      } else {
        setError(result.error)
        setCompetition(null)
      }
    } catch (err) {
      setError(err.message)
      setCompetition(null)
    } finally {
      setLoading(false)
    }
  }, [leagueCode])

  useEffect(() => {
    fetchCompetition()
  }, [fetchCompetition])

  return {
    competition,
    loading,
    error,
    refetch: fetchCompetition
  }
}
