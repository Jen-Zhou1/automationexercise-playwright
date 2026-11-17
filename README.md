# Automation Exercise — Playwright Automation Framework

> Playwright 1.64.1 · TypeScript · Page Object Model · custom fixtures
> Application under test: <https://automationexercise.com> (public e-commerce demo site)

## 1. Brief coverage
Main = final code; Draft = first draft.
| Requirement (from the brief) | Where it is implemented |
|---|---|
| Page Object Model | `pages/` — `Component` owns shared wrapped actions; `BasePage` adds site-relative navigation for page objects |
| Custom fixtures | `fixtures/base-fixtures.ts` — `registeredUser`, `authedUser`, `adBlocker`, plus a queue-full guard on `page` |
| Data-driven testing | `testdata/` + `tests/01-auth.spec.ts` (login failures), `tests/02-catalog.spec.ts` (search matrix) |
| Network interception and mocking | `utils/network.ts` — request spy and a mocked `500` on add-to-cart, asserted in `tests/02-catalog.spec.ts` |
| Trace viewer and debugging | `trace: 'retain-on-failure'` plus screenshot and video; see §6 |
| Cross-browser execution | Three viewports enabled by default, four more engines one line away; see §5 |
| Accessibility (axe-core) | `tests/07-a11y.spec.ts` + `utils/a11y.ts`, severity-gated, one aggregate report per run |
| Visual regression | `tests/08-visual.spec.ts` — 10 checkpoints, full page, one baseline set per viewport |
| AI-assisted creation | [`capstone/ai-usage-log.md`](./capstone/ai-usage-log.md) — what AI produced and what was corrected |
| 5–8 automated test cases | 8 business scenarios (`TC-01`…`TC-08`) across 6 files; see §3 |
| README explaining the design | this file, plus [`capstone/architecture.md`](./capstone/architecture.md) (one diagram) |
| Test plan vs the site's 26 scenarios | [`capstone/automation-test-plan.md`](./capstone/automation-test-plan.md) |

Everything runs from a terminal on one machine. There is no server, database or external service to set up.

## 2. Architecture in one paragraph

Tests only orchestrate and assert. They obtain a page through custom fixtures, which register or
authenticate a user and clean it up afterwards. Page objects own every locator and expose business verbs
(`addToCartByName`, `proceedToCheckout`), with `Component` providing shared wrapped actions and `BasePage`
adding site-relative navigation. Utilities hold
everything that has no business meaning: data generation, network helpers, carousel control, axe plumbing.
`config/env.ts` is the only module that reads `process.env`. Dependencies point one way — `tests → fixtures →
pages → utils/config` — and nothing points back up, which is what keeps a UI change to a one-file edit.

The diagram and the rule for each layer are in [`capstone/architecture.md`](./capstone/architecture.md).

## 3. Test suite

Eight spec files in three roles. They are not eight competing test cases.

| # | File | Scenario | What it verifies | Tags |
|---|---|---|---|---|
| 01 | `01-auth.spec.ts` | TC-01 | register → logout → duplicate email → re-login → delete; login failure matrix | `@regression` |
| 02 | `02-catalog.spec.ts` | TC-02–04 | category and brand filters, keyword search, request spy + mocked 500, recommended items, product detail and review | `@regression` |
| 03 | `03-cart.spec.ts` | TC-05 | multi-item cart, quantity and subtotal from the product page, removal, cart survives logout/login | `@regression` |
| 04 | `04-checkout.spec.ts` | TC-06 | three checkout paths, invoice download with content check, account cleanup | one happy path: `@smoke @regression`; others: `@regression` |
| 05 | `05-subscription-back-to-top.spec.ts` | TC-07 | back-to-top by click and by keyboard, footer subscription on home and cart | `@regression` |
| 06 | `06-contact.spec.ts` | TC-08 | upload, native confirm dialog, success message; two invalid submissions | `@smoke @regression` (success), `@regression` (invalid) |
| 07 | `07-a11y.spec.ts` | — | axe scans with a critical-severity gate | `@a11y` |
| 08 | `08-visual.spec.ts` | — | full-page screenshot comparison, 10 checkpoints per viewport | `@visual` |


