#!/usr/bin/env node
/*
  Interactive checkpoint utility for Fixture Compare
  - Save a stable reference point with a markdown summary
  - Optionally create a git commit, tag, and/or branch
  - Restore by checking out a tag or branch
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const PROJECT_ROOT = process.cwd();
const CHECKPOINTS_DIR = path.join(PROJECT_ROOT, 'checkpoints');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function nowStamp() {
  const d = new Date();
  // YYYY-MM-DD_HHMM
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function defaultName() {
  return `stable-${nowStamp()}`;
}

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (ans) => { rl.close(); resolve(ans); }));
}

function tryExec(cmd) {
  try { return execSync(cmd, { stdio: 'inherit' }); } catch (e) { /* surface error but continue */ }
}

function snapshotSummary(name) {
  // Small, focused summary of current intended stable aspects
  const headerTsx = path.join(PROJECT_ROOT, 'src', 'components', 'Header.tsx');
  const pageTsx = path.join(PROJECT_ROOT, 'src', 'app', 'api-predictions-live', 'page.tsx');
  const cardTsx = path.join(PROJECT_ROOT, 'src', 'components', 'PredictiveFixtureCard.tsx');

  const readSafe = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '(missing)';

  const md = `# Stable Reference Point — ${name}\n\n` +
`This checkpoint captures the current stable, working state so you can reliably revert.\n\n` +
`## Key UI traits\n` +
`- Header: text-only \`Fixture Compare\` in \`src/components/Header.tsx\` (no logo emoji).\n` +
`- Tagline: "Compare fixtures, forecast results, project points" on \`src/app/api-predictions-live/page.tsx\`.\n` +
`- Standings points beneath teams use placeholder "–" (no live standings in UI).\n` +
`- Shareable image: side-by-side desktop layout with W/D/L fixtures and totals.\n` +
`- Team name truncation length: 20 chars in \`PredictiveFixtureCard.tsx\`.\n\n` +
`## Files captured for reference\n` +
`- \`src/components/Header.tsx\`\n` +
`- \`src/app/api-predictions-live/page.tsx\`\n` +
`- \`src/components/PredictiveFixtureCard.tsx\`\n\n` +
`---\n\n` +
`<details><summary>src/components/Header.tsx</summary>\n\n\n\n\n\n${'```tsx\n'}${readSafe(headerTsx)}${'\n```'}\n\n</details>\n\n` +
`<details><summary>src/app/api-predictions-live/page.tsx</summary>\n\n${'```tsx\n'}${readSafe(pageTsx).slice(0, 12000)}${'\n```'}\n\n</details>\n\n` +
`<details><summary>src/components/PredictiveFixtureCard.tsx</summary>\n\n${'```tsx\n'}${readSafe(cardTsx)}${'\n```'}\n\n</details>\n`;

  return md;
}

async function main() {
  console.log('\nFixture Compare — Checkpoint Utility');
  const mode = (await ask('\nWhat do you want to do? [save/restore] (default: save): ')).trim().toLowerCase() || 'save';

  if (mode === 'save') {
    ensureDir(CHECKPOINTS_DIR);
    const nameInput = (await ask(`\nCheckpoint name (default: ${defaultName()}): `)).trim();
    const name = nameInput || defaultName();
    const filePath = path.join(CHECKPOINTS_DIR, `${name}.md`);

    // Write markdown snapshot file
    fs.writeFileSync(filePath, snapshotSummary(name), 'utf8');
    console.log(`\n✓ Wrote checkpoint summary -> ${path.relative(PROJECT_ROOT, filePath)}`);

    // Git options
    const doCommit = ((await ask('\nCreate a git commit with all current changes? [y/N]: ')).trim().toLowerCase() === 'y');
    if (doCommit) {
      tryExec('git add -A');
      tryExec(`git commit -m "Checkpoint: ${name}"`);
    }

    const doTag = ((await ask('Create a git tag for this checkpoint? [y/N]: ')).trim().toLowerCase() === 'y');
    if (doTag) {
      const tagName = (await ask('Tag name (default: same as checkpoint name): ')).trim() || name;
      tryExec(`git tag ${tagName}`);
      console.log(`\n✓ Created tag: ${tagName}`);
    }

    const doBranch = ((await ask('Create a new branch for this checkpoint? [y/N]: ')).trim().toLowerCase() === 'y');
    if (doBranch) {
      const branchName = (await ask('Branch name (default: checkpoint/<name>): ')).trim() || `checkpoint/${name}`;
      tryExec(`git branch ${branchName}`);
      console.log(`\n✓ Created branch: ${branchName}`);
    }

    console.log('\nAll done. You can restore later by checking out the tag or branch you created.');
  }
  else if (mode === 'restore') {
    const restoreType = (await ask('\nRestore from [tag/branch]: ')).trim().toLowerCase();
    if (!['tag', 'branch'].includes(restoreType)) {
      console.log('Invalid choice. Exiting.');
      process.exit(1);
    }
    const refName = (await ask(`Enter the ${restoreType} name to checkout: `)).trim();
    if (!refName) { console.log('No name provided. Exiting.'); process.exit(1); }

    const confirm = (await ask(`\nThis will checkout ${restoreType} "${refName}". Continue? [y/N]: `)).trim().toLowerCase() === 'y';
    if (!confirm) { console.log('Cancelled.'); process.exit(0); }

    tryExec(`git checkout ${refName}`);
  }
  else {
    console.log('Unknown mode. Use "save" or "restore".');
  }
}

main();
