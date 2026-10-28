/**
 * Official cases 10, 11, 25, and 26: home/cart subscriptions and both scroll-to-top
 * behaviors (arrow control and manual scrolling).
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { uniqueEmail } from '../utils/data-generator';

test('滚动到底部后分别使用回顶箭头和键盘回顶（官方场景 25、26） @regression', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.scrollToFooter();
  await expect(home.subscription.heading).toBeInViewport();
  await home.scrollToTopWithArrow();
  await expect(home.heroHeading).toBeInViewport();

  await home.scrollToFooter();
  await expect(home.subscription.heading).toBeInViewport();
  await home.scrollToTopWithoutArrow();
  await expect(home.heroHeading).toBeInViewport();
});

test('首页订阅成功提示（官方场景 10） @regression', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();
  await home.scrollToFooter();
  await expect(home.subscription.heading).toBeVisible();
  await home.subscription.subscribe(uniqueEmail('home_subscription'));
  await expect(home.subscription.successMessage).toContainText(
    'You have been successfully subscribed!',
  );
});

test('购物车页订阅成功提示（官方场景 11） @regression', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.goto();
  await cart.subscription.heading.scrollIntoViewIfNeeded();
  await expect(cart.subscription.heading).toBeVisible();
  await cart.subscription.subscribe(uniqueEmail('cart_subscription'));
  await expect(cart.subscription.successMessage).toContainText(
    'You have been successfully subscribed!',
  );
});
