import { NextRequest } from 'next/server'
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

// Helper to build absolute origin from request
function getOrigin(req: NextRequest): string {
  try {
    const url = new URL(req.url)
    return url.origin
  } catch {
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    const host = req.headers.get('host') || 'localhost:3000'
    return `${proto}://${host}`
  }
}

function validateParams(params: URLSearchParams) {
  const league = (params.get('league') || '').toUpperCase()
  const allowed = new Set(['PL', 'PD', 'SA', 'FL1', 'BL1'])
  if (!allowed.has(league)) return { ok: false, error: 'Invalid league parameter' }

  const teamAIdRaw = params.get('teamAId')
  const teamBIdRaw = params.get('teamBId')
  const teamAId = teamAIdRaw ? Number(teamAIdRaw) : undefined
  const teamBId = teamBIdRaw ? Number(teamBIdRaw) : undefined
  if (teamAIdRaw && (!Number.isFinite(teamAId!) || teamAId! <= 0)) return { ok: false, error: 'Invalid teamAId' }
  if (teamBIdRaw && (!Number.isFinite(teamBId!) || teamBId! <= 0)) return { ok: false, error: 'Invalid teamBId' }
  return { ok: true }
}

async function launchBrowser() {
  const executablePath = await chromium.executablePath()

  return puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
  })
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const valid = validateParams(params)
  if (!valid.ok) {
    return new Response(valid['error' as keyof typeof valid] as string, { status: 400 })
  }

  const origin = getOrigin(req)
  const exportUrl = new URL('/export/predictions', origin)

  // Extract required params
  const league = (params.get('league') || '').toUpperCase()
  const teamAId = Number(params.get('teamAId') || '') || 0
  const teamBId = Number(params.get('teamBId') || '') || 0
  // Parse minimal predictions payload (from client)
  let clientPredictions: Record<number, 'win' | 'draw' | 'lose'> = {}
  const dataParam = params.get('data') || ''
  if (dataParam) {
    try {
      const json = decodeURIComponent(escape(Buffer.from(dataParam, 'base64').toString('utf-8')))
      const parsed: any = JSON.parse(json)
      clientPredictions = parsed?.predictions || {}
    } catch {}
  }

  // Server-side fetch to gather teams, fixtures, and base points
  async function fetchJson(url: string) {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
    return r.json()
  }

  // Build payload for export page to render synchronously
  let payloadB64 = ''
  try {
    const teamsRes = await fetchJson(`${origin}/api/teams/${encodeURIComponent(league)}`)
    const teamsArr: any[] = (() => {
      const res: any = teamsRes
      if (Array.isArray(res)) return res
      if (Array.isArray(res?.teams)) return res.teams
      if (Array.isArray(res?.data)) return res.data
      if (Array.isArray(res?.data?.teams)) return res.data.teams
      if (res?.success && Array.isArray(res?.data?.teams)) return res.data.teams
      return []
    })()
    const findTeam = (id: number) => teamsArr.find((t: any) => Number(t.id) === Number(id)) || null
    const tA = findTeam(teamAId)
    const tB = findTeam(teamBId)

    const faRes = await fetchJson(`${origin}/api/fixtures/${teamAId}?leagueCode=${encodeURIComponent(league)}`)
    const fbRes = await fetchJson(`${origin}/api/fixtures/${teamBId}?leagueCode=${encodeURIComponent(league)}`)
    const normalizeFixtures = (input: any): any[] => {
      const res: any = input
      if (Array.isArray(res)) return res
      if (Array.isArray(res?.fixtures)) return res.fixtures
      if (Array.isArray(res?.data)) return res.data
      if (Array.isArray(res?.data?.fixtures)) return res.data.fixtures
      if (res?.success && Array.isArray(res?.data?.fixtures)) return res.data.fixtures
      return []
    }
    const fixturesAApi: any[] = normalizeFixtures(faRes)
    const fixturesBApi: any[] = normalizeFixtures(fbRes)

    const mapFixture = (f: any): any => ({
      id: Number(f.id),
      opponent: f.opponent,
      opponentLogo: f.opponentLogo,
      home: !!f.home,
      date: f.date,
      time: f.time,
      league: f.league,
      status: f.status || 'upcoming',
      gameweek: f.gameweek,
    })
    // Apply same ID transform as client (offset B IDs by +100000)
    const fixturesA = fixturesAApi.map(mapFixture).map((f: any) => ({ ...f, id: Number(f.id) }))
    const fixturesB = fixturesBApi.map(mapFixture).map((f: any) => ({ ...f, id: Number(f.id) + 100000 }))

    // Compute predicted additional points based on client predictions mapping
    const pointsFor = (pred: any) => pred === 'win' ? 3 : pred === 'draw' ? 1 : 0
    const addA = fixturesA.reduce((sum: number, f: any) => sum + pointsFor(clientPredictions[f.id]), 0)
    const addB = fixturesB.reduce((sum: number, f: any) => sum + pointsFor(clientPredictions[f.id]), 0)

    // Fetch base points from server endpoint
    const fetchPoints = async (teamName?: string): Promise<number> => {
      if (!teamName) return 0
      try {
        const pr = await fetchJson(`${origin}/api/points/${encodeURIComponent(league)}?team=${encodeURIComponent(teamName)}`)
        const n = Number(pr?.points)
        return Number.isFinite(n) ? n : 0
      } catch {
        return 0
      }
    }
    const baseA = await fetchPoints(tA?.name)
    const baseB = await fetchPoints(tB?.name)

    const baseTotals = { A: baseA, B: baseB }
    const totals = { A: baseA + addA, B: baseB + addB }

    const payload = {
      v: 3,
      league,
      teamA: tA ? { id: tA.id, name: tA.name, shortName: tA.shortName, logo: tA.logo } : null,
      teamB: tB ? { id: tB.id, name: tB.name, shortName: tB.shortName, logo: tB.logo } : null,
      fixturesA: fixturesA.slice(0, 5),
      fixturesB: fixturesB.slice(0, 5),
      predictions: clientPredictions,
      baseTotals,
      totals,
    }
    const json = JSON.stringify(payload)
    // Encode as base64 of UTF-8 bytes. The export page decodes with decodeURIComponent(escape(atob(...)))
    // which expects raw UTF-8 bytes, not an already-URI-encoded string.
    payloadB64 = Buffer.from(json, 'utf-8').toString('base64')
  } catch (e: any) {
    // If server-side prep fails, still pass through original params; export page may show placeholders
    payloadB64 = ''
  }

  // Build export URL with prepared payload
  exportUrl.searchParams.set('league', league)
  exportUrl.searchParams.set('teamAId', String(teamAId))
  exportUrl.searchParams.set('teamBId', String(teamBId))
  if (payloadB64) exportUrl.searchParams.set('data', payloadB64)

  let browser: any
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Generous timeouts for dev
    page.setDefaultNavigationTimeout(60000)
    page.setDefaultTimeout(60000)

    // Optional debug hooks (safe to leave in dev)
    try {
      page.on('console', (msg: any) => console.log('PAGE LOG:', msg.text()))
      page.on('pageerror', (err: any) => console.error('PAGE ERROR:', err))
      page.on('requestfailed', (req: any) => console.error('REQUEST FAILED:', req.url()))
    } catch {}

    // Viewport large enough to ensure element can be fully brought into view
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 })
    await page.goto(exportUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('#export-root', { timeout: 30000 })
    // Guarded readiness wait for fonts and images (cap total wait ~2.5s)
    try {
      await page.evaluate(async () => {
        const withTimeout = (p: Promise<any>, ms = 2500) =>
          Promise.race([p, new Promise((res) => setTimeout(res, ms))])

        await withTimeout((async () => {
          try { await (document as any).fonts?.ready } catch {}
          const imgs = Array.from(document.images).filter(img => !img.complete)
          await Promise.all(imgs.map(img => new Promise<void>((res) => {
            img.onload = () => res()
            img.onerror = () => res()
          })))
        })())
      })
    } catch {}

    // Ensure the export element is in view and stable, then element screenshot
    const rootEl = await page.$('#export-root')
    if (!rootEl) throw new Error('export root not found')
    try { await rootEl.evaluate((el) => el.scrollIntoView({ block: 'start', inline: 'nearest' })) } catch {}
    await page.waitForTimeout(100)
    const png: Buffer = (await rootEl.screenshot({ type: 'png' })) as Buffer
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="fixture-share.png"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    const message = `Failed to generate image: ${err?.message || String(err)}`
    return new Response(message, { status: 500 })
  } finally {
    try { await browser?.close() } catch {}
  }
}
