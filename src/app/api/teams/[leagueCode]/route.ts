import { NextResponse } from "next/server";
const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;

  try {
    const url = `${FD_API}/competitions/${leagueCode}/teams`;
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": String(FD_TOKEN || ""),
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Football-Data teams error: ${data?.message || res.statusText}`);

    const mapped = (Array.isArray(data?.teams) ? data.teams : []).map((t: any) => ({
      id: t?.id,
      name: t?.name || "Unknown Team",
      shortName: t?.shortName || t?.name || "Unknown",
      logo: t?.crest || null,
      leagueId: leagueCode,
    }));

    return NextResponse.json({ data: mapped, teams: mapped }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Football-Data teams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
