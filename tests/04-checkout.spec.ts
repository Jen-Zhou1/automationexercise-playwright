/**
 * TC-06 Checkout E2E (site TC 14-16, 23, 24)
 * Three independent customer paths, each ending in payment, invoice download and its own
 * account cleanup: registered before shopping / register during checkout / sign in before checkout.
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

const requireCard = () => {
  const card = PAYMENT_CARDS[0];
  if (!card) {
    throw new Error('Checkout E2E requires at least one configured payment card');
  }
  return card;
};

async function registerUser(page: Page, user: TestUser): Promise<void> {
  await test.step('Register a new account during checkout', async () => {
    const signup = new SignupLoginPage(page);
    await signup.open();
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
  });
}

async function completeOrder(page: Page, card = requireCard()): Promise<OrderConfirmationPage> {
  const confirmation = await test.step('Cart → checkout → place order → pay', async () => {
    const cart = new CartPage(page);
    await cart.open();
    await cart.proceedToCheckout();

    const checkout = new CheckoutPage(page);
    await checkout.expectAddressDetailsVisible();
    await checkout.expectOrderReviewVisible();
    await checkout.addComment(ORDER_COMMENT);
    await checkout.placeOrder();
    await new PaymentPage(page).pay(card);

    const order = new OrderConfirmationPage(page);
    await order.expectOrderPlaced();
    return order;
  });
  return confirmation;
}

async function downloadAndVerifyInvoice(
  confirmation: OrderConfirmationPage,
  user: Pick<TestUser, 'firstName' | 'lastName'>,
  expectedAmount: number,
  invoicePath: string,
): Promise<void> {
  await confirmation.downloadInvoice(invoicePath);
  const invoice = await readFile(invoicePath, 'utf8');
  expect(invoice).toContain(
    `Hi ${user.firstName} ${user.lastName}, Your total purchase amount is ${expectedAmount}. Thank you`,
  );
}

async function deleteCurrentAccount(page: Page): Promise<void> {
  await test.step('Delete the account → logged-out home page', async () => {
    const home = new HomePage(page);
    await home.deleteAccount();
    const account = new AccountPage(page);
    await account.expectAccountDeleted();
    await account.continueToHome();
    await home.expectLoggedOut();
  });
}

test.describe('Checkout E2E (independent user paths)', () => {
  const regressionPaymentCard = requireCard();

  test(`Shop after Registration → Pay (${regressionPaymentCard.label}) → Download Invoice → Delete Account @smoke @regression`, async (
    { authedUser },
    testInfo,
  ) => {
    test.setTimeout(env.timeouts.journey);
    const { page, user } = authedUser;

    await test.step('Add Blue Top to the cart', async () => {
      const products = new ProductsPage(page);
      await products.open();
      await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();

      await expect(new CartPage(page).productRows).toHaveCount(1);
    });

    await test.step('Checkout: billing/delivery addresses, order review and comment', async () => {
      const cart = new CartPage(page);
      await cart.proceedToCheckout();

      const checkout = new CheckoutPage(page);
      await expect(page).toHaveURL(/\/checkout/);
      await checkout.expectAddressDetailsVisible();
      await checkout.expectOrderReviewVisible([
        { name: PRODUCTS.blueTop.name, quantity: 1, unitPrice: PRODUCTS.blueTop.unitPrice },
      ]);
      await checkout.expectAddressesMatch(user);
      await checkout.addComment(ORDER_COMMENT);
      await checkout.placeOrder();
    });

    const confirmation = await test.step('Pay and reach the order-confirmation page', async () => {
      await new PaymentPage(page).pay(regressionPaymentCard);
      const order = new OrderConfirmationPage(page);
      await order.expectOrderPlaced();
      return order;
    });

    await test.step('Download the invoice and verify the customer name and total', async () => {
      const invoicePath = testInfo.outputPath(
        `invoice-${regressionPaymentCard.cardNumber.slice(-4)}.txt`,
      );
      await downloadAndVerifyInvoice(
        confirmation,
        user,
        PRODUCTS.blueTop.unitPrice,
        invoicePath,
      );
    });

    await deleteCurrentAccount(page);
  });

  test('Register during Guest Checkout → Place Order → Download invoice @regression', async (
    { page },
    testInfo,
  ) => {
    test.setTimeout(env.timeouts.journey);
    const user = generateUser();

    await test.step('Add a product, then hit checkout as a guest', async () => {
      const products = new ProductsPage(page);
      await products.open();
      const [addResponse] = await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes(`/add_to_cart/${PRODUCTS.blueTop.id}`),
        ),
        products.clickAddToCartByName(PRODUCTS.blueTop.name),
      ]);
      expect(
        addResponse.ok(),
        `Adding ${PRODUCTS.blueTop.name} should succeed (HTTP ${addResponse.status()})`,
      ).toBe(true);

      const cart = new CartPage(page);
      await cart.open();
      await expect(cart.productRows).toHaveCount(1);
      await expect(cart.productRow(PRODUCTS.blueTop.id)).toContainText(PRODUCTS.blueTop.name);
      await cart.proceedToCheckout();
      await expect(cart.checkoutModal).toBeVisible();
      await cart.chooseRegisterOrLoginAtCheckout();
    });

    await registerUser(page, user);

    const confirmation = await completeOrder(page);

    await test.step('Download the invoice and verify the amount', async () => {
      const invoicePath = testInfo.outputPath('invoice-checkout-registration.txt');
      await downloadAndVerifyInvoice(
        confirmation,
        user,
        PRODUCTS.blueTop.unitPrice,
        invoicePath,
      );
      log.pass('Invoice downloaded for the register-during-checkout E2E; customer name and order amount are correct');
    });

    await deleteCurrentAccount(page);
  });

  test('Sign In before Checkout → Place Order @regression', async ({
    page,
    authedUser,
  }) => {
    test.setTimeout(env.timeouts.journey);
    const home = new HomePage(page);

    await test.step('Log out, then sign in again with the fixture account', async () => {
      await home.logout();

      const signup = new SignupLoginPage(page);
      await signup.open();
      expect(await signup.login(authedUser.user.email, authedUser.user.password)).toBe('success');
      await home.expectLoggedInAs(authedUser.user.name);
    });

    await test.step('Add a product and complete the order', async () => {
      const products = new ProductsPage(page);
      await products.open();
      await products.addToCartByName(PRODUCTS.blueTop.name);
      await products.viewCartFromModal();
      await completeOrder(page);
    });

    await deleteCurrentAccount(page);
  });
});
