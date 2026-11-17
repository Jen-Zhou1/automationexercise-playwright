/**
 * Shared interaction capabilities, verified against the site's main-frame
 * navigation and queue-full response behavior. Contains no navigation method.
 */
import { Page, Locator, expect, type Download } from '@playwright/test';
import { SITE_MESSAGES } from '../testdata/site-messages';
import { getMainDocumentHealth } from '../utils/network';

/**
 * In-memory file payload accepted by `setInputFiles`.
 * Declared locally to avoid depending on a playwright-core internal type.
 */
export interface FileAttachment {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export class Component {
  constructor(protected readonly page: Page) {}

  protected async click(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await locator.click();
  }

  protected async fill(locator: Locator, value: string): Promise<void> {
    await this.assertSiteAvailable();
    await locator.fill(value);
  }

  /** Check a checkbox or radio (registration title, newsletter, partner offers). */
  protected async check(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await locator.check();
  }

  /** Choose an `<option>` in a native `<select>` (birth date, country). */
  protected async selectOption(
    locator: Locator,
    values: Parameters<Locator['selectOption']>[0],
  ): Promise<string[]> {
    await this.assertSiteAvailable();
    return locator.selectOption(values);
  }

  protected async textOf(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
  }

  /** Attach an in-memory file to an `<input type="file">` (no fixture needed on disk). */
  protected async setInputFiles(locator: Locator, file: FileAttachment): Promise<void> {
    await this.assertSiteAvailable();
    await locator.setInputFiles(file);
  }

  /** Scroll an element into view (also runs the queue-full check). */
  protected async scrollTo(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await locator.scrollIntoViewIfNeeded();
  }

  /** Press a key that is part of a user journey (e.g. Home for back-to-top). */
  protected async pressKey(key: string): Promise<void> {
    await this.assertSiteAvailable();
    await this.page.keyboard.press(key);
  }

  /**
   * Click a link that starts a download and return the download handle.
   * Waiting must start before the click: a download link usually does not
   * navigate, so "click, then waitForEvent('download')" misses the event and
   * waits until timeout. Running both concurrently also keeps the click inside
   * this class, so the queue-full check is not bypassed.
   */
  protected async clickAndWaitForDownload(locator: Locator): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.click(locator),
    ]);
    return download;
  }

  protected async expectVisible(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await expect(locator).toBeVisible();
  }

  protected async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await this.assertSiteAvailable();
    await expect(locator).toContainText(text);
  }

  /** Wait for the URL to match, instead of sleeping for an estimated duration. */
  protected async expectUrl(pattern: RegExp | string): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  /**
   * Fail fast when the site serves its queue-full page, a 5xx document, or an
   * empty document response.
   */
  protected async assertSiteAvailable(): Promise<void> {
    const overloadNotice = this.page.getByText(SITE_MESSAGES.queueFull, { exact: false });
    if ((await overloadNotice.count()) > 0) {
      throw new Error(
        `Automation Exercise is overloaded (queue full) at ${this.page.url()}`,
      );
    }

    const documentHealth = getMainDocumentHealth(this.page);
    if (!documentHealth.hasResponse) {
      return;
    }
    if (documentHealth.status >= 500) {
      throw new Error(
        `Automation Exercise returned HTTP ${documentHealth.status} at ${this.page.url()}`,
      );
    }
  }
}