**Tags.** Four, one per execution contract. `@visual` and `@a11y` are deliberately not `@regression`: a
shifted baseline is either an intended redesign or a real regression, and an axe violation is pre-existing
site debt; neither should turn a functional run red. `@smoke` is a true subset of `@regression` in tags, and
`test:regression` adds `--grep-invert "@smoke"` so the two lanes never execute the same journey:

| Command | Selection |
|---|---|
| `npm run test:smoke` | 2 tests: checkout and successful contact submission |
| `npm run test:regression` | 18 tests (20 tagged, 2 excluded) |
| `npm run test:gate` | smoke, then regression (2 + 18); regression still runs if smoke fails |
| `npm run test:regression:all-viewports` | 36 tests: 18 each on Chrome and mobile Chromium. The script runs the two functional-capable viewports only; `tablet-chrome` is deliberately excluded because it is visual-only via project-level `grep: /@visual/`. |
| `npm run test:a11y` | 3 scans, desktop only |
| `npm run test:visual` | 3 tests × 3 viewports = 9 comparisons |
| `npm run test:checkout` | the three checkout journeys |

To regenerate baselines in CI, open **Actions → Run Playwright Tests → Run workflow** and select
`visual-update`. On success, download the `visual-baselines-<run-id>-<attempt>` artifact, review the PNGs,
restore them to `tests/08-visual.spec.ts-snapshots/`, and commit the approved changes. This workflow does not
commit baselines automatically; selecting `visual` only compares against the existing baselines.

## 4. Running it locally

Requires **Node.js ≥ 22.12**.

```bash
npm ci
npx playwright install chromium   # also installs ffmpeg, which video recording needs
npm run typecheck
npm run test:smoke               # 2 tests: checkout and contact-form success
```

| Goal | Command |
|---|---|
| Whole suite, every project | `npm test` |
| One tag | `npx playwright test --grep "@regression"` |
| One file | `npx playwright test --project=chrome tests/04-checkout.spec.ts` |
| One test by title | `npx playwright test --project=chrome tests/01-auth.spec.ts -g "Login failure"` |
| One test by line | `npx playwright test --project=chrome tests/06-contact.spec.ts:46` |
| Watch it run | `npx playwright test --project=chrome tests/05-subscription-back-to-top.spec.ts --headed --workers=1` |
| Step through a failure | `npx playwright test --project=chrome tests/04-checkout.spec.ts --debug` |
| UI mode | `npm run test:ui` |
| Latest HTML report | `npm run report` |
| Regenerate visual baselines | `npm run test:visual:update` |
| Clean old runs | `npm run clean` |

## 5. Viewports and browsers

| Project | Viewport (CSS px) | Site band | Runs |
|---|---|---|---|
| `chrome` | 1280 × 720 | `lg` (≥ 1200) | functional · visual · axe |
| `tablet-chrome` | 800 × 1280 | `sm` (768–991) | visual only (project-level `grep`) |
| `mobile-chrome` | 412 × 839 | `xs` (< 768) | functional · visual |

The site is Bootstrap 3, so its breakpoints are 768 / 992 / 1200. The three viewports above sample the bands
whose layout actually differs: at `sm` the product grid drops from three columns to two and the navigation
switches from a hamburger to a horizontal menu. 800 is used rather than 768 on purpose — a baseline taken on
the boundary records the wrong band once a scrollbar takes ~15 px.

**Cross-engine execution** is configured but not enabled by default: `edge`, `firefox`, `webkit` and
`mobile-safari` (iPhone 13) sit in a commented block in `playwright.config.ts`. Enabling all six
functional-capable projects would mean six full passes over 20 tagged tests (120 serial runs) against a shared
public demo, so they are opt-in. The tablet project remains visual-only:

