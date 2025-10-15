/*
  FixtureCompare.com: Sync manual points totals to API-registered team names
  Usage:
    1) npm i -D ts-node typescript unidecode node-fetch
    2) FOOTBALL_DATA_API_TOKEN=... npx ts-node src/scripts/cascade-update-points.ts

  This script validates that all teams in La Liga (PD), Bundesliga (BL1), Serie A (SA), and Ligue 1 (FL1)
  can be matched to a manual points total using exact API names, with enhanced normalization and aliases.
*/

import { unidecode } from "unidecode";

// If using Node 18+, global fetch exists; otherwise uncomment the import below
// @ts-ignore
import fetch_ from 'node-fetch';
// @ts-ignore
const fetchAny: typeof fetch = (global as any).fetch || (fetch_ as any);

const FD_API = 'https://api.football-data.org/v4';
const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN || '';

export const MANUAL_POINTS = {
  la_liga: {
    "Real Madrid CF": 21,
    "FC Barcelona": 19,
    "Villarreal CF": 16,
    "Real Betis Balompié": 15,
    "Club Atlético de Madrid": 13,
    "Sevilla FC": 13,
    "Elche CF": 13,
    "Athletic Club": 13,
    "RCD Espanyol de Barcelona": 12,
    "Deportivo Alavés": 11,
    "Getafe CF": 11,
    "CA Osasuna": 10,
    "Levante UD": 8,
    "Rayo Vallecano de Madrid": 8,
    "Valencia CF": 8,
    "RC Celta de Vigo": 6,
    "Real Oviedo": 6,
    "Girona FC": 6,
    "Real Sociedad de Fútbol": 5,
    "RCD Mallorca": 5
  },

  bundesliga: {
    "FC Bayern München": 18,
    "Borussia Dortmund": 14,
    "RB Leipzig": 13,
    "VfB Stuttgart": 12,
    "Bayer 04 Leverkusen": 11,
    "1. FC Köln": 10,
    "Eintracht Frankfurt": 9,
    "SC Freiburg": 8,
    "Hamburger SV": 8,
    "FC St. Pauli 1910": 7,
    "TSG 1899 Hoffenheim": 7,
    "SV Werder Bremen": 7,
    "1. FC Union Berlin": 7,
    "FC Augsburg": 6,
    "VfL Wolfsburg": 5,
    "1. FSV Mainz 05": 4,
    "Borussia Mönchengladbach": 3,
    "1. FC Heidenheim 1846": 3
  },

  serie_a: {
    "SSC Napoli": 15,
    "AS Roma": 15,
    "AC Milan": 13,
    "FC Internazionale Milano": 12,
    "Juventus FC": 12,
    "Atalanta BC": 10,
    "Bologna FC 1909": 10,
    "Como 1907": 9,
    "US Sassuolo Calcio": 9,
    "US Cremonese": 9,
    "Cagliari Calcio": 8,
    "Udinese Calcio": 8,
    "SS Lazio": 7,
    "Parma Calcio 1913": 5,
    "US Lecce": 5,
    "Torino FC": 5,
    "ACF Fiorentina": 3,
    "Hellas Verona FC": 3,
    "Genoa CFC": 2,
    "AC Pisa 1909": 2
  },

  ligue_1: {
    "Paris Saint-Germain FC": 16,
    "Olympique de Marseille": 15,
    "RC Strasbourg Alsace": 15,
    "Olympique Lyonnais": 15,
    "AS Monaco FC": 13,
    "Racing Club de Lens": 13,
    "Lille OSC": 11,
    "Paris FC": 10,
    "Toulouse FC": 10,
    "Stade Rennais FC 1901": 10,
    "Stade Brestois 29": 8,
    "OGC Nice": 8,
    "FC Lorient": 7,
    "Le Havre AC": 6,
    "FC Nantes": 6,
    "AJ Auxerre": 6,
    "Angers SCO": 5,
    "FC Metz": 2
  }
};

