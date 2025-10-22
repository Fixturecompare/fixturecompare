'use client'

import { useState, useEffect, useMemo } from 'react'
import Dropdown from '@/components/Dropdown'
import PredictiveFixtureCard, { PredictionType, FixtureData } from '@/components/PredictiveFixtureCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { getTeams, getFixtures } from '@/lib/footballApi'
import { getManualPoints } from '@/utils/getManualPoints'
import { fetchPoints } from '@/utils/fetchPoints'

interface Team {
  id: number
  name: string
  shortName: string
  logo: string
  leagueId: string
}

interface Predictions {
  [fixtureId: number]: PredictionType
}


const leagues = [
  { id: 'PL', name: 'Premier League' },
  { id: 'PD', name: 'La Liga' },
  { id: 'SA', name: 'Serie A' },
  { id: 'FL1', name: 'Ligue 1' },
  { id: 'BL1', name: 'Bundesliga' }
]

export default function LivePredictionsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [selectedTeamA, setSelectedTeamA] = useState<Team | null>(null)
  const [selectedTeamB, setSelectedTeamB] = useState<Team | null>(null)
  const [teamAFixtures, setTeamAFixtures] = useState<FixtureData[]>([])
  const [teamBFixtures, setTeamBFixtures] = useState<FixtureData[]>([])
  const [predictions, setPredictions] = useState<Predictions>({})
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  // Base points resolved from server endpoint (feature-flag drives live vs manual inside the API)
  const [basePointsA, setBasePointsA] = useState<number | null>(null)
  const [basePointsB, setBasePointsB] = useState<number | null>(null)
  const [loadingBase, setLoadingBase] = useState({ A: false, B: false })
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState({
    teams: false,
    teamAFixtures: false,
    teamBFixtures: false
  })
  const [errors, setErrors] = useState({
    teams: '',
    teamAFixtures: '',
    teamBFixtures: ''
  })

  // League-specific manual points map (PL, PD, SA, BL1, FL1)
  const leaguePointsMap = getManualPoints(selectedLeague)

  // Build a normalized lookup map for robust matching (kept for any auxiliary needs)
  const normalizeName = (s: string): string => {
    const lower = (s || '').toLowerCase()
    // remove diacritics
    const noDia = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // replace symbols and punctuation
    const cleaned = noDia
      .replace(/[.&',]/g, ' ') // dots, ampersands, apostrophes, commas
      .replace(/-/g, ' ')
      .replace(/\s+fc$/i, '') // trailing FC
      .replace(/^afc\s+/i, '') // leading AFC
      .replace(/^as\s+/i, '') // leading AS (e.g., AS Monaco)
      .replace(/^ac\s+/i, '') // leading AC
      .replace(/^rc\s+/i, '') // leading RC
      .replace(/^ud\s+/i, '') // leading UD
      .replace(/\bcalcio\b/g, '')
      .replace(/\bclub\b/g, '')
      .replace(/\bfutbol\b/g, '')
      .replace(/\bsporting\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return cleaned
  }

  const normalizedPointsMap = useMemo(() => {
    const m = new Map<string, number>()
    Object.entries(leaguePointsMap || {}).forEach(([name, pts]) => {
      m.set(normalizeName(name), pts as number)
    })
    return m
  }, [leaguePointsMap])

  // Load teams when league changes
  useEffect(() => {
    if (selectedLeague) {
      loadTeams(selectedLeague)
      // Reset team selections when league changes
      setSelectedTeamA(null)
      setSelectedTeamB(null)
      setTeamAFixtures([])
      setTeamBFixtures([])
    }
  }, [selectedLeague])

  // Load Team A fixtures
  useEffect(() => {
    if (selectedTeamA) {
      loadTeamFixtures(selectedTeamA.id, 'A')
    }
  }, [selectedTeamA])

  // Load Team B fixtures
  useEffect(() => {
    if (selectedTeamB) {
      loadTeamFixtures(selectedTeamB.id, 'B')
    }
  }, [selectedTeamB])


  const loadTeams = async (leagueCode: string) => {
    setLoading(prev => ({ ...prev, teams: true }))
    setErrors(prev => ({ ...prev, teams: '' }))
    
    try {
      const teams = await getTeams(leagueCode)
      const sorted = ([...(teams as Team[])]).sort((a, b) => a.name.localeCompare(b.name))
      setAvailableTeams(sorted)
    } catch (error) {
      setErrors(prev => ({ ...prev, teams: 'Failed to load teams. Please try again.' }))
      console.error('Error loading teams:', error)
    } finally {
      setLoading(prev => ({ ...prev, teams: false }))
    }
  }


  const loadTeamFixtures = async (teamId: number, team: 'A' | 'B') => {
    const loadingKey = team === 'A' ? 'teamAFixtures' : 'teamBFixtures'
    const errorKey = team === 'A' ? 'teamAFixtures' : 'teamBFixtures'
    
    setLoading(prev => ({ ...prev, [loadingKey]: true }))
    setErrors(prev => ({ ...prev, [errorKey]: '' }))
    
    try {
      const fixtures = await getFixtures(teamId, selectedLeague)
      const transformedFixtures: FixtureData[] = (fixtures as any[]).map((fixture: any) => ({
        id: fixture.id + (team === 'B' ? 100000 : 0), // Offset Team B IDs
        opponent: fixture.opponent,
        opponentLogo: fixture.opponentLogo,
        home: fixture.home,
        date: fixture.date,
        time: fixture.time,
        league: fixture.league,
        status: 'upcoming' as const,
        gameweek: fixture.gameweek
      }))
      
      if (team === 'A') {
        setTeamAFixtures(transformedFixtures)
      } else {
        setTeamBFixtures(transformedFixtures)
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [errorKey]: `Failed to load ${team === 'A' ? 'Team A' : 'Team B'} fixtures. Please try again.` }))
      console.error(`Error loading team ${team} fixtures:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handlePredictionChange = (fixtureId: number, prediction: PredictionType) => {
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: prediction
    }))
  }

  const calculatePoints = (fixtures: FixtureData[]) => {
    return fixtures.reduce((total, fixture) => {
      const prediction = predictions[fixture.id]
      switch (prediction) {
        case 'win': return total + 3
        case 'draw': return total + 1
        case 'lose': return total + 0
        default: return total
      }
    }, 0)
  }

  const resolveManualPoints = (name?: string): number => {
    if (!name) return 0
    const norm = normalizeName(name)
    const direct = normalizedPointsMap.get(norm)
    if (typeof direct === 'number') return direct

    // alias mapping (normalized -> normalized target)
    const aliasToTarget = new Map<string, string>()
    const alias = (from: string, to: string) => aliasToTarget.set(normalizeName(from), normalizeName(to))

    // Cross-league common aliases
    alias('Man City', 'Manchester City')
    alias('Man United', 'Manchester United')
    alias('Manchester Utd', 'Manchester United')
    alias('Newcastle', 'Newcastle United')
    alias('West Ham', 'West Ham United')
    alias('Wolves', 'Wolverhampton Wanderers')
    alias('Brighton Hove Albion', 'Brighton')
    alias('Tottenham', 'Tottenham Hotspur')
    alias('Bournemouth', 'AFC Bournemouth')

    // La Liga
    alias('Real Sociedad de Futbol', 'Real Sociedad')

    // Bundesliga
    alias('RB Leipzig', 'RasenBallsport Leipzig')
    alias('1. FC Koln', 'FC Cologne')
    alias('Koln', 'FC Cologne')
    alias('Borussia Monchengladbach', 'Borussia M.Gladbach')
    alias('1. FC Heidenheim 1846', 'FC Heidenheim')
    alias('St Pauli', 'St. Pauli')

    // Serie A
    alias('FC Internazionale Milano', 'Inter')
    alias('Internazionale', 'Inter')
    alias('US Sassuolo Calcio', 'Sassuolo')
    alias('Udinese Calcio', 'Udinese')
    alias('Hellas Verona', 'Verona')
    alias('Genoa CFC', 'Genoa')
    alias('Pisa Sporting Club', 'Pisa')

    // Ligue 1
    alias('Paris Saint-Germain', 'Paris Saint Germain')
    alias('Olympique de Marseille', 'Marseille')
    alias('AS Monaco FC', 'Monaco')
    alias('RC Lens', 'Lens')
    alias('Stade Brestois 29', 'Brest')
    alias('Le Havre AC', 'Le Havre')

    const target = aliasToTarget.get(norm)
    if (target) {
      const v = normalizedPointsMap.get(target)
      if (typeof v === 'number') return v
    }

    return 0
  }

  

  const resolveBasePoints = (name?: string): number => {
    return resolveManualPoints(name)
  }

  // Fetch base points for Team A via unified server endpoint
  useEffect(() => {
    const run = async () => {
      if (!selectedLeague || !selectedTeamA?.name) {
        setBasePointsA(null)
        return
      }
      setLoadingBase((s) => ({ ...s, A: true }))
      const { points } = await fetchPoints(selectedLeague, selectedTeamA.name)
      setBasePointsA(points)
      setLoadingBase((s) => ({ ...s, A: false }))
    }
    run()
  }, [selectedLeague, selectedTeamA?.name])

  // Fetch base points for Team B via unified server endpoint
  useEffect(() => {
    const run = async () => {
      if (!selectedLeague || !selectedTeamB?.name) {
        setBasePointsB(null)
        return
      }
      setLoadingBase((s) => ({ ...s, B: true }))
      const { points } = await fetchPoints(selectedLeague, selectedTeamB.name)
      setBasePointsB(points)
      setLoadingBase((s) => ({ ...s, B: false }))
    }
    run()
  }, [selectedLeague, selectedTeamB?.name])

  // Predicted additional points from user selections
  const teamAPredictionPoints = calculatePoints(teamAFixtures)
  const teamBPredictionPoints = calculatePoints(teamBFixtures)
  // Projected = unified base (from /api/points) + predicted; if base not yet loaded, fallback to manual to avoid flicker
  const teamAProjectedTotal = (basePointsA ?? resolveBasePoints(selectedTeamA?.name)) + teamAPredictionPoints
  const teamBProjectedTotal = (basePointsB ?? resolveBasePoints(selectedTeamB?.name)) + teamBPredictionPoints
  const hasPredictions = Object.keys(predictions).length > 0

  const generateShareImage = async () => {
    if (!selectedTeamA || !selectedTeamB || !hasPredictions) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for side-by-side desktop format
    canvas.width = 1000
    canvas.height = 700

    // Background gradient matching app (soft pastel purple with depth, diagonal)
    // Use diagonal gradient top-left to bottom-right with an intermediate stop for depth
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#a78bfa')      // stronger dark purple
    gradient.addColorStop(0.55, '#e9d5ff')   // mid lavender for depth
    gradient.addColorStop(1, '#f3e8ff')      // light lavender
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1000, 700)

    // Title
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Fixture Compare – Predictions', 500, 40)

    // Helper function to draw fixture card
    const drawFixtureCard = (fixture: any, teamName: string, isHome: boolean, cardX: number, cardY: number) => {
      const prediction = predictions[fixture.id]
      if (!prediction) return cardY

      const cardWidth = 380
      const cardHeight = 70
      
      // Card background (white rounded rectangle)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      
      // Rounded rectangle
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 8)
      ctx.fill()
      ctx.stroke()

      // Date and gameweek
      ctx.font = '10px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'left'
      const date = new Date(fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ctx.fillText(date, cardX + 10, cardY + 15)
      
      ctx.textAlign = 'right'
      ctx.fillText(`GW${fixture.gameweek || Math.floor(Math.random() * 38) + 1}`, cardX + cardWidth - 10, cardY + 15)

      // Home/Away badge
      const badgeText = isHome ? 'HOME' : 'AWAY'
      const badgeColor = isHome ? '#dcfce7' : '#dbeafe'
      const badgeTextColor = isHome ? '#166534' : '#1e40af'
      
      ctx.fillStyle = badgeColor
      ctx.fillRect(cardX + cardWidth - 60, cardY + 20, 45, 16)
      ctx.font = 'bold 8px Arial'
      ctx.fillStyle = badgeTextColor
      ctx.textAlign = 'center'
      ctx.fillText(badgeText, cardX + cardWidth - 37.5, cardY + 30)

      // Team vs Opponent
      ctx.font = 'bold 12px Arial'
      ctx.fillStyle = '#1f2937'
      ctx.textAlign = 'center'
      
      const matchText = isHome ? `${teamName} vs ${fixture.opponent}` : `${fixture.opponent} vs ${teamName}`
      ctx.fillText(matchText, cardX + cardWidth/2, cardY + 40)

      // Prediction buttons
      const buttonWidth = 45
      const buttonHeight = 18
      const buttonY = cardY + 48
      const buttonSpacing = 55
      const startX = cardX + cardWidth/2 - (buttonSpacing * 1.5) + (buttonWidth / 2)

      // Win button
      const winSelected = prediction === 'win'
      ctx.fillStyle = winSelected ? '#059669' : '#ffffff'
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(startX, buttonY, buttonWidth, buttonHeight, 4)
      ctx.fill()
      ctx.stroke()
      
      ctx.font = 'bold 9px Arial'
      ctx.fillStyle = winSelected ? '#ffffff' : '#059669'
      ctx.textAlign = 'center'
      ctx.fillText('W', startX + buttonWidth/2, buttonY + 12)

      // Draw button
      const drawSelected = prediction === 'draw'
      ctx.fillStyle = drawSelected ? '#d97706' : '#ffffff'
      ctx.strokeStyle = '#d97706'
      ctx.beginPath()
      ctx.roundRect(startX + buttonSpacing, buttonY, buttonWidth, buttonHeight, 4)
      ctx.fill()
      ctx.stroke()
      
      ctx.fillStyle = drawSelected ? '#ffffff' : '#d97706'
      ctx.fillText('D', startX + buttonSpacing + buttonWidth/2, buttonY + 12)

      // Lose button
      const loseSelected = prediction === 'lose'
      ctx.fillStyle = loseSelected ? '#dc2626' : '#ffffff'
      ctx.strokeStyle = '#dc2626'
      ctx.beginPath()
      ctx.roundRect(startX + buttonSpacing * 2, buttonY, buttonWidth, buttonHeight, 4)
      ctx.fill()
      ctx.stroke()
      
      ctx.fillStyle = loseSelected ? '#ffffff' : '#dc2626'
      ctx.fillText('L', startX + buttonSpacing * 2 + buttonWidth/2, buttonY + 12)

      return cardY + cardHeight + 8
    }

    // Helpers
    const drawInitialCircle = (x: number, y: number, r: number, initial: string) => {
      ctx.fillStyle = '#DBEAFE' // blue-100
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1E40AF' // blue-800
      ctx.font = `bold ${Math.floor(r)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initial.toUpperCase(), x, y + 1)
    }

    const getInitial = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase()

    // Team A Section (Left Side)
    const leftX = 50
    let leftY = 80

    // Header row: initial + name + subtitle, points metric on right
    drawInitialCircle(leftX + 18, leftY, 14, getInitial(selectedTeamA.name))
    ctx.fillStyle = '#111827' // gray-900
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(selectedTeamA.name, leftX + 40, leftY + 4)
    ctx.fillStyle = '#4B5563' // gray-600
    ctx.font = '12px Arial'
    ctx.fillText('Next 5 Fixtures', leftX + 40, leftY + 22)
    // Right metric box uses unified base points (fallback to manual only if not yet loaded)
    const teamAPoints = (typeof basePointsA === 'number' ? basePointsA : resolveBasePoints(selectedTeamA.name))
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(String(teamAPoints || '—'), leftX + 380, leftY + 6)
    ctx.fillStyle = '#6B7280' // gray-500
    ctx.font = '10px Arial'
    ctx.fillText('Points', leftX + 380, leftY + 22)
    leftY += 40

    // Team A fixtures
    const teamAWithPredictions = teamAFixtures.filter(f => predictions[f.id])
    teamAWithPredictions.slice(0, 6).forEach(fixture => {
      leftY = drawFixtureCard(fixture, selectedTeamA.name, fixture.home, leftX, leftY)
    })

    // Team B Section (Right Side)
    const rightX = 520
    let rightY = 80

    // Header row: initial + name + subtitle, points metric on right
    drawInitialCircle(rightX + 18, rightY, 14, getInitial(selectedTeamB.name))
    ctx.fillStyle = '#111827' // gray-900
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(selectedTeamB.name, rightX + 40, rightY + 4)
    ctx.fillStyle = '#4B5563' // gray-600
    ctx.font = '12px Arial'
    ctx.fillText('Next 5 Fixtures', rightX + 40, rightY + 22)
    // Right metric box uses unified base points (fallback to manual only if not yet loaded)
    const teamBPoints = (typeof basePointsB === 'number' ? basePointsB : resolveBasePoints(selectedTeamB.name))
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(String(teamBPoints || '—'), rightX + 380, rightY + 6)
    ctx.fillStyle = '#6B7280'
    ctx.font = '10px Arial'
    ctx.fillText('Points', rightX + 380, rightY + 22)
    rightY += 40

    // Team B fixtures
    const teamBWithPredictions = teamBFixtures.filter(f => predictions[f.id])
    teamBWithPredictions.slice(0, 6).forEach(fixture => {
      rightY = drawFixtureCard(fixture, selectedTeamB.name, fixture.home, rightX, rightY)
    })

    // Points Section at Bottom
    const pointsY = Math.max(leftY, rightY) + 30

    // Team A Projected Points (manual base + predicted)
    ctx.font = 'bold 32px Arial'
    ctx.fillStyle = '#1f2937'
    ctx.textAlign = 'center'
    ctx.fillText(teamAProjectedTotal.toString(), leftX + 190, pointsY)
    
    ctx.font = '14px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('projected points', leftX + 190, pointsY + 25)

    // Team B Projected Points (manual base + predicted)
    ctx.font = 'bold 32px Arial'
    ctx.fillStyle = '#1f2937'
    ctx.fillText(teamBProjectedTotal.toString(), rightX + 190, pointsY)
    
    ctx.font = '14px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('projected points', rightX + 190, pointsY + 25)

    // VS in center
    ctx.font = 'bold 20px Arial'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText('VS', 500, pointsY - 10)

    // Winner announcement
    if (teamAProjectedTotal !== teamBProjectedTotal) {
      const winner = teamAProjectedTotal > teamBProjectedTotal ? selectedTeamA.name : selectedTeamB.name
      const pointDiff = Math.abs(teamAProjectedTotal - teamBProjectedTotal)
      
      ctx.font = 'bold 16px Arial'
      ctx.fillStyle = '#059669'
      ctx.fillText(`${winner} leads by ${pointDiff} point${pointDiff !== 1 ? 's' : ''}`, 500, pointsY + 60)
    }

    // Footer
    ctx.font = '12px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Generated by Fixture Compare', 500, pointsY + 90)

    return canvas.toDataURL('image/png')
  }

  const handleDownloadImage = async () => {
    const imageData = await generateShareImage()
    if (!imageData) return

    const link = document.createElement('a')
    link.download = `fixture-predictions-${selectedTeamA?.name}-vs-${selectedTeamB?.name}.png`
    link.href = imageData
    link.click()
  }

  const handleShareToSocial = async (platform: string) => {
    // Generate the same image to keep UX consistent, even if we don't auto-attach it
    const imageData = await generateShareImage()
    if (!imageData) return

    const text = `${selectedTeamA?.name} vs ${selectedTeamB?.name} - My projected totals: ${teamAProjectedTotal} vs ${teamBProjectedTotal} points!`

    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      window.open(twitterUrl, '_blank')
      alert('Tweet text opened. To include the image, first use Download Image, then attach the saved PNG to your tweet.')
      return
    }

    if (platform === 'copy') {
      await navigator.clipboard.writeText(text)
      alert('Results copied to clipboard!')
    }
  }


  const getTeamBOptions = () => {
    return availableTeams
      .filter(team => team.id !== selectedTeamA?.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const retryLoadTeams = () => {
    if (selectedLeague) {
      loadTeams(selectedLeague)
    }
  }

  const retryLoadTeamAFixtures = () => {
    if (selectedTeamA) {
      loadTeamFixtures(selectedTeamA.id, 'A')
    }
  }

  const retryLoadTeamBFixtures = () => {
    if (selectedTeamB) {
      loadTeamFixtures(selectedTeamB.id, 'B')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a78bfa] via-[#e9d5ff] to-[#f3e8ff]">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-montserrat">
            Fixture Compare
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-montserrat uppercase italic">
            Compare Fixtures - Forecast Results - Project Points
          </p>
        </div>

        {/* League Selection */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select League
          </label>
          <Dropdown
            options={leagues.map(league => ({ value: league.id, label: league.name }))}
            value={selectedLeague}
            onChange={setSelectedLeague}
            placeholder="Choose a league..."
          />
        </div>

        {/* Teams Loading/Error */}
        {loading.teams && (
          <div className="flex justify-center mb-8">
            <LoadingSpinner message="Loading teams..." />
          </div>
        )}

        {errors.teams && (
          <div className="max-w-md mx-auto mb-8">
            <ErrorMessage message={errors.teams} onRetry={retryLoadTeams} />
          </div>
        )}

        {/* Team Selection */}
        {selectedLeague && !loading.teams && !errors.teams && availableTeams.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team A
              </label>
              <Dropdown
                options={availableTeams.map(team => ({ 
                  value: team.id.toString(), 
                  label: team.name
                }))}
                value={selectedTeamA?.id.toString() || ''}
                onChange={(value) => {
                  const team = availableTeams.find(t => t.id.toString() === value)
                  setSelectedTeamA(team || null)
                }}
                placeholder="Choose Team A..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team B
              </label>
              <Dropdown
                options={getTeamBOptions().map(team => ({ 
                  value: team.id.toString(), 
                  label: team.name
                }))}
                value={selectedTeamB?.id.toString() || ''}
                onChange={(value) => {
                  const team = availableTeams.find(t => t.id.toString() === value)
                  setSelectedTeamB(team || null)
                }}
                placeholder="Choose Team B..."
                disabled={!selectedTeamA}
              />
            </div>
          </div>
        )}

        {/* Fixtures Comparison */}
        {selectedTeamA && selectedTeamB && (
          <div className="space-y-8">
            {/* Fixtures Grid */}
            <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {/* Team A Fixtures */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedTeamA.logo && selectedTeamA.logo.startsWith('http') ? (
                        <img 
                          src={selectedTeamA.logo} 
                          alt={`${selectedTeamA.name} crest`}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm ${selectedTeamA.logo && selectedTeamA.logo.startsWith('http') ? 'hidden' : ''}`}>
                        {(selectedTeamA.name?.trim()?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{selectedTeamA.name}</h3>
                        <p className="text-sm text-gray-600">Next 5 Fixtures</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{basePointsA == null ? '—' : basePointsA}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                </div>
                
                {loading.teamAFixtures && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner message="Loading fixtures..." />
                  </div>
                )}
                
                {errors.teamAFixtures && (
                  <ErrorMessage message={errors.teamAFixtures} onRetry={retryLoadTeamAFixtures} />
                )}
                
                {!loading.teamAFixtures && !errors.teamAFixtures && (
                  teamAFixtures.length > 0 ? (
                    teamAFixtures.map(fixture => (
                      <PredictiveFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        prediction={predictions[fixture.id]}
                        onPredictionChange={handlePredictionChange}
                        teamName={selectedTeamA.name}
                        teamLogo={selectedTeamA.logo && selectedTeamA.logo.startsWith('http') ? selectedTeamA.logo : selectedTeamA.name.charAt(0)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming fixtures found
                    </div>
                  )
                )}
              </div>

              {/* Team B Fixtures */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedTeamB.logo && selectedTeamB.logo.startsWith('http') ? (
                        <img 
                          src={selectedTeamB.logo} 
                          alt={`${selectedTeamB.name} crest`}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm ${selectedTeamB.logo && selectedTeamB.logo.startsWith('http') ? 'hidden' : ''}`}>
                        {selectedTeamB.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{selectedTeamB.name}</h3>
                        <p className="text-sm text-gray-600">Next 5 Fixtures</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{basePointsB == null ? '—' : basePointsB}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                </div>
                
                {loading.teamBFixtures && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner message="Loading fixtures..." />
                  </div>
                )}
                
                {errors.teamBFixtures && (
                  <ErrorMessage message={errors.teamBFixtures} onRetry={retryLoadTeamBFixtures} />
                )}
                
                {!loading.teamBFixtures && !errors.teamBFixtures && (
                  teamBFixtures.length > 0 ? (
                    teamBFixtures.map(fixture => (
                      <PredictiveFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        prediction={predictions[fixture.id]}
                        onPredictionChange={handlePredictionChange}
                        teamName={selectedTeamB.name}
                        teamLogo={selectedTeamB.logo && selectedTeamB.logo.startsWith('http') ? selectedTeamB.logo : selectedTeamB.name.charAt(0)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming fixtures found
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Calculate Button & Results */}
            {hasPredictions && (
              <div className="space-y-6">
                <div className="text-center">
                  <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Calculate Projected Points
                  </button>
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-6 font-montserrat">
                    Projected Points Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {selectedTeamA.logo && selectedTeamA.logo.startsWith('http') ? (
                          <img 
                            src={selectedTeamA.logo} 
                            alt={`${selectedTeamA.name} crest`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs ${selectedTeamA.logo && selectedTeamA.logo.startsWith('http') ? 'hidden' : ''}`}>
                          {(selectedTeamA.name?.trim()?.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{selectedTeamA.name}</span>
                      </div>
                      <div className="text-3xl font-bold text-primary-600 font-montserrat">{teamAProjectedTotal}</div>
                      <div className="text-sm text-gray-500">projected points</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {selectedTeamB.logo && selectedTeamB.logo.startsWith('http') ? (
                          <img 
                            src={selectedTeamB.logo} 
                            alt={`${selectedTeamB.name} crest`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs ${selectedTeamB.logo && selectedTeamB.logo.startsWith('http') ? 'hidden' : ''}`}>
                          {(selectedTeamB.name?.trim()?.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{selectedTeamB.name}</span>
                      </div>
                      <div className="text-3xl font-bold text-primary-600 font-montserrat">{teamBProjectedTotal}</div>
                      <div className="text-sm text-gray-500">projected points</div>
                    </div>
                  </div>

                  {teamAProjectedTotal !== teamBProjectedTotal && (
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                      <p className="text-lg font-semibold text-gray-900 font-montserrat">
                        {teamAProjectedTotal > teamBProjectedTotal ? selectedTeamA.name : selectedTeamB.name} 
                        <span className="text-primary-600 ml-1">
                          leads by {Math.abs(teamAProjectedTotal - teamBProjectedTotal)} point{Math.abs(teamAProjectedTotal - teamBProjectedTotal) !== 1 ? 's' : ''}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Share Results Section */}
            {selectedTeamA && selectedTeamB && hasPredictions && (
              <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center font-montserrat">
                  Share Your Predictions
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Image</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareToSocial('twitter')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Share to Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareToSocial('copy')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Results</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Generate a shareable image with your prediction results and points totals
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedLeague && (
          <div className="text-center py-16">
            <p className="max-w-md mx-auto text-xl md:text-2xl font-semibold font-montserrat tracking-wide leading-relaxed text-black">
              Select a league, choose two teams, and compare their next five fixtures to make your predictions
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
