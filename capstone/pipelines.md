# Test Pipelines

This repository tests the public Automation Exercise storefront, which can return a queue-full page under load. The workflow runs one selected suite at a time and serializes workflow runs to reduce overlapping traffic.

## Required GitHub Actions workflow

Create a workflow named `Run Playwright Tests` that runs on:

1. Every pull request targeting the `main` branch.
2. Every push to the `main` branch.
3. Manual trigger from the GitHub Actions page (`workflow_dispatch`).

The workflow uses Node.js 22, `npm ci`, caches npm packages and Playwright browsers, and uploads the timestamped reports and failure evidence from `reports/**`.

## Suite selection

This project already exposes meaningful execution boundaries in [package.json](../package.json):

- `npm run test:smoke` runs the `@smoke` checks.
- `npm run test:regression` runs `@regression` checks except tests also tagged `@smoke`.
- `npm run test:a11y` runs the accessibility suite only on the Chrome project.
- `npm run test:visual` runs the visual comparison suite on Chrome.

The workflow selects suites without running smoke and regression together on the same tests:

- pull request: smoke only
- push to `main`: regression only
- manual run: choose smoke, regression, accessibility, visual, or all
- nightly run: smoke, regression, accessibility, and visual, sequentially

## Scope alignment with this project

The project’s actual configuration reinforces this split:

- [playwright.config.ts](../playwright.config.ts) uses a single worker and stores timestamped HTML/JSON outputs under `reports/<timestamp>/`
- `config/env.ts` explicitly marks Chrome as the accessibility and visual project
- TC7 only opens the site's Test Cases listing page; since it does not verify customer-facing business behavior, it is intentionally excluded from automation and has no test file
- smoke and regression are run on different events; regression excludes the smoke-tagged contact-form tests to prevent duplicate execution when the nightly run includes both
- a workflow-level concurrency group prevents separate workflow runs from exercising the public site simultaneously
- the visual baselines are Windows snapshots, so CI uses a Windows runner; the existing browser baseline is not regenerated in CI

## Artifacts to upload

The workflow publishes the generated HTML reports, JSON results, screenshots, videos, and traces from `reports/**` as a run-specific artifact retained for 14 days.
