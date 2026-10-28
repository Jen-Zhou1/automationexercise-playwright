# GitHub Copilot 编码约定（本项目）

> 本文件供 GitHub Copilot / AI 助手参考，生成与本项目风格一致的代码。

## 硬性规则

1. **定位策略优先级**：`[data-qa="..."]` > `#id` > 语义 class > 文本。
   - 禁止使用长 XPath、依赖层级结构的 CSS（如 `div > div > span:nth-child(2)`）。
   - 禁止用 `:nth-child()` 选列表项；用 `filter({ hasText })` 或 data 属性。
2. **禁止固定 sleep**。用 Playwright 自动等待：`expect(locator).toBeVisible()`、
   `locator.click()`（自带可点击等待）、`page.waitForURL()`。
  唯一例外：等待第三方轮播/动画的视觉场景，且必须注释原因。
3. **页面元素与操作只进 `pages/`**，测试文件（`tests/`）只写"编排 + 断言"，
  不允许在测试里直接堆 locator。
4. **测试数据只进 `testdata/`**；动态数据（唯一邮箱等）用 `utils/data-generator.ts`。
   环境相关值只进 `config/env.ts`，读取 `process.env.AE_*`。
5. **测试必须 import `test/expect` from `../fixtures/base-fixtures`**，
   不要直接从 `@playwright/test` 导入。
6. **断言用 web-first assertions**（`await expect(locator).to...`），
   禁止 `expect(await locator.isVisible()).toBe(true)` 这类手动判断。
7. **失败证据**：全局已在 `playwright.config.ts` 配置
   `screenshot: only-on-failure` / `video: retain-on-failure` / `trace: retain-on-failure`，
   不要在用例里重复配置。
8. **新增页面**要继承 `BasePage`，并把可复用操作写成方法，方法名用业务动词
   （`startSignup`、`proceedToCheckout`、`pay`）。
9. **视觉回归**只允许在 `chrome` 项目跑，用 `testInfo.project.name !== env.visualProject` 跳过。
10. **无障碍检查**使用 `reportAccessibilityScan` 记录结果，不阻断公开演示站的业务流程；
    接客户项目时应先建立基线，再按评审后的严重级别门禁。

## 代码风格

- 文件头用块注释说明：这个页面/工具是什么、已核实的结构依据。
- 公开方法写 JSDoc（含参数含义与站点特殊行为提示）。
- console 输出用 `utils/logger.ts` 的 `log.step/info/pass/warn`，不要裸 `console.log`。
