/**
 * Home page / Header navigation (pages/HomePage.ts)
 * Header is present on every page, and login-state assertions are centralized here.
 */
import { Locator, expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SubscriptionSection } from './SubscriptionSection';
import { env } from '../config/env';

export class HomePage extends BasePage {
  readonly subscription: SubscriptionSection;
  // Header navigation, chosen by verified href.
  readonly signupLoginLink: Locator = this.page.locator('a[href="/login"]');
  readonly logoutLink: Locator = this.page.locator('a[href="/logout"]');
  readonly deleteAccountLink: Locator = this.page.locator('a[href="/delete_account"]');
  readonly productsLink: Locator = this.page.locator('a[href="/products"]');
  readonly cartLink: Locator = this.page.locator('a[href="/view_cart"]').first();
  readonly contactLink: Locator = this.page.locator('a[href="/contact_us"]');
  readonly loggedInAs: Locator = this.page.getByText(/Logged in as/);
  readonly visualAnchor: Locator = this.page.locator('#slider-carousel, .features_items').first();
  /**
   * The carousel container, used as the back-to-top anchor.
   * Do not assert on `.item.active h2`: Bootstrap moves the active class every
   * 5 seconds, which rebuilds that node, so `toBeInViewport()` fails at random
   * whenever it lands on a slide change. The container itself never detaches.
   */
  readonly heroBanner: Locator = this.page.locator('#slider-carousel');
  readonly footer: Locator = this.page.locator('#footer');
  readonly scrollUpButton: Locator = this.page.locator('#scrollUp');

  constructor(page: Page) {
    super(page);
    this.subscription = new SubscriptionSection(page);
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  /** Assert that the specified user is logged in (the site shows "Logged in as <name>" in the header) */
  async expectLoggedInAs(name: string): Promise<void> {
    await expect(this.page).toHaveURL('/');
    /* Keep the global expect timeout here: under load this is the assertion most likely to be slow. */
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible({
      timeout: env.timeouts.expect,
    });
    await this.expectText(this.loggedInAs, name);
  }

  /** Assert that the user is logged out (Signup/Login appears, Logout does not) */
  async expectLoggedOut(): Promise<void> {
    await this.expectVisible(this.signupLoginLink);
    await expect(this.logoutLink).toHaveCount(0);
  }

  async logout(): Promise<void> {
    await this.click(this.logoutLink);
  }

  async goToProducts(): Promise<void> {
    await this.click(this.productsLink);
  }

  async goToCart(): Promise<void> {
    await this.click(this.cartLink);
  }

  async goToContactUs(): Promise<void> {
    await this.click(this.contactLink);
  }

  /** Delete the currently logged-in account. */
  async deleteAccount(): Promise<void> {
    await this.click(this.deleteAccountLink);
  }

  /** Scroll the footer into view. */
  async scrollToFooter(): Promise<void> {
    await this.scrollTo(this.footer);
  }

  /** Click the site scroll-up arrow and confirm that the hero banner is back in view. */
  async scrollToTopWithArrow(): Promise<void> {
    await this.click(this.scrollUpButton);
    await expect(this.heroBanner).toBeInViewport();
  }

  /** Use the keyboard Home key to return to the top of the page. */
  async scrollToTopWithoutArrow(): Promise<void> {
    await this.pressKey('Home');
    await expect(this.heroBanner).toBeInViewport();
  }
}
