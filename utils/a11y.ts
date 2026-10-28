/**
 * Runs axe-core scans and persists one rule-level accessibility report per test run.
 */
import type { Page, TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { env } from '../config/env';
import { log } from './logger';

export interface AccessibilityScan {
  scannedAt: string;
  url: string;
  title: string;
  violations: Result[];
}

interface AccessibilityPageReport extends AccessibilityScan {
  testTitle: string;
  violationCount: number;
  nodeCount: number;
}

interface AccessibilityRuleSample {
  page: string;
  selector: string;
}

interface AccessibilityRuleSummary {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  pageCount: number;
  affectedPages: string[];
  nodeCount: number;
  samples: AccessibilityRuleSample[];
}

interface AccessibilityRunReport {
  formatVersion: 2;
  generatedAt: string;
  runId: string;
  project: string;
  gate: 'critical' | 'record';
  status: 'in-progress' | 'passed' | 'findings-recorded' | 'blocked';
  totalPages: number;
  pagesWithViolations: number;
  violationCount: number;
  ruleCount: number;
  nodeCount: number;
  rulesByImpact: Record<string, number>;
  scans: AccessibilityPageReport[];
  rules: AccessibilityRuleSummary[];
}

let currentReport: AccessibilityRunReport | undefined;
let currentReportPath: string | undefined;

const reportDirectory = path.resolve(process.cwd(), 'reports', 'a11y');
const impactRank: Record<'critical' | 'serious' | 'moderate' | 'minor' | 'unknown', number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
  unknown: 4,
};

function getImpactRank(impact: string): number {
  return impactRank[impact as keyof typeof impactRank] ?? impactRank.unknown;
}

function getRunId(): string {
  const runId = process.env.AE_A11Y_REPORT_RUN_ID;
  if (!runId) {
    throw new Error('Accessibility report run ID was not initialized by Playwright config');
  }
  return runId;
}

