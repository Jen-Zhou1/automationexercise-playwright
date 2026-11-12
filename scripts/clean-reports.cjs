/**
 * Report directory cleanup (scripts/clean-reports.cjs).
 *
 * Every run creates reports/<timestamp>/ and keeps video plus trace on failure,
 * so a handful of runs is enough to fill a few GB.
 *
 * Usage:
 *   npm run clean                keep the last 10 runs and 30 axe reports
 *   npm run clean -- --keep=20   keep the last 20 runs
 *   npm run clean -- --dry-run   print only, delete nothing
 *
 * It also removes "listed but never executed" directories (all stats at zero).
 * The current config no longer creates them (see isListing in
 * playwright.config.ts); this handles directories left by older versions.
 *
 * Only directories and files this tool created under reports/ are touched.
 */
const fs = require('node:fs');
const path = require('node:path');

const reportsDirectory = path.resolve(__dirname, '..', 'reports');
const RUN_DIRECTORY_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;
const A11Y_FILE_PATTERN = /^axe-scan-.*\.json$/;

const args = process.argv.slice(2);
const keepOption = args.find((arg) => arg.startsWith('--keep='));
const keepRuns = Number(keepOption ? keepOption.split('=')[1] : 10) || 10;
const keepA11y = 30;
const dryRun = args.includes('--dry-run');

function directorySize(target) {
  let total = 0;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    try {
      total += entry.isDirectory() ? directorySize(full) : fs.statSync(full).size;
    } catch {
      /* The file may be locked by another process; skip it. */
    }
  }
  return total;
}

function remove(target) {
  const size = directorySize(target);
  if (!dryRun) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  return size;
}

/**
 * A "listed but never executed" directory: `--list` used to create report
 * directories whose results.json has expected / unexpected / flaky all at zero
 * and only skipped entries. There is nothing to diagnose in those, so they go.
 * A directory whose results.json cannot be read is kept, so evidence is never
 * deleted by mistake.
 */
function isListOnlyRun(directory) {
  const resultsPath = path.join(directory, 'results.json');
  if (!fs.existsSync(resultsPath)) return false;
  try {
    const { stats = {} } = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const executed = (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.flaky ?? 0);
    return executed === 0;
  } catch {
    return false;
  }
}

if (!fs.existsSync(reportsDirectory)) {
  console.log('reports/ does not exist; nothing to clean.');
  process.exit(0);
}

/* 1. Newest first, so the tail of the list is what has to go. */
const runDirectories = fs
  .readdirSync(reportsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && RUN_DIRECTORY_PATTERN.test(entry.name))
  .map((entry) => entry.name)
  .sort()
  .reverse();

let freed = 0;
const removedRuns = [];
const removedEmpty = [];

/* 1a. Remove the empty listing directories first: they are noise and must not consume a retention slot. */
for (const name of runDirectories) {
  if (isListOnlyRun(path.join(reportsDirectory, name))) {
    freed += remove(path.join(reportsDirectory, name));
    removedEmpty.push(name);
  }
}

/* 1b. The remaining entries are real runs; keep the newest keepRuns of them. */
for (const name of runDirectories.filter((name) => !removedEmpty.includes(name)).slice(keepRuns)) {
  freed += remove(path.join(reportsDirectory, name));
  removedRuns.push(name);
}

/* 2. axe reports are small and valuable, so they get their own retention count. */
const a11yDirectory = path.join(reportsDirectory, 'a11y');
let removedA11y = 0;
if (fs.existsSync(a11yDirectory)) {
  const files = fs
    .readdirSync(a11yDirectory)
    .filter((name) => A11Y_FILE_PATTERN.test(name))
    .sort()
    .reverse();
  for (const name of files.slice(keepA11y)) {
    freed += remove(path.join(a11yDirectory, name));
    removedA11y += 1;
  }
}

const freedMb = (freed / 1024 / 1024).toFixed(1);
const verb = dryRun ? 'Reclaimable' : 'Freed';
console.log(
  `${verb} ${freedMb} MB: ${removedRuns.length} run directories, ${removedEmpty.length} empty listing directories, ` +
    `${removedA11y} axe reports (keeping the newest ${keepRuns} runs / ${keepA11y} axe reports)`,
);
if (removedRuns.length > 0) {
  console.log(`Removed runs: ${removedRuns.join(', ')}`);
}
if (removedEmpty.length > 0) {
  const preview = removedEmpty.slice(0, 3).join(', ');
  const more = removedEmpty.length > 3 ? ` and ${removedEmpty.length} in total` : '';
  console.log(`Removed empty directories: ${preview}${more}`);
}
if (dryRun) {
  console.log('(--dry-run: nothing was deleted)');
}
