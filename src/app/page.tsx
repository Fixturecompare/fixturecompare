'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import FixtureCard from '@/components/FixtureCard'
import ComparisonModal from '@/components/ComparisonModal'

// Mock fixture data
const fixtures = [
  {
    id: 1,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeScore: 2,
    awayScore: 1,
    date: '2024-01-15',
    time: '15:00',
    league: 'Premier League',
    status: 'completed',
    homeTeamLogo: '🔴',
    awayTeamLogo: '🔴'
  },
  {
    id: 2,
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeScore: null,
    awayScore: null,
    date: '2024-01-20',
    time: '17:30',
    league: 'Premier League',
    status: 'upcoming',
    homeTeamLogo: '🔴',
    awayTeamLogo: '🔵'
  },
  {
    id: 3,
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    homeScore: 3,
    awayScore: 2,
    date: '2024-01-18',
    time: '20:00',
    league: 'La Liga',
    status: 'completed',
    homeTeamLogo: '🔵',
    awayTeamLogo: '⚪'
  },
  {
    id: 4,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    homeScore: null,
    awayScore: null,
    date: '2024-01-22',
    time: '18:30',
    league: 'Bundesliga',
    status: 'upcoming',
    homeTeamLogo: '🔴',
    awayTeamLogo: '🟡'
  }
]

export default function Home() {
  const [selectedFixtures, setSelectedFixtures] = useState<number[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const handleFixtureSelect = (fixtureId: number) => {
    setSelectedFixtures(prev => {
      if (prev.includes(fixtureId)) {
        return prev.filter(id => id !== fixtureId)
      } else if (prev.length < 2) {
        return [...prev, fixtureId]
      } else {
        return [prev[1], fixtureId]
      }
    })
  }

  const handleCompare = () => {
    if (selectedFixtures.length === 2) {
      setShowComparison(true)
    }
  }

  const selectedFixtureData = fixtures.filter(f => selectedFixtures.includes(f.id))

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Fixture <span className="text-primary-600">Compare</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Compare your favorite sports fixtures with our premium analytics platform
          </p>
          
          {/* Comparison Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-gray-100">
              <span className="text-sm text-gray-500">Selected: </span>
              <span className="font-semibold text-primary-600">
                {selectedFixtures.length}/2 fixtures
              </span>
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedFixtures.length !== 2}
              className={`btn-primary ${
                selectedFixtures.length !== 2 
                  ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' 
                  : ''
              }`}
            >
              Compare Fixtures
            </button>
          </div>
        </div>

        {/* Fixtures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fixtures.map((fixture, index) => (
            <div
              key={fixture.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <FixtureCard
                fixture={fixture}
                isSelected={selectedFixtures.includes(fixture.id)}
                onSelect={() => handleFixtureSelect(fixture.id)}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {fixtures.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No fixtures available</h3>
            <p className="text-gray-600">Check back later for upcoming matches</p>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          fixtures={selectedFixtureData}
          onClose={() => setShowComparison(false)}
        />
      )}
    </main>
  )
}
