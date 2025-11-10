import { NextResponse } from "next/server";
import { getStandings } from "@/lib/football";
import { normalizeWithAliases } from "@/utils/resolveTeamName";

export async function GET(req: Request, { params }: { params: { leagueCode: string } }) {
  const { leagueCode } = params;
  const urlObj = new URL(req.url);
  const teamName = urlObj.searchParams.get("team") || "";

  try {
    const { standings } = await getStandings(leagueCode.toUpperCase());
    const normTarget = normalizeWithAliases(teamName);

    for (const row of standings) {
      const n = normalizeWithAliases(row.team?.name || "");
      if (n === normTarget) {
        return NextResponse.json(
          { points: Number(row.points ?? 0), source: "standings" },
          {
            status: 200,
            headers: {
              "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
            },
          }
        );
      }
    }

    return NextResponse.json(
      { points: 0, source: "standings", note: "team-not-found" },
      {
        status: 200,
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    console.error("Points fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch points from standings" },
      {
        status: 502,
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  }
}