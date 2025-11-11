export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getStandings } from "@/lib/football";

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;
  try {
    const { competition, season, standings } = await getStandings(leagueCode.toUpperCase());
    return NextResponse.json(
      { competition, season, standings: [{ table: standings }] },
      { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
    );
  } catch (err: any) {
    console.error("Standings fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch standings" },
      { status: 502, headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
  }
}
