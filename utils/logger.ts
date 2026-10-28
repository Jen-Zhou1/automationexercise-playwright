/**
 * 轻量日志工具（utils/logger.ts）
 * 让 CI / 本地终端输出有结构、可读；不引入第三方依赖。
 */
const ts = () => new Date().toISOString().slice(11, 19);

export const log = {
  step: (msg: string) => console.log(`\n[${ts()}] ▶ ${msg}`),
  info: (msg: string) => console.log(`[${ts()}]   ℹ ${msg}`),
  pass: (msg: string) => console.log(`[${ts()}]   ✅ ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}]   ⚠️ ${msg}`),
  error: (msg: string) => console.error(`[${ts()}]   ❌ ${msg}`),
};
