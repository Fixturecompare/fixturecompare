'use client'

import { useState, useMemo } from 'react'
import Dropdown from '@/components/Dropdown'
import TeamFixtures from '@/components/TeamFixtures'
import { leagues, getTeamsByLeague, getUpcomingFixturesForTeam } from '@/lib/data'

export default function PredictionsPage() {
  const [selectedLeague, setSelectedLeague] = useState('')
  const [selectedTeamA, setSelectedTeamA] = useState('')
  const [selectedTeamB, setSelectedTeamB] = useState('')

  // Get teams for selected league
  const availableTeams = useMemo(() => {
    if (!selectedLeague) return []
    return getTeamsByLeague(selectedLeague)
  }, [selectedLeague])

  // Get fixtures for selected teams
  const teamAFixtures = useMemo(() => {
    if (!selectedTeamA) return []
    return getUpcomingFixturesForTeam(selectedTeamA)
  }, [selectedTeamA])

  const teamBFixtures = useMemo(() => {
    if (!selectedTeamB) return []
    return getUpcomingFixturesForTeam(selectedTeamB)
  }, [selectedTeamB])

  // Get team data for display
  const teamAData = availableTeams.find(team => team.name === selectedTeamA)
  const teamBData = availableTeams.find(team => team.name === selectedTeamB)

  // Handle league change - reset team selections
  const handleLeagueChange = (leagueId: string) => {
    setSelectedLeague(leagueId)
    setSelectedTeamA('')
    setSelectedTeamB('')
  }

  // Prepare dropdown options
  const leagueOptions = leagues.map(league => ({
    value: league.id,
    label: `${league.name} (${league.code})`
  }))

  const teamOptions = availableTeams.map(team => ({
    value: team.name,
    label: team.name
  }))

  // Filter team B options to exclude selected team A
  const teamBOptions = teamOptions.filter(option => option.value !== selectedTeamA)

  return (
    <main className="min-h-screen">
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Match <span className="text-primary-600">Predictions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Select teams from major European leagues to analyze their upcoming fixtures
          </p>
        </div>

        {/* Selection Controls */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Selection</h2>
            
            {/* League Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select League
              </label>
              <Dropdown
                options={leagueOptions}
                value={selectedLeague}
                onChange={handleLeagueChange}
                placeholder="Choose a European league..."
              />
            </div>

            {/* Team Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Team A
                </label>
                <Dropdown
                  options={teamOptions}
                  value={selectedTeamA}
                  onChange={setSelectedTeamA}
                  placeholder="Select first team..."
                  disabled={!selectedLeague}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Team B
                </label>
                <Dropdown
                  options={teamBOptions}
                  value={selectedTeamB}
                  onChange={setSelectedTeamB}
                  placeholder="Select second team..."
                  disabled={!selectedLeague || !selectedTeamA}
                />
              </div>
            </div>

            {/* Selection Summary */}
            {selectedLeague && (
              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span className="font-medium text-primary-800">
                    League: {leagues.find(l => l.id === selectedLeague)?.name}
                  </span>
                  {selectedTeamA && (
                    <>
                      <span className="text-primary-600">•</span>
                      <span className="font-medium text-primary-800">Team A: {selectedTeamA}</span>
                    </>
                  )}
                  {selectedTeamB && (
                    <>
                      <span className="text-primary-600">•</span>
                      <span className="font-medium text-primary-800">Team B: {selectedTeamB}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Fixtures Comparison */}
        {selectedTeamA && selectedTeamB && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Upcoming Fixtures Comparison
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Team A Fixtures */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <TeamFixtures
                  teamName={selectedTeamA}
                  fixtures={teamAFixtures}
                  teamLogo={teamAData?.logo || '⚽'}
                />
              </div>

              {/* Team B Fixtures */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <TeamFixtures
                  teamName={selectedTeamB}
                  fixtures={teamBFixtures}
                  teamLogo={teamBData?.logo || '⚽'}
                />
              </div>
            </div>

            {/* Comparison Insights */}
            {teamAFixtures.length > 0 && teamBFixtures.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">{teamAFixtures.length}</div>
                    <div className="text-sm text-gray-600">{selectedTeamA} Fixtures</div>
                  </div>
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">{teamBFixtures.length}</div>
                    <div className="text-sm text-gray-600">{selectedTeamB} Fixtures</div>
                  </div>
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {leagues.find(l => l.id === selectedLeague)?.code}
                    </div>
                    <div className="text-sm text-gray-600">League</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedLeague && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Select a League to Get Started</h3>
            <p className="text-gray-600">Choose from 5 major European leagues to compare team fixtures</p>
          </div>
        )}

        {selectedLeague && !selectedTeamA && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Select Teams to Compare</h3>
            <p className="text-gray-600">Choose two teams from {leagues.find(l => l.id === selectedLeague)?.name} to view their fixtures</p>
          </div>
        )}
      </div>
    </main>
  )
}