```bash
npx playwright install firefox webkit msedge
npx playwright test --project=firefox --grep "@smoke"
npx playwright test --project=firefox --grep "@regression" --grep-invert "@smoke"
```

Visual baselines are stored per project name, so a new engine starts with its own empty baseline set and
never overwrites an existing one.

## 6. Reports and failure evidence

Each run writes to its own directory, and only the run summary is always produced:

| Output | When |
|---|---|
| `reports/<timestamp>/report/index.html` | always — screenshots, video and trace links per test |
| `reports/<timestamp>/results.json` | always — machine-readable, one entry per test |
| `reports/<timestamp>/artifacts/<test-id>/` | on failure — screenshot, video and `trace.zip` |
| `reports/a11y/axe-scan-<timestamp>.json` | after an accessibility run, never overwritten |

A failing test is meant to be diagnosable without re-running it: open the HTML report, then the trace, and
step through the recorded actions with the DOM snapshot at each one. `test.step` groups the long journeys by
business phase, so a failure reads "the payment step failed" rather than a line number.
`npm run clean` retains the newest 10 run directories and 30 accessibility reports by default; `-- --dry-run`
previews cleanup without deleting files.

## 7. Design decisions

| Decision | Reason |
|---|---|
| Locator priority: `[data-qa]` → stable `href` → `#id` → semantic class → text | The site exposes `data-qa` on every form; hierarchy-based XPath breaks on any DOM change |
| No fixed sleeps; auto-waiting and web-first assertions | The only timer waits are the bounded asset wait and documented settle inside `helpers/stabilize.ts` |
| Every action goes through a `Component` wrapper | Page objects inherit wrappers through `BasePage`; UI components such as SubscriptionSection use `Component` directly |
| A fresh account per test, generated email | Accounts are permanent on the demo site; a fixed email collides on the second run |
| `open()` / `openProduct(id)` instead of overriding `goto()` | An override changes what the base signature means; `noImplicitOverride` now rejects it |
| Timeouts and budgets live in `config/env.ts` | `accountLifecycle` (register + cleanup) and `journey` (the multi-page flows) must match the fixture, otherwise the cleanup allowance never applies |
| Broken images abort visual capture with their URL | Asset waiting is bounded; third-party image failures are reported before the screenshot, without retrying them |
| One worker, no parallelism | The demo site throttles, and the a11y aggregate lives in module state |
| Visual thresholds in the tests, not the config | One source of truth; a config value was silently overridden before |
| Carousels frozen before every capture | The Bootstrap sliders advance on a JS timer that `animations: 'disabled'` does not stop |
| Accessibility gated on `critical` only | One `serious` rule on a site nobody owns would keep the suite red forever; every finding is still recorded |

## 8. Project structure

```text
config/       environment variables, timeouts, project-name validation
fixtures/     account creation, login state, ad blocking, queue-full detection
helpers/     screenshot stabilisation and failed-image checks
pages/        page objects and business actions
tests/        orchestration and assertions (9 files)
testdata/     product, user, contact and payment data
utils/        data generation, network, carousel, accessibility, logging
capstone/     requirement brief, architecture, test plan, AI usage log
reports/      per-run reports, failure evidence, axe records
scripts/      report viewer, gate runner and cleanup helpers
```

## 9. Known limits

- The site is a shared public demo. It returns a queue-full page under load; the framework detects that page
  and fails with a clear message instead of waiting for elements that will never appear.
- Visual baselines are platform-specific (`-win32` suffix). They were generated on Windows; on another OS the
  first visual run reports a missing snapshot, which is fixed with `npm run test:visual:update`.
- The `md` band (992–1199) has no baseline. It differs from `lg` only by a narrower container and six
  alignment rules, so a fourth set would prove "same layout, 100 px narrower".
- TC7 of the site's scenarios only opens its own listing page and is intentionally not automated.
