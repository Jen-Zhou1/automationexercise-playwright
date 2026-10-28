/**
 * 网络层工具（utils/network.ts）
 * ---------------------------------------------------------------------------
 * 对应需求 "Network Interception and Mocking"：
 *  1. blockThirdPartyAds  —— 拦截并中止广告/统计请求（稳定性 + 视觉基线干净）
 *  2. spyOnAddToCart      —— 监听（不篡改）加购 AJAX，验证请求确实发出且参数正确
 *  3. mockAddToCartFailure—— Mock 服务端 500，验证前端错误处理路径
 * 站点加购/删除均为 jQuery AJAX：
 *   GET /add_to_cart/<product_id>?quantity=N
 *   GET /delete_cart/<product_id>
 */
import type { Page, Request } from '@playwright/test';
import { env } from '../config/env';
import { log } from './logger';

/** 拦截并中止第三方广告/统计请求 */
export async function blockThirdPartyAds(page: Page): Promise<void> {
  for (const pattern of env.adDomains) {
    await page.route(pattern, (route) => route.abort());
  }
  log.info(`已屏蔽第三方广告/统计域名：${env.adDomains.length} 条规则`);
}

export interface AddToCartCall {
  productId: string;
  quantity: string | null;
  url: string;
}

/** 监听加购请求（pass-through，不修改响应），返回调用记录 */
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

/** Mock：让所有加购请求返回 500，用于验证错误路径（弹窗不应出现） */
export async function mockAddToCartFailure(page: Page): Promise<void> {
  await page.route('**/add_to_cart/**', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'mock: server error' }),
  );
  log.info('已 Mock:/add_to_cart/** 将返回 500');
}

/** 取消所有 Mock 恢复真实请求（可选，测试内一般不需要） */
export async function resetNetworkMocks(page: Page): Promise<void> {
  await page.unroute('**/add_to_cart/**');
}
