/**
 * Next.js App Router Instrumentation
 * 
 * This file is automatically loaded by Next.js when the app starts.
 * It registers OpenTelemetry and Web Vitals monitoring.
 */

import { registerOTel } from './lib/otel/web';

export async function register() {
  console.log('[OTEL] Registering instrumentation...');
  
  try {
    await registerOTel();
    console.log('[OTEL] Instrumentation registered successfully');
  } catch (error) {
    console.error('[OTEL] Failed to register instrumentation:', error);
  }
}
