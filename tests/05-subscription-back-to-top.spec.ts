/**
 * TC-07 Site-wide widgets (site TC 10, 11, 25, 26)
 * Back-to-top arrow (click and keyboard), footer subscription on Home and Cart.
 *
 * These two belong to the site chrome rather than to any business flow: the
 * footer subscription appears on every page, and the back-to-top arrow is a
 * global control layered over the content. Keeping them in their own file means
 * a footer regression is not mistaken for a cart failure.
 *
 * The file is named after the features (subscription, back-to-top) rather than
 * an abstract label like "site chrome", so the file list states its coverage
 * directly; a new global control would require renaming it.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { uniqueEmail } from '../utils/data-generator';

test('Scroll to Bottom - Back-to-Top Arrow @regression', async ({ page }) => {
  const home = new HomePage(page);

  await test.step('Open the home page and scroll to the footer', async () => {
    await home.open();
    await home.scrollToFooter();
    await expect(home.subscription.heading).toBeInViewport();
  });

  await test.step('Click the scroll-up arrow → back at the top', async () => {
    await home.scrollToTopWithArrow();
    await expect(home.heroBanner).toBeInViewport();
  });

  await test.step('Scroll again, then use the keyboard Home key → back at the top', async () => {
    await home.scrollToFooter();
    await expect(home.subscription.heading).toBeInViewport();
    await home.scrollToTopWithoutArrow();
    await expect(home.heroBanner).toBeInViewport();
  });
});

test('Success Message on Home Subscription @regression', async ({ page }) => {
  const home = new HomePage(page);

  await test.step('Scroll to the footer subscription block', async () => {
    await home.open();
    await home.scrollToFooter();
    await expect(home.subscription.heading).toBeVisible();
  });

  await test.step('Subscribe with a unique email → success message', async () => {
    await home.subscription.subscribe(uniqueEmail('home_subscription'));
    await expect(home.subscription.successMessage).toContainText(
      'You have been successfully subscribed!',
    );
  });
});

test('Success Message on Cart Subscription @regression', async ({ page }) => {
  const cart = new CartPage(page);

  await test.step('Open the cart page and bring the subscription block into view', async () => {
    await cart.open();
    await cart.subscription.scrollIntoView();
    await expect(cart.subscription.heading).toBeVisible();
  });

  await test.step('Subscribe with a unique email → success message', async () => {
    await cart.subscription.subscribe(uniqueEmail('cart_subscription'));
    await expect(cart.subscription.successMessage).toContainText(
      'You have been successfully subscribed!',
    );
  });
});
