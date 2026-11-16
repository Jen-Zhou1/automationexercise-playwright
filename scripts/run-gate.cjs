const { spawnSync } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const suites = [
  { name: 'smoke', args: ['run', 'test:smoke'] },
  { name: 'regression', args: ['run', 'test:regression'] },
];

let exitCode = 0;

for (const suite of suites) {
  const result = spawnSync(npmCommand, suite.args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`Failed to start ${suite.name}: ${result.error.message}`);
    exitCode = 1;
    continue;
  }

  const status = typeof result.status === 'number' ? result.status : 1;

  if (status !== 0) {
    if (suite.name === 'smoke') {
      console.warn('\nSmoke suite failed; continuing to regression to collect the full signal.\n');
    }
    exitCode = status;
  }

  if (suite.name === 'smoke' && status !== 0) {
    continue;
  }
}

process.exit(exitCode);
