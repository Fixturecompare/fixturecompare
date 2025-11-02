// app/api/test-env-vars/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    FOOTBALL_DATA_API_TOKEN: process.env.FOOTBALL_DATA_API_TOKEN ? "set" : "missing",
    HYBRID_POINTS: process.env.HYBRID_POINTS || "not found",
    NODE_ENV: process.env.NODE_ENV,
  });
}