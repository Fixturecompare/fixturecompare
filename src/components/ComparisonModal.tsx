'use client'

import { useEffect } from 'react'

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

interface ComparisonModalProps {
  fixtures: Fixture[]
  onClose: () => void
}

export default function ComparisonModal({ fixtures, onClose }: ComparisonModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (fixtures.length !== 2) return null

  const [fixture1, fixture2] = fixtures

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getResult = (fixture: Fixture) => {
    if (fixture.homeScore === null || fixture.awayScore === null) {
      return 'TBD'
    }
    if (fixture.homeScore > fixture.awayScore) {
      return `${fixture.homeTeam} Win`
    } else if (fixture.awayScore > fixture.homeScore) {
      return `${fixture.awayTeam} Win`
    } else {
      return 'Draw'
    }
  }

  const getTotalGoals = (fixture: Fixture) => {
    if (fixture.homeScore === null || fixture.awayScore === null) {
      return 'TBD'
    }
    return fixture.homeScore + fixture.awayScore
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Fixture Comparison</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fixture 1 */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary-600 mb-2">Fixture 1</h3>
                <div className="bg-primary-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">{fixture1.homeTeamLogo}</div>
                        <div className="font-semibold text-gray-900">{fixture1.homeTeam}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600">
                          {fixture1.homeScore ?? '-'}
                        </div>
                      </div>
                      <div className="text-gray-400 font-medium">VS</div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600">
                          {fixture1.awayScore ?? '-'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{fixture1.awayTeamLogo}</div>
                        <div className="font-semibold text-gray-900">{fixture1.awayTeam}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixture 1 Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">League</span>
                  <span className="font-semibold">{fixture1.league}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">{formatDate(fixture1.date)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold">{fixture1.time}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold capitalize">{fixture1.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Result</span>
                  <span className="font-semibold">{getResult(fixture1)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Total Goals</span>
                  <span className="font-semibold">{getTotalGoals(fixture1)}</span>
                </div>
              </div>
            </div>

            {/* Fixture 2 */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary-600 mb-2">Fixture 2</h3>
                <div className="bg-primary-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">{fixture2.homeTeamLogo}</div>
                        <div className="font-semibold text-gray-900">{fixture2.homeTeam}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600">
                          {fixture2.homeScore ?? '-'}
                        </div>
                      </div>
                      <div className="text-gray-400 font-medium">VS</div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600">
                          {fixture2.awayScore ?? '-'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{fixture2.awayTeamLogo}</div>
                        <div className="font-semibold text-gray-900">{fixture2.awayTeam}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixture 2 Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">League</span>
                  <span className="font-semibold">{fixture2.league}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">{formatDate(fixture2.date)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold">{fixture2.time}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold capitalize">{fixture2.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Result</span>
                  <span className="font-semibold">{getResult(fixture2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Total Goals</span>
                  <span className="font-semibold">{getTotalGoals(fixture2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Same League</div>
                <div className="text-lg font-semibold">
                  {fixture1.league === fixture2.league ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Both Completed</div>
                <div className="text-lg font-semibold">
                  {fixture1.status === 'completed' && fixture2.status === 'completed' ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Higher Scoring</div>
                <div className="text-lg font-semibold">
                  {fixture1.status === 'completed' && fixture2.status === 'completed' 
                    ? (getTotalGoals(fixture1) > getTotalGoals(fixture2) ? 'Fixture 1' : 
                       getTotalGoals(fixture2) > getTotalGoals(fixture1) ? 'Fixture 2' : 'Tie')
                    : 'TBD'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
