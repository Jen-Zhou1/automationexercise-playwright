/**
 * Lightweight logging utility (utils/logger.ts)
 * Keeps CI/local terminal output structured and readable without introducing third-party dependencies.
 */
const ts = () => new Date().toISOString().slice(11, 19);

export const log = {
  step: (msg: string) => console.log(`\n[${ts()}] ▶ ${msg}`),
  info: (msg: string) => console.log(`[${ts()}]   ℹ ${msg}`),
  pass: (msg: string) => console.log(`[${ts()}]   ✅ ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}]   ⚠️ ${msg}`),
  error: (msg: string) => console.error(`[${ts()}]   ❌ ${msg}`),
};
