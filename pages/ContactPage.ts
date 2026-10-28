/**
 * 联系我们页（pages/ContactPage.ts）
 * 已核实：字段 data-qa = name / email / subject / message；
 * 文件域 input[name="upload_file"]；提交 data-qa="submit-button"。
 * ⚠️ 关键行为：提交时弹出原生 confirm("Press OK to proceed!")，
 *    点确定后 JS 才显示 .alert-success 成功提示（见 README「站点特殊行为」）。
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
   * 填写并提交。
   * @param acceptConfirmDialog 是否自动点掉原生 confirm 弹窗（成功路径必须为 true）
   */
  async submit(data: ContactSubmission, acceptConfirmDialog = false): Promise<void> {
    // 只填有值的字段（空值用于验证"必填缺失"场景）
    if (data.name) await this.fill(this.name, data.name);
    if (data.email) await this.fill(this.email, data.email);
    if (data.subject) await this.fill(this.subject, data.subject);
    if (data.message) await this.fill(this.message, data.message);

    if (acceptConfirmDialog) {
      // 必须在点击 submit 之前注册，否则弹窗会挂起超时
      this.page.once('dialog', (dialog) => dialog.accept());
    }
    await this.click(this.submitButton);
  }

}
