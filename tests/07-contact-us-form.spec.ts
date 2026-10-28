/**
 * Contact Us form coverage: data-driven HTML5 validation failures and a successful
 * submission with an attachment and the site's native confirmation dialog.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { ContactPage } from '../pages/ContactPage';
import { CONTACT_INVALID_SUBMISSIONS } from '../testdata/checkout';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';

test.describe('联系表单校验', () => {
  // —— 数据驱动：异常输入被校验拦截 ——
  for (const submission of CONTACT_INVALID_SUBMISSIONS) {
    test(`提交被拦截：${submission.email === '' ? '必填邮箱为空' : '邮箱格式非法'} @smoke @regression`, async ({
      page,
    }) => {
      const contact = new ContactPage(page);
      await contact.goto();
      await contact.submit(submission);

      // 请求未发出：页面停在原页，且目标字段处于 :invalid 状态
      await expect(page).toHaveURL(/\/contact_us/);
      await expect(contact.invalidFields.first()).toBeVisible();
      log.pass('浏览器 HTML5 校验拦截了非法提交');
    });
  }

  // —— 正常提交：文件上传 + confirm 弹窗 ——
  test('合法提交（含附件上传）→ 成功提示 @smoke @regression', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();

    // 上传附件（内存构造，无需真实文件）
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
      /* acceptConfirmDialog */ true, // 站点提交时弹原生 confirm，必须点确定
    );

    await expect(contact.successAlert).toBeVisible();
    await expect(contact.successAlert).toContainText(
      'Success! Your details have been submitted successfully.',
    );
    log.pass('联系表单提交成功，成功提示可见');
  });
});
