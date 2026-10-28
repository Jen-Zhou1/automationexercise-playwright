/**
 * Contact us page (pages/ContactPage.ts)
 * Verified: fields `data-qa = name / email / subject / message`;
 * File Input `input[name="upload_file"]`; submit button `data-qa="submit-button"`.
 * ⚠️ Key behavior: submit triggers the native `confirm("Press OK to proceed!")`;
 *    Only after accepting does JS show the `.alert-success` success message (see README "site-specific behavior").
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { ContactSubmission } from '../testdata/checkout';

export class ContactPage extends BasePage {
  readonly name: Locator = this.page.locator('[data-qa="name"]');
  readonly email: Locator = this.page.locator('[data-qa="email"]');
  readonly subject: Locator = this.page.locator('[data-qa="subject"]');
  readonly message: Locator = this.page.locator('[data-qa="message"]');
  readonly fileUpload: Locator = this.page.locator('input[name="upload_file"]');
  readonly submitButton: Locator = this.page.locator('[data-qa="submit-button"]');
  readonly successAlert: Locator = this.page.locator('#contact-page .status.alert-success');
  readonly invalidFields: Locator = this.page.locator('#contact-us-form :invalid');

  async goto(): Promise<void> {
    await super.goto('/contact_us');
  }

  /**
   * Fill the Contact Us form and submit.
   * @param acceptConfirmDialog whether to automatically accept the native confirm dialog (must be true for the success path)
   */
  async submit(data: ContactSubmission, acceptConfirmDialog = false): Promise<void> {
    // Fill only the fields that have values (empty values are used to validate required-field scenarios)
    if (data.name) await this.fill(this.name, data.name);
    if (data.email) await this.fill(this.email, data.email);
    if (data.subject) await this.fill(this.subject, data.subject);
    if (data.message) await this.fill(this.message, data.message);

    if (acceptConfirmDialog) {
      // Must register before clicking submit; otherwise the dialog hangs until timeout
      this.page.once('dialog', (dialog) => dialog.accept());
    }
    await this.click(this.submitButton);
  }
}
