/**
 * Standalone axe-core scans for key storefront, account, and order states.
 * Each flow archives and logs all findings without gating public-site business flows.
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
  scanAccessibilityPage,
  writeAccessibilityReport,
  type AccessibilityScan,
} from '../utils/a11y';
import { env } from '../config/env';
import { ORDER_COMMENT, PAYMENT_CARDS } from '../testdata/checkout';
import { PRODUCTS } from '../testdata/products';

async function archiveAccessibilityFindings(
  scans: AccessibilityScan[],
  testInfo: Parameters<typeof writeAccessibilityReport>[1],
): Promise<void> {
  await writeAccessibilityReport(scans, testInfo);
}

test.describe('无障碍扫描（axe-core）', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== env.accessibilityProject,
      `Accessibility scans run only in ${env.accessibilityProject}`,
    );
  });

  test('扫描首页、推荐商品、目录、分类、品牌及商品详情 @a11y', async ({ page }, testInfo) => {
    const scans: AccessibilityScan[] = [];
    const home = new HomePage(page);
    const products = new ProductsPage(page);

    await home.open();
    await expect(home.visualAnchor).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    await expect(products.recommendedItems).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    await products.goto();
    await expect(products.productPageHeading).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    await products.categoryHeading('Women').click();
    await products.openCategory('Tops');
    await expect(products.productCards.first()).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    await products.goto();
    await products.openBrand('POLO');
    await expect(products.productCards.first()).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    const detail = new ProductDetailPage(page);
    await detail.goto(PRODUCTS.blueTop.id);
    await expect(detail.productInformation).toBeVisible();
    scans.push(await scanAccessibilityPage(page));
    await archiveAccessibilityFindings(scans, testInfo);
  });

  test('扫描登录、联系表单和购物车 @a11y', async ({ page }, testInfo) => {
    const scans: AccessibilityScan[] = [];
    const signupLogin = new SignupLoginPage(page);
    await signupLogin.goto();
    await expect(signupLogin.loginButton).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    const contact = new ContactPage(page);
    await contact.goto();
    await expect(contact.submitButton).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    const products = new ProductsPage(page);
    await products.goto();
    await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.viewCartFromModal();

    const cart = new CartPage(page);
    await expect(cart.productRows.first()).toBeVisible();
    scans.push(await scanAccessibilityPage(page));
    await archiveAccessibilityFindings(scans, testInfo);
  });

  test('扫描已登录结算、支付和订单确认 @a11y', async ({ authedUser }, testInfo) => {
    test.setTimeout(env.timeouts.registration * 2);
    const scans: AccessibilityScan[] = [];
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
    scans.push(await scanAccessibilityPage(page));

    await checkout.addComment(ORDER_COMMENT);
    await checkout.placeOrder();
    const payment = new PaymentPage(page);
    await expect(payment.payButton).toBeVisible();
    scans.push(await scanAccessibilityPage(page));

    await payment.pay(card);
    const confirmation = new OrderConfirmationPage(page);
    await confirmation.expectOrderPlaced();
    scans.push(await scanAccessibilityPage(page));

    await confirmation.continueToHome();
    const home = new HomePage(page);
    await home.deleteAccount();
    const account = new AccountPage(page);
    await account.expectAccountDeleted();
    await account.continueToHome();
    await home.expectLoggedOut();
    await archiveAccessibilityFindings(scans, testInfo);
  });
});
