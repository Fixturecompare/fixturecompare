import { NextResponse } from "next/server";
const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;

  try {
    // Use standings endpoint to derive teams, which is generally less restricted
    const url = `${FD_API}/competitions/${leagueCode}/standings`;
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": String(FD_TOKEN || ""),
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Football-Data standings error: ${data?.message || res.statusText}`);

    // standings[0].table is typical for TOTAL standings
    const table = data?.standings?.[0]?.table || [];
    const mapped = table
      .map((row: any) => row?.team)
      .filter(Boolean)
      .map((t: any) => ({
        id: t?.id,
        name: t?.name || "Unknown Team",
        shortName: t?.shortName || t?.tla || t?.name || "Unknown",
        logo: t?.crest || null,
        leagueId: leagueCode,
      }));

    // Deduplicate by id just in case
    const seen = new Set<number>();
    const unique = mapped.filter((t) => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    return NextResponse.json(
      { data: unique, teams: unique },
      { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
    );
  } catch (err: any) {
    console.error("❌ Football-Data teams error:", err);
    // Graceful empty list to keep UI functional even if FD is restricted
    return NextResponse.json({ data: [], teams: [], error: err.message }, { status: 200 });
  }
}
