export type StandingRow = {
  position: number;
  team: { id?: number; name: string; shortName?: string; tla?: string; crest?: string | null };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

const API_BASE = "https://api.football-data.org/v4";
const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN || "";

async function fetchFD(path: string) {
  if (!TOKEN) throw new Error("FOOTBALL_DATA_API_TOKEN missing");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "X-Auth-Token": TOKEN,
      Accept: "application/json",
      "User-Agent": "fixturecompare/local-test",
    },
    next: { revalidate: 60 },
  });
  return res;
}

export async function getStandings(leagueCode: string) {
  const res = await fetchFD(`/competitions/${leagueCode}/standings`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Football-Data ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const standingsArr = Array.isArray(json?.standings) ? json.standings : [];
  const total = standingsArr.find((s: any) => s?.type === "TOTAL") || standingsArr[0] || {};
  const table = Array.isArray(total?.table) ? total.table : [];

  const mapped = table.map((row: any) => {
    const gf = row?.goalsFor ?? 0;
    const ga = row?.goalsAgainst ?? 0;
    return {
      position: row?.position ?? 0,
      team: {
        id: row?.team?.id,
        name: row?.team?.name || "Unknown",
        shortName: row?.team?.shortName || row?.team?.name,
        tla: row?.team?.tla,
        crest: row?.team?.crest || null,
      },
      playedGames: row?.playedGames ?? 0,
      won: row?.won ?? 0,
      draw: row?.draw ?? 0,
      lost: row?.lost ?? 0,
      points: Number(row?.points ?? 0),
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: gf - ga,
    } as StandingRow;
  });

  return {
    competition: json?.competition,
    season: json?.season,
    standings: mapped,
  };
}
