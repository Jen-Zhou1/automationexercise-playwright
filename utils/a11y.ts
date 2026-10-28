/**
 * Accessibility scans using Deque's @axe-core/playwright.
 * Each dedicated scan writes one aggregated JSON report and logs violations without gating
 * business flows against the shared public demo site.
 */
import type { Page, TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { log } from './logger';

export interface AccessibilityScan {
  scannedAt: string;
  url: string;
  title: string;
  violations: Result[];
}

interface AccessibilityRunReport {
  generatedAt: string;
  project: string;
  testTitle: string;
  status: 'passed' | 'findings-recorded';
  scanCount: number;
  violationCount: number;
  violationsByImpact: Record<string, number>;
  scans: AccessibilityScan[];
}

export interface AccessibilityReportResult {
  violationCount: number;
  reportPath: string;
}

/** Run axe-core on the current page and retain its complete violation details. */
export async function scanAccessibilityPage(page: Page): Promise<AccessibilityScan> {
  const results = await new AxeBuilder({ page }).analyze();
  return {
    scannedAt: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    violations: results.violations,
  };
}

/** Write one aggregated JSON report for this accessibility test and return its outcome. */
export async function writeAccessibilityReport(
  scans: AccessibilityScan[],
  testInfo: TestInfo,
): Promise<AccessibilityReportResult> {
  const violations = scans.flatMap((scan) => scan.violations);
  const violationsByImpact = violations.reduce<Record<string, number>>((counts, violation) => {
    const impact = violation.impact ?? 'unknown';
    counts[impact] = (counts[impact] ?? 0) + 1;
    return counts;
  }, {});
  const generatedAt = new Date().toISOString();
  const report: AccessibilityRunReport = {
    generatedAt,
    project: testInfo.project.name,
    testTitle: testInfo.titlePath.join(' › '),
    status: violations.length === 0 ? 'passed' : 'findings-recorded',
    scanCount: scans.length,
    violationCount: violations.length,
    violationsByImpact,
    scans,
  };
  const reportDirectory = path.resolve(process.cwd(), 'reports', 'accessibility');
  const fileTimestamp = generatedAt.replace(/[:.]/g, '-');
  const testName = testInfo.title.replace(/[^\p{L}\p{N}-]/gu, '-').slice(0, 60);
  const fileName = `a11y-run-${fileTimestamp}-${testInfo.project.name}-${testName}-${randomUUID()}.json`;
  const absoluteReportPath = path.join(reportDirectory, fileName);

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const reportPath = path.relative(process.cwd(), absoluteReportPath);
  log.info(`axe-core 汇总报告已存档：${reportPath}`);
  if (violations.length > 0) {
    log.warn(
      `axe-core 扫描发现 ${violations.length} 项违规：` +
        violations.map((violation) => `${violation.id}(${violation.impact ?? 'n/a'})`).join(', '),
    );
  } else {
    log.pass(`axe-core 扫描未发现违规（共扫描 ${scans.length} 个页面状态）`);
  }

  return { violationCount: violations.length, reportPath };
}
