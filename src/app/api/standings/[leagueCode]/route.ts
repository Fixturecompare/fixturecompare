import { NextResponse } from "next/server";
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
      logo: row?.team?.crest || null,
      position: row?.position ?? 0,
      points: row?.points ?? 0,
      form: row?.form || null,
      stats: {
        played: row?.playedGames ?? 0,
        wins: row?.won ?? 0,
        draws: row?.draw ?? 0,
        losses: row?.lost ?? 0,
        goalsFor: row?.goalsFor ?? 0,
        goalsAgainst: row?.goalsAgainst ?? 0,
      },
    }));

    return NextResponse.json({ data: mapped, standings: [{ table: mapped }] }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Football-Data standings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
