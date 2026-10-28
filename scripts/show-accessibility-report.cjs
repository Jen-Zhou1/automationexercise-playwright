const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const reportDirectory = path.resolve(process.cwd(), 'reports', 'a11y');
  const files = (await fs.readdir(reportDirectory).catch((error) => {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }))
    .filter((name) => /^axe-scan-.*\.json$/u.test(name))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log(`No accessibility reports found in ${path.relative(process.cwd(), reportDirectory)}`);
    return;
  }

  const selector = process.argv[2];
  if (!selector) {
    for (const file of files) {
      const report = JSON.parse(await fs.readFile(path.join(reportDirectory, file), 'utf8'));
      console.log(
        `${report.generatedAt} | ${report.status} | pages=${report.totalPages} ` +
          `violations=${report.violationCount} rules=${report.ruleCount} ` +
          `nodes=${report.nodeCount} | ${file}`,
      );
    }
    return;
  }

  const requestedFile = selector === '--latest'
    ? files[0]
    : selector.endsWith('.json')
      ? selector
      : `axe-scan-${selector}.json`;
  if (!requestedFile || !files.includes(requestedFile)) {
    throw new Error(`Accessibility report not found: ${selector}`);
  }

  const reportPath = path.join(reportDirectory, requestedFile);
  process.stdout.write(`${JSON.stringify(JSON.parse(await fs.readFile(reportPath, 'utf8')), null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
