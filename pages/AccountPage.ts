/**
 * Account Information Form page / Account Created page (pages/AccountPage.ts)
 * Registration second-step form + registered confirmation.
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { TestUser } from '../testdata/users';

export class AccountPage extends BasePage {
  // —— Account Information Form (data-qa verified) ——
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

  // —— Account Created Page ——
  readonly accountCreated: Locator = this.page.locator('[data-qa="account-created"]');
  readonly accountDeleted: Locator = this.page.locator('[data-qa="account-deleted"]');
  readonly continueButton: Locator = this.page.locator('[data-qa="continue-button"]');

  async fillAccountInfo(user: TestUser): Promise<void> {
    await this.check(this.titleMr);
    await this.fill(this.password, user.password);
    await this.selectOption(this.days, user.birth.day);
    await this.selectOption(this.months, user.birth.month);
    await this.selectOption(this.years, user.birth.year);
    await this.check(this.newsletter);
    await this.check(this.partnerOffers);
    await this.fill(this.firstName, user.firstName);
    await this.fill(this.lastName, user.lastName);
    await this.fill(this.company, user.company);
    await this.fill(this.address1, user.address1);
    await this.fill(this.address2, user.address2);
    await this.selectOption(this.country, { label: user.country }); // site dropdown value is the same as the visible label text
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

  /** Assert the account-deletion success message. */
  async expectAccountDeleted(): Promise<void> {
    await this.expectVisible(this.accountDeleted);
    await this.expectText(this.accountDeleted, 'Account Deleted!');
  }

  /** Click Continue to return home (User is already logged in). */
  async continueToHome(): Promise<void> {
    await this.click(this.continueButton);
  }
}
