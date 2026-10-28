const { existsSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const reportsDirectory = path.resolve(__dirname, '..', 'reports');
const latestRun = existsSync(reportsDirectory)
  ? readdirSync(reportsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .reverse()
  .find((name) => existsSync(path.join(reportsDirectory, name, 'report', 'index.html')))
  : undefined;

if (!latestRun) {
  console.error('No HTML report found. Run the Playwright tests first.');
  process.exitCode = 1;
} else {
  const reportPath = path.join(reportsDirectory, latestRun, 'report');
  const result = spawnSync(
    process.execPath,
    [require.resolve('@playwright/test/cli'), 'show-report', reportPath],
    { stdio: 'inherit' },
  );
  process.exitCode = result.status ?? 1;
}
