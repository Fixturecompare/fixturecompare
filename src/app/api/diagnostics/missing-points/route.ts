export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getManualPoints } from "@/utils/getManualPoints";

const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

const LEAGUES = ["PL", "PD", "SA", "BL1", "FL1"] as const;

function normalizeName(s: string): string {
  const lower = (s || "").toLowerCase();
  const noDia = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = noDia
    .replace(/[.&',]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+fc$/i, "")
    .replace(/^afc\s+/i, "")
    .replace(/^as\s+/i, "")
    .replace(/^ac\s+/i, "")
    .replace(/^rc\s+/i, "")
    .replace(/^ud\s+/i, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/\bclub\b/g, "")
    .replace(/\bfutbol\b/g, "")
    .replace(/\bsporting\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
}

function buildAliasMap() {
  const aliasToTarget = new Map<string, string>();
  const alias = (from: string, to: string) => aliasToTarget.set(normalizeName(from), normalizeName(to));

  // Cross-league
  alias("Man City", "Manchester City");
  alias("Man United", "Manchester United");
  alias("Manchester Utd", "Manchester United");
  alias("Newcastle", "Newcastle United");
  alias("West Ham", "West Ham United");
  alias("Wolves", "Wolverhampton Wanderers");
  alias("Brighton Hove Albion", "Brighton");
  alias("Tottenham", "Tottenham Hotspur");
  alias("Bournemouth", "AFC Bournemouth");

  // La Liga
  alias("Real Sociedad de Futbol", "Real Sociedad");

  // Bundesliga
  alias("RB Leipzig", "RasenBallsport Leipzig");
  alias("1. FC Koln", "FC Cologne");
  alias("Koln", "FC Cologne");
  alias("Borussia Monchengladbach", "Borussia M.Gladbach");
  alias("1. FC Heidenheim 1846", "FC Heidenheim");
  alias("St Pauli", "St. Pauli");

  // Serie A
  alias("FC Internazionale Milano", "Inter");
  alias("Internazionale", "Inter");
  alias("US Sassuolo Calcio", "Sassuolo");
  alias("Udinese Calcio", "Udinese");
  alias("Hellas Verona", "Verona");
  alias("Genoa CFC", "Genoa");
  alias("Pisa Sporting Club", "Pisa");

  // Ligue 1
  alias("Paris Saint-Germain", "Paris Saint Germain");
  alias("Olympique de Marseille", "Marseille");
  alias("AS Monaco FC", "Monaco");
  alias("RC Lens", "Lens");
  alias("Stade Brestois 29", "Brest");
  alias("Le Havre AC", "Le Havre");

  return aliasToTarget;
}

export async function GET() {
  try {
    const aliasToTarget = buildAliasMap();

    const results: any = {};

    for (const leagueCode of LEAGUES) {
      // Load manual map for league
      const manual = getManualPoints(leagueCode) as Record<string, number>;
      const normalizedMap = new Map<string, number>();
      Object.entries(manual || {}).forEach(([name, pts]) => {
        normalizedMap.set(normalizeName(name), pts as number);
      });

      // Fetch official teams from Football-Data
      const res = await fetch(`${FD_API}/competitions/${leagueCode}/teams`, {
        headers: {
          "X-Auth-Token": String(FD_TOKEN || ""),
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`FD teams error ${leagueCode}: ${data?.message || res.statusText}`);

      const teams = Array.isArray(data?.teams) ? data.teams : [];

      const missing: Array<{
        teamId: number;
        name: string;
        normalized: string;
        suggestedAliasTarget?: string;
        knownManualKeys: string[];
      }> = [];

      for (const t of teams) {
        const name = t?.name as string;
        const norm = normalizeName(name);
        const direct = normalizedMap.get(norm);
        if (typeof direct === "number") continue;

        // Try alias
        const target = aliasToTarget.get(norm);
        if (target && typeof normalizedMap.get(target) === "number") continue;

        // Collect known manual keys to help the user
        const keys = Object.keys(manual || {});
        missing.push({
          teamId: t?.id,
          name,
          normalized: norm,
          suggestedAliasTarget: target,
          knownManualKeys: keys.slice(0, 50),
        });
      }

      results[leagueCode] = { missingCount: missing.length, missing };
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
