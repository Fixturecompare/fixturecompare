'use client'

import { useState, useMemo } from 'react'
import PredictiveFixtureCard, { PredictionType, FixtureData } from '@/components/PredictiveFixtureCard'

// Types
type League = 'PL' | 'PD' | 'SA' | 'FL1' | 'BL1'

interface Team {
  id: number
  name: string
  logo: string
}

interface Fixture extends FixtureData {
  league: League
}

// Mock Data
const leagues: Record<League, string> = {
  PL: 'Premier League (England)',
  PD: 'La Liga (Spain)',
  SA: 'Serie A (Italy)',
  FL1: 'Ligue 1 (France)',
  BL1: 'Bundesliga (Germany)'
}

const teamsByLeague: Record<League, Team[]> = {
  PL: [
    { id: 1, name: 'Manchester United', logo: '🔴' },
    { id: 2, name: 'Liverpool', logo: '🔴' },
    { id: 3, name: 'Arsenal', logo: '🔴' },
    { id: 4, name: 'Chelsea', logo: '🔵' },
    { id: 5, name: 'Manchester City', logo: '🔵' },
    { id: 6, name: 'Tottenham', logo: '⚪' },
    { id: 7, name: 'Newcastle', logo: '⚫' },
    { id: 8, name: 'Brighton', logo: '🔵' }
  ],
  PD: [
    { id: 9, name: 'Real Madrid', logo: '⚪' },
    { id: 10, name: 'Barcelona', logo: '🔵' },
    { id: 11, name: 'Atletico Madrid', logo: '🔴' },
    { id: 12, name: 'Sevilla', logo: '⚪' },
    { id: 13, name: 'Valencia', logo: '🟠' },
    { id: 14, name: 'Real Sociedad', logo: '🔵' },
    { id: 15, name: 'Villarreal', logo: '🟡' },
    { id: 16, name: 'Athletic Bilbao', logo: '🔴' }
  ],
  SA: [
    { id: 17, name: 'Juventus', logo: '⚫' },
    { id: 18, name: 'AC Milan', logo: '🔴' },
    { id: 19, name: 'Inter Milan', logo: '🔵' },
    { id: 20, name: 'Napoli', logo: '🔵' },
    { id: 21, name: 'AS Roma', logo: '🟡' },
    { id: 22, name: 'Lazio', logo: '🔵' },
    { id: 23, name: 'Atalanta', logo: '🔵' },
    { id: 24, name: 'Fiorentina', logo: '🟣' }
  ],
  FL1: [
    { id: 25, name: 'Paris Saint-Germain', logo: '🔵' },
    { id: 26, name: 'Marseille', logo: '🔵' },
    { id: 27, name: 'Lyon', logo: '🔵' },
    { id: 28, name: 'Monaco', logo: '🔴' },
    { id: 29, name: 'Nice', logo: '🔴' },
    { id: 30, name: 'Lille', logo: '🔴' },
    { id: 31, name: 'Rennes', logo: '🔴' },
    { id: 32, name: 'Strasbourg', logo: '🔵' }
  ],
  BL1: [
    { id: 33, name: 'Bayern Munich', logo: '🔴' },
    { id: 34, name: 'Borussia Dortmund', logo: '🟡' },
    { id: 35, name: 'RB Leipzig', logo: '🔴' },
    { id: 36, name: 'Bayer Leverkusen', logo: '🔴' },
    { id: 37, name: 'Eintracht Frankfurt', logo: '🔴' },
    { id: 38, name: 'Borussia Mönchengladbach', logo: '⚫' },
    { id: 39, name: 'VfL Wolfsburg', logo: '🟢' },
    { id: 40, name: 'SC Freiburg', logo: '🔴' }
  ]
}

// Generate mock fixtures for each team
const generateFixtures = (teamId: number, league: League): Fixture[] => {
  const opponents = [
    { name: 'Liverpool', logo: '🔴' },
    { name: 'Arsenal', logo: '🔴' },
    { name: 'Chelsea', logo: '🔵' },
    { name: 'Tottenham', logo: '⚪' },
    { name: 'Newcastle', logo: '⚫' }
  ]
  
  return Array.from({ length: 5 }, (_, index) => ({
    id: teamId * 100 + index,
    opponent: opponents[index].name,
    opponentLogo: opponents[index].logo,
    home: index % 2 === 0,
    date: `2024-0${(index % 2) + 1}-${15 + index * 3}`,
    time: `${15 + index}:00`,
    league,
    status: 'upcoming' as const
  }))
}

