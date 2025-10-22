import { NextResponse } from "next/server";
import { getManualPoints } from "@/utils/getManualPoints";
import { normalizeWithAliases } from "@/utils/resolveTeamName";

const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
const HYBRID_POINTS = process.env.HYBRID_POINTS;

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;
  const urlObj = new URL(req.url);
  const teamName = urlObj.searchParams.get("team") || "";

  const manualLookup = () => {
    const manual = getManualPoints(leagueCode) as Record<string, number>;
    // exact match first
    if (Object.prototype.hasOwnProperty.call(manual, teamName)) {
      return { points: manual[teamName] ?? 0, source: "manual" as const };
    }
    // normalized + aliases
    const normTarget = normalizeWithAliases(teamName);
    const normalizedManual = new Map<string, number>();
    Object.entries(manual).forEach(([k, v]) => normalizedManual.set(normalizeWithAliases(k), v));
    return { points: normalizedManual.get(normTarget) ?? 0, source: "manual" as const };
  };

  try {
    // Feature-flagged path: use standings if enabled, else manual only
    if (HYBRID_POINTS !== "true") {
      const res = manualLookup();
      return NextResponse.json(res, { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" } });
    }

    // Try live standings
    const standingsRes = await fetch(`${FD_API}/competitions/${leagueCode}/standings`, {
      headers: {
        "X-Auth-Token": String(FD_TOKEN || ""),
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const standingsJson = await standingsRes.json();

    if (standingsRes.ok) {
      const standingsArr = Array.isArray(standingsJson?.standings) ? standingsJson.standings : [];
      const total = standingsArr.find((s: any) => s?.type === "TOTAL") || standingsArr[0] || {};
      const table = Array.isArray(total?.table) ? total.table : [];

      const normTarget = normalizeWithAliases(teamName);
      for (const row of table) {
        const n = normalizeWithAliases(row?.team?.name || "");
        if (n === normTarget) {
          return NextResponse.json(
            { points: Number(row?.points ?? 0), source: "standings" },
            { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" } }
          );
        }
      }
      // Not found in standings table → manual fallback
      const res = manualLookup();
      return NextResponse.json(res, { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" } });
    }

    // Standings failed → manual fallback with error note
    const res = manualLookup();
    return NextResponse.json({ ...res, error: standingsJson?.message || standingsRes.statusText }, { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" } });
  } catch (err: any) {
    const res = manualLookup();
    return NextResponse.json({ ...res, error: err?.message || String(err) }, { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" } });
  }
}
