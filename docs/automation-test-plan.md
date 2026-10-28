# Automation Exercise Test Cases and Automation Coverage

**Source:** [Automation Exercise Test Cases](https://automationexercise.com/test_cases)  
**Reviewed:** 2026-10-22  
**Coverage summary:** 25 Covered · 0 Partial · 0 Not covered · 1 Skipped by policy

This document consolidates the English test scenarios, their execution steps, coverage status, and the corresponding project tests. Steps are restated in English for this framework; scenario names preserve the site's labels. Coverage status describes implementation, while the Test Plan separately identifies cases excluded from every regular test run.

## Test Case 1: Register User

**Automation coverage:** Covered — [01-authentication.spec.ts](../tests/01-authentication.spec.ts)

1. Open the application and confirm the home page loads.
2. Open Signup / Login and confirm the new-user signup form is available.
3. Enter a new user's name and email, then submit the signup form.
4. Confirm the account-information form is displayed.
5. Complete the title, password, date of birth, newsletter preferences, and address fields.
6. Submit account creation and confirm the account-created message.
7. Continue to the home page and confirm the new username is shown as logged in.
8. Delete the account, confirm the account-deleted message, and continue back to the logged-out home page.

## Test Case 2: Login User with correct email and password

**Automation coverage:** Covered — [01-authentication.spec.ts](../tests/01-authentication.spec.ts)

1. Open the application and navigate to Signup / Login.
2. Confirm the login form is displayed.
3. Submit a registered email address and its correct password.
4. Confirm the logged-in username is shown.
5. Delete the account and confirm the account-deleted message.

## Test Case 3: Login User with incorrect email and password

**Automation coverage:** Covered — [01-authentication.spec.ts](../tests/01-authentication.spec.ts)

1. Open the application and navigate to Signup / Login.
2. Confirm the login form is displayed.
3. Submit an invalid email/password combination.
4. Confirm the login failure message is displayed.

## Test Case 4: Logout User

**Automation coverage:** Covered — [01-authentication.spec.ts](../tests/01-authentication.spec.ts); [08-register-search-cart-smoke.spec.ts](../tests/08-register-search-cart-smoke.spec.ts)

1. Open the application and navigate to Signup / Login.
2. Sign in with a valid account and confirm the username is shown as logged in.
3. Select Logout.
4. Confirm the user is returned to the login page.

## Test Case 5: Register User with existing email

**Automation coverage:** Covered — [01-authentication.spec.ts](../tests/01-authentication.spec.ts). The lifecycle flow attempts duplicate signup after logout, confirms the error, then logs back in with the original account.

1. Open the application and navigate to Signup / Login.
2. Confirm the new-user signup form is displayed.
3. Submit a name with an email address already registered on the site.
4. Confirm the duplicate-email error is displayed.

## Test Case 6: Contact Us Form

**Automation coverage:** Covered — [07-contact-us-form.spec.ts](../tests/07-contact-us-form.spec.ts)

1. Open the application and navigate to Contact Us.
2. Confirm the contact form is displayed.
3. Enter a name, email address, subject, and message.
4. Attach a file and submit the form.
5. Accept the browser confirmation dialog.
6. Confirm the successful-submission message is displayed.
7. Return to the home page and confirm it loaded successfully.

## Test Case 7: Verify Test Cases Page

**Automation coverage:** Skipped by policy — [00-tc7-test-cases-page-skipped.spec.ts](../tests/00-tc7-test-cases-page-skipped.spec.ts) is permanently marked skipped and does not run.

1. Open the application and confirm the home page loads.
2. Select Test Cases from the navigation.
3. Confirm the test-cases page is displayed.

## Test Case 8: Verify All Products and product detail page

**Automation coverage:** Covered — [04-pdp-review-cart-clear.spec.ts](../tests/04-pdp-review-cart-clear.spec.ts)

1. Open the application and navigate to Products.
2. Confirm the All Products page and product list are displayed.
3. Open the Blue Top product detail page.
4. Confirm the product name, category, price, availability, condition, and brand are displayed.

## Test Case 9: Search Product

**Automation coverage:** Covered — [03-products-search-cart-persistence.spec.ts](../tests/03-products-search-cart-persistence.spec.ts)

1. Open the application and navigate to Products.
2. Confirm the All Products page is displayed.
3. Enter a product name in the search field and submit the search.
4. Confirm the searched-products heading and matching product results are displayed.

## Test Case 10: Verify Subscription in home page

**Automation coverage:** Covered — [05-site-scroll-and-subscription.spec.ts](../tests/05-site-scroll-and-subscription.spec.ts)

1. Open the application and confirm the home page loads.
2. Scroll to the footer and confirm the subscription section is displayed.
3. Enter an email address and submit the subscription.
4. Confirm the subscription-success message is displayed.

## Test Case 11: Verify Subscription in Cart page

**Automation coverage:** Covered — [05-site-scroll-and-subscription.spec.ts](../tests/05-site-scroll-and-subscription.spec.ts)

1. Open the application and confirm the home page loads.
2. Navigate to Cart and scroll to the footer.
3. Confirm the subscription section is displayed.
4. Enter an email address and submit the subscription.
5. Confirm the subscription-success message is displayed.

## Test Case 12: Add Products in Cart

**Automation coverage:** Covered — [02-products-filter-cart.spec.ts](../tests/02-products-filter-cart.spec.ts)

1. Open the application and navigate to Products.
2. Add the first product to the cart.
3. Continue shopping and add a different product.
4. Open the cart and confirm both products are present.
5. Verify each product's price, quantity, and line total.

## Test Case 13: Verify Product quantity in Cart

**Automation coverage:** Covered — [04-pdp-review-cart-clear.spec.ts](../tests/04-pdp-review-cart-clear.spec.ts)

1. Open the application and open a product detail page.
2. Confirm the product detail is displayed.
3. Set the product quantity to four and add it to the cart.
4. Open the cart and confirm the product is present with the requested quantity.

## Test Case 14: Place Order: Register while Checkout

**Automation coverage:** Covered — [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts)

1. Open the application, add a product to the cart, and open Cart.
2. Start checkout and choose the Register / Login option in the checkout prompt.
3. Complete signup and confirm the account-created message.
4. Continue and confirm the new username is shown as logged in.
5. Return to Cart and proceed to checkout.
6. Verify address details and the order review.
7. Enter an order comment, place the order, and provide payment details.
8. Confirm the order-success message.
9. Delete the account, confirm deletion, and continue.

## Test Case 15: Place Order: Register before Checkout

**Automation coverage:** Covered — [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts)

1. Open the application and create a new account before shopping.
2. Confirm account creation, continue, and verify the logged-in username.
3. Add a product to the cart and open Cart.
4. Start checkout and verify the address details and order review.
5. Enter an order comment, place the order, and provide payment details.
6. Confirm the order-success message and download the invoice.
7. Delete the account and confirm the account-deleted message.

## Test Case 16: Place Order: Login before Checkout

**Automation coverage:** Covered — [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts)

1. Open the application and sign in with an existing account.
2. Confirm the logged-in username is shown.
3. Add a product to the cart and open Cart.
4. Proceed to checkout and verify the address details and order review.
5. Enter an order comment, place the order, and provide payment details.
6. Confirm the order-success message.
7. Delete the account and confirm deletion.

## Test Case 17: Remove Products From Cart

**Automation coverage:** Covered — [04-pdp-review-cart-clear.spec.ts](../tests/04-pdp-review-cart-clear.spec.ts)

1. Open the application and add a product to the cart.
2. Open Cart and confirm the cart page and product are displayed.
3. Remove the selected product.
4. Confirm the product row is removed and the cart is empty.

## Test Case 18: View Category Products

**Automation coverage:** Covered — [02-products-filter-cart.spec.ts](../tests/02-products-filter-cart.spec.ts)

1. Open the application and navigate to Products.
2. Confirm the category sidebar is displayed.
3. Expand Women and open one of its subcategories.
4. Confirm the category page heading and product list are displayed.
5. Expand Men, open one of its subcategories, and confirm the corresponding category page and products.

## Test Case 19: View & Cart Brand Products

**Automation coverage:** Covered — [02-products-filter-cart.spec.ts](../tests/02-products-filter-cart.spec.ts)

1. Open the application and navigate to Products.
2. Confirm the brand sidebar is displayed.
3. Open a brand and confirm its brand page and products are displayed.
4. Add a product from that brand to the cart and confirm it appears in Cart.
5. Select a different brand and confirm its page and products are displayed.

## Test Case 20: Search Products and Verify Cart After Login

**Automation coverage:** Covered — [03-products-search-cart-persistence.spec.ts](../tests/03-products-search-cart-persistence.spec.ts)

1. Open the application and navigate to Products.
2. Search for a product name and confirm matching products are displayed.
3. Add the matching products to the cart and confirm they appear in Cart.
4. Open Signup / Login and sign in with a valid account.
5. Return to Cart and confirm the previously added products remain present.

## Test Case 21: Add review on product

**Automation coverage:** Covered — [04-pdp-review-cart-clear.spec.ts](../tests/04-pdp-review-cart-clear.spec.ts)

1. Open the application and navigate to Products.
2. Open a product detail page and confirm the review section is displayed.
3. Enter a name, email address, and review, then submit.
4. Confirm the review-success message is displayed.

## Test Case 22: Add to cart from Recommended items

**Automation coverage:** Covered — [02-products-filter-cart.spec.ts](../tests/02-products-filter-cart.spec.ts)

1. Open the application and scroll to the recommended-items section.
2. Confirm recommended items are displayed.
3. Add a recommended product to the cart.
4. Open Cart and confirm the product is present.

## Test Case 23: Verify address details in checkout page

**Automation coverage:** Covered — [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts)

1. Open the application and create an account with address information.
2. Continue and confirm the account is logged in.
3. Add a product to the cart, open Cart, and proceed to checkout.
4. Compare the delivery address with the registration details.
5. Compare the billing address with the registration details.
6. Delete the account and confirm deletion.

## Test Case 24: Download Invoice after purchase order

**Automation coverage:** Covered — [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts) registers during checkout, places the order, downloads the invoice, and verifies the customer name and order amount in its contents.

1. Open the application, add a product to Cart, and proceed to checkout.
2. Register or sign in when prompted, then continue to Cart and proceed to checkout.
3. Verify address details and the order review.
4. Enter an order comment, place the order, and provide payment details.
5. Confirm the order-success message and download the invoice.
6. Continue to the home page, delete the account, and confirm deletion.

## Test Case 25: Verify Scroll Up using 'Arrow' button and Scroll Down functionality

**Automation coverage:** Covered — [05-site-scroll-and-subscription.spec.ts](../tests/05-site-scroll-and-subscription.spec.ts)

1. Open the application and confirm the home page loads.
2. Scroll to the bottom and confirm the subscription section is visible.
3. Select the bottom-right scroll-up arrow.
4. Confirm the home-page hero heading is visible in the viewport.

## Test Case 26: Verify Scroll Up without 'Arrow' button and Scroll Down functionality

**Automation coverage:** Covered — [05-site-scroll-and-subscription.spec.ts](../tests/05-site-scroll-and-subscription.spec.ts)

1. Open the application and confirm the home page loads.
2. Scroll to the bottom and confirm the subscription section is visible.
3. Scroll back to the top without selecting the arrow.
4. Confirm the home-page hero heading is visible in the viewport.

## Coverage Summary

| Status | Count |
|---|---:|
| Covered | 25 |
| Partial | 0 |
| Not covered | 0 |
| Skipped by policy | 1 |

## Coverage Notes

- **Covered** means the project has a test that verifies the principal behavior in the official scenario.
- **Partial** means the flow exists but one or more required steps are not yet verified.
- **Skipped by policy** means the test is deliberately excluded from every run. TC7 uses Playwright's static `test.skip` declaration.
- Related official scenarios may share one automated test file or be combined to avoid repeating setup.
- Accessibility scans and visual regression are additional framework practices, not among these 26 functional scenarios.
- The registration-to-cart smoke journey in [08-register-search-cart-smoke.spec.ts](../tests/08-register-search-cart-smoke.spec.ts) checks integration across account access, search, cart, and logout. It intentionally stops before checkout because dedicated regression cases cover order placement and payment.
- Test titles carry grep-friendly tags: 08 is `@smoke`; 07 is `@smoke @regression`; all other functional tests are `@regression`. Visual tests in 09 are excluded from both tag groups and run separately with `npm run test:visual`. The current Chrome discovery finds 4 smoke tests and 22 regression tests (including the statically skipped TC7). Use `npm run test:smoke` or `npm run test:regression`.

## Test Plan

### Execution policy

- Run functional scenarios TC1–6 and TC8–26, subject to the test groups below.
- **Never execute TC7.** Its Playwright test is statically skipped, so normal, focused, and tagged runs all report it as skipped rather than opening the Test Cases page.
- A detected shared-site `queue full` response is a test failure, not a skip or a reason to omit the run.
- Do not add anonymous/authenticated duplicates by default. Add both states only where authentication changes the behavior or the business requirement explicitly calls for both.
- Keep visual regression as a separate Chromium-only suite. Run broad axe coverage through the dedicated accessibility suite rather than coupling scans to every business journey.
- Use `npm run test:smoke` or `npm run test:regression` to filter functional tests by the tags in their titles. Smoke contains 08 plus the overlapping 07 suite; regression includes all functional tests except the smoke-only 08 suite. Run the separate Chromium visual suite with `npm run test:visual`.
- Run standalone accessibility coverage with `npm run test:a11y`. It runs only in Desktop Chrome, one worker at a time. It records axe results for the homepage, recommended products, catalog, category, brand, product details, login, contact form, cart, checkout, payment, and order confirmation. Each scan flow writes one aggregated JSON report to `reports/accessibility/`; violations are recorded and logged without failing business-flow tests against the shared public demo site. Functional regression tests do not repeat these scans.

### Regression groups

| Group | Official cases | Scope and test mapping |
|---|---|---|
| Authentication | TC1–5 | Registration, valid/invalid login, logout, duplicate email, and account deletion; [01-authentication.spec.ts](../tests/01-authentication.spec.ts). The main lifecycle verifies duplicate-signup rejection followed by successful login with the existing account. |
| Contact form | TC6 | Validate rejected submissions and a successful submission with attachment; [07-contact-us-form.spec.ts](../tests/07-contact-us-form.spec.ts). Do not duplicate in the authenticated state without a requirement showing different behavior. |
| Product catalog and brands | TC12, TC18, TC19, TC22 | Multi-item cart, category/brand browsing, and recommended-product cart flow; [02-products-filter-cart.spec.ts](../tests/02-products-filter-cart.spec.ts). |
| Product search and cart persistence | TC9, TC20 | Search and cart verification, network spy/mock behavior, and cart persistence across login; [03-products-search-cart-persistence.spec.ts](../tests/03-products-search-cart-persistence.spec.ts). |
| Product detail and review | TC8, TC13, TC17, TC21 | Product details/review plus quantity, line total, and removal; [04-pdp-review-cart-clear.spec.ts](../tests/04-pdp-review-cart-clear.spec.ts). |
| Site-wide footer and scroll behavior | TC10–11, TC25–26 | Home/cart subscription plus scroll-to-top with and without the arrow; [05-site-scroll-subscribe.spec.ts](../tests/05-site-scroll-subscribe.spec.ts). |
| Checkout E2E journeys | TC14–16, TC23–24 | Three independent user paths: registered before shopping, guest registers at checkout, and existing user signs in before checkout; each runs as an independent test in [06-checkout-e2e.spec.ts](../tests/06-checkout-e2e.spec.ts). TC15/23 additionally validate registered address details; TC15 and TC24 verify invoice content. |
| Visual regression | Additional framework coverage | Run the visual suite only in Chromium. Baseline screenshots cover the homepage, product catalog, product detail, login, contact form, cart, checkout, payment, and order confirmation; the authenticated order screens use a test account, while dynamic account details are masked. See [09-visual-compare.spec.ts](../tests/09-visual-compare.spec.ts). Keep visual checks separate from the official functional-case count. |
| Accessibility scanning | Additional framework coverage | The dedicated axe suite in [10-accessibility.spec.ts](../tests/10-accessibility.spec.ts) runs only in Desktop Chrome and scans key storefront and account/order states, including category and brand results. Each test writes one aggregated report to `reports/accessibility/`; violations are recorded and logged without failing the test run. |

### Browser rollout

- Desktop Chrome and Pixel 7 (mobile Chromium) are currently enabled. The planned extended matrix also includes Desktop Firefox, Desktop Edge, Desktop WebKit, and iPhone 13 (mobile WebKit). Enable the desired projects in `playwright.config.ts` and install the required browsers before treating them as validated coverage. Accessibility scans run only in Desktop Chrome; other projects skip those tests.
- Keep `fullyParallel: false` and the global worker limit at 1 to reduce load on the shared public demo site. `npm run test:checkout` also uses one worker.
- Playwright's `--workers` value limits the whole invocation across all selected projects. For example:

  ```bash
  npx playwright test --workers=1 --project=chrome --project=mobile-chrome
  ```

- Run selected projects as one Playwright invocation rather than launching separate project commands concurrently; separate invocations each have their own worker limit and can overload the shared public demo site. Keep `--workers=1` when the site becomes slow or rate-limits requests. Increase concurrency only against an isolated test environment.
- Visual regression is restricted to the configured Chrome project, so visual checks are not duplicated across the other browser/device projects.