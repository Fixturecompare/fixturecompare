import { NextRequest } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const isVercel = !!process.env.VERCEL

function getOrigin(req: NextRequest): string {
  try {
    return new URL(req.url).origin
  } catch {
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host') || 'localhost:3000'
    return `${proto}://${host}`
  }
}

async function launchBrowser() {
  if (isVercel) {
    // Resolve the package location inside the bundled Lambda, then derive bin
    const pkgPath = require.resolve('@sparticuz/chromium')
    const brotliPath = path.join(path.dirname(pkgPath), 'bin')

    const executablePath = await chromium.executablePath({ brotliPath })

    return puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      executablePath,
      headless: true,
    })
  }

  return puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const params = url.searchParams
  const origin = getOrigin(req)

  const exportUrl = new URL('/export/predictions', origin)

  params.forEach((value, key) => {
    exportUrl.searchParams.set(key, value)
  })

  let browser: puppeteer.Browser | null = null

  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2,
    })

    await page.goto(exportUrl.toString(), {
      waitUntil: 'networkidle0',
    })

    await page.waitForSelector('#export-root', { timeout: 30000 })

    await page.evaluate(() => {
      const el = document.getElementById('export-root') as HTMLElement | null
      if (el) {
        el.style.width = '1200px'
        el.style.height = '630px'
        el.style.transform = 'none'
        ;(el.style as any).WebkitTransform = 'none'
        el.style.margin = '0'
      }

      const html = document.documentElement
      const body = document.body

      if (html) {
        html.style.margin = '0'
        html.style.padding = '0'
      }

      if (body) {
        body.style.margin = '0'
        body.style.padding = '0'
      }
    })

    const root = await page.$('#export-root')
    if (!root) throw new Error('export-root not found')

    const png = (await root.screenshot({
      type: 'png',
    })) as Buffer

    const cacheHeader = isVercel
      ? 'public, s-maxage=86400, stale-while-revalidate=604800'
      : 'no-store'

    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheHeader,
        'Content-Disposition':
          'attachment; filename="fixture-share.png"',
      },
    })
  } catch (err: any) {
    console.error('[share-image] Error:', err)

    return new Response(
      `Failed to render image: ${err?.message || String(err)}`,
      { status: 500 }
    )
  } finally {
    try {
      await browser?.close()
    } catch {}
  }
}
