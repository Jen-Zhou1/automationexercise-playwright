# Automation Exercise 电商自动化测试框架

> Playwright + TypeScript + Page Object Model + Custom Fixtures  
> 被测站点：<https://automationexercise.com>（公开电商演示站）

本框架覆盖关键用户流程，并包含数据驱动、网络拦截与 Mock、axe-core 无障碍记录、
视觉回归以及失败截图/录屏/Trace。当前启用 Desktop Chrome 和 Pixel 7（mobile-chrome）；
Desktop Edge、Firefox、WebKit 和 iPhone 13（移动 WebKit）已在
`playwright.config.ts` 中预备，但暂时注释停用。

## 需求覆盖

| 能力 | 实现位置 |
|---|---|
| POM、页面对象和可复用 fixtures | `pages/`、`fixtures/base-fixtures.ts` |
| 环境、用户/商品/订单数据和工具 | `config/`、`testdata/`、`utils/` |
| HTML/JSON 报告及失败证据 | `playwright.config.ts`、`reports/<timestamp>/` |
| 用户注册/登录/登出、商品、购物车、结算、下单和联系表单 | `tests/` |
| 网络监听与失败 Mock | `utils/network.ts`、`tests/03-products-search-cart-persistence.spec.ts` |
| 独立 axe-core 扫描与报告 | `tests/10-accessibility.spec.ts`、`utils/a11y.ts`、`reports/accessibility/` |
| 视觉回归（仅 Chrome 项目） | `tests/09-visual-compare.spec.ts` 及 snapshots |
| 官方 26 个测试场景与自动化状态 | [`docs/automation-test-plan.md`](./docs/automation-test-plan.md) |

## 快速开始

需要 Node.js 22.12 或更高版本。安装依赖和当前启用项目所需的浏览器：

```bash
npm install
npx playwright install chromium
npx playwright test
```

常用命令：

| 用途 | 命令 |
|---|---|
| 当前启用浏览器的全量测试 | `npm test` |
| Desktop Chrome / Pixel 7 移动 Chrome | `npx playwright test --project=chrome` / `npx playwright test --project=mobile-chrome` |
| 结算 E2E（单 worker） | `npm run test:checkout` |
| 无障碍扫描（单 worker） | `npm run test:a11y` |
| Playwright grep 筛选 | `npx playwright test --grep "@smoke"` / `npx playwright test --grep "@regression"` |
| 单个测试文件 | `npx playwright test tests/06-checkout-e2e.spec.ts` |
| 打开最近一次 HTML 报告 | `npm run report` |
| 类型检查 | `npm run typecheck` |
| UI / 调试模式 | `npm run test:ui` / `npm run test:debug` |

无障碍扫描仅运行在 Desktop Chrome，`npm run test:a11y` 已固定指定 `--project=chrome`；
如果完整矩阵运行，无障碍用例会在其他项目中跳过。视觉基线同样仅适用于 Chrome。

公开演示站会对集中访问进行限流。默认全局使用单 worker；结算和无障碍命令也显式
串行运行，避免同一流程中的浏览器并行请求加剧站点过载。若站点返回 queue-full 页面，
页面对象会尽早报出明确的过载错误，而不是等待业务元素超时。

其他项目配置暂时处于注释状态。要启用某个项目，取消 `playwright.config.ts` 中对应
配置块的注释并安装所需浏览器；随后使用 `npx playwright test --project=<name>`
指定项目。Edge 项目使用本机 Microsoft Edge；
Pixel 7 使用 Chromium，iPhone 13 使用 WebKit。

## 目录结构

```text
config/       环境变量和超时
fixtures/     用户注册、登录态和全局拦截装配
pages/        页面对象与业务动作
tests/        测试编排和断言
testdata/     用户、商品、表单及支付测试数据
utils/        日志、数据生成、网络和无障碍工具
docs/         测试计划、架构讲解和 AI 使用记录
reports/      每次运行的报告、失败证据与 axe 扫描记录
```

## 测试文件

| 文件 | 主要覆盖 |
|---|---|
| `00-tc7-test-cases-page-skipped.spec.ts` | TC7 按策略永久跳过 |
| `01-authentication.spec.ts` | 注册、登出、重复邮箱注册失败、原账号重登/删除及无效登录 |
| `02-products-filter-cart.spec.ts` | 多商品购物车、分类/品牌和推荐商品 |
| `03-products-search-cart-persistence.spec.ts` | 商品搜索、网络拦截/Mock、登录前后购物车保持 |
| `04-pdp-review-cart-clear.spec.ts` | 商品详情、评价、数量、小计和移除 |
| `05-site-scroll-and-subscription.spec.ts` | 首页/购物车订阅及滚动/回顶行为 |
| `06-checkout-e2e.spec.ts` | 注册前购物、结算时注册、已有用户登录后结算等独立 E2E |
| `07-contact-us-form.spec.ts` | 联系表单异常校验、附件上传与成功提交 |
| `08-register-search-cart-smoke.spec.ts` | 注册、搜索加购、登出及账户清理 Smoke 流程 |
| `09-visual-compare.spec.ts` | 首页、目录、详情、登录、联系表单、购物车、结算、支付和订单确认 |
| `10-accessibility.spec.ts` | 首页、推荐、目录、分类、品牌、商品详情、登录、联系表单、购物车、结算、支付和订单确认 axe 扫描 |

TC7 由静态 `test.skip` 声明，任何常规运行均不会执行该测试。功能用例按行为合并，
避免为了身份状态而重复相同流程。测试标题使用 `@smoke` 与 `@regression` 标签：
08 是唯一的跨功能 smoke 测试；07 同时属于 smoke 与 regression；其余功能测试
（包括永久跳过的 TC7）标记为 regression。视觉测试不属于功能标签组，使用
`npm run test:visual` 独立运行。当前 `@smoke` 发现 4 项（3 个联系表单、
1 个跨功能 smoke），`@regression` 发现 22 项（TC7 计为 skipped）。
08 覆盖的注册、搜索加购和登出功能也在专门的认证/搜索回归测试中验证，但这些测试
只标记为 regression，因此不会与 08 一起被 smoke 命令重复执行。
详细英文步骤、状态及映射以测试计划为准。

## 设计和诊断约定

- 定位优先级为 `[data-qa]`、`#id`、语义 class、文本；避免长 XPath 和层级选择器。
- 页面元素与业务操作封装在 `pages/`；测试文件只负责编排和断言。
- 使用 Playwright 自动等待与 web-first assertions，不使用固定 sleep。
- 独立无障碍扫描通过 `npm run test:a11y` 运行，仅在 Desktop Chrome 执行；每条扫描流程生成一个汇总 JSON 至 `reports/accessibility/`，并记录 axe 违规但不以公开演示站的既有问题阻断流程。接入自有站点后，应先建立评审过的基线，再按基线设置质量门禁。功能回归不重复执行无障碍扫描。
- 每次运行写入 `reports/<timestamp>/`，其中包含 HTML/JSON 报告和测试产物；
  失败时保留截图、视频与 Trace。报告目录不提交版本控制。
- 报告的逐次运行日志由 Playwright reporter 产生；应用步骤日志由 `utils/logger.ts` 输出。
- 视觉测试只在 `chrome` 项目运行，基线随代码评审维护。

更多架构决策见 [`docs/architecture-talk.md`](./docs/architecture-talk.md)，
AI 辅助开发记录见 [`docs/ai-usage-log.md`](./docs/ai-usage-log.md)。
