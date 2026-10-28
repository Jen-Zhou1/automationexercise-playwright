/**
 * 账户创建页 / 账户已创建页（pages/AccountPage.ts）
 * 注册第二步表单 + 创建成功确认。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { TestUser } from '../testdata/users';

export class AccountPage extends BasePage {
  // —— 账户信息表单（data-qa 已核实）——
  readonly titleMr: Locator = this.page.locator('#id_gender1'); // Mr
  readonly password: Locator = this.page.locator('[data-qa="password"]');
  readonly days: Locator = this.page.locator('[data-qa="days"]');
  readonly months: Locator = this.page.locator('[data-qa="months"]');
  readonly years: Locator = this.page.locator('[data-qa="years"]');
  readonly newsletter: Locator = this.page.locator('#newsletter');
  readonly partnerOffers: Locator = this.page.locator('#optin');
  readonly firstName: Locator = this.page.locator('[data-qa="first_name"]');
  readonly lastName: Locator = this.page.locator('[data-qa="last_name"]');
  readonly company: Locator = this.page.locator('[data-qa="company"]');
  readonly address1: Locator = this.page.locator('[data-qa="address"]'); // name=address1
  readonly address2: Locator = this.page.locator('[data-qa="address2"]');
  readonly country: Locator = this.page.locator('[data-qa="country"]');
  readonly state: Locator = this.page.locator('[data-qa="state"]');
  readonly city: Locator = this.page.locator('[data-qa="city"]');
  readonly zipcode: Locator = this.page.locator('[data-qa="zipcode"]');
  readonly mobileNumber: Locator = this.page.locator('[data-qa="mobile_number"]');
  readonly createAccountButton: Locator = this.page.locator('[data-qa="create-account"]');

  // —— 账户已创建页 ——
  readonly accountCreated: Locator = this.page.locator('[data-qa="account-created"]');
  readonly accountDeleted: Locator = this.page.locator('[data-qa="account-deleted"]');
  readonly continueButton: Locator = this.page.locator('[data-qa="continue-button"]');

  async fillAccountInfo(user: TestUser): Promise<void> {
    await this.titleMr.check();
    await this.fill(this.password, user.password);
    await this.days.selectOption(user.birth.day);
    await this.months.selectOption(user.birth.month);
    await this.years.selectOption(user.birth.year);
    await this.newsletter.check();
    await this.partnerOffers.check();
    await this.fill(this.firstName, user.firstName);
    await this.fill(this.lastName, user.lastName);
    await this.fill(this.company, user.company);
    await this.fill(this.address1, user.address1);
    await this.fill(this.address2, user.address2);
    await this.country.selectOption({ label: user.country }); // 站点下拉 value 即标签文本
    await this.fill(this.state, user.state);
    await this.fill(this.city, user.city);
    await this.fill(this.zipcode, user.zipcode);
    await this.fill(this.mobileNumber, user.mobile);
  }

  async submitCreateAccount(): Promise<void> {
    await this.click(this.createAccountButton);
  }

  async expectAccountCreated(): Promise<void> {
    await this.expectVisible(this.accountCreated);
    await this.expectText(this.accountCreated, 'Account Created!');
  }

  /** 断言账户删除成功提示。 */
  async expectAccountDeleted(): Promise<void> {
    await this.expectVisible(this.accountDeleted);
    await this.expectText(this.accountDeleted, 'Account Deleted!');
  }

  /** 点击 Continue 回到首页（此时已自动登录） */
  async continueToHome(): Promise<void> {
    await this.click(this.continueButton);
  }
}
