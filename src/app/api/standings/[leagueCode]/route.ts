import { NextResponse } from "next/server";
import { getManualPoints } from "@/utils/getManualPoints";
const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;

  try {
    const url = `${FD_API}/competitions/${leagueCode}/standings`;
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": String(FD_TOKEN || ""),
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Football-Data standings error: ${data?.message || res.statusText}`);

    const standingsArr = Array.isArray(data?.standings) ? data.standings : [];
    // Prefer TOTAL table
    const total = standingsArr.find((s: any) => s?.type === "TOTAL") || standingsArr[0] || {};
    const table = Array.isArray(total?.table) ? total.table : [];

    const mapped = table.map((row: any) => ({
      id: row?.team?.id,
      teamName: row?.team?.name || "Unknown Team",
      shortName: row?.team?.shortName || row?.team?.name || "Unknown",
      crest: row?.team?.crest || null,
      position: row?.position ?? 0,
      playedGames: row?.playedGames ?? 0,
      won: row?.won ?? 0,
      drawn: row?.draw ?? 0,
      lost: row?.lost ?? 0,
      goalDifference: (row?.goalsFor ?? 0) - (row?.goalsAgainst ?? 0),
      points: row?.points ?? 0,
    }));

    if (mapped.length === 0) {
      // Graceful fallback to manual points
      const manual = getManualPoints(leagueCode);
      const fallback = Object.entries(manual).map(([teamName, points]) => ({
        id: undefined,
        teamName,
        shortName: teamName,
        crest: null,
        position: 0,
        playedGames: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalDifference: 0,
        points,
      }));
      return NextResponse.json(
        { data: fallback, standings: [{ table: fallback }] },
        { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
      );
    }

    return NextResponse.json(
      { data: mapped, standings: [{ table: mapped }] },
      { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
    );
  } catch (err: any) {
    console.error("❌ Football-Data standings error:", err);
    // Fallback to manual points on error
    const manual = getManualPoints(leagueCode);
    const fallback = Object.entries(manual).map(([teamName, points]) => ({
      id: undefined,
      teamName,
      shortName: teamName,
      crest: null,
      position: 0,
      playedGames: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalDifference: 0,
      points,
    }));
    return NextResponse.json(
      { data: fallback, standings: [{ table: fallback }], error: err.message },
      { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
    );
  }
}
