/**
 * Base class for every page object (pages/BasePage.ts).
 *
 * It holds shared capabilities only, never business logic. Locator priority used
 * across the framework: data-qa attribute > stable href/attribute > #id >
 * semantic class > text.
 *
 * Subclasses expose `open(...)` / `openProduct(id)` instead of overriding
 * `goto(path)`: an override changes what the base signature means, and a
 * polymorphic call then navigates somewhere else.
 *
 * Every user action (click, fill, check, selectOption, key press, scroll,
 * download click) goes through the protected wrappers below rather than
 * `locator.click()`. The wrappers run the queue-full check first, so an action
 * on an overloaded site reports "the site is queueing" instead of "element not
 * visible".
 */
import { Page, Locator, expect, type Download } from '@playwright/test';
import { env } from '../config/env';

/**
 * In-memory file payload accepted by `setInputFiles`.
 * Declared locally to avoid depending on a playwright-core internal type.
 */
export interface FileAttachment {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export const SITE_OVERLOAD_MESSAGE = 'This website is under heavy load (queue full)';

export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Open a site-relative path. */
  async goto(path: string): Promise<void> {
    await this.page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout: env.timeouts.navigation,
    });
    await this.assertSiteAvailable();
  }

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
    await expect(locator).toContainText(text);
  }

  /** Wait for the URL to match, instead of sleeping for an estimated duration. */
  protected async expectUrl(pattern: RegExp | string): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  /**
   * Fail fast when the site serves its "queue full" page.
   * Uses an existence query rather than `body.innerText()`: the latter pulls the
   * whole page text into Node on every action and forces a layout each time.
   */
  protected async assertSiteAvailable(): Promise<void> {
    const overloadNotice = this.page.getByText(SITE_OVERLOAD_MESSAGE, { exact: false });
    if ((await overloadNotice.count()) > 0) {
      throw new Error(
        `Automation Exercise is overloaded (queue full) at ${this.page.url()}`,
      );
    }
  }
}
