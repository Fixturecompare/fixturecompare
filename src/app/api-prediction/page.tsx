'use client'

import { useState, useMemo } from 'react'
import { useTeams, useFixtures } from '@/hooks/useFootballApi'
import PredictiveFixtureCard, { PredictionType } from '@/components/PredictiveFixtureCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Dropdown from '@/components/Dropdown'

// League codes for football-data.org API
const leagues = {
  PL: 'Premier League (England)',
  PD: 'La Liga (Spain)', 
  SA: 'Serie A (Italy)',
  FL1: 'Ligue 1 (France)',
  BL1: 'Bundesliga (Germany)'
}

// Team Fixtures Component with API Integration
interface ApiTeamFixturesProps {
  team: any
  teamId: number | null
  title: string
  predictions: Record<number, PredictionType>
  onPredictionChange: (fixtureId: number, prediction: PredictionType) => void
}

const ApiTeamFixtures = ({ team, teamId, title, predictions, onPredictionChange }: ApiTeamFixturesProps) => {
  const { fixtures, loading, error, refetch } = useFixtures(teamId)

  if (!team) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚽</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Selected</h3>
          <p className="text-gray-500">Select {title} to view fixtures</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <LoadingSpinner size="lg" message={`Loading fixtures for ${team.name}...`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-2">
          {team.crest ? (
            <img src={team.crest} alt={`${team.name} logo`} className="w-8 h-8" />
          ) : (
            <span className="text-3xl">⚽</span>
          )}
          <h3 className="text-2xl font-bold text-gray-900">{team.name}</h3>
        </div>
        <p className="text-gray-500">Make your predictions for upcoming fixtures</p>
      </div>

      {fixtures.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Fixtures</h3>
          <p className="text-gray-500">This team has no scheduled matches at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {fixtures.map((fixture, index) => {
            // Transform API fixture to our component format
            const transformedFixture = {
              id: fixture.id,
              opponent: fixture.opponent.name,
              opponentLogo: fixture.opponent.crest || '⚽',
              home: fixture.isHome,
              date: new Date(fixture.utcDate).toISOString().split('T')[0],
              time: new Date(fixture.utcDate).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              league: fixture.competition.name,
              status: fixture.status.toLowerCase()
            }

            return (
              <div key={fixture.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PredictiveFixtureCard
                  fixture={transformedFixture}
                  prediction={predictions[fixture.id]}
                  onPredictionChange={onPredictionChange}
                  teamName={team.name}
                  teamLogo={team.crest ? undefined : '⚽'}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Main API Prediction Page Component
export default function ApiPredictionPage() {
  const [selectedLeague, setSelectedLeague] = useState('PL')
  const [selectedTeamA, setSelectedTeamA] = useState(null)
  const [selectedTeamB, setSelectedTeamB] = useState(null)
  const [predictions, setPredictions] = useState({})

  // Fetch teams for selected league
  const { teams, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useTeams(selectedLeague)

  // Get team data
  const teamAData = useMemo(() => 
    teams.find(team => team.id === selectedTeamA) || null, 
    [teams, selectedTeamA]
  )
  
  const teamBData = useMemo(() => 
    teams.find(team => team.id === selectedTeamB) || null, 
    [teams, selectedTeamB]
  )

  // Handle league change
  const handleLeagueChange = (league) => {
    setSelectedLeague(league)
    setSelectedTeamA(null)
    setSelectedTeamB(null)
    setPredictions({})
  }

  // Handle prediction change
  const handlePredictionChange = (fixtureId, prediction) => {
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: prediction
    }))
  }

  // Prepare dropdown options
  const leagueOptions = Object.entries(leagues).map(([code, name]) => ({
    value: code,
    label: name
  }))

  const teamAOptions = teams.map(team => ({
    value: team.id.toString(),
    label: `${team.shortName || team.name}`
  }))

  const teamBOptions = teams
    .filter(team => team.id !== selectedTeamA)
    .map(team => ({
      value: team.id.toString(),
      label: `${team.shortName || team.name}`
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Live <span className="text-green-600">Predictions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time fixture predictions powered by football-data.org API
          </p>
        </div>

        {/* API Status Notice */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">ℹ️</span>
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> This page uses the football-data.org API. 
                Make sure to set your <code>FOOTBALL_DATA_API_KEY</code> in the environment variables.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Selection</h2>
            
            {/* League Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select League
              </label>
              <Dropdown
                value={selectedLeague}
                onChange={handleLeagueChange}
                options={leagueOptions}
                placeholder="Choose a league..."
              />
            </div>

            {/* Teams Loading/Error States */}
            {teamsLoading && (
              <div className="mb-6">
                <LoadingSpinner message="Loading teams..." />
              </div>
            )}

            {teamsError && (
              <div className="mb-6">
                <ErrorMessage message={teamsError} onRetry={refetchTeams} />
              </div>
            )}

            {/* Team Dropdowns */}
            {!teamsLoading && !teamsError && teams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Team A
                  </label>
                  <Dropdown
                    value={selectedTeamA?.toString() || ''}
                    onChange={(value) => setSelectedTeamA(value ? parseInt(value) : null)}
                    options={teamAOptions}
                    placeholder="Select first team..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Team B
                  </label>
                  <Dropdown
                    value={selectedTeamB?.toString() || ''}
                    onChange={(value) => setSelectedTeamB(value ? parseInt(value) : null)}
                    options={teamBOptions}
                    placeholder="Select second team..."
                    disabled={!selectedTeamA}
                  />
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {(teamAData || teamBData) && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <span className="font-medium text-green-800">
                    League: {leagues[selectedLeague].split(' ')[0]}
                  </span>
                  {teamAData && (
                    <>
                      <span className="text-green-600">•</span>
                      <span className="font-medium text-green-800">
                        Team A: {teamAData.name}
                      </span>
                    </>
                  )}
                  {teamBData && (
                    <>
                      <span className="text-green-600">•</span>
                      <span className="font-medium text-green-800">
                        Team B: {teamBData.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixtures Display */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ApiTeamFixtures
                team={teamAData}
                teamId={selectedTeamA}
                title="Team A"
                predictions={predictions}
                onPredictionChange={handlePredictionChange}
              />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <ApiTeamFixtures
                team={teamBData}
                teamId={selectedTeamB}
                title="Team B"
                predictions={predictions}
                onPredictionChange={handlePredictionChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
