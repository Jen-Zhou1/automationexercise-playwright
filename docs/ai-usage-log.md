# AI 辅助开发使用记录（docs/ai-usage-log.md）

> 需求明确要求："Candidates should leverage AI tools responsibly and explain
> where generated code was improved or optimized."
> 本文档如实记录：AI 用在哪里、哪些被采纳、哪些被改进/否决、依据是什么。

## 1. 用了什么 AI 能力

| 环节 | AI 用途 |
|---|---|
| 页面结构探索 | 辅助整理抓取到的页面 HTML，归纳表单字段与端点清单 |
| 样板代码 | 生成页面对象骨架、数据类定义、fixtures 结构草稿 |
| 文档撰写 | README/讲解稿的结构与措辞草稿 |
| 编码约定 | `.github/copilot-instructions.md`（供团队 Copilot 遵循） |

## 2. 被采纳的部分（附原因）

- **POM 分层骨架**：基类 + 页面对象 + 组件拆分是行业标准模式，AI 草稿结构合理，采纳。
- **数据类定义**（`testdata/*.ts` 的 interface）：纯结构代码，采纳后按站点实际字段校正。
- **fixtures 组织方式**：`registeredUser` → `authedUser` 的依赖链，采纳。

## 3. 被改进/否决的部分（重点，体现"负责任地使用 AI"）

### 3.1 定位器：AI 凭记忆给的 XPath → 全部改为线上核实的选择器

AI 最初给出的登录定位是 `input[name="email"]` 之类的通用写法，以及一些
教程式 XPath（如 `//div[@id='login']/form/input[2]`）。

**改进**：实际抓取 `automationexercise.com` 的 HTML 逐一核实后发现站点
登录/注册/支付/联系表单都暴露了 `data-qa` 属性（`login-button`、
`card-number`、`submit-button` 等），最终全部改用 `[data-qa="..."]`。
购物车行、加购弹窗、Place Order 等也都是从真实 DOM 里确认的
（`tr#product-<id>`、`#cartModal`、`a.check_out[href="/payment"]`）。

**依据**：`data-qa` 是站点为自动化暴露的稳定钩子，抗改版能力最强；
XPath 依赖 DOM 层级，UI 一调整就失效。

### 3.2 固定 sleep → 自动等待

AI 草稿里出现了 `await page.waitForTimeout(3000)`（等弹窗、等页面跳转）。

**改进**：全部替换为 Playwright 自动等待——`expect(cartModal).toBeVisible()`、
`page.waitForURL(/\/payment/)`、`waitForEvent('download')`。

**依据**：固定 sleep 是 flaky 测试的第一来源；要么等太久浪费时间，
要么等太短随机失败。

### 3.3 confirm 弹窗：AI 漏掉的站点特殊行为

AI 生成的联系表单用例直接"填完点提交，断言成功提示"。

**改进**：实际验证发现站点提交时会弹**原生 `confirm("Press OK to proceed!")`**，
不处理会挂起到超时。用例改为点击前注册 `page.once('dialog', d => d.accept())`。

**依据**：线上实测（curl 提交 + JS 源码分析确认行为）。

### 3.4 无障碍扫描策略：报告模式决策（已被独立门禁取代）

AI 建议 `expect(violations).toHaveLength(0)`。

**当时的改进**：公开演示站采取报告模式，所有级别只记录、不阻断核心业务流程。
后续已改为独立无障碍测试门禁：违规写入每个扫描流程的汇总 JSON，并使该无障碍测试失败；
普通功能回归不执行无障碍扫描。

**依据**：业务流程回归需要与公开演示站已有的无障碍状态解耦；报告保留规则 ID
和严重级别，因此问题仍可追踪，不会被静默隐藏。

### 3.5 视觉回归范围：AI 的"全浏览器" → 仅 Chromium

AI 草稿让视觉用例在所有项目跑。

**改进**：按需求约定只在 `chrome` 项目跑，其余项目 skip。

**依据**：不同浏览器引擎的字体渲染/抗锯齿存在系统性差异，像素对比跨浏览器
只会产生噪音；这是行业通行做法。

### 3.6 数据隔离：AI 的"固定测试账号" → 唯一邮箱动态注册

AI 建议用固定账号密码（`standard_user` 之类）。

**改进**：站点是共享演示站、无内置账号且数据持久化，改为每次运行生成
唯一邮箱注册（`utils/data-generator.ts`）。

**依据**：固定账号在共享站点上会互相冲突（"Email Address already exist!"），
唯一邮箱保证任意重复/并发执行都幂等。

## 4. 结论

AI 在本项目中的角色是"**加速样板与探索**"，不是"替代工程判断"。
所有进入框架的代码都经过：线上行为核实 → 与团队约定对齐 → 必要时改进。
这份记录本身就是 deliverable 的一部分——它证明使用者理解每一行代码为什么这样写。