function normalizeName(name: string): string {
  const cleaned = unidecode(name)
    .toLowerCase()
    .replace(/\b(fc|cf|ac|us|aj|sc|ss|bc|sco|ud|sd|cd|ca|rc|vfl|1\.?|club)\b/g, "")
    .replace(/\d{2,4}/g, "") // remove years like 1909, 1910
    .replace(/[^a-z]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

const ALIASES: Record<string, string> = {
  // Premier League (kept for parity)
  "sunderland afc": "sunderland",
  "tottenham hotspur": "tottenham",
  "leeds united": "leeds",
  "west ham united": "west ham",

  // La Liga
  "club atletico de madrid": "atletico madrid",
  "rcd espanyol de barcelona": "espanyol",
  "fc barcelona": "barcelona",
  "getafe cf": "getafe",
  "real madrid cf": "real madrid",
  "rayo vallecano de madrid": "rayo vallecano",
  "levante ud": "levante",
  "rcd mallorca": "mallorca",
  "real betis balompie": "real betis",
  "villarreal cf": "villarreal",
  "valencia cf": "valencia",
  "deportivo alaves": "alaves",
  "elche cf": "elche",
  "rc celta de vigo": "celta vigo",
  "ca osasuna": "osasuna",

  // Bundesliga
  "fc bayern munchen": "bayern munich",
  "bayer 04 leverkusen": "bayer leverkusen",
  "tsg 1899 hoffenheim": "hoffenheim",
  "1 fsv mainz 05": "mainz 05",
  "fc st pauli 1910": "st pauli",
  "1 fc union berlin": "union berlin",
  "vfl wolfsburg": "wolfsburg",
  "sv werder bremen": "werder bremen",
  "sc freiburg": "freiburg",
  "fc augsburg": "augsburg",

  // Serie A
  "acf fiorentina": "fiorentina",
  "atalanta bc": "atalanta",
  "bologna fc 1909": "bologna",
  "ss lazio": "lazio",
  "ssc napoli": "napoli",
  "us cremonese": "cremonese",
  "ac pisa 1909": "pisa",
  "us lecce": "lecce",
  "como 1907": "como",

  // Ligue 1
  "aj auxerre": "auxerre",
  "lille osc": "lille",
  "ogc nice": "nice",
  "olympique lyonnais": "lyon",
  "fc lorient": "lorient",
  "stade rennais fc 1901": "rennes",
  "angers sco": "angers",
  "fc nantes": "nantes",
  "fc metz": "metz",
  "racing club de lens": "lens",
  "rc strasbourg alsace": "strasbourg"
};

function leagueKey(league: string): keyof typeof MANUAL_POINTS | undefined {
  const code = (league || '').toUpperCase();
  if (code === 'PD') return 'la_liga';
  if (code === 'BL1') return 'bundesliga';
  if (code === 'SA') return 'serie_a';
  if (code === 'FL1') return 'ligue_1';
  return undefined;
}

function findManualPointsForTeam(teamName: string, league: string) {
  const key = leagueKey(league);
  if (!key) return undefined;
  const map = MANUAL_POINTS[key] as Record<string, number>;
  // Try exact match by API name first
  if (Object.prototype.hasOwnProperty.call(map, teamName)) return map[teamName];
  // Fallback: normalized + alias resolution against simplified keys
  const normalized = normalizeName(teamName);
  const alias = ALIASES[normalized];
  const lookupName = alias || normalized;
  // Build simplified normalized map from MANUAL_POINTS keys
  const simpleMap = new Map<string, number>();
  Object.entries(map).forEach(([apiName, pts]) => {
    simpleMap.set(normalizeName(apiName), pts);
  });
  return simpleMap.get(lookupName);
}

async function fetchLeagueTeams(leagueCode: string) {
  const res = await fetchAny(`${FD_API}/competitions/${leagueCode}/teams`, {
    headers: { 'X-Auth-Token': TOKEN, Accept: 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${leagueCode} teams error: ${data?.message || res.statusText}`);
  return Array.isArray(data?.teams) ? data.teams : [];
}

(async () => {
  if (!TOKEN) {
    console.error('FOOTBALL_DATA_API_TOKEN missing in environment.');
    process.exit(1);
  }

  const LEAGUES = ['PD', 'BL1', 'SA', 'FL1'];
  const report: any = {};

  for (const league of LEAGUES) {
    const teams = await fetchLeagueTeams(league);
    const missing: Array<{ teamId: number; name: string; }> = [];
    let matched = 0;

    for (const t of teams) {
      const pts = findManualPointsForTeam(t?.name, league);
      if (typeof pts === 'number') {
        matched += 1;
      } else {
        missing.push({ teamId: t?.id, name: t?.name });
      }
    }

    report[league] = { matched, missingCount: missing.length, missing };
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
})().catch((e) => {
  console.error('Cascade update points script failed:', e?.message || e);
  process.exit(1);
});
