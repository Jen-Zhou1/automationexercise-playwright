/**
 * Visual regression suite - a non-functional capability, not a business test case.
 *
 * Three viewports, each with its own baseline set, run separately from the
 * functional gate: a pixel difference is often an intended redesign that needs a
 * human to approve the new baseline, and it must not turn a functional run red.
 *   Desktop Chrome 1280x720  -> lg band (>= 1200)
 *   Tablet 800x1280          -> sm band (768-991)
 *   Pixel 7 mobile 412x839   -> xs band (< 768)
 * The site is Bootstrap 3, so its breakpoints are 768 / 992 / 1200; these three
 * viewports sample the three bands whose behaviour actually differs.
 *
 * Every capture is full page (`fullPage: true`) and every baseline is stored per
 * project, so the viewports never overwrite each other.
 *
 * Each capture is preceded by stabilizeForScreenshot(): freeze the carousels,
 * wait for fonts and images (aborting with URLs if any image is broken), move the
 * mouse away, settle. The homepage slider and the recommended strip advance
 * every 5 seconds, so skipping this makes the baseline drift on its own.
 *
 * Regenerate baselines with: npm run test:visual:update
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
import { stabilizeForScreenshot } from '../helpers/stabilize';
import { env } from '../config/env';
import { ORDER_COMMENT, PAYMENT_CARDS } from '../testdata/checkout';
import { PRODUCTS } from '../testdata/products';
import { log } from '../utils/logger';

/**
 * Full-page capture: the larger the area, the more pixels there are, so a ratio
 * threshold is steadier than an absolute count. 1% absorbs font antialiasing and
 * image compression noise while still catching a missing or misplaced block.
 */
const pageShot = {
  fullPage: true,
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maxDiffPixelRatio: 0.01,
  timeout: 90_000,
};

/** Component-level capture (one product card): small area, so an absolute budget reads better. */
const componentShot = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maxDiffPixels: 200,
  timeout: 30_000,
};

const isVisualProject = (projectName: string): boolean =>
  env.visualProjects.some((visualProject) => visualProject === projectName);

test.describe('Visual Test (Desktop, Tablet, Mobile Chromium)', () => {
  test.describe.configure({ retries: 1 });

  test('Visual Test: anonymous Home, Product Catalog, PDP @visual', async ({ page }, testInfo) => {
    test.skip(
      !isVisualProject(testInfo.project.name),
      `Visual tests run only in these projects: ${env.visualProjects.join(', ')}`,
    );

    await test.step('Home page (anonymous)', async () => {
      const home = new HomePage(page);
      await home.open();
      await expect(home.visualAnchor).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('homepage.png', pageShot);
    });

    await test.step('Product catalog + one product card', async () => {
      const products = new ProductsPage(page);
      await products.open();
      await expect(products.productPageHeading).toHaveText('All Products');
      await expect(products.productCards.first()).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('products-page.png', pageShot);
      await expect(products.productCard(PRODUCTS.blueTop.name)).toHaveScreenshot(
        'product-card-blue-top.png',
        componentShot,
      );
    });

    await test.step('Product detail page', async () => {
      const detail = new ProductDetailPage(page);
      await detail.openProduct(PRODUCTS.blueTop.id);
      await expect(detail.productInformation).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('product-detail-page.png', pageShot);
    });

    log.pass('Home, Catalog, and PDP visual comparisons passed');
  });

  test('Visual Test: Login, Contact Us Form, Cart @visual', async ({ page }, testInfo) => {
    test.skip(
      !isVisualProject(testInfo.project.name),
      `Visual tests run only in these projects: ${env.visualProjects.join(', ')}`,
    );
    test.setTimeout(env.timeouts.journey);

    await test.step('Login page', async () => {
      const signupLogin = new SignupLoginPage(page);
      await signupLogin.open();
      await expect(signupLogin.loginButton).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('login-page.png', pageShot);
    });

    await test.step('Contact Us form', async () => {
      const contact = new ContactPage(page);
      await contact.open();
      await expect(contact.submitButton).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('contact-page.png', pageShot);
    });

    await test.step('Cart with one product', async () => {
      const products = new ProductsPage(page);
      await products.open();
      const productId = await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();
      const cart = new CartPage(page);
      /* Assert the business fact before capturing: otherwise an empty cart can be
         photographed as a perfectly good new baseline, green on pixels and broken
         on behaviour. Row-level assertion, not toContainText on the row set. */
      await expect(cart.productRows).toHaveCount(1);
      await expect(cart.productRow(productId)).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('cart-page.png', pageShot);
    });

    log.pass('Login page, Contact form, and Cart visual comparisons passed');
  });

  test('Visual Test: Signed-in Checkout, Payment, Order Confirmation @visual', async (
    { authedUser },
    testInfo,
  ) => {
    test.skip(
      !isVisualProject(testInfo.project.name),
      `Visual tests run only in these projects: ${env.visualProjects.join(', ')}`,
    );
    test.setTimeout(env.timeouts.journey);

    const { page } = authedUser;
    const products = new ProductsPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const payment = new PaymentPage(page);
    const home = new HomePage(page);

    await test.step('Add a product and reach the checkout page', async () => {
      await products.open();
      await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();

      await cart.proceedToCheckout();
      await checkout.expectAddressDetailsVisible();
      await checkout.expectOrderReviewVisible();
    });

    await test.step('Checkout page (addresses and login state masked)', async () => {
      /* Addresses and login state carry random data and must be masked, or every run differs. */
      const masked = [checkout.deliveryAddress, checkout.invoiceAddress, home.loggedInAs];
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('checkout-page.png', {
        ...pageShot,
        /* Narrow viewports give a taller page and more text wrapping, so 2% */
        maxDiffPixelRatio: env.narrowVisualProjects.some(
          (project) => project === testInfo.project.name,
        )
          ? 0.02
          : pageShot.maxDiffPixelRatio,
        mask: masked,
      });
    });

    await test.step('Payment page', async () => {
      await checkout.addComment(ORDER_COMMENT);
      await checkout.placeOrder();

      await expect(payment.payButton).toBeVisible();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('payment-page.png', {
        ...pageShot,
        mask: [home.loggedInAs],
      });
    });

    await test.step('Order confirmation page', async () => {
      const card = PAYMENT_CARDS[0];
      if (!card) {
        throw new Error('Visual checkout requires at least one configured payment card');
      }
      await payment.pay(card);

      const confirmation = new OrderConfirmationPage(page);
      await confirmation.expectOrderPlaced();
      await stabilizeForScreenshot(page);
      await expect(page).toHaveScreenshot('order-confirmation-page.png', {
        ...pageShot,
        mask: [home.loggedInAs],
      });
      await confirmation.continueToHome();
    });

    await test.step('Delete the account', async () => {
      await home.deleteAccount();
      const account = new AccountPage(page);
      await account.expectAccountDeleted();
      await account.continueToHome();
      await home.expectLoggedOut();
    });

    log.pass('Signed-in Checkout, Payment, and Order Confirmation visual comparisons passed');
  });
});
