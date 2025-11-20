import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Temporarily disabled to restore previous app state
export async function GET() {
  return NextResponse.json(
    { error: "Export temporarily disabled" },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  )
}
