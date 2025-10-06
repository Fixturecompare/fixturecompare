# Stable Reference Point — 2025-09-28

This file captures the current stable, working state of the Fixture Compare app so you can reliably revert to it if anything goes wrong.

## Summary of Current UI/Behavior
- Header: text-only "Fixture Compare" in `src/components/Header.tsx` (no emoji/logo), with subtle blurred white bar.
- Tagline: "Compare fixtures, forecast results, project points" displayed on `src/app/api-predictions-live/page.tsx` header section.
- Points under team cards: live standings disabled (placeholder "–" shown). No standings fetch used in UI.
- Predictions: W/D/L selection on fixture cards; totals calculated separately for each team.
- Shareable image: available. Generates a side-by-side desktop layout image (team A left, team B right) with fixture cards (showing selected W/D/L states) and projected points at the bottom; supports Download, Tweet (text only), and Copy Results.
- Team name truncation in fixture cards: up to 20 characters before adding ellipsis.
- Simplified single-page experience (no navbar links).

## Key Files Locked In This Checkpoint
- `src/app/api-predictions-live/page.tsx`
  - Tagline text
  - Share image implementation (side-by-side desktop format)
  - Standings display: placeholder points (no live standings access)
- `src/components/Header.tsx`
  - Text-only header: `"Fixture Compare"`, className size `text-3xl`
- `src/components/PredictiveFixtureCard.tsx`
  - `truncateTeamName(..., 20)`
- `src/lib/footballApi.js`
  - Client helpers for `/api/teams/[leagueCode]` etc. (unchanged in this checkpoint)
- `src/app/api/standings/[leagueCode]/route.ts`
  - Present on disk, but UI currently not binding standings.

## Environment & Dev Server
- App runs locally at: http://localhost:3000/api-predictions-live
- API token remains server-side in `.env.local` (not checked in).

## How To Revert To This State
You have three options. Pick one that fits your workflow:

### Option A — Git tag (recommended)
If this project is a git repo, create a commit and tag for this checkpoint:

```
# stage all changes
git add -A
# commit with message
git commit -m "Checkpoint: stable UI 2025-09-28 (no live standings, share image side-by-side)"
# create a lightweight tag
git tag stable-2025-09-28
```
To restore later:
```
# Warning: this resets your working tree to the tag
git checkout -f stable-2025-09-28
```

### Option B — Create a branch
```
# from your current branch
git checkout -b checkpoint/2025-09-28-stable
```
To restore later, just check out this branch again.

### Option C — Zip the project directory
Create a zip of the whole project folder as an offline snapshot.

## Manual Checklist (What this checkpoint guarantees)
- No runtime crashes related to standings/points fetching.
- Share actions work without external keys (image download and copy text; Twitter opens with text only).
- Clean header (no emoji/logo), single prominent title.
- Tagline is concise and updated.
- Team names are readable up to 20 characters.

## Notes
- If you later reintroduce live standings, keep strict null guards and progressive enhancement to avoid UI crashes.
- If you want me to auto-create the git tag/branch for you, just ask and I’ll run the commands.
