#!/usr/bin/env node

/**
 * Performance Budget Validation
 *
 * Validates that performance metrics meet SLO thresholds.
 * Used in CI to fail builds that violate performance budgets.
 */

import fs from 'node:fs';
import path from 'node:path';

const BUDGETS = {
  // Web Vitals SLOs
  TTFB: { threshold: 200, unit: 'ms', percentile: 'p75' },
  LCP: { threshold: 2300, unit: 'ms', percentile: 'p75' },
  INP: { threshold: 150, unit: 'ms', percentile: 'p75' },
  CLS: { threshold: 0.1, unit: '', percentile: 'p75' },

  // API Performance SLOs
  api_latency: { threshold: 500, unit: 'ms', percentile: 'p95' },
  api_error_rate: { threshold: 0.5, unit: '%', percentile: 'avg' },

  // Widget Performance SLOs
  widget_init: { threshold: 400, unit: 'ms', percentile: 'p95' },
  widget_postmessage: { threshold: 200, unit: 'ms', percentile: 'p95' },

  // Database Performance
  db_query: { threshold: 200, unit: 'ms', percentile: 'p95' },
};

console.log('🎯 Performance Budget Validation');
console.log('=================================');

async function validateBudgets() {
  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Check Lighthouse results if available
  await checkLighthouseResults(results);

  // Check k6 results if available
  await checkK6Results(results);

  // Check custom metrics if available
  await checkCustomMetrics(results);

  // Summary
  console.log('\n📊 Budget Validation Results');
  console.log('============================');

  if (results.passed.length > 0) {
    console.log(`✅ Passed (${results.passed.length}):`);
    results.passed.forEach(item => console.log(`   ${item}`));
  }

  if (results.warnings.length > 0) {
    console.log(`⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.forEach(item => console.log(`   ${item}`));
  }

  if (results.failed.length > 0) {
    console.log(`❌ Failed (${results.failed.length}):`);
    results.failed.forEach(item => console.log(`   ${item}`));
  }

  const hasFailures = results.failed.length > 0;
  console.log(`\n${hasFailures ? '💥 Budget validation FAILED' : '🎉 All budgets passed!'}`);

  return !hasFailures;
}

async function checkLighthouseResults(results) {
  const lighthouseDir = 'lighthouse-results';

  if (!fs.existsSync(lighthouseDir)) {
    results.warnings.push('Lighthouse results not found - skipping web vitals validation');
    return;
  }

  try {
    const files = fs.readdirSync(lighthouseDir).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      results.warnings.push('No Lighthouse JSON results found');
      return;
    }

    const latestFile = files.sort().pop();
    const reportPath = path.join(lighthouseDir, latestFile);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Check Core Web Vitals
    const audits = report.audits;

    if (audits['largest-contentful-paint']) {
      const lcp = audits['largest-contentful-paint'].numericValue;
      const budget = BUDGETS.LCP;
      if (lcp <= budget.threshold) {
        results.passed.push(`LCP: ${lcp.toFixed(0)}ms ≤ ${budget.threshold}ms`);
      } else {
        results.failed.push(`LCP: ${lcp.toFixed(0)}ms > ${budget.threshold}ms (budget violation)`);
      }
    }

    if (audits['server-response-time']) {
      const ttfb = audits['server-response-time'].numericValue;
      const budget = BUDGETS.TTFB;
      if (ttfb <= budget.threshold) {
        results.passed.push(`TTFB: ${ttfb.toFixed(0)}ms ≤ ${budget.threshold}ms`);
      } else {
        results.failed.push(
          `TTFB: ${ttfb.toFixed(0)}ms > ${budget.threshold}ms (budget violation)`
        );
      }
    }

    if (audits['cumulative-layout-shift']) {
      const cls = audits['cumulative-layout-shift'].numericValue;
      const budget = BUDGETS.CLS;
      if (cls <= budget.threshold) {
        results.passed.push(`CLS: ${cls.toFixed(3)} ≤ ${budget.threshold}`);
      } else {
        results.failed.push(`CLS: ${cls.toFixed(3)} > ${budget.threshold} (budget violation)`);
      }
    }
  } catch (error) {
    results.warnings.push(`Failed to parse Lighthouse results: ${error.message}`);
  }
}

async function checkK6Results(results) {
  const k6Files = ['smoke-test-results.json', 'load-test-results.json'];

  for (const filename of k6Files) {
    if (!fs.existsSync(filename)) continue;

    try {
      const k6Results = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const metrics = k6Results.metrics;

      // Check API latency
      if (metrics.http_req_duration && metrics.http_req_duration['p(95)']) {
        const p95 = metrics.http_req_duration['p(95)'];
        const budget = BUDGETS.api_latency;
        if (p95 <= budget.threshold) {
          results.passed.push(`API p95 latency: ${p95.toFixed(0)}ms ≤ ${budget.threshold}ms`);
        } else {
          results.failed.push(
            `API p95 latency: ${p95.toFixed(0)}ms > ${budget.threshold}ms (budget violation)`
          );
        }
      }

      // Check error rate
      if (metrics.http_req_failed && metrics.http_req_failed.rate !== undefined) {
        const errorRate = metrics.http_req_failed.rate * 100;
        const budget = BUDGETS.api_error_rate;
        if (errorRate <= budget.threshold) {
          results.passed.push(`API error rate: ${errorRate.toFixed(2)}% ≤ ${budget.threshold}%`);
        } else {
          results.failed.push(
            `API error rate: ${errorRate.toFixed(2)}% > ${budget.threshold}% (budget violation)`
          );
        }
      }

      // Check custom widget metrics if present
      if (metrics.widget_latency && metrics.widget_latency['p(95)']) {
        const widgetP95 = metrics.widget_latency['p(95)'];
        const budget = BUDGETS.widget_init;
        if (widgetP95 <= budget.threshold) {
          results.passed.push(`Widget init p95: ${widgetP95.toFixed(0)}ms ≤ ${budget.threshold}ms`);
        } else {
          results.failed.push(
            `Widget init p95: ${widgetP95.toFixed(0)}ms > ${budget.threshold}ms (budget violation)`
          );
        }
      }
    } catch (error) {
      results.warnings.push(`Failed to parse k6 results from ${filename}: ${error.message}`);
    }
  }
}

async function checkCustomMetrics(results) {
  // Check for custom performance metrics from our telemetry
  const metricsFile = 'performance-metrics.json';

  if (!fs.existsSync(metricsFile)) {
    results.warnings.push('Custom metrics file not found - skipping custom validation');
    return;
  }

  try {
    const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

    // Validate each metric against its budget
    for (const [metricName, data] of Object.entries(metrics)) {
      const budget = BUDGETS[metricName];
      if (!budget) continue;

      const value = data[budget.percentile] || data.value;
      if (value === undefined) continue;

      if (value <= budget.threshold) {
        results.passed.push(
          `${metricName}: ${value}${budget.unit} ≤ ${budget.threshold}${budget.unit}`
        );
      } else {
        results.failed.push(
          `${metricName}: ${value}${budget.unit} > ${budget.threshold}${budget.unit} (budget violation)`
        );
      }
    }
  } catch (error) {
    results.warnings.push(`Failed to parse custom metrics: ${error.message}`);
  }
}

// Run validation
validateBudgets()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Budget validation crashed:', error.message);
    process.exit(1);
  });
