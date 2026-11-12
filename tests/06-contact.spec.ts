/**
 * TC-08 Contact Us (site TC 6)
 * HTML5 validation failures (data-driven, negative branch) and one successful submission with an
 * attachment, including the site's native confirmation dialog.
 *
 * Own file on purpose: it is the only flow with a native `confirm()` dialog and an upload,
 * both of which are the first suspects when a unrelated-looking failure shows up here.
 *
 * The successful submission also carries @smoke so the fast lane checks both a
 * completed order and a successful form submission.
 *
 * Tags: @smoke @regression (success) / @regression (the two invalid submissions).
 * The double tag keeps "smoke is a subset of regression" true at tag level, while
 * `test:regression` adds `--grep-invert @smoke` to keep the *run* disjoint
 * (18 executed of the 20 tagged).
 */
import { test, expect } from '../fixtures/base-fixtures';
import { ContactPage } from '../pages/ContactPage';
import { CONTACT_INVALID_SUBMISSIONS, type ContactSubmission } from '../testdata/checkout';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';

test.describe('Contact Us Form Validation', () => {
  // —— Block Invalid Input Validation: Data-driven ——
  for (const submission of CONTACT_INVALID_SUBMISSIONS) {
    test(`Submission Blocked: ${submission.email === '' ? 'Empty Required Email' : 'Invalid Email Format'} @regression`, async ({
      page,
    }) => {
      const contact = new ContactPage(page);

      await test.step('Fill the form with the invalid value and submit', async () => {
        await contact.open();
        await contact.submit(submission);
      });

      await test.step('The browser blocks the request and the field is :invalid', async () => {
        // The request is never sent: the page remains on the same screen and the target field is :invalid
        await expect(page).toHaveURL(/\/contact_us/);
        await expect(contact.invalidFields.first()).toBeVisible();
        log.pass('Browser HTML5 validation blocked the invalid submission');
      });
    });
  }

  // —— Valid Submission: file upload + confirm dialog ——
  test('Valid Submission (inc. attachment) → Success Message @smoke @regression', async ({ page }) => {
    const contact = new ContactPage(page);
    const submission: ContactSubmission = {
      name: 'AutoQA Engineer',
      email: uniqueEmail('contact'),
      subject: 'Question about my order',
      message: 'Hello, this is an automated QA inquiry. Please ignore.',
    };

    await test.step('Fill the form and attach a file (constructed in memory)', async () => {
      await contact.open();
      await contact.attachFile({
        name: 'qa-evidence.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('QA automated test evidence attachment'),
      });
    });

    await test.step('Submit and accept the native confirm dialog', async () => {
      await contact.submit(submission, /* acceptConfirmDialog */ true);
    });

    await test.step('Success message is shown', async () => {
      await expect(contact.successAlert).toBeVisible();
      await expect(contact.successAlert).toContainText(
        'Success! Your details have been submitted successfully.',
      );
      log.pass('Contact Us form submitted with visible success message');
    });
  });
});
