'use client'

interface Fixture {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  date: string
  time: string
  league: string
  status: 'completed' | 'upcoming' | 'live'
  homeTeamLogo: string
  awayTeamLogo: string
}

interface FixtureCardProps {
  fixture: Fixture
  isSelected: boolean
  onSelect: () => void
}

export default function FixtureCard({ fixture, isSelected, onSelect }: FixtureCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'live':
        return 'bg-red-100 text-red-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`card cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-primary-500 shadow-xl transform scale-105' 
          : 'hover:shadow-lg hover:transform hover:scale-[1.02]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{fixture.league}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fixture.status)}`}>
          {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{fixture.homeTeamLogo}</span>
            <span className="font-semibold text-gray-900">{fixture.homeTeam}</span>
          </div>
          {fixture.homeScore !== null && (
            <span className="text-2xl font-bold text-primary-600">{fixture.homeScore}</span>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center">
          <div className="w-full h-px bg-gray-200"></div>
          <span className="px-3 text-xs font-medium text-gray-400 bg-white">VS</span>
          <div className="w-full h-px bg-gray-200"></div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{fixture.awayTeamLogo}</span>
            <span className="font-semibold text-gray-900">{fixture.awayTeam}</span>
          </div>
          {fixture.awayScore !== null && (
            <span className="text-2xl font-bold text-primary-600">{fixture.awayScore}</span>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <span>{formatDate(fixture.date)}</span>
        <span>{fixture.time}</span>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center animate-scale-in">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}
