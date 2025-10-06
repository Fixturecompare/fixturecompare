# Stable Reference Point — 2025-10-05

This file captures the current stable, working state of the Fixture Compare app so you can reliably revert to it if anything goes wrong.

## Summary of Current UI/Behavior
- Header: text-only "Fixture Compare" in `src/components/Header.tsx` (no emoji/logo), with subtle blurred white bar.
- Typography (Google Fonts via `next/font/google`):
  - Inter as the global/base font (applied on `<body>` via Tailwind `font-sans`).
  - Montserrat used for headings and results/totals using the Tailwind utility class `font-montserrat`.
- Tagline on predictions page: "Compare fixtures, forecast results, project points".
- Points under team cards: live standings disabled (placeholder "–").
- Predictions: W/D/L selection on fixture cards; totals calculated separately for each team.
- Shareable image: side-by-side desktop layout (Team A left, Team B right) with fixture cards (showing selected W/D/L states) and projected points at the bottom; supports Download, Tweet (text only), and Copy Results.
- Team name truncation in fixture cards: up to 20 characters before adding ellipsis.
- Simplified single-page experience (no navbar links).

## Key Files Locked In This Checkpoint
- `src/app/layout.tsx`
  - Loads Inter and Montserrat with `next/font/google` as CSS variables and applies `font-sans`.
- `tailwind.config.ts`
  - Sets `fontFamily.sans` to Inter variable and adds `font-montserrat` utility.
- `src/components/Header.tsx`
  - Text-only header using `font-montserrat` for the title.
- `src/app/api-predictions-live/page.tsx`
  - Uses `font-montserrat` for `h1`, Results Summary heading, totals, and winner line; share section heading updated too.
  - Standings display: placeholder points (no live standings access).
- `src/components/PredictiveFixtureCard.tsx`
  - `truncateTeamName(..., 20)`
- `src/lib/footballApi.js`
  - Client helpers for `/api/teams/[leagueCode]` etc.
- `src/app/api/standings/[leagueCode]/route.ts`
  - Present on disk; UI currently not binding standings.

## Environment & Dev Server
- App runs locally at: http://localhost:3000/api-predictions-live
- API token remains server-side in `.env.local` (not checked in).

---

## Quick Restore Prompts

You have two easy ways to restore this design later.

### Option A — Using the interactive script (recommended)
Run the checkpoint utility and choose "restore":

```
npm run checkpoint
```
Prompts you’ll see (example answers):
- What do you want to do? [save/restore]: `restore`
- Restore from [tag/branch]: `tag` (or `branch` if you created one)
- Enter the tag/branch name to checkout: `<your-saved-name>`
- Continue? [y/N]: `y`

### Option B — Using git directly
If you created a tag/branch when saving:

- Restore via tag:
```
git checkout <your-tag-name>
```

- Restore via branch:
```
git checkout <your-branch-name>
```

---

## Quick Save Prompt (to create another checkpoint later)
Create a new checkpoint with prompts:
```
npm run checkpoint
```
Then answer the questions to optionally create a git commit, tag, and/or branch.

## What This Checkpoint Guarantees
- Modern typography (Inter base + Montserrat headings) without layout shift.
- No runtime crashes related to standings fetching.
- Share actions work without external services (download and copy text; Twitter opens with text).
- Clean header (no emoji/logo), premium feel.
- Team names readable up to 20 characters.

## Notes
- If you later reintroduce live standings, keep strict null guards and progressive enhancement to avoid UI crashes.
- If you want me to auto-create a git tag/branch for this exact checkpoint, just ask and I can run the commands for you.
