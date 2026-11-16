# Automation Exercise — Test Cases and Automation Coverage

**Source:** [automationexercise.com/test_cases](https://automationexercise.com/test_cases) · **Reviewed:** 2026-11-07
against the current source tree · **Coverage:** 25 Covered · 0 Partial · 0 Not covered · 1 Skipped by policy

Step sequences are condensed with `→`; scenario names keep the site's labels. Coverage describes implementation — the
[Execution policy](#4-execution-policy) section covers what is excluded from every regular run.

## 1. The 26 official scenarios

| # | Official scenario | Verified steps (condensed) | Coverage | Spec |
|---:|---|---|---|---|
| 1 | Register User | home → signup form → name + email → account form → fill title/password/DOB/address → account created → username shown → delete account | Covered | [01](../tests/01-auth.spec.ts) |
| 2 | Login with correct credentials | login form → registered email + password → username shown → delete account | Covered | [01](../tests/01-auth.spec.ts) |
| 3 | Login with incorrect credentials | login form → invalid pair → failure message | Covered | [01](../tests/01-auth.spec.ts) |
| 4 | Logout User | login → username shown → logout → back to login page | Covered | [01](../tests/01-auth.spec.ts) |
| 5 | Register with existing email | signup form → already-registered email → duplicate-email error | Covered | [01](../tests/01-auth.spec.ts) |
| 6 | Contact Us Form | contact page → name/email/subject/message → attach file → confirm dialog → success message → home | Covered | [06](../tests/06-contact.spec.ts) |
| 7 | Verify Test Cases Page | home → Test Cases nav → listing page shown | Skipped by policy | — |
| 8 | All Products + product detail | products → list shown → open Blue Top → name/category/price/availability/condition/brand | Covered | [02](../tests/02-catalog.spec.ts) |
| 9 | Search Product | products → search field → searched-products heading + matches | Covered | [02](../tests/02-catalog.spec.ts) |
| 10 | Subscription on home page | home → footer → subscription section → email → success | Covered | [05](../tests/05-subscription-back-to-top.spec.ts) |
| 11 | Subscription on cart page | home → cart → footer → subscription section → email → success | Covered | [05](../tests/05-subscription-back-to-top.spec.ts) |
| 12 | Add products in cart | products → add first → continue → add second → both present → price/qty/total per row | Covered | [03](../tests/03-cart.spec.ts) |
| 13 | Product quantity in cart | PDP → qty 4 → add → cart shows the requested quantity | Covered | [03](../tests/03-cart.spec.ts) |
| 14 | Place order: register while checkout | add to cart → checkout → register in the prompt → logged in → checkout → address + review → comment/pay → success → delete | Covered | [04](../tests/04-checkout.spec.ts) |
| 15 | Place order: register before checkout | create account → logged in → add to cart → checkout → address + review → pay → success + invoice → delete | Covered | [04](../tests/04-checkout.spec.ts) |
| 16 | Place order: login before checkout | sign in → username shown → add to cart → checkout → address + review → pay → success → delete | Covered | [04](../tests/04-checkout.spec.ts) |
| 17 | Remove products from cart | add to cart → cart shows row → remove → row gone, cart empty | Covered | [03](../tests/03-cart.spec.ts) |
| 18 | View category products | products → category sidebar → Women subcategory → heading + list → Men subcategory → heading + list | Covered | [02](../tests/02-catalog.spec.ts) |
| 19 | View and cart brand products | products → brand sidebar → brand page → add from brand → cart shows it → another brand page | Covered | [02](../tests/02-catalog.spec.ts) |
| 20 | Search products, verify cart after login | search → matches → add → cart shows them → sign in → cart still holds them | Covered | [03](../tests/03-cart.spec.ts) |
| 21 | Add review on product | PDP → review section → name/email/review → submit → success message | Covered | [02](../tests/02-catalog.spec.ts) |
| 22 | Add to cart from recommended items | home → recommended section → add one → cart shows it | Covered | [02](../tests/02-catalog.spec.ts) |
| 23 | Verify address in checkout | register with address → logged in → add to cart → checkout → delivery address matches registration → billing address matches → delete | Covered | [04](../tests/04-checkout.spec.ts) |
| 24 | Download invoice after order | add to cart → checkout → register/sign in → address + review → pay → success + download invoice → delete | Covered | [04](../tests/04-checkout.spec.ts) |
| 25 | Scroll up with Arrow button | home → footer visible → click scroll-up arrow → hero carousel back in viewport | Covered | [05](../tests/05-subscription-back-to-top.spec.ts) |
| 26 | Scroll up without Arrow button | home → footer visible → scroll to top manually → hero carousel back in viewport | Covered | [05](../tests/05-subscription-back-to-top.spec.ts) |

### Notes on four cases

| Case | Note |
|---|---|
| TC5 | The lifecycle flow attempts the duplicate signup after logout, confirms the error, then logs back in with the original account — so the negative branch is exercised without a second account |
| TC7 | Deliberately not automated: it only opens the site's own listing page and verifies no customer-facing behaviour (`pages/TestCasesPage.ts` stays as a reference implementation) |
| TC24 | Registers during checkout, places the order, downloads the invoice, and asserts the customer name and order amount inside the file — not just that a download happened |
| TC25 / TC26 | The final assertion targets the carousel **container**, not `.item.active`: Bootstrap rebuilds that node every 5 s, so asserting on the slide fails randomly |

## 2. Coverage rules

| Status | Meaning |
|---|---|
| Covered | A test verifies the principal behaviour of the official scenario |
| Partial | The flow exists but one or more required steps are not yet verified |
| Not covered | No automated test verifies the scenario |
| Skipped by policy | Intentionally excluded (TC7 only) |

Visual regression and axe scans are additional framework practices, not part of the 26 functional scenarios. Related
scenarios may share one file to avoid repeating setup. The smoke lane includes the register-before-shopping happy
checkout path in [04](../tests/04-checkout.spec.ts) and the successful contact submission in [06](../tests/06-contact.spec.ts).

## 3. Regression groups

| Group | Cases | Scope | Spec |
|---|---|---|---|
| Authentication | TC1–5 | registration, valid/invalid login, logout, duplicate email, deletion | [01](../tests/01-auth.spec.ts) |
| Contact form | TC6 | two rejected submissions + one successful submission with attachment (success path also `@smoke`) | [06](../tests/06-contact.spec.ts) |
| Product discovery | TC8, 9, 18, 19, 21, 22 | category/brand filtering, keyword search with request spy and mocked 500, recommended items, PDP + review | [02](../tests/02-catalog.spec.ts) |
| Cart | TC12, 13, 17, 20 | multi-item cart, quantity/subtotal from PDP, removal, persistence across logout/login | [03](../tests/03-cart.spec.ts) |
| Footer and scroll | TC10–11, 25–26 | home/cart subscription, scroll-to-top with and without the arrow | [05](../tests/05-subscription-back-to-top.spec.ts) |
| Checkout E2E | TC14–16, 23–24 | three independent paths (register before, register during, login before); the register-before path is also `@smoke`; TC15/23 assert registered address data, TC15/24 verify invoice content | [04](../tests/04-checkout.spec.ts) |
| Visual regression | extra | 3 tests × 10 checkpoints × 3 viewports (desktop 1280, tablet 800, mobile 412) = 30 baselines, full page | [08](../tests/08-visual.spec.ts) |
| Accessibility | extra | one desktop scan per page, cross-page rule aggregate, fails only on `critical` | [07](../tests/07-a11y.spec.ts) |

## 4. Execution policy

| Rule | Detail |
|---|---|
| Scope | Functional scenarios TC1–6 and TC8–26, subject to the groups above |
| Queue full | A shared-site `queue full` response is a **failure**, never a skip or a reason to omit the run |
| Anonymous vs authenticated | Do not duplicate by default; add both states only where authentication changes the behaviour |
| Visual | Separate Chromium-only suite, never coupled to business journeys |
| Broken images | Before a visual screenshot, completed images with `naturalWidth === 0` abort capture with their URLs; no automatic retry |
| CI baseline update | Manual `visual-update` runs `npm run test:visual:update` and uploads snapshots as an artifact; reviewed baselines are committed manually |
| Accessibility | Separate suite, Desktop Chrome only, one worker; broad axe coverage does not repeat inside functional tests |
| Tag selection | `test:smoke` = 2 tests; `test:regression` = the remaining 18 and **excludes** those two, so the pair covers all 20 tagged tests exactly once; `test:gate` runs both, and continues to regression if smoke fails |
| axe output | One non-overwritten `reports/a11y/axe-scan-<local-timestamp>.json` (`formatVersion: 2`); findings deduplicated by rule across pages (`pageCount`, `affectedPages`, `nodeCount`, up to five selectors), per-page scans retained |
| axe gate | `AE_A11Y_GATE` default `critical` fails at the end of the run, after all scans are saved; `record` records without failing. `serious`/`moderate`/`minor` are recorded only |
| Reporting | `npm run report:a11y` lists runs, `-- --latest` prints the newest, a run ID inspects a past one |

## 5. Browser rollout

| Item | Detail |
|---|---|
| Enabled | Desktop Chrome 1280×720 · tablet 800×1280 (visual only) · Pixel 7 mobile Chromium 412×839 |
| Planned, not enabled | Desktop Firefox · Desktop Edge · Desktop WebKit · iPhone 13 (mobile WebKit). Enable in `playwright.config.ts` and install the engine before calling it coverage |
| Accessibility | Desktop Chrome only; every other project skips the scans |
| Concurrency | `fullyParallel: false`, `workers: 1` — the public demo site throttles, and separate invocations each carry their own worker limit |
| Checkout pinning | `test:checkout` is pinned to `chrome`, so the three E2E journeys run 3 times, not once per project |
| Multi-project runs | One invocation with several `--project` flags (`npx playwright test --workers=1 --project=chrome --project=mobile-chrome`), not concurrent commands |
| Visual | Restricted to the three Chromium projects; a new engine starts with an empty baseline set |
