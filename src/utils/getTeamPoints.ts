import { getManualPoints } from "@/utils/getManualPoints";

// Simple in-memory cache per league for the session
const standingsCache: Record<string, { at: number; map: Map<string, number> }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizeName(s: string): string {
  const lower = (s || '').toLowerCase();
  const noDia = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleaned = noDia
    .replace(/[.&',]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+fc$/i, '')
    .replace(/^afc\s+/i, '')
    .replace(/^as\s+/i, '')
    .replace(/^ac\s+/i, '')
    .replace(/^rc\s+/i, '')
    .replace(/^ud\s+/i, '')
    .replace(/\bcalcio\b/g, '')
    .replace(/\bclub\b/g, '')
    .replace(/\bfutbol\b/g, '')
    .replace(/\bsporting\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

function buildAliasMap(): Map<string, string> {
  const aliasToTarget = new Map<string, string>();
  const alias = (from: string, to: string) => aliasToTarget.set(normalizeName(from), normalizeName(to));
  // Cross-league
  alias('Man City', 'Manchester City');
  alias('Man United', 'Manchester United');
  alias('Manchester Utd', 'Manchester United');
  alias('Newcastle', 'Newcastle United');
  alias('West Ham', 'West Ham United');
  alias('Wolves', 'Wolverhampton Wanderers');
  alias('Brighton Hove Albion', 'Brighton');
  alias('Tottenham', 'Tottenham Hotspur');
  alias('Bournemouth', 'AFC Bournemouth');
  // La Liga
  alias('Real Sociedad de Futbol', 'Real Sociedad');
  // Bundesliga
  alias('RB Leipzig', 'RasenBallsport Leipzig');
  alias('1. FC Koln', 'FC Cologne');
  alias('Koln', 'FC Cologne');
  alias('Borussia Monchengladbach', 'Borussia M.Gladbach');
  alias('1. FC Heidenheim 1846', 'FC Heidenheim');
  alias('St Pauli', 'St. Pauli');
  // Serie A
  alias('FC Internazionale Milano', 'Inter');
  alias('Internazionale', 'Inter');
  alias('US Sassuolo Calcio', 'Sassuolo');
  alias('Udinese Calcio', 'Udinese');
  alias('Hellas Verona', 'Verona');
  alias('Genoa CFC', 'Genoa');
  alias('Pisa Sporting Club', 'Pisa');
  // Ligue 1
  alias('Paris Saint-Germain', 'Paris Saint Germain');
  alias('Olympique de Marseille', 'Marseille');
  alias('AS Monaco FC', 'Monaco');
  alias('RC Lens', 'Lens');
  alias('Stade Brestois 29', 'Brest');
  alias('Le Havre AC', 'Le Havre');
  return aliasToTarget;
}

async function getStandingsMap(leagueCode: string): Promise<Map<string, number>> {
  const now = Date.now();
  const cached = standingsCache[leagueCode];
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.map;
  }
  try {
    const res = await fetch(`/api/standings/${leagueCode}`);
    const json = await res.json();
    const table: Array<{ teamName: string; points: number }> = json?.standings?.[0]?.table || json?.data || [];
    const map = new Map<string, number>();
    for (const row of table) {
      if (!row?.teamName) continue;
      map.set(normalizeName(row.teamName), Number(row.points) || 0);
    }
    standingsCache[leagueCode] = { at: now, map };
    return map;
  } catch (e) {
    // return empty to trigger fallback
    return new Map<string, number>();
  }
}

export async function getTeamPoints(leagueCode: string | undefined, teamName: string | undefined): Promise<number> {
  if (!leagueCode || !teamName) return 0;
  const norm = normalizeName(teamName);
  const aliasMap = buildAliasMap();
  const target = aliasMap.get(norm) || norm;

  // 1) Try live standings
  const liveMap = await getStandingsMap(leagueCode);
  const live = liveMap.get(target);
  if (typeof live === 'number') return live;

  // 2) Fallback to manual
  const manual = getManualPoints(leagueCode);
  // Try exact, then normalized match against manual keys
  if (Object.prototype.hasOwnProperty.call(manual, teamName)) return manual[teamName];
  // Build normalized manual map
  const normalizedManual = new Map<string, number>();
  Object.entries(manual).forEach(([k, v]) => normalizedManual.set(normalizeName(k), v));
  const aliasTarget = aliasMap.get(norm) || norm;
  return normalizedManual.get(aliasTarget) ?? 0;
}
