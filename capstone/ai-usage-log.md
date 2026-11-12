# AI-Assisted Development — Usage Record

> The brief asks candidates to "leverage AI tools responsibly and explain where generated code was improved or
> optimized". This file records what AI produced, what was kept, and what was corrected — with the reason for each.

## 1. What AI was used for

| Stage | Contribution |
|---|---|
| Page structure exploration | Organised captured HTML, summarised form fields and endpoint lists |
| Boilerplate | Page-object skeletons, data-class definitions, fixture-structure drafts |
| Documentation | README and presentation structure / wording drafts |
| Conventions | `.github/copilot-instructions.md` for team-wide Copilot compliance |

## 2. What was adopted unchanged

| Item | Reason |
|---|---|
| POM layering (base class → page objects → components) | Industry-standard split; the draft structure was already sound |
| Data-class definitions (`testdata/*.ts`) | Pure structural code; field names were corrected against the real site |
| Fixture chain `registeredUser` → `authedUser` | Correct dependency direction, cleanup stays in one place |

## 3. What was corrected (the substance of this record)

| # | AI produced | Why it fails | Correction |
|---|---|---|---|
| 1 | From-memory selectors: `input[name="email"]`, `//div[@id='login']/form/input[2]` | Plausible and wrong; hierarchy XPath breaks on any DOM change | Verified the live DOM: the site exposes `data-qa` on every form (`login-button`, `card-number`, `submit-button`) plus `tr#product-<id>`, `#cartModal`, `a.check_out[href="/payment"]`. All locators now use those |
| 2 | `await page.waitForTimeout(3000)` for popups and transitions | Too long wastes time, too short fails randomly — the classic flaky source | Replaced with `expect(cartModal).toBeVisible()`, `page.waitForURL(/\/payment/)`, `waitForEvent('download')` |
| 3 | Contact form: fill → assert success | The site shows a native `confirm("Press OK to proceed!")`; without a handler the test hangs until timeout | `page.once('dialog', d => d.accept())` before submit, confirmed by live submission and JS source |
| 4 | `expect(violations).toHaveLength(0)` | One serious rule on a site nobody controls makes the suite permanently red; report-only lets findings rot | Severity gate: fail on `critical` only (`AE_A11Y_GATE`, default `critical`; `record` to observe). Rule ID, severity, page count and selector samples all survive in JSON |
| 5 | Visual across all six projects (3 engines + 3 devices) | Cross-engine pixel comparison is mostly font/antialiasing noise, and 21 cases × 6 = 126 serial runs against a shared storefront | Three Chromium viewports only — desktop 1280, tablet 800, mobile 412 — declared once in `env.visualProjects`; other projects `test.skip`. Tablet declares `grep: /@visual/` at **project** level, so it adds a layout band without a third functional run (3 tests, not 27) |
| 6 | Fixed test account (`standard_user`) | A shared demo site has no such account; fixed emails collide ("Email Address already exist!") | Unique email per run via `utils/data-generator.ts`, so runs stay idempotent |
| 7 | `toHaveScreenshot('homepage.png')` without `fullPage` | Default is viewport-only, so the "homepage" baseline was a 1280×720 first screen — recommended items, footer subscription and scroll-up button were **not in the baseline at all** | `fullPage: true` on all ten checkpoints; the old viewport baselines were deleted rather than kept |
| 8 | `animations: 'disabled'` as the anti-flake measure | That stops CSS animations; the Bootstrap 3 carousels are driven by `data-ride="carousel"` and a JavaScript `setInterval`, which it does not touch | `utils/carousel.ts` `freezeCarousels()`: strip `data-ride`, force the first `.item` active, then jQuery `carousel({ interval: false })` + `carousel('pause')`. Wrapped with `document.fonts.ready`, `img.complete`, mouse repositioning and a short settle in `helpers/stabilize.ts` |
| 9 | Read `data-product-id` from `.item.active`, then re-resolve `.item.active` to click | The carousel advances every 5 s, so the click could hit a different product than the id later asserted — a race that only fails under timing pressure | `addRecommendedProductToCart()` freezes the carousel and does read-then-click in one resolution, returning the id it actually clicked |
| 10 | Config `maxDiffPixels: 100` **and** `maxDiffPixelRatio` in tests | Playwright takes the stricter, so the config value was dead code that misled readers | Removed; thresholds live in one place — a ratio of page area for full-page captures, an absolute pixel budget for the single component checkpoint |
| 11 | `npm run test:visual` filtered `--grep "Visual regression"` | Test titles say `Visual Compare:`, so the filter matched nothing and the run failed for the wrong reason | Filter by machine tag (`@visual`), never by prose in a title |
| 12 | README said four projects were commented out; the config had all six enabled | Documentation written from intent, not from the file: `npm test` meant 126 executions, while only Chromium was installed | Projects really commented out (only `chrome` / `mobile-chrome` / `tablet-chrome`); the config now throws at load time if `env.ts` names a project that is not enabled |
| 13 | `test:checkout` with no `--project` flag | Invisible with one project; with several, three journeys became eighteen full checkout-and-invoice runs | Pinned to `chrome` |
| 14 | `runStamp` generated inside the config | Playwright re-evaluates the config in each worker, so every worker wrote its own report directory | One id shared through `process.env.AE_REPORT_RUN_ID`, set on first load |
| 15 | `goto()` overridden by three subclasses with different meanings (`goto(productId)`) | Polymorphic calls through the base type silently navigated to the wrong page | Renamed to `open()` / `openProduct(id)`; `noImplicitOverride` makes the compiler reject future overrides |
| 16 | `expectAddressesMatch()` asserting ten fields one at a time | Worst case 20 sequential waits × 20 s ≈ 400 s — functionally correct, still unacceptable: the failure mode is a timeout with no useful message | One array assertion per address block, so a failure costs one `expect` timeout |
| 17 | Ten files ordered by feature (`01-authentication`, `02-products-filter-cart`, …) | Grouped by which page they touch, not by when and why they run | Eight files in two roles: 6 business (`01`–`06`) and 2 capability suites (`07` a11y, `08` visual). The redundant smoke journey was removed; the checkout happy path and contact success path form the smoke lane. Old `02`+`03`+`04` re-split by **where the assertion lands**; contact form pulled out so its upload and native dialog have one owner |
| 18 | Five tags including `@extended` for negative branches | `@core` and `@extended` were both *subsets* of the functional suite, so a test tagged only `@regression` belonged to neither gate and nothing failed | Four tags, one per execution contract (`@smoke`, `@regression`, `@visual`, `@a11y`); smoke tests carry both `@smoke @regression`. Negative branches keep `@regression` — "the login error message is wrong" *is* a regression |

### Where the round number was rejected

The eight-file layout keeps the contact form in its own file because its upload and native dialog have a distinct
failure surface; it removes the redundant smoke-only file instead. Each file survives the question "why is this here?".
Likewise, the brief asks for 5–8 **test cases**,
not files: scenarios stay at 8, while `test()` blocks are 15, because a scenario such as checkout legitimately expands
into the site's three official paths (TC14/15/16) and a merged test would hide which path broke.

## 4. What AI could not do

| Limit | Evidence |
|---|---|
| Verify selectors against the live page | Every locator in `pages/` was confirmed by fetching the real DOM. The from-memory suggestions were frequently plausible and wrong |
| Discover site-specific behaviour | The native confirm dialog, the queue-full page under load, and the missing `.navbar-collapse` on mobile were all found by running, not by reasoning |
| Decide where a threshold belongs | Severity-gated axe and ratio-based visual diffing are risk judgements about a site the team does not own — that call is the engineer's |

## 5. Conclusion

AI's role here was to **accelerate scaffolding and exploration**, not to replace judgement: every line that entered the
framework went through live verification → alignment with team conventions → correction where needed.

| Recurring failure class | Examples | How it is caught |
|---|---|---|
| Plausible but unverified | from-memory XPath, viewport-only screenshots, "animations disabled" assumed to stop a JS timer | Run against the live site, read the actual DOM |
| Correct in the small, wrong in the large | screenshot of the wrong region, an assertion costing 400 s when it fails, a race between two resolutions of the same carousel slide | Ask "what does this actually verify, and what does it cost when it fails?" |
| Silent disagreement between sources of truth | config vs npm scripts vs README — nothing throws, the run just does the wrong thing (zero tests, six times the executions) | Validate project names at startup; filter on machine tags instead of prose |
