// Normalization and aliasing helpers for team name matching
// Shared between server endpoints and client utilities

export function normalizeName(s: string): string {
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

export function buildAliasMap(): Map<string, string> {
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

export function normalizeWithAliases(name: string): string {
  const norm = normalizeName(name);
  const aliasMap = buildAliasMap();
  return aliasMap.get(norm) || norm;
}
