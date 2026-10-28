/**
 * Footer subscriptions, Home/Cart's scroll-to-top: TC 10, 11, 25, 26
 * Behaviors (arrow control and manual scrolling)
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { uniqueEmail } from '../utils/data-generator';

test('Scroll to Bottom - Back-to-Top Arrow @regression', async ({ page }) => {
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

test('Success Message on Home Subscription @regression', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();
  await home.scrollToFooter();
  await expect(home.subscription.heading).toBeVisible();
  await home.subscription.subscribe(uniqueEmail('home_subscription'));
  await expect(home.subscription.successMessage).toContainText(
    'You have been successfully subscribed!',
  );
});

test('Success Message on Cart Subscription @regression', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.goto();
  await cart.subscription.heading.scrollIntoViewIfNeeded();
  await expect(cart.subscription.heading).toBeVisible();
  await cart.subscription.subscribe(uniqueEmail('cart_subscription'));
  await expect(cart.subscription.successMessage).toContainText(
    'You have been successfully subscribed!',
  );
});
