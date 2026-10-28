/**
 * 首页 / 全局头部导航（pages/HomePage.ts）
 * 头部导航在每个页面都存在，登录态断言统一放这里。
 */
import { Locator, expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SubscriptionSection } from './SubscriptionSection';

export class HomePage extends BasePage {
  readonly subscription: SubscriptionSection;
  // —— 全局头部导航（已核实的 href）——
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

  /** 断言已登录为指定用户（站点在头部显示 "Logged in as <名字>"） */
  async expectLoggedInAs(name: string): Promise<void> {
    await expect(this.page).toHaveURL('/');
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible({ timeout: 15_000 });
    await this.expectText(this.loggedInAs, name);
  }

  /** 断言已登出（出现 Signup/Login，没有 Logout） */
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

  /** 删除当前登录账户。 */
  async deleteAccount(): Promise<void> {
    await this.click(this.deleteAccountLink);
  }

  /** 将页脚滚动到可视区域。 */
  async scrollToFooter(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded();
  }

  /** 点击站点回顶箭头并确认首页主标题进入视口。 */
  async scrollToTopWithArrow(): Promise<void> {
    await this.click(this.scrollUpButton);
    await expect(this.heroHeading).toBeInViewport();
  }

  /** 使用键盘 Home 键回到页面顶部。 */
  async scrollToTopWithoutArrow(): Promise<void> {
    await this.page.keyboard.press('Home');
    await expect(this.heroHeading).toBeInViewport();
  }
}
