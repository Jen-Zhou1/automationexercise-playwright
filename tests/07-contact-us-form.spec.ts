/**
 * Contact Us Form: TC 6
 * Data-driven HTML5 validation failures and a successful submission with an attachment 
 * Site's native confirmation dialog
 */
import { test, expect } from '../fixtures/base-fixtures';
import { ContactPage } from '../pages/ContactPage';
import { CONTACT_INVALID_SUBMISSIONS } from '../testdata/checkout';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';

test.describe('Contact Us Form Validation', () => {
  // —— Block Invalid Input Validation: Data-driven ——
  for (const submission of CONTACT_INVALID_SUBMISSIONS) {
    test(`Submission Blocked: ${submission.email === '' ? 'Empty Required Email' : 'Invalid Email Format'} @smoke @regression`, async ({
      page,
    }) => {
      const contact = new ContactPage(page);
      await contact.goto();
      await contact.submit(submission);

      // The request is never sent: the page remains on the same screen and the target field is :invalid
      await expect(page).toHaveURL(/\/contact_us/);
      await expect(contact.invalidFields.first()).toBeVisible();
      log.pass('Browser HTML5 validation blocked the invalid submission');
    });
  }

  // —— Valid Submission: file upload + confirm dialog ——
  test('Valid Submission (inc. attachment) → Success Message @smoke @regression', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();

    // Upload an Attachment (constructed in memory; no real file required)
    await contact.fileUpload.setInputFiles({
      name: 'qa-evidence.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('QA automated test evidence attachment'),
    });

    await contact.submit(
      {
        name: 'AutoQA Engineer',
        email: uniqueEmail('contact'),
        subject: 'Question about my order',
        message: 'Hello, this is an automated QA inquiry. Please ignore.',
      },
      /* acceptConfirmDialog */ true, // The site shows a native confirm on submit; it must be accepted
    );

    await expect(contact.successAlert).toBeVisible();
    await expect(contact.successAlert).toContainText(
      'Success! Your details have been submitted successfully.',
    );
    log.pass('Contact Us form submitted with visible success message');
  });
});
