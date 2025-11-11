export const runtime = "nodejs";
import { NextResponse } from "next/server";
const FD_API = "https://api.football-data.org/v4";
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

export async function GET(req: Request, { params }: { params: { teamId: string } }) {
  const { teamId } = params;

  try {
    const url = `${FD_API}/teams/${teamId}/matches?status=SCHEDULED,FINISHED`;
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": String(FD_TOKEN || ""),
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Football-Data fixtures error: ${data?.message || res.statusText}`);

    const matches = Array.isArray(data?.matches) ? data.matches : [];
    const urlObj = new URL(req.url);
    const leagueCode = urlObj.searchParams.get('leagueCode') || urlObj.searchParams.get('leagueId') || null;
    // Map to frontend-expected shape
    const normalized = matches.map((m: any) => {
      const utc = m?.utcDate || null;
      const ts = utc ? Date.parse(utc) : NaN;
      const homeId = m?.homeTeam?.id;
      const awayId = m?.awayTeam?.id;
      const isHome = Number(homeId) === Number(teamId);
      const opponentName = isHome ? (m?.awayTeam?.name || 'Unknown') : (m?.homeTeam?.name || 'Unknown');
      const opponentLogo = isHome ? (m?.awayTeam?.crest || null) : (m?.homeTeam?.crest || null);
      const time = utc ? new Date(utc).toISOString().substring(11, 16) : null; // HH:MM from ISO
      const league = m?.competition?.name || leagueCode || null;
      const competitionCode = m?.competition?.code || null;
      const gameweek = m?.matchday ?? null;

      return {
        id: m?.id,
        opponent: opponentName,
        opponentLogo,
        home: isHome,
        date: utc,
        time,
        league,
        competitionCode,
        gameweek,
        ts,
      };
    }).filter((r: any) => r.id);

    // Filter to domestic league only if leagueCode is provided
    let filteredByLeague = leagueCode
      ? normalized.filter((r: any) => (r.competitionCode || '').toUpperCase() === String(leagueCode).toUpperCase())
      : normalized;
    // If filtering removed everything (common when competition.code differs slightly), fallback to unfiltered
    if (leagueCode && filteredByLeague.length === 0) {
      filteredByLeague = normalized;
    }

    const nowTs = Date.now();
    const upcoming = filteredByLeague
      .filter((r: any) => !Number.isNaN(r.ts) && r.ts >= nowTs)
      .sort((a: any, b: any) => a.ts - b.ts)
      .slice(0, 5)
      .map(({ ts, ...rest }: any) => rest);

    const final = upcoming.length > 0
      ? upcoming
      : filteredByLeague
          .filter((r: any) => !Number.isNaN(r.ts))
          .sort((a: any, b: any) => a.ts - b.ts)
          .slice(0, 5)
          .map(({ ts, ...rest }: any) => rest);

    // We already embedded opponentLogo from match payloads, return final directly
    return NextResponse.json(
      { data: final, fixtures: final },
      { status: 200, headers: { 'x-fixtures-count': String(final.length), 'x-league-filter': String(leagueCode || '') } }
    );
  } catch (err: any) {
    console.error("❌ Football-Data fixtures error:", err?.message || err);
    // Graceful fallback to prevent UI hard error: return empty fixtures
    return NextResponse.json({ data: [], fixtures: [] }, { status: 200, headers: { 'x-error': 'fixtures_fetch_failed' } });
  }
}
