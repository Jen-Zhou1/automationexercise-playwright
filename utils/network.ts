/**
 * Network layer utilities (utils/network.ts)
 * ---------------------------------------------------------------------------
 * Corresponding requirement: "Network Interception and Mocking":
 *  1. blockThirdPartyAds  —— intercept and abort ad/analytics requests (stability + clean visual baseline)
 *  2. spyOnAddToCart      —— listen to add-to-cart AJAX without altering it and verify the request is sent with valid parameters
 *  3. mockAddToCartFailure—— mock a server 500 to validate the frontend error-handling path
 * The site uses jQuery AJAX for add-to-cart and remove-from-cart:
 *   GET /add_to_cart/<product_id>?quantity=N
 *   GET /delete_cart/<product_id>
 */
import type { Page, Request } from '@playwright/test';
import { env } from '../config/env';
import { log } from './logger';

export interface MainDocumentHealth {
  hasResponse: boolean;
  status: number;
}

const mainDocumentHealth = new WeakMap<Page, MainDocumentHealth>();

/** Return the latest main-frame document response status, observing it only once per page. */
export function getMainDocumentHealth(page: Page): MainDocumentHealth {
  const existingHealth = mainDocumentHealth.get(page);
  if (existingHealth) {
    return existingHealth;
  }

  const health: MainDocumentHealth = { hasResponse: false, status: 0 };
  mainDocumentHealth.set(page, health);
  page.on('response', (response) => {
    if (
      response.request().resourceType() === 'document' &&
      response.frame() === page.mainFrame()
    ) {
      health.hasResponse = true;
      health.status = response.status();
    }
  });
  return health;
}

/** Intercept and abort third-party ad/analytics requests */
export async function blockThirdPartyAds(page: Page): Promise<void> {
  for (const pattern of env.adDomains) {
    await page.route(pattern, (route) => route.abort());
  }
  log.info(`Blocked third-party ad/analytics domains: ${env.adDomains.length} rules`);
}

export interface AddToCartCall {
  productId: string;
  quantity: string | null;
  url: string;
}

/** Listen for add-to-cart requests (pass-through, do not modify the response) and return the call log */
export function spyOnAddToCart(page: Page): AddToCartCall[] {
  const calls: AddToCartCall[] = [];
  page.on('request', (req: Request) => {
    const match = req.url().match(/\/add_to_cart\/(\d+)/);
    if (match) {
      const url = new URL(req.url());
      calls.push({
        productId: match[1] ?? '',
        quantity: url.searchParams.get('quantity'),
        url: req.url(),
      });
    }
  });
  return calls;
}

/** Mock all add-to-cart requests to return 500 to validate the error path (the modal should not appear) */
export async function mockAddToCartFailure(page: Page): Promise<void> {
  await page.route('**/add_to_cart/**', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'mock: server error' }),
  );
  log.info('Mocked: /add_to_cart/** will now return 500');
}

/** Clear all mocks and restore real requests (optional; generally not needed inside a test) */
export async function resetNetworkMocks(page: Page): Promise<void> {
  await page.unroute('**/add_to_cart/**');
}
