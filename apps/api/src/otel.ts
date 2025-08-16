// OpenTelemetry setup for observability
// Simplified version to avoid type conflicts

// Only initialize if OTEL_ENABLED is set
if (process.env.OTEL_ENABLED === 'true') {
  try {
    // For now, just log that observability is enabled
    // Full OpenTelemetry setup can be added later with compatible versions
    console.log('OpenTelemetry enabled (basic logging mode)');

    // You can add custom metrics/tracing here without the SDK
    // Example: custom performance tracking, error monitoring, etc.
  } catch (error) {
    console.warn('Failed to initialize OpenTelemetry:', error);
  }
} else {
  console.log('OpenTelemetry disabled (set OTEL_ENABLED=true to enable)');
}
