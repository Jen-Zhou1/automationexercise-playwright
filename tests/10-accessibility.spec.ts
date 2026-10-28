/**
 * Standalone axe-core scans for key storefront, account, and order states.
 * Each scan is persisted immediately; the suite gates critical findings after its final summary.
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

    await home.open();
    await expect(home.visualAnchor).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    await expect(products.recommendedItems).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    await products.goto();
    await expect(products.productPageHeading).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    await products.categoryHeading('Women').click();
    await products.openCategory('Tops');
    await expect(products.productCards.first()).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    await products.goto();
    await products.openBrand('POLO');
    await expect(products.productCards.first()).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    const detail = new ProductDetailPage(page);
    await detail.goto(PRODUCTS.blueTop.id);
    await expect(detail.productInformation).toBeVisible();
    await scanAccessibilityPage(page, testInfo);
  });

  test('Scan Login, Contact Us Form, Cart @a11y', async ({ page }, testInfo) => {
    const signupLogin = new SignupLoginPage(page);
    await signupLogin.goto();
    await expect(signupLogin.loginButton).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    const contact = new ContactPage(page);
    await contact.goto();
    await expect(contact.submitButton).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();

    const cart = new CartPage(page);
    await expect(cart.productRows.first()).toBeVisible();
    await scanAccessibilityPage(page, testInfo);
  });

  test('Scan Signed-in Checkout, Payment, Order Confirmation @a11y', async ({ authedUser }, testInfo) => {
    test.setTimeout(env.timeouts.registration * 2);
    const { page } = authedUser;
    const card = PAYMENT_CARDS[0];
    if (!card) {
      throw new Error('Accessibility checkout scan requires a configured payment card');
    }

    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();

    const cart = new CartPage(page);
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(page);
    await checkout.expectAddressDetailsVisible();
    await checkout.expectOrderReviewVisible();
    await scanAccessibilityPage(page, testInfo);

    await checkout.addComment(ORDER_COMMENT);
    await checkout.placeOrder();
    const payment = new PaymentPage(page);
    await expect(payment.payButton).toBeVisible();
    await scanAccessibilityPage(page, testInfo);

    await payment.pay(card);
    const confirmation = new OrderConfirmationPage(page);
    await confirmation.expectOrderPlaced();
    await scanAccessibilityPage(page, testInfo);

    await confirmation.continueToHome();
    const home = new HomePage(page);
    await home.deleteAccount();
    const account = new AccountPage(page);
    await account.expectAccountDeleted();
    await account.continueToHome();
    await home.expectLoggedOut();
  });
});
