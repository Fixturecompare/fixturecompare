import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const league = searchParams.get('league');
    const teamAId = searchParams.get('teamAId');
    const teamBId = searchParams.get('teamBId');
    const base = searchParams.get('base');

    if (!league || !teamAId || !teamBId || !base) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Use the Chrome you have installed manually
    const executablePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    const targetUrl = `${base.replace(/\/$/, '')}/export/predictions?league=${encodeURIComponent(league)}&teamAId=${encodeURIComponent(teamAId)}&teamBId=${encodeURIComponent(teamBId)}`;

    // Avoid waiting for long-polling sockets in dev; rely on DOM being ready
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Ensure the export wrapper exists in the DOM
    await page.waitForSelector('#export-target', { timeout: 20000, visible: true });

    // Wait for fonts and images to fully load to stabilize Tailwind layout
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch {}
      }
      const imgs = Array.from(document.images);
      await Promise.race([
        Promise.all(
          imgs.map((img) =>
            (img as any).decode?.().catch(() => {}) ||
            (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res(); }))
          )
        ),
        new Promise((res) => setTimeout(res, 5000)),
      ]);
    });

    // Small settle to ensure final paint
    await page.waitForTimeout(200);

    const element = await page.$('#export-target');

    if (!element) {
      await browser.close();
      return NextResponse.json(
        { error: 'Could not find #export-target on page' },
        { status: 500 }
      );
    }

    const buffer = await element.screenshot({ type: 'png' });

    await browser.close();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="prediction.png"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