// Dropdown Component
interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
}

const Dropdown = ({ value, onChange, options, placeholder, disabled = false }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
            : 'hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && !disabled && (
        <>
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-green-50 focus:outline-none focus:bg-green-50 transition-colors duration-150 ${
                  option.value === value ? 'bg-green-100 text-green-900' : 'text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  )
}

// Fixture Card Component
interface FixtureCardProps {
  fixture: Fixture
  index: number
}

const FixtureCard = ({ fixture, index }: FixtureCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-100 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{fixture.opponentLogo}</span>
          <div>
            <div className="font-semibold text-gray-900">
              {fixture.home ? 'vs' : '@'} {fixture.opponent}
            </div>
            <div className="text-sm text-gray-500">
              {fixture.home ? 'Home' : 'Away'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-gray-900">{formatDate(fixture.date)}</div>
          <div className="text-sm text-gray-500">{fixture.time}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {leagues[fixture.league].split(' ')[0]}
        </span>
        <span className="text-xs text-gray-400 capitalize">
          {fixture.status}
        </span>
      </div>
    </div>
  )
}

// Team Fixtures Component
interface TeamFixturesProps {
  team: Team | null
  fixtures: Fixture[]
  title: string
  predictions: Record<number, PredictionType>
  onPredictionChange: (fixtureId: number, prediction: PredictionType) => void
}

const TeamFixtures = ({ team, fixtures, title, predictions, onPredictionChange }: TeamFixturesProps) => {
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <span className="text-3xl">{team.logo}</span>
          <h3 className="text-2xl font-bold text-gray-900">{team.name}</h3>
        </div>
        <p className="text-gray-500">Make your predictions for upcoming fixtures</p>
      </div>

      <div className="space-y-6">
        {fixtures.map((fixture, index) => (
          <div key={fixture.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <PredictiveFixtureCard
              fixture={fixture}
              prediction={predictions[fixture.id]}
              onPredictionChange={onPredictionChange}
              teamName={team.name}
              teamLogo={team.logo}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Component
export default function PredictionPage() {
  const [selectedLeague, setSelectedLeague] = useState<League>('PL')
  const [selectedTeamA, setSelectedTeamA] = useState<number | null>(null)
  const [selectedTeamB, setSelectedTeamB] = useState<number | null>(null)
  const [predictions, setPredictions] = useState<Record<number, PredictionType>>({})
  const [showResults, setShowResults] = useState(false)

  // Get teams for selected league
  const availableTeams = useMemo(() => {
    return teamsByLeague[selectedLeague] || []
  }, [selectedLeague])

  // Get fixtures for selected teams
  const teamAFixtures = useMemo(() => {
    if (!selectedTeamA) return []
    return generateFixtures(selectedTeamA, selectedLeague)
  }, [selectedTeamA, selectedLeague])

  const teamBFixtures = useMemo(() => {
    if (!selectedTeamB) return []
    return generateFixtures(selectedTeamB, selectedLeague)
  }, [selectedTeamB, selectedLeague])

  // Get team data
  const teamAData = availableTeams.find(team => team.id === selectedTeamA) || null
  const teamBData = availableTeams.find(team => team.id === selectedTeamB) || null

  // Handle league change
  const handleLeagueChange = (league: string) => {
    setSelectedLeague(league as League)
    setSelectedTeamA(null)
    setSelectedTeamB(null)
    setPredictions({}) // Clear predictions when league changes
  }

  // Handle prediction change
  const handlePredictionChange = (fixtureId: number, prediction: PredictionType) => {
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: prediction
    }))
    setShowResults(false) // Hide results when predictions change
  }

  // Calculate projected points for a team
  const calculateTeamPoints = (fixtures: Fixture[]) => {
    return fixtures.reduce((totalPoints, fixture) => {
      const prediction = predictions[fixture.id]
      if (!prediction) return totalPoints
      
      switch (prediction) {
        case 'win':
          return totalPoints + 3
        case 'draw':
          return totalPoints + 1
        case 'lose':
          return totalPoints + 0
        default:
          return totalPoints
      }
    }, 0)
  }

  // Get predicted fixtures count for each team
  const getTeamPredictionsCount = (fixtures: Fixture[]) => {
    return fixtures.filter(fixture => predictions[fixture.id]).length
  }

  // Calculate results
  const teamAPoints = useMemo(() => calculateTeamPoints(teamAFixtures), [teamAFixtures, predictions])
  const teamBPoints = useMemo(() => calculateTeamPoints(teamBFixtures), [teamBFixtures, predictions])
  const teamAPredictions = useMemo(() => getTeamPredictionsCount(teamAFixtures), [teamAFixtures, predictions])
  const teamBPredictions = useMemo(() => getTeamPredictionsCount(teamBFixtures), [teamBFixtures, predictions])

  // Handle calculate button click
  const handleCalculate = () => {
    setShowResults(true)
  }

  // Prepare dropdown options
  const leagueOptions = Object.entries(leagues).map(([code, name]) => ({
    value: code,
    label: name
  }))

  const teamAOptions = availableTeams.map(team => ({
    value: team.id.toString(),
    label: `${team.logo} ${team.name}`
  }))

  const teamBOptions = availableTeams
    .filter(team => team.id !== selectedTeamA)
    .map(team => ({
      value: team.id.toString(),
      label: `${team.logo} ${team.name}`
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Fixture <span className="text-green-600">Predictions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare upcoming fixtures between teams from Europe's top leagues
          </p>
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

            {/* Team Dropdowns */}
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

            {/* Selection Summary */}
            {(selectedTeamA || selectedTeamB) && (
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
              <TeamFixtures
                team={teamAData}
                fixtures={teamAFixtures}
                title="Team A"
                predictions={predictions}
                onPredictionChange={handlePredictionChange}
              />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <TeamFixtures
                team={teamBData}
                fixtures={teamBFixtures}
                title="Team B"
                predictions={predictions}
                onPredictionChange={handlePredictionChange}
              />
            </div>
          </div>

          {/* Calculate Button */}
          {teamAData && teamBData && (teamAPredictions > 0 || teamBPredictions > 0) && (
            <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={handleCalculate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Calculate Projected Points
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Based on your predictions (Win = 3pts, Draw = 1pt, Loss = 0pts)
              </p>
            </div>
          )}

          {/* Results Summary */}
          {showResults && teamAData && teamBData && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Projected Points Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Results */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">{teamAData.logo}</span>
                    <h4 className="text-xl font-bold text-gray-900">{teamAData.name}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Predictions Made:</span>
                      <span className="font-semibold">{teamAPredictions} / {teamAFixtures.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Points:</span>
                      <span className="text-3xl font-bold text-green-600">{teamAPoints}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      From {teamAPredictions} predicted fixture{teamAPredictions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Team B Results */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">{teamBData.logo}</span>
                    <h4 className="text-xl font-bold text-gray-900">{teamBData.name}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Predictions Made:</span>
                      <span className="font-semibold">{teamBPredictions} / {teamBFixtures.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Points:</span>
                      <span className="text-3xl font-bold text-green-600">{teamBPoints}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      From {teamBPredictions} predicted fixture{teamBPredictions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Comparison</h5>
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-2xl font-bold text-green-600">{teamAData.name}</span>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg">
                      <span className="text-lg font-bold">
                        {teamAPoints > teamBPoints ? 'LEADS' : 
                         teamAPoints < teamBPoints ? 'TRAILS' : 'TIED'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{teamBData.name}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Point difference: {Math.abs(teamAPoints - teamBPoints)} point{Math.abs(teamAPoints - teamBPoints) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Points Breakdown */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  <p className="mb-2"><strong>Points System:</strong></p>
                  <div className="flex justify-center space-x-6">
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Win = 3pts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                      <span>Draw = 1pt</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span>Loss = 0pts</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
