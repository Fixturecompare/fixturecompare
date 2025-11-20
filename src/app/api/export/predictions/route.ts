import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const league = (url.searchParams.get('league') || 'PL').toUpperCase()
    const teamAId = url.searchParams.get('teamAId')
    const teamBId = url.searchParams.get('teamBId')
    const base = url.searchParams.get('base') || 'http://localhost:3000'

    if (!teamAId || !teamBId) {
      return new NextResponse(JSON.stringify({ error: 'teamAId and teamBId are required' }), { status: 400 })
    }

    // Lazy import puppeteer to avoid bundling unless called locally
    const puppeteer = await import('puppeteer')

    const browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let png: Buffer | null = null
    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
      const target = `${base.replace(/\/$/, '')}/export/predictions?league=${encodeURIComponent(league)}&teamAId=${encodeURIComponent(teamAId)}&teamBId=${encodeURIComponent(teamBId)}`
      await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 })

      // Wait for fonts and images
      await page.evaluate(async () => {
        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready
        }
        const imgs = Array.from(document.images)
        await Promise.all(
          imgs.map((img) => (img as any).decode?.().catch(() => {}) || (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res() })))
        )
      })
      await page.waitForTimeout(250)

      png = await page.screenshot({ type: 'png', omitBackground: false }) as Buffer
    } finally {
      await browser.close()
    }

    if (!png) {
      return new NextResponse(JSON.stringify({ error: 'Failed to render export' }), { status: 500 })
    }

    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="fixture-compare-export-1200x630.png"'
      }
    })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 })
  }
}
