// app/api/test-football-env/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://api.football-data.org/v4/competitions/PL/standings";

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_TOKEN || "",
        "Accept": "application/json",
        "User-Agent": "fixturecompare-debug/1.0",
      },
      next: { revalidate: 0 }, // disable Next.js caching
    });

    const bodyText = await response.text();

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      headersSent: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_TOKEN ? "set" : "missing",
        "Accept": "application/json",
        "User-Agent": "fixturecompare-debug/1.0",
      },
      bodySnippet: bodyText.slice(0, 500) + "...", // avoid huge responses
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
