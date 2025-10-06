'use client'

import { useState } from 'react'

export type PredictionType = 'win' | 'draw' | 'lose' | null

export interface FixtureData {
  id: number
  opponent: string
  opponentLogo: string
  home: boolean
  date: string
  time: string
  league: string
  status: 'upcoming' | 'live' | 'finished'
  gameweek?: number
}

interface PredictiveFixtureCardProps {
  fixture: FixtureData
  prediction?: PredictionType
  onPredictionChange?: (fixtureId: number, prediction: PredictionType) => void
  teamName?: string
  teamLogo?: string
}

export default function PredictiveFixtureCard({ 
  fixture, 
  prediction, 
  onPredictionChange,
  teamName,
  teamLogo 
}: PredictiveFixtureCardProps) {
  const [hoveredButton, setHoveredButton] = useState<PredictionType>(null)
  const [teamCrestError, setTeamCrestError] = useState(false)
  const [opponentCrestError, setOpponentCrestError] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handlePredictionClick = (predictionType: PredictionType) => {
    const newPrediction = prediction === predictionType ? null : predictionType
    onPredictionChange?.(fixture.id, newPrediction)
  }

  const getTeamInitial = (teamName: string) => {
    return teamName.charAt(0).toUpperCase()
  }

  const truncateTeamName = (name: string, maxLength: number = 20) => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
  }

  const getButtonStyles = (buttonType: PredictionType) => {
    const isSelected = prediction === buttonType
    const baseStyles = "h-9 rounded-md font-semibold text-xs transition-all duration-200 transform active:scale-95 flex items-center justify-center"
    
    switch (buttonType) {
      case 'win':
        return `${baseStyles} ${
          isSelected 
            ? 'bg-green-600 text-white shadow-md scale-105' 
            : 'border-2 border-green-600 text-green-600 hover:bg-green-50 hover:scale-105'
        }`
      case 'draw':
        return `${baseStyles} ${
          isSelected 
            ? 'bg-amber-500 text-white shadow-md scale-105' 
            : 'border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:scale-105'
        }`
      case 'lose':
        return `${baseStyles} ${
          isSelected 
            ? 'bg-red-600 text-white shadow-md scale-105' 
            : 'border-2 border-red-600 text-red-600 hover:bg-red-50 hover:scale-105'
        }`
      default:
        return baseStyles
    }
  }

  const TeamCrest = ({ src, teamName, isOpponent = false }: { src?: string, teamName: string, isOpponent?: boolean }) => {
    const hasError = isOpponent ? opponentCrestError : teamCrestError
    const setError = isOpponent ? setOpponentCrestError : setTeamCrestError
    
    if (!src || hasError) {
      return (
        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
          {getTeamInitial(teamName)}
        </div>
      )
    }

    return (
      <img 
        src={src} 
        alt={`${teamName} crest`} 
        className="w-6 h-6 object-contain"
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-1.5 transition-all duration-300 hover:shadow-md hover:border-gray-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>{formatDate(fixture.date)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            fixture.home 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {fixture.home ? 'HOME' : 'AWAY'}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            GW{fixture.gameweek || Math.floor(Math.random() * 38) + 1}
          </span>
        </div>
      </div>

      {/* Team Display Row */}
      <div className="flex items-center justify-between mb-2">
        {fixture.home ? (
          // Home game: Selected team on left, opponent on right
          <>
            <div className="flex flex-col items-center space-y-0.5 flex-1">
              <TeamCrest src={teamLogo} teamName={teamName || 'Team'} />
              <span className="text-xs font-bold text-gray-900 text-center">
                {truncateTeamName(teamName || 'Team')}
              </span>
            </div>
            
            <div className="px-2">
              <span className="text-xs font-bold text-gray-400">VS</span>
            </div>
            
            <div className="flex flex-col items-center space-y-0.5 flex-1">
              <TeamCrest src={fixture.opponentLogo} teamName={fixture.opponent} isOpponent />
              <span className="text-xs font-bold text-gray-900 text-center">
                {truncateTeamName(fixture.opponent)}
              </span>
            </div>
          </>
        ) : (
          // Away game: Opponent on left, selected team on right
          <>
            <div className="flex flex-col items-center space-y-0.5 flex-1">
              <TeamCrest src={fixture.opponentLogo} teamName={fixture.opponent} isOpponent />
              <span className="text-xs font-bold text-gray-900 text-center">
                {truncateTeamName(fixture.opponent)}
              </span>
            </div>
            
            <div className="px-2">
              <span className="text-xs font-bold text-gray-400">VS</span>
            </div>
            
            <div className="flex flex-col items-center space-y-0.5 flex-1">
              <TeamCrest src={teamLogo} teamName={teamName || 'Team'} />
              <span className="text-xs font-bold text-gray-900 text-center">
                {truncateTeamName(teamName || 'Team')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Prediction Buttons Row */}
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => handlePredictionClick('win')}
          onMouseEnter={() => setHoveredButton('win')}
          onMouseLeave={() => setHoveredButton(null)}
          className={getButtonStyles('win')}
        >
          <div className="flex flex-col items-center">
            <span>W</span>
            <span className="text-xs opacity-75">3</span>
          </div>
        </button>
        <button
          onClick={() => handlePredictionClick('draw')}
          onMouseEnter={() => setHoveredButton('draw')}
          onMouseLeave={() => setHoveredButton(null)}
          className={getButtonStyles('draw')}
        >
          <div className="flex flex-col items-center">
            <span>D</span>
            <span className="text-xs opacity-75">1</span>
          </div>
        </button>
        <button
          onClick={() => handlePredictionClick('lose')}
          onMouseEnter={() => setHoveredButton('lose')}
          onMouseLeave={() => setHoveredButton(null)}
          className={getButtonStyles('lose')}
        >
          <div className="flex flex-col items-center">
            <span>L</span>
            <span className="text-xs opacity-75">0</span>
          </div>
        </button>
      </div>
    </div>
  )
}
