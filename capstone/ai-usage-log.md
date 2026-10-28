# AI-Assisted Development Usage Record (docs/ai-usage-log.md)

> The requirement explicitly states: "Candidates should leverage AI tools responsibly and explain
> where generated code was improved or optimized."
> This document records honestly where AI was used, which parts were adopted, which were improved or rejected, and the rationale behind each decision.

## 1. What AI Capabilities Were Used

| Stage | AI usage |
|---|---|
| Page structure exploration | Helped organize captured page HTML and summarize form fields and endpoint lists |
| Boilerplate code | Generated page-object skeletons, data-class definitions, and fixture-structure drafts |
| Documentation writing | Drafted README and presentation structure and wording |
| Coding conventions | `.github/copilot-instructions.md` (for team Copilot compliance) |

## 2. Parts That Were Adopted (with reasons)

- **POM layered structure**: The base class + page objects + component split is an industry-standard pattern, and the AI draft structure was reasonable, so it was adopted.
- **Data class definitions** (`testdata/*.ts` interfaces): This is pure structural code, and after adoption it was corrected to match the site's actual fields.
- **Fixture organization**: The dependency chain `registeredUser` → `authedUser` was adopted.

## 3. Parts That Were Improved or Rejected (the key point is responsible AI use)

### 3.1 Locators: AI's memory-based XPath → all changed to selectors verified against the live site

The AI initially suggested generic selectors such as `input[name="email"]` and some tutorial-style XPath such as `//div[@id='login']/form/input[2]`.

**Improvement**: After fetching and verifying the actual HTML of `automationexercise.com`, it was confirmed that the site exposes `data-qa` attributes on the login, registration, payment, and contact forms (`login-button`, `card-number`, `submit-button`, etc.). The final implementation uses `[data-qa="..."]` everywhere.
The cart rows, add-to-cart modal, and Place Order elements were also confirmed from the real DOM (`tr#product-<id>`, `#cartModal`, `a.check_out[href="/payment"]`).

**Reason**: `data-qa` is the stable automation hook exposed by the site and is the most resistant to page changes. XPath depends on DOM hierarchy and breaks easily when the UI changes.

### 3.2 Fixed sleep → automatic waiting

The AI draft included `await page.waitForTimeout(3000)` for things like popups and page transitions.

**Improvement**: These were replaced with Playwright auto-waiting patterns such as `expect(cartModal).toBeVisible()`, `page.waitForURL(/\/payment/)`, and `waitForEvent('download')`.

**Reason**: Fixed sleeps are a common source of flaky tests; they either waste time if too long or fail randomly if too short.

### 3.3 Confirm dialog: site-specific behavior the AI missed

The AI-generated contact form test simply filled in the fields and asserted the success message.

**Improvement**: In practice, the site shows a native `confirm("Press OK to proceed!")` on submit. If it is not handled, the test hangs until timeout. The test was revised to register `page.once('dialog', d => d.accept())` before clicking submit.

**Reason**: Verified live (curl submission + JavaScript source analysis confirmed the behavior).

### 3.4 Accessibility scan strategy: report mode decision (later replaced by an independent gate)

The AI recommended `expect(violations).toHaveLength(0)`.

**Improvement at the time**: The public demo site uses report mode; all severities are recorded but the core business flow is not blocked. This was later changed to a separate accessibility test gate: violations are written to the summary JSON for each scan flow, and that accessibility test fails; normal functional regression does not run accessibility scans.

**Reason**: Functional regression must remain decoupled from the public demo site's existing a11y state; report mode keeps the rule IDs and severities so issues remain traceable instead of being silently hidden.

### 3.5 Visual regression scope: AI's "all browsers" → Chromium only

The AI draft ran the visual cases across all projects.

**Improvement**: Per requirement, the visual tests run only in the `chrome` project, and other projects skip them.

**Reason**: Different browser engines produce systematic font-rendering and antialiasing differences, and cross-browser pixel comparison adds noise. This is the standard industry approach.

### 3.6 Data isolation: AI's "fixed test account" → unique email registration

The AI suggested using fixed account credentials such as `standard_user`.

**Improvement**: Because the site is a shared demo site with no built-in account and persistent data, the tests were changed to generate a unique email for every run (`utils/data-generator.ts`).

**Reason**: Fixed accounts conflict on a shared site ("Email Address already exist!"), while unique emails preserve idempotence across repeated or concurrent runs.

## 4. Conclusion

The role of AI in this project is to "**accelerate scaffolding and exploration**," not to replace engineering judgment.
Every line of code that enters the framework is validated through: live behavior verification → alignment with team conventions → improvement when necessary.
This record itself is part of the deliverable—it demonstrates that the user understands why each line of code was written this way.
