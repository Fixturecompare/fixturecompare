#!/usr/bin/env node
/*
  Export /export/predictions to a 1200x630 PNG using Puppeteer, ensuring:
  - Tailwind and fonts applied
  - Remote crests loaded (crossOrigin=anonymous)
  - Exact pixel parity with export layout

  Usage:
    node scripts/export-predictions.js \
      --league=PL --teamAId=57 --teamBId=64 \
      --out=public/exports/fixture-compare-arsenal-vs-liverpool-1200x630.png \
      --base=http://localhost:3000
*/

const fs = require('fs')
const path = require('path')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

async function waitForImages(page) {
  // Wait for all <img> to finish loading/decoding or error out
  await page.evaluate(async () => {
    const imgs = Array.from(document.images)
    await Promise.all(
      imgs.map((img) =>
        img.decode?.().catch(() => {}) || (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res() }))
      )
    )
  })
}

async function waitForFonts(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  })
}

async function main() {
  const { league = 'PL', teamAId, teamBId, out, base = 'http://localhost:3000' } = parseArgs()
  if (!teamAId || !teamBId || !out) {
    console.error('Missing required args. Example: --league=PL --teamAId=57 --teamBId=64 --out=public/exports/output.png --base=http://localhost:3000')
    process.exit(1)
  }

  const url = `${base.replace(/\/$/, '')}/export/predictions?league=${encodeURIComponent(league)}&teamAId=${encodeURIComponent(teamAId)}&teamBId=${encodeURIComponent(teamBId)}`

  // Lazy-require puppeteer so this file can be checked in without hard dependency until installed
  const puppeteer = require('puppeteer')

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })

    // Go to export page and wait for network to idle
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })

    // Ensure fonts and images are fully ready
    await waitForFonts(page)
    await waitForImages(page)

    // Small settle delay for any late layout shifts
    await page.waitForTimeout(250)

    // Ensure output directory exists
    const outPath = path.resolve(process.cwd(), out)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })

    await page.screenshot({ path: outPath, type: 'png', omitBackground: false })

    console.log(`Saved export to: ${outPath}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
