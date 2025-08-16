/**
 * Web Vitals Telemetry Endpoint
 * 
 * Receives Core Web Vitals and custom performance metrics from the browser.
 * Logs them in structured format for monitoring and alerting.
 */

import { NextRequest, NextResponse } from 'next/server';

interface VitalMetric {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  url: string;
  timestamp: number;
  userAgent?: string;
  connection?: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: VitalMetric = await request.json();
    
    // Validate required fields
    if (!metric.metric || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Extract useful context
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Structure the log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      msg: 'web_vital',
      request_id: requestId,
      metric: metric.metric,
      value: Math.round(metric.value * 100) / 100, // Round to 2 decimal places
      rating: metric.rating,
      url: metric.url,
      user_agent: userAgent,
      connection: metric.connection || 'unknown',
      ip: ip.split(',')[0], // Take first IP if multiple
    };

    // Log to console (will be picked up by log aggregation)
    console.info(JSON.stringify(logEntry));

    // Check against SLO thresholds and alert if needed
    const alerts = checkSLOViolations(metric);
    if (alerts.length > 0) {
      console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        msg: 'slo_violation',
        request_id: requestId,
        metric: metric.metric,
        value: metric.value,
        violations: alerts,
      }));
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('[TELEMETRY] Failed to process vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if metrics violate our SLO thresholds
 */
function checkSLOViolations(metric: VitalMetric): string[] {
  const violations: string[] = [];

  // SLO thresholds from the spec
  const thresholds = {
    'TTFB': 200,      // p75 < 200ms
    'LCP': 2300,      // p75 < 2300ms  
    'INP': 150,       // p75 < 150ms
    'CLS': 0.1,       // p75 < 0.1
    'widget-init': 400, // p95 < 400ms
  };

  const threshold = thresholds[metric.metric as keyof typeof thresholds];
  if (threshold && metric.value > threshold) {
    violations.push(`${metric.metric} ${metric.value} > ${threshold} (${metric.rating})`);
  }

  return violations;
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
