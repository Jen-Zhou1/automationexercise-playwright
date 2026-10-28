/**
 * Visual regression for the key storefront, account, contact, cart, and order pages.
 * Pixel comparisons run only in the configured Chromium project; generate baselines with
 * `npm run test:visual:update` before comparing them.
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
import { env } from '../config/env';
import { ORDER_COMMENT, PAYMENT_CARDS } from '../testdata/checkout';
import { PRODUCTS } from '../testdata/products';
import { log } from '../utils/logger';

const screenshotOptions = {
  maxDiffPixelRatio: 0.02,
  maxDiffPixels: 500,
  animations: 'disabled' as const,
  timeout: 60_000,
};

test.describe('视觉回归（仅 Chromium）', () => {
  test('视觉回归：匿名首页、商品目录与商品详情', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== env.visualProject,
      `视觉测试仅在 ${env.visualProject} 项目运行`,
    );

    const home = new HomePage(page);
    await home.open();
    await expect(home.visualAnchor).toBeVisible();
    await expect(page).toHaveScreenshot('homepage.png', screenshotOptions);

    const products = new ProductsPage(page);
    await products.goto();
    await expect(products.productPageHeading).toHaveText('All Products');
    await expect(products.productCards.first()).toBeVisible();
    await expect(page).toHaveScreenshot('products-page.png', screenshotOptions);
    await expect(products.productCard(PRODUCTS.blueTop.name)).toHaveScreenshot(
      'product-card-blue-top.png',
      screenshotOptions,
    );

    const detail = new ProductDetailPage(page);
    await detail.goto(PRODUCTS.blueTop.id);
    await expect(detail.productInformation).toBeVisible();
    await expect(page).toHaveScreenshot('product-detail-page.png', screenshotOptions);
    log.pass('首页、商品目录和商品详情视觉对比通过');
  });

  test('视觉回归：登录、联系表单与购物车', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== env.visualProject,
      `视觉测试仅在 ${env.visualProject} 项目运行`,
    );
    test.setTimeout(env.timeouts.registration * 2);

    const signupLogin = new SignupLoginPage(page);
    await signupLogin.goto();
    await expect(signupLogin.loginButton).toBeVisible();
    await expect(page).toHaveScreenshot('login-page.png', screenshotOptions);

    const contact = new ContactPage(page);
    await contact.goto();
    await expect(contact.submitButton).toBeVisible();
    await expect(page).toHaveScreenshot('contact-page.png', screenshotOptions);

    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();
    const cart = new CartPage(page);
    await expect(cart.productRows.first()).toBeVisible();
    await expect(page).toHaveScreenshot('cart-page.png', screenshotOptions);
    log.pass('登录页、联系表单和购物车视觉对比通过');
  });

  test('视觉回归：已登录结算、支付与订单确认', async ({ authedUser }, testInfo) => {
    test.skip(
      testInfo.project.name !== env.visualProject,
      `视觉测试仅在 ${env.visualProject} 项目运行`,
    );
    test.setTimeout(env.timeouts.registration * 2);

    const { page } = authedUser;
    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();

    const cart = new CartPage(page);
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(page);
    await checkout.expectAddressDetailsVisible();
    await checkout.expectOrderReviewVisible();
    await expect(page).toHaveScreenshot('checkout-page.png', {
      ...screenshotOptions,
      mask: [checkout.deliveryAddress, checkout.invoiceAddress, new HomePage(page).loggedInAs],
    });
    await checkout.addComment(ORDER_COMMENT);
    await checkout.placeOrder();

    const payment = new PaymentPage(page);
    await expect(payment.payButton).toBeVisible();
    await expect(page).toHaveScreenshot('payment-page.png', {
      ...screenshotOptions,
      mask: [new HomePage(page).loggedInAs],
    });

    const card = PAYMENT_CARDS[0];
    if (!card) {
      throw new Error('Visual checkout requires at least one configured payment card');
    }
    await payment.pay(card);

    const confirmation = new OrderConfirmationPage(page);
    await confirmation.expectOrderPlaced();
    await expect(page).toHaveScreenshot('order-confirmation-page.png', {
      ...screenshotOptions,
      mask: [new HomePage(page).loggedInAs],
    });

    await confirmation.continueToHome();
    const home = new HomePage(page);
    await home.deleteAccount();
    const account = new AccountPage(page);
    await account.expectAccountDeleted();
    await account.continueToHome();
    await home.expectLoggedOut();
    log.pass('结算、支付和订单确认视觉对比通过');
  });
});
