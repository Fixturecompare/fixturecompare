'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
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

  // --- Mobile detection for summary-only abbreviation logic ---
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null
    const update = () => setIsMobile(Boolean(mq?.matches))
    update()
    mq?.addEventListener('change', update)
    return () => mq?.removeEventListener('change', update)
  }, [])

  // Helpers to abbreviate names when needed for symmetry on mobile
  const deriveInitials = (name: string): string => {
    const cleaned = (name || '')
      .replace(/\b(football\s*club|fc|cf|sd|ac|as|rc|ud|de|club|futbol|calcio)\b/gi, ' ')
      .replace(/[&.']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const parts = cleaned.split(' ').filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
    // Prefer up to 3-4 initials
    const initials = parts.map(p => p[0]!.toUpperCase()).join('')
    return initials.slice(0, 4)
  }

  const getAbbr = (team: Team | null): string => {
    if (!team) return ''
    // Prefer provided shortName if it's meaningfully shorter; else derive initials
    const short = (team.shortName || '').trim()
    const hasShort = short && short.length <= 12
    return hasShort ? short : deriveInitials(team.name || '')
  }

  const MAX_MOBILE_CHARS = 18
  const computeDisplayNames = (a: Team | null, b: Team | null) => {
    const aFull = a?.name || ''
    const bFull = b?.name || ''
    if (!isMobile) return { aName: aFull, bName: bFull, aTitle: undefined, bTitle: undefined }

    const aLen = aFull.length
    const bLen = bFull.length
    const aTooLong = aLen > MAX_MOBILE_CHARS
    const bTooLong = bLen > MAX_MOBILE_CHARS
    const imbalanceA = aLen - bLen >= 5
    const imbalanceB = bLen - aLen >= 5

    let aUseAbbr = aTooLong || imbalanceA
    let bUseAbbr = bTooLong || imbalanceB
    // If both are long, abbreviate both for symmetry
    if (aTooLong && bTooLong) {
      aUseAbbr = true
      bUseAbbr = true
    }

    const aAbbr = getAbbr(a)
    const bAbbr = getAbbr(b)
    const aName = aUseAbbr ? aAbbr : aFull
    const bName = bUseAbbr ? bAbbr : bFull
    const aTitle = aUseAbbr ? aFull : undefined
    const bTitle = bUseAbbr ? bFull : undefined
    return { aName, bName, aTitle, bTitle }
  }

  const { aName: summaryAName, bName: summaryBName, aTitle: summaryATitle, bTitle: summaryBTitle } = useMemo(
    () => computeDisplayNames(selectedTeamA, selectedTeamB),
    [selectedTeamA, selectedTeamB, isMobile]
  )

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
      const result: any = await getTeams(leagueCode)
      const teamsArr: Team[] = result && typeof result === 'object' && 'success' in result
        ? (result.success ? (result.data?.teams || []) : [])
        : (result as Team[])

      if (Array.isArray(teamsArr) && teamsArr.length >= 0) {
        const sorted = ([...teamsArr]).sort((a, b) => a.name.localeCompare(b.name))
        setAvailableTeams(sorted)
      } else {
        throw new Error('Unexpected teams response shape')
      }
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
      const res: any = await getFixtures(teamId, selectedLeague)
      const fixturesArr: any[] = res && typeof res === 'object' && 'success' in res
        ? (res.success ? (res.data?.fixtures || []) : [])
        : (res as any[])

      const transformedFixtures: FixtureData[] = fixturesArr.map((fixture: any) => ({
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
  const handleShareDownload = () => {
    if (!selectedLeague || !selectedTeamA || !selectedTeamB) return
    // Build a full export payload so /export/predictions can render synchronously as well
    const baseA = (basePointsA ?? resolveBasePoints(selectedTeamA?.name)) || 0
    const baseB = (basePointsB ?? resolveBasePoints(selectedTeamB?.name)) || 0
    const addA = calculatePoints(teamAFixtures)
    const addB = calculatePoints(teamBFixtures)
    const fullPayload = {
      v: 3,
      league: selectedLeague,
      teamA: { id: selectedTeamA.id, name: selectedTeamA.name, shortName: selectedTeamA.shortName, logo: selectedTeamA.logo },
      teamB: { id: selectedTeamB.id, name: selectedTeamB.name, shortName: selectedTeamB.shortName, logo: selectedTeamB.logo },
      fixturesA: teamAFixtures.slice(0, 5).map(f => ({
        id: Number(f.id),
        opponent: f.opponent,
        opponentLogo: f.opponentLogo,
        home: !!f.home,
        date: f.date,
        time: f.time,
        league: f.league,
        status: f.status,
        gameweek: f.gameweek,
      })),
      fixturesB: teamBFixtures.slice(0, 5).map(f => ({
        id: Number(f.id), // already offset by +100000 in client loader
        opponent: f.opponent,
        opponentLogo: f.opponentLogo,
        home: !!f.home,
        date: f.date,
        time: f.time,
        league: f.league,
        status: f.status,
        gameweek: f.gameweek,
      })),
      predictions,
      baseTotals: { A: baseA, B: baseB },
      totals: { A: baseA + addA, B: baseB + addB },
    }
    const json = JSON.stringify(fullPayload)
    const b64 = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : ''
    const params = new URLSearchParams({
      league: selectedLeague,
      teamAId: String(selectedTeamA.id),
      teamBId: String(selectedTeamB.id),
      data: b64,
    })
    // Primary: generate and download via API (server will ignore extra fields and rebuild a fresh payload for consistency)
    window.location.href = `/api/share-image?${params.toString()}`
    // Tip: you can also preview directly by opening `/export/predictions?data=${b64}` in a new tab.
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
          <div className="flex justify-center mb-4">
            <Image
              src="/fixturecompare-logo.png"
              alt="Fixture Compare"
              width={552}
              height={151}
              priority
            />
          </div>
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

            {/* Results Summary */}
            {hasPredictions && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-400 shadow p-6 max-w-2xl mx-auto">
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
                        <span
                          className="font-semibold text-gray-900 whitespace-nowrap sm:whitespace-normal max-w-[140px] sm:max-w-none truncate"
                          title={summaryATitle}
                        >
                          {summaryAName}
                        </span>
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
                        <span
                          className="font-semibold text-gray-900 whitespace-nowrap sm:whitespace-normal max-w-[140px] sm:max-w-none truncate"
                          title={summaryBTitle}
                        >
                          {summaryBName}
                        </span>
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
              <div className="mt-8 bg-white rounded-lg border border-gray-400 shadow p-6">
                <div className="flex justify-center">
                  <button
                    onClick={handleShareDownload}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Share Your Predictions
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Generate a shareable image with your predicted results and points totals
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedLeague && (
          <div className="text-center py-16">
            <p
              className="max-w-md mx-auto text-xl md:text-2xl font-semibold font-montserrat tracking-wide leading-relaxed text-gray-600"
              style={{ fontFamily: 'var(--font-darker)' }}
            >
              Select a league, choose two teams, and compare their next five fixtures to make your predictions
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
