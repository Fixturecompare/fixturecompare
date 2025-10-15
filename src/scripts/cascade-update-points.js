/* eslint-disable no-console */
// FixtureCompare: Cascade Update Points Diagnostics Script (Node.js)
// Usage: node src/scripts/cascade-update-points.js
// Requires env FOOTBALL_DATA_API_TOKEN

const { unidecode } = require('unidecode');
const fetch = global.fetch || require('node-fetch');

const FD_API = 'https://api.football-data.org/v4';
const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN || '';
const LEAGUES = ['PD', 'BL1', 'SA', 'FL1']; // Exclude PL (already manual)

// Load manual maps from project files (compiled at runtime)
// Note: Using require with ts files is not supported in plain Node.
// For reliability, re-declare the manual maps here to compare and report.
// These match the project files under src/data/.
const MANUAL = {
  pd: {
    'real madrid': 21,
    'barcelona': 19,
    'villarreal': 16,
    'real betis': 15,
    'atletico madrid': 13,
    'sevilla': 13,
    'elche': 13,
    'athletic club': 13,
    'espanyol': 12,
    'alaves': 11,
    'getafe': 11,
    'osasuna': 10,
    'levante': 8,
    'rayo vallecano': 8,
    'valencia': 8,
    'celta vigo': 6,
    'real oviedo': 6,
    'girona': 6,
    'real sociedad': 5,
    'mallorca': 5,
  },
  bl1: {
    'bayern munich': 18,
    'borussia dortmund': 14,
    'rasenballsport leipzig': 13,
    'vfb stuttgart': 12,
    'bayer leverkusen': 11,
    'fc cologne': 10,
    'eintracht frankfurt': 9,
    'freiburg': 8,
    'hamburger sv': 8,
    'st pauli': 7,
    'hoffenheim': 7,
    'werder bremen': 7,
    'union berlin': 7,
    'augsburg': 6,
    'wolfsburg': 5,
    'mainz 05': 4,
    'borussia m gladbach': 3,
    'fc heidenheim': 3,
  },
  sa: {
    'napoli': 15,
    'roma': 15,
    'ac milan': 13,
    'inter': 12,
    'juventus': 12,
    'atalanta': 10,
    'bologna': 10,
    'como': 9,
    'sassuolo': 9,
    'cremonese': 9,
    'cagliari': 8,
    'udinese': 8,
    'lazio': 7,
    'parma calcio 1913': 5,
    'lecce': 5,
    'torino': 5,
    'fiorentina': 3,
    'verona': 3,
    'genoa': 2,
    'pisa': 2,
  },
  fl1: {
    'paris saint germain': 16,
    'marseille': 15,
    'strasbourg': 15,
    'lyon': 15,
    'monaco': 13,
    'lens': 13,
    'lille': 11,
    'paris fc': 10,
    'toulouse': 10,
    'rennes': 10,
    'brest': 8,
    'nice': 8,
    'lorient': 7,
    'le havre': 6,
    'nantes': 6,
    'auxerre': 6,
    'angers': 5,
    'metz': 2,
  },
};

function normalizeName(name) {
  const cleaned = unidecode(name)
    .toLowerCase()
    .replace(/\b(fc|cf|ac|us|aj|sc|ss|bc|sco|ud|sd|cd|ca|rc|vfl|1\.?|club)\b/g, '')
    .replace(/\d{2,4}/g, '')
    .replace(/[^a-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

const ALIASES = {
  // PL samples kept for parity
  'sunderland afc': 'sunderland',
  'tottenham hotspur': 'tottenham',
  'leeds united': 'leeds',
  'west ham united': 'west ham',
  // La Liga
  'club atletico de madrid': 'atletico madrid',
  'rcd espanyol de barcelona': 'espanyol',
  'fc barcelona': 'barcelona',
  'getafe cf': 'getafe',
  'real madrid cf': 'real madrid',
  'rayo vallecano de madrid': 'rayo vallecano',
  'levante ud': 'levante',
  'rcd mallorca': 'mallorca',
  'real betis balompie': 'real betis',
  'villarreal cf': 'villarreal',
  'valencia cf': 'valencia',
  'deportivo alaves': 'alaves',
  'elche cf': 'elche',
  'rc celta de vigo': 'celta vigo',
  'ca osasuna': 'osasuna',
  // Bundesliga
  'fc bayern munchen': 'bayern munich',
  'bayer 04 leverkusen': 'bayer leverkusen',
  'tsg 1899 hoffenheim': 'hoffenheim',
  '1 fsv mainz 05': 'mainz 05',
  'fc st pauli 1910': 'st pauli',
  '1 fc union berlin': 'union berlin',
  'vfl wolfsburg': 'wolfsburg',
  'sv werder bremen': 'werder bremen',
  'sc freiburg': 'freiburg',
  'fc augsburg': 'augsburg',
  // Serie A
  'acf fiorentina': 'fiorentina',
  'atalanta bc': 'atalanta',
  'bologna fc 1909': 'bologna',
  'ss lazio': 'lazio',
  'ssc napoli': 'napoli',
  'us cremonese': 'cremonese',
  'ac pisa 1909': 'pisa',
  'us lecce': 'lecce',
  'como 1907': 'como',
  // Ligue 1
  'aj auxerre': 'auxerre',
  'lille osc': 'lille',
  'ogc nice': 'nice',
  'olympique lyonnais': 'lyon',
  'fc lorient': 'lorient',
  'stade rennais fc 1901': 'rennes',
  'angers sco': 'angers',
  'fc nantes': 'nantes',
  'fc metz': 'metz',
  'racing club de lens': 'lens',
  'rc strasbourg alsace': 'strasbourg',
};

function findManualPointsForTeam(teamName, leagueCode) {
  const normalized = normalizeName(teamName);
  const alias = ALIASES[normalized];
  const lookup = alias || normalized;
  const key = (leagueCode || '').toLowerCase();
  const map = MANUAL[key] || {};
  return map[lookup];
}

async function fetchLeagueTeams(leagueCode) {
  const res = await fetch(`${FD_API}/competitions/${leagueCode}/teams`, {
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

  const report = {};
  for (const league of LEAGUES) {
    const teams = await fetchLeagueTeams(league);
    const missing = [];
    let matched = 0;

    for (const t of teams) {
      const pts = findManualPointsForTeam(t?.name, league.toLowerCase());
      if (typeof pts === 'number') {
        matched += 1;
      } else {
        missing.push({ teamId: t?.id, name: t?.name, normalized: normalizeName(t?.name) });
      }
    }

    report[league] = { matched, missingCount: missing.length, missing };
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
})().catch((e) => {
  console.error('Cascade update points script failed:', e?.message || e);
  process.exit(1);
});
