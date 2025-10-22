type PointsResponse = { points: number; source?: 'standings' | 'manual'; error?: string };

// simple in-memory cache per session
const cache = new Map<string, PointsResponse>();

export async function fetchPoints(leagueCode: string, teamName: string): Promise<PointsResponse> {
  const key = `${leagueCode}::${teamName}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await fetch(`/api/points/${encodeURIComponent(leagueCode)}?team=${encodeURIComponent(teamName)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = (await res.json()) as PointsResponse;
    // normalize
    const normalized: PointsResponse = { points: typeof json?.points === 'number' ? json.points : 0, source: json?.source, error: json?.error };
    cache.set(key, normalized);
    if (normalized.source === 'manual') {
      // log once per key for debugging
      // eslint-disable-next-line no-console
      console.log(`[points] manual fallback used for ${leagueCode} / ${teamName}`, normalized.error ? `(error: ${normalized.error})` : '');
    }
    return normalized;
  } catch (e: any) {
    const fallback: PointsResponse = { points: 0, source: 'manual', error: e?.message || String(e) };
    cache.set(key, fallback);
    // eslint-disable-next-line no-console
    console.log(`[points] manual fallback due to fetch error for ${leagueCode} / ${teamName}:`, fallback.error);
    return fallback;
  }
}
