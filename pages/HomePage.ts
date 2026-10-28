/**
 * Home page / Header navigation (pages/HomePage.ts)
 * Header is present on every page, and login-state assertions are centralized here.
 */
import { Locator, expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SubscriptionSection } from './SubscriptionSection';

export class HomePage extends BasePage {
  readonly subscription: SubscriptionSection;
  // —— Header Navigation (verified hrefs) ——
  readonly signupLoginLink: Locator = this.page.locator('a[href="/login"]');
  readonly logoutLink: Locator = this.page.locator('a[href="/logout"]');
  readonly deleteAccountLink: Locator = this.page.locator('a[href="/delete_account"]');
  readonly productsLink: Locator = this.page.locator('a[href="/products"]');
  readonly cartLink: Locator = this.page.locator('a[href="/view_cart"]').first();
  readonly contactLink: Locator = this.page.locator('a[href="/contact_us"]');
  readonly loggedInAs: Locator = this.page.getByText(/Logged in as/);
  readonly visualAnchor: Locator = this.page.locator('#slider-carousel, .features_items').first();
  readonly heroHeading: Locator = this.page.locator('#slider-carousel .item.active h2');
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
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible({ timeout: 15_000 });
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
    await this.footer.scrollIntoViewIfNeeded();
  }

  /** Click the site scroll-up arrow and confirm that the main home heading is in view. */
  async scrollToTopWithArrow(): Promise<void> {
    await this.click(this.scrollUpButton);
    await expect(this.heroHeading).toBeInViewport();
  }

  /** Use the keyboard Home key to return to the top of the page. */
  async scrollToTopWithoutArrow(): Promise<void> {
    await this.page.keyboard.press('Home');
    await expect(this.heroHeading).toBeInViewport();
  }
}
