# Test Pipelines

This repository uses a Playwright-based regression suite for the public Automation Exercise storefront. The pipeline should therefore reflect the project’s actual test gates rather than a single generic “run everything” job.

## Required GitHub Actions workflow

Create a workflow named `Run Playwright Tests` that runs on:

1. Every pull request targeting the `main` branch.
2. Every push to the `main` branch.
3. Manual trigger from the GitHub Actions page (`workflow_dispatch`).
4. Optional scheduled nightly execution for non-blocking quality checks.

The workflow should:

- use Node.js 22 LTS
- install project dependencies with `npm ci`
- cache npm packages and Playwright browser artifacts between runs
- install the required Playwright browsers with `npx playwright install --with-deps`
- run the project’s test gates in parallel where appropriate
- keep the Playwright HTML/JSON reports generated under `reports/<timestamp>/`
- upload report and evidence folders as workflow artifacts for testers to inspect failures

## Recommended job breakdown

This project already exposes meaningful execution boundaries in [package.json](../package.json):

- `npm run test:smoke` runs the smoke suite (`@smoke`), which is the smallest fast validation lane.
- `npm run test:regression` runs the main regression suite (`@regression`) for product/auth/cart/checkout flows.
- `npm run test:a11y` runs the accessibility suite only on the Chrome project.
- `npm run test:visual` runs the visual comparison suite on Chrome.
- `npm test` remains the broader full-project execution entry point when a complete run is desired.

The CI workflow should therefore split validation into separate jobs:

- `smoke` job: fast PR gate and merge gate
- `regression` job: full regression validation on the main branch and PRs
- `a11y` job: non-blocking or scheduled validation for DOM/accessibility changes
- `visual` job: scheduled or manual run, because it is Chrome-only and intentionally separate from functionality checks

## Scope alignment with this project

The project’s actual configuration reinforces this split:

- [playwright.config.ts](../playwright.config.ts) uses a single-worker default and stores timestamped HTML/JSON outputs under `reports/<timestamp>/`
- `config/env.ts` explicitly marks Chrome as the accessibility and visual project
- the suite contains deliberate skip logic, including the permanently skipped TC7 in [tests/00-tc7-test-cases-page-skipped.spec.ts](../tests/00-tc7-test-cases-page-skipped.spec.ts)
- the public demo site is rate-limited, so dedicated single-worker and gated runs are intentional rather than accidental

## Artifacts to upload

The workflow should publish generated report and evidence directories, including:

- `reports/**/report/**`
- `reports/**/results.json`
- `reports/**/artifacts/**`
- any screenshot/video/trace files retained on failure

This matches the repository’s existing Playwright output pattern and keeps CI artifacts accessible to testers without breaking the project’s intended validation strategy.
