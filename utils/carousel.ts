/**
 * Carousel control (utils/carousel.ts).
 *
 * The homepage slider (`#slider-carousel`) and the recommended-items strip
 * (`#recommended-item-carousel`) both carry `data-ride="carousel"`, so Bootstrap
 * advances them every 5 seconds. Two consequences, both observed on the live site:
 *
 *  1. A screenshot can capture slide 2 or a half-slid frame, so the baseline is
 *     unstable.
 *  2. Reading the active product id and then re-resolving `.item.active` to click
 *     it is a race: if the carousel advances in between, the test clicks one
 *     product and asserts on another.
 *
 * Freezing the carousel on slide 1 removes both: stop Bootstrap's timer and
 * reset the DOM classes.
 */
import type { Page } from '@playwright/test';

/** Carousel roots: the slider, the recommended strip, and any future data-ride carousel. */
const CAROUSEL_SELECTORS = [
  '#slider-carousel',
  '#recommended-item-carousel',
  '.carousel[data-ride="carousel"]',
];

type JQueryLike = (element: Element) => { carousel: (options?: unknown) => void };

/**
 * Pause every carousel and reset it to slide 1.
 * @returns how many carousels were handled, so a caller can log that it took effect
 */
export async function freezeCarousels(page: Page): Promise<number> {
  return page.evaluate((selectors: string[]) => {
    const roots = new Set<Element>();
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => roots.add(element));
    }

    const jq = (window as unknown as { jQuery?: JQueryLike }).jQuery;
    let handled = 0;

    for (const root of roots) {
      /* Removing data-ride stops Bootstrap from attaching a new timer on init. */
      root.removeAttribute('data-ride');

      /* Reset to slide 1 by class alone, without reading Bootstrap's internal state. */
      const firstItem = root.querySelector('.carousel-inner > .item');
      root.querySelectorAll('.carousel-inner > .item').forEach((item) => {
        item.classList.toggle('active', item === firstItem);
      });
      const firstIndicator = root.querySelector('.carousel-indicators > li');
      root.querySelectorAll('.carousel-indicators > li').forEach((indicator) => {
        indicator.classList.toggle('active', indicator === firstIndicator);
      });

      if (jq) {
        try {
          const carousel = jq(root);
          carousel.carousel({ interval: false });
          carousel.carousel('pause');
        } catch {
          /* If jQuery is unavailable, the class reset above already keeps the capture stable. */
        }
      }

      handled += 1;
    }

    return handled;
  }, CAROUSEL_SELECTORS);
}
