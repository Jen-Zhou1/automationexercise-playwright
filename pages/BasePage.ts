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
 * Every user action goes through the protected wrappers inherited from
 * Component rather than direct locator actions. Those wrappers run the site
 * health check first, so overload errors are reported before locator errors.
 */
import type { Page } from '@playwright/test';
import { env } from '../config/env';
import { SITE_MESSAGES } from '../testdata/site-messages';
import { Component } from './Component';

export { type FileAttachment } from './Component';
export const SITE_OVERLOAD_MESSAGE = SITE_MESSAGES.queueFull;

export class BasePage extends Component {
  /** Open a site-relative path. */
  async goto(path: string): Promise<void> {
    await this.page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout: env.timeouts.navigation,
    });
    await this.assertSiteAvailable();
  }
}
