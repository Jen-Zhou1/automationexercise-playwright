/**
 * Accessibility suite (axe-core) — a non-functional capability, not a business test case.
 * Standalone scans for key storefront, account, and order states.
 * Each scan is persisted immediately; the suite gates critical findings after its final summary.
 *
 * A separate file for the same reason as the visual suite: axe findings are
 * existing debt on the site, gated by severity (AE_A11Y_GATE), and they must not
 * decide a functional run. Upgrading @axe-core/playwright changes the rule set and
 * should not drag business assertions with it.
 *
 * The aggregate lives in module state in utils/a11y.ts, which assumes every scan
 * in this file runs serially in one worker. `workers: 1` + `fullyParallel: false`
 * is what makes that true; raising the worker count for speed would give each
 * worker its own copy and the report would silently lose pages.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import {
  finalizeAccessibilityReport,
  initializeAccessibilityReport,
  scanAccessibilityPage,
} from '../utils/a11y';
import { env } from '../config/env';
import { ORDER_COMMENT, PAYMENT_CARDS } from '../testdata/checkout';
import { PRODUCTS } from '../testdata/products';

test.describe('Accessibility scans (axe-core)', () => {
  test.describe.configure({ retries: 0 });

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name === env.accessibilityProject) {
      await initializeAccessibilityReport(testInfo);
    }
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== env.accessibilityProject,
      `Accessibility scans run only in ${env.accessibilityProject}`,
    );
  });

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name === env.accessibilityProject) {
      await finalizeAccessibilityReport();
    }
  });

  test('Scan Home, Recommended Products, Catalog, Categories, Brands, PDP @a11y', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    const products = new ProductsPage(page);

    await test.step('Home page + recommended products block', async () => {
      await home.open();
      await expect(home.visualAnchor).toBeVisible();
      await scanAccessibilityPage(page, testInfo);

      await expect(products.recommendedItems).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Product catalog', async () => {
      await products.open();
      await expect(products.productPageHeading).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Category page (Women > Tops)', async () => {
      await products.expandCategory('Women');
      await products.openCategory('Tops');
      await expect(products.productCards.first()).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Brand page (POLO)', async () => {
      await products.open();
      await products.openBrand('POLO');
      await expect(products.productCards.first()).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Product detail page', async () => {
      const detail = new ProductDetailPage(page);
      await detail.openProduct(PRODUCTS.blueTop.id);
      await expect(detail.productInformation).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });
  });

  test('Scan Login, Contact Us Form, Cart @a11y', async ({ page }, testInfo) => {
    await test.step('Login / signup page', async () => {
      const signupLogin = new SignupLoginPage(page);
      await signupLogin.open();
      await expect(signupLogin.loginButton).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Contact Us form', async () => {
      const contact = new ContactPage(page);
      await contact.open();
      await expect(contact.submitButton).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Cart with one product', async () => {
      const products = new ProductsPage(page);
      await products.open();
      const productId = await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();

      /* Confirm the cart really contains a product before scanning: an empty cart
         is a different page state, and scanning it would make the violation counts
         in the report describe a scenario nobody tested. */
      const cart = new CartPage(page);
      await expect(cart.productRows).toHaveCount(1);
      await expect(cart.productRow(productId)).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });
  });

  test('Scan Signed-in Checkout, Payment, Order Confirmation @a11y', async ({ authedUser }, testInfo) => {
    test.setTimeout(env.timeouts.journey);
    const { page } = authedUser;
    const card = PAYMENT_CARDS[0];
    if (!card) {
      throw new Error('Accessibility checkout scan requires a configured payment card');
    }

    const products = new ProductsPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const payment = new PaymentPage(page);
    const home = new HomePage(page);

    await test.step('Checkout page (signed in)', async () => {
      await products.open();
      await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();

      await cart.proceedToCheckout();
      await checkout.expectAddressDetailsVisible();
      await checkout.expectOrderReviewVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Payment page', async () => {
      await checkout.addComment(ORDER_COMMENT);
      await checkout.placeOrder();
      await expect(payment.payButton).toBeVisible();
      await scanAccessibilityPage(page, testInfo);
    });

    await test.step('Order confirmation page', async () => {
      await payment.pay(card);
      const confirmation = new OrderConfirmationPage(page);
      await confirmation.expectOrderPlaced();
      await scanAccessibilityPage(page, testInfo);
      await confirmation.continueToHome();
    });

    await test.step('Delete the account', async () => {
      await home.deleteAccount();
      const account = new AccountPage(page);
      await account.expectAccountDeleted();
      await account.continueToHome();
      await home.expectLoggedOut();
    });
  });
});
