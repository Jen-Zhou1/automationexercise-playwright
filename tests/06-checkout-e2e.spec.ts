/**
 * Independent checkout E2E journeys for registration before shopping, registration
 * during checkout, and an existing user signing in before checkout.
 */
import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-fixtures';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { HomePage } from '../pages/HomePage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { ORDER_COMMENT, PAYMENT_CARDS } from '../testdata/checkout';
import { PRODUCTS } from '../testdata/products';
import type { TestUser } from '../testdata/users';
import { env } from '../config/env';
import { generateUser } from '../utils/data-generator';
import { log } from '../utils/logger';

async function registerUser(page: Page, user: TestUser): Promise<void> {
  const signup = new SignupLoginPage(page);
  await signup.goto();
  const signupResult = await signup.startSignup(user.name, user.email);
  if (signupResult !== 'new-user') {
    throw new Error(`Generated email is already registered: ${user.email}`);
  }

  const account = new AccountPage(page);
  await account.fillAccountInfo(user);
  await account.submitCreateAccount();
  await account.expectAccountCreated();
  await account.continueToHome();
  await new HomePage(page).expectLoggedInAs(user.name);
}

async function completeOrder(page: Page, card = PAYMENT_CARDS[0]): Promise<OrderConfirmationPage> {
  if (!card) {
    throw new Error('Checkout tests require at least one configured payment card');
  }

  const cart = new CartPage(page);
  await cart.goto();
  await cart.proceedToCheckout();

  const checkout = new CheckoutPage(page);
  await checkout.expectAddressDetailsVisible();
  await checkout.expectOrderReviewVisible();
  await checkout.addComment(ORDER_COMMENT);
  await checkout.placeOrder();
  await new PaymentPage(page).pay(card);

  const confirmation = new OrderConfirmationPage(page);
  await confirmation.expectOrderPlaced();
  return confirmation;
}

async function deleteCurrentAccount(page: Page): Promise<void> {
  const home = new HomePage(page);
  await home.deleteAccount();
  const account = new AccountPage(page);
  await account.expectAccountDeleted();
  await account.continueToHome();
  await home.expectLoggedOut();
}

test.describe('结算 E2E（独立用户路径）', () => {
  for (const card of PAYMENT_CARDS) {
    test(`注册后购物 → 支付(${card.label}) → 下载发票 → 删除账户 @regression`, async (
      { authedUser },
      testInfo,
    ) => {
      test.setTimeout(env.timeouts.registration * 2);
      const { page, user } = authedUser;
      const products = new ProductsPage(page);
      await products.goto();
      await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();

      const cart = new CartPage(page);
      await expect(cart.productRows).toHaveCount(1);
      await cart.proceedToCheckout();

      const checkout = new CheckoutPage(page);
      await expect(page).toHaveURL(/\/checkout/);
      await checkout.expectAddressDetailsVisible();
      await checkout.expectOrderReviewVisible();
      await checkout.expectAddressesMatch(user);
      await checkout.addComment(ORDER_COMMENT);
      await checkout.placeOrder();

      const payment = new PaymentPage(page);
      await payment.pay(card);
      const confirmation = new OrderConfirmationPage(page);
      await confirmation.expectOrderPlaced();

      const invoicePath = testInfo.outputPath(`invoice-${card.cardNumber.slice(-4)}.txt`);
      await confirmation.downloadInvoice(invoicePath);
      const invoice = await readFile(invoicePath, 'utf8');
      expect(invoice).toContain(
        `Hi ${user.name}, Your total purchase amount is ${PRODUCTS.blueTop.unitPrice}. Thank you`,
      );

      await confirmation.continueToHome();
      await deleteCurrentAccount(page);
    });
  }

  test('访客结算时注册 → 下单并下载发票（官方场景 14、24） @regression', async (
    { page },
    testInfo,
  ) => {
    test.setTimeout(env.timeouts.registration * 2);
    const user = generateUser();
    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();

    const cart = new CartPage(page);
    await cart.proceedToCheckout();
    await expect(cart.checkoutModal).toBeVisible();
    await cart.chooseRegisterOrLoginAtCheckout();
    await registerUser(page, user);

    const confirmation = await completeOrder(page);
    const invoicePath = testInfo.outputPath('invoice-checkout-registration.txt');
    await confirmation.downloadInvoice(invoicePath);
    const invoice = await readFile(invoicePath, 'utf8');
    expect(invoice).toContain(
      `Hi ${user.name}, Your total purchase amount is ${PRODUCTS.blueTop.unitPrice}. Thank you`,
    );
    log.pass('结算时注册流程的发票已下载，客户名和订单金额正确');
    await deleteCurrentAccount(page);
  });

  test('已有用户登录后结算并完成订单（官方场景 16） @regression', async ({
    page,
    authedUser,
  }) => {
    test.setTimeout(env.timeouts.registration * 2);
    const home = new HomePage(page);
    await home.logout();

    const signup = new SignupLoginPage(page);
    await signup.goto();
    expect(await signup.login(authedUser.user.email, authedUser.user.password)).toBe('success');
    await home.expectLoggedInAs(authedUser.user.name);

    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();
    await completeOrder(page);
    await deleteCurrentAccount(page);
  });
});