function localTimestamp(date: Date): string {
  const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-` +
    `${pad(date.getMilliseconds(), 3)}`
  );
}

function emptyReport(project: string): AccessibilityRunReport {
  return {
    formatVersion: 2,
    generatedAt: new Date().toISOString(),
    runId: getRunId(),
    project,
    gate: env.accessibilityGate,
    status: 'in-progress',
    totalPages: 0,
    pagesWithViolations: 0,
    violationCount: 0,
    ruleCount: 0,
    nodeCount: 0,
    rulesByImpact: {},
    scans: [],
    rules: [],
  };
}

function buildRuleSummary(scans: AccessibilityPageReport[]): AccessibilityRuleSummary[] {
  const rules = new Map<
    string,
    AccessibilityRuleSummary & { pageKeys: Set<string>; sampleKeys: Set<string> }
  >();

  for (const scan of scans) {
    const page = `${scan.title || 'Untitled page'} (${scan.url})`;
    const pageKey = `${scan.title}\u0000${scan.url}`;

    for (const violation of scan.violations) {
      const impact = violation.impact ?? 'unknown';
      let summary = rules.get(violation.id);
      if (!summary) {
        summary = {
          id: violation.id,
          impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          pageCount: 0,
          affectedPages: [],
          nodeCount: 0,
          samples: [],
          pageKeys: new Set<string>(),
          sampleKeys: new Set<string>(),
        };
        rules.set(violation.id, summary);
      } else if (getImpactRank(impact) < getImpactRank(summary.impact)) {
        summary.impact = impact;
      }

      if (!summary.pageKeys.has(pageKey)) {
        summary.pageKeys.add(pageKey);
        summary.affectedPages.push(page);
      }

      summary.nodeCount += violation.nodes.length;
      for (const node of violation.nodes) {
        const selector = node.target.join(' ') || '<document>';
        const sampleKey = `${pageKey}\u0000${selector}`;
        if (summary.samples.length < 5 && !summary.sampleKeys.has(sampleKey)) {
          summary.sampleKeys.add(sampleKey);
          summary.samples.push({ page, selector });
        }
      }
    }
  }

  return [...rules.values()]
    .map(({ pageKeys, sampleKeys, ...summary }) => ({
      ...summary,
      pageCount: pageKeys.size,
    }))
    .sort(
      (first, second) =>
        getImpactRank(first.impact) - getImpactRank(second.impact) ||
        second.pageCount - first.pageCount ||
        second.nodeCount - first.nodeCount ||
        first.id.localeCompare(second.id),
    );
}

function updateReportSummary(report: AccessibilityRunReport): void {
  const rules = buildRuleSummary(report.scans);
  const rulesByImpact: Record<string, number> = {};
  for (const rule of rules) {
    rulesByImpact[rule.impact] = (rulesByImpact[rule.impact] ?? 0) + 1;
  }

  report.generatedAt = new Date().toISOString();
  report.totalPages = report.scans.length;
  report.pagesWithViolations = report.scans.filter((scan) => scan.violationCount > 0).length;
  report.violationCount = report.scans.reduce((count, scan) => count + scan.violationCount, 0);
  report.ruleCount = rules.length;
  report.nodeCount = report.scans.reduce((count, scan) => count + scan.nodeCount, 0);
  report.rulesByImpact = rulesByImpact;
  report.rules = rules;
}

async function persistReport(): Promise<void> {
  if (!currentReport || !currentReportPath) {
    throw new Error('Accessibility report has not been initialized');
  }

  const temporaryPath = `${currentReportPath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(currentReport, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, currentReportPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

/** Create a new, non-overwriting JSON report for this test run. */
export async function initializeAccessibilityReport(testInfo: TestInfo): Promise<void> {
  await mkdir(reportDirectory, { recursive: true });

  const stamp = localTimestamp(new Date());
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const fileSuffix = suffix === 0 ? '' : `-${suffix}`;
    const reportPath = path.join(reportDirectory, `axe-scan-${stamp}${fileSuffix}.json`);
    const report = emptyReport(testInfo.project.name);
    try {
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
      currentReport = report;
      currentReportPath = reportPath;
      return;
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  throw new Error(`Could not create a unique accessibility report in ${reportDirectory}`);
}

/** Run axe-core on the current page, log its findings, and persist the scan immediately. */
export async function scanAccessibilityPage(
  page: Page,
  testInfo: TestInfo,
): Promise<AccessibilityScan> {
  const report = currentReport;
  if (!report) {
    throw new Error('Accessibility report must be initialized before scanning');
  }

  const results = await new AxeBuilder({ page }).analyze();
  const scan: AccessibilityScan = {
    scannedAt: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    violations: results.violations,
  };
  const entry: AccessibilityPageReport = {
    ...scan,
    testTitle: testInfo.titlePath.join(' › '),
    violationCount: scan.violations.length,
    nodeCount: scan.violations.reduce((count, violation) => count + violation.nodes.length, 0),
  };

  report.scans.push(entry);
  updateReportSummary(report);
  await persistReport();

  const resultMessage =
    `axe-core ${scan.title || scan.url}: ${entry.violationCount} violation(s), ` +
    `${entry.nodeCount} affected node(s)`;
  if (entry.violationCount > 0) {
    log.warn(resultMessage);
  } else {
    log.pass(resultMessage);
  }

  return scan;
}

/** Persist the final summary, print it, then fail once if critical findings are gated. */
export async function finalizeAccessibilityReport(): Promise<void> {
  const report = currentReport;
  const absoluteReportPath = currentReportPath;
  if (!report || !absoluteReportPath) {
    throw new Error('Accessibility report has not been initialized');
  }

  updateReportSummary(report);
  const criticalRules = report.rules.filter((rule) => rule.impact === 'critical');
  const gateBlocked = env.accessibilityGate === 'critical' && criticalRules.length > 0;
  report.status = gateBlocked
    ? 'blocked'
    : report.ruleCount === 0
      ? 'passed'
      : 'findings-recorded';
  await persistReport();

  const reportPath = path.relative(process.cwd(), absoluteReportPath).split(path.sep).join('/');
  const impactSummary = Object.entries(report.rulesByImpact)
    .sort(
      ([first], [second]) => getImpactRank(first) - getImpactRank(second),
    )
    .map(([impact, count]) => `${impact}=${count}`)
    .join(', ') || 'none';

  log.step('Final axe-core accessibility summary');
  log.info(
    `Scanned pages: ${report.totalPages}; pages with violations: ` +
      `${report.pagesWithViolations}; unique rules: ${report.ruleCount}; ` +
      `affected nodes: ${report.nodeCount}`,
  );
  log.info(`Severity (unique rules): ${impactSummary}`);

  if (report.rules.length > 0) {
    log.info('Top 5 rules to address:');
    for (const [index, rule] of report.rules.slice(0, 5).entries()) {
      log.info(
        `${index + 1}. ${rule.id} (${rule.impact}) — ${rule.pageCount} page(s), ` +
          `${rule.nodeCount} node(s)`,
      );
    }
  }
  log.info(`Full report: ${reportPath}`);

  if (gateBlocked) {
    const blockedPages = report.scans
      .map((scan) => {
        const criticalOnPage = scan.violations.filter(
          (violation) => (violation.impact ?? 'unknown') === 'critical',
        );
        if (criticalOnPage.length === 0) {
          return undefined;
        }

        const blockedRules = criticalOnPage
          .map((violation) => `${violation.id} (${violation.nodes.length} node(s))`)
          .join(', ');
        return (
          `${scan.title || scan.url}: ${criticalOnPage.length} critical violation(s); ` +
          `blocked rules: ${blockedRules}`
        );
      })
      .filter((page): page is string => page !== undefined);

    throw new Error(
      `Accessibility gate blocked ${criticalRules.length} critical rule(s). ` +
        `Page findings: ${blockedPages.join(' | ')}. ` +
        `Full report: ${reportPath}. Set AE_A11Y_GATE=record to record findings without failing.`,
    );
  }

  if (report.ruleCount === 0) {
    log.pass('axe-core found no accessibility violations');
  } else {
    log.warn(
      `axe-core recorded ${report.ruleCount} rule(s); gate mode: ${env.accessibilityGate}`,
    );
  }
}
