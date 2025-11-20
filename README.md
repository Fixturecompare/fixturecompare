# Fixture Compare

A premium sports fixture comparison app built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🏆 Premium sports app aesthetic with green and white color scheme
- 📱 Mobile-first responsive design
- ⚡ Smooth animations and transitions
- 🎯 Card-based layout for fixture display
- 🔄 Compare up to 2 fixtures side by side
- 🎨 Clean typography and modern UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── FixtureCard.tsx
│   └── ComparisonModal.tsx
└── lib/
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Inter Font** - Modern typography

## Design Features

- Custom green color palette for sports theme
- Smooth hover animations and transitions
- Mobile-responsive grid layout
- Card-based UI with subtle shadows
- Interactive comparison modal
- Animated mobile menu

## Usage

1. Browse available fixtures in the card grid
2. Select up to 2 fixtures by clicking on them
3. Click "Compare Fixtures" to view detailed comparison
4. Use the responsive navigation for different sections

## Customization

The app uses a custom Tailwind configuration with:
- Primary green color palette (50-950 shades)
- Custom animations (fade-in, slide-up, scale-in)
- Inter font family
- Responsive breakpoints

## Image Export Parity (1200×630 PNG)

This project includes a pixel-parity export of the `/predictions-live` layout, rendered via a dedicated export page and captured with Puppeteer.

### Export Route

- Path: `/export/predictions`
- Query params:
  - `league` (e.g., `PL`)
  - `teamAId` (numeric team id)
  - `teamBId` (numeric team id)
- Example: `http://localhost:3000/export/predictions?league=PL&teamAId=57&teamBId=64`

The export page renders a fixed 1200×630 frame with identical styling, crests (cross-origin), and a bottom-right watermark.

### Watermark Logo

Place your logo at: `public/logo/fixture-compare-logo.png`.

### Generate PNG via Puppeteer

Install Puppeteer (dev-only):

```bash
npm install --save-dev puppeteer
```

Start the dev server in one terminal:

```bash
npm run dev
```

Then run the export (adjust ids as needed):

```bash
npm run export:predictions
```

This writes the file:

```
public/exports/fixture-compare-arsenal-vs-liverpool-1200x630.png
```

### Notes

- External crests are loaded with `crossOrigin="anonymous"` and the capture waits for images and fonts.
- Final output is exactly 1200×630 px with a gradient background and ~32 px internal padding.
