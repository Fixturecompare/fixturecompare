'use client'

import { Fixture } from '@/lib/data'

interface TeamFixturesProps {
  teamName: string
  fixtures: Fixture[]
  teamLogo: string
}

export default function TeamFixtures({ teamName, fixtures, teamLogo }: TeamFixturesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isHomeTeam = (fixture: Fixture, team: string) => {
    return fixture.homeTeam === team
  }

  const getOpponent = (fixture: Fixture, team: string) => {
    return fixture.homeTeam === team ? fixture.awayTeam : fixture.homeTeam
  }

  const getOpponentLogo = (fixture: Fixture, team: string) => {
    return fixture.homeTeam === team ? fixture.awayTeamLogo : fixture.homeTeamLogo
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Team Header */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
        <span className="text-3xl">{teamLogo}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{teamName}</h3>
          <p className="text-sm text-gray-500">Upcoming Fixtures</p>
        </div>
      </div>

      {/* Fixtures List */}
      {fixtures.length > 0 ? (
        <div className="space-y-4">
          {fixtures.map((fixture, index) => (
            <div
              key={fixture.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getOpponentLogo(fixture, teamName)}</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {isHomeTeam(fixture, teamName) ? 'vs' : '@'} {getOpponent(fixture, teamName)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isHomeTeam(fixture, teamName) ? 'Home' : 'Away'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatDate(fixture.date)}</div>
                  <div className="text-sm text-gray-500">{fixture.time}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
                  {fixture.league}
                </span>
                <span className="text-gray-400">
                  {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📅</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Fixtures</h4>
          <p className="text-gray-500">This team has no scheduled matches at the moment.</p>
        </div>
      )}
    </div>
  )
}
