/**
 * Screenshot stabilisation (helpers/stabilize.ts).
 *
 * Most visual failures are not a changed page but an unsettled one:
 *  - a carousel advancing on its own (Bootstrap's JS timer, which
 *    `animations: 'disabled'` does not stop)
 *  - webfonts still swapping, so text reflows
 *  - images still loading or failed, so placeholders have a different height
 *  - the mouse resting on an element, capturing a hover state
 *
 * Call once before every capture. Broken images abort with their URL. Cost is
 * roughly 0.3-1 s when assets are healthy.
 */
import type { Page } from '@playwright/test';
import { freezeCarousels } from '../utils/carousel';

/** Extra pause after all assets are ready, so the last transition finishes. */
const SETTLE_MS = 300;

/** Upper bound while waiting for fonts and images, so one broken asset cannot stall a test. */
const ASSET_TIMEOUT_MS = 8_000;

/**
 * Bring the page into a state that can be captured reliably.
 * The order matters: freeze the carousels, wait for assets, then move the mouse
 * away and let everything settle.
 */
export async function stabilizeForScreenshot(page: Page): Promise<void> {
  await freezeCarousels(page);
  await waitForAssets(page);
  /* Move the pointer out of the content area so no hover state reaches the baseline. */
  await page.mouse.move(1, 1);
  await page.waitForTimeout(SETTLE_MS);
}

/** Wait boundedly for webfonts and unfinished images, then reject known broken images. */
async function waitForAssets(page: Page): Promise<void> {
  const assetsReady = page.evaluate(async () => {
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }

    const pending = Array.from(document.images).filter((image) => !image.complete);
    await Promise.all(
      pending.map(
        (image) =>
          new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 5_000);
            const done = (): void => {
              window.clearTimeout(timer);
              resolve();
            };
            image.addEventListener('load', done, { once: true });
            image.addEventListener('error', done, { once: true });
          }),
      ),
    );
  });

  await Promise.race([assetsReady, page.waitForTimeout(ASSET_TIMEOUT_MS)]);

  const failedImageUrls = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || '(missing src)'),
  );
  if (failedImageUrls.length > 0) {
    throw new Error(
      `Screenshot aborted: ${failedImageUrls.length} image(s) failed to load:\n` +
        failedImageUrls.map((url) => `- ${url}`).join('\n'),
    );
  }
}
