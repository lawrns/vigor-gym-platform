import express, { Request, Response } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getSecurityMetrics,
  checkSecurityAlerts,
  updateActiveDevicesCount,
} from '../utils/auditLogger.js';

const router = express.Router();

/**
 * GET /v1/security/metrics
 * Get current security metrics (admin only)
 */
router.get('/metrics', authRequired(['owner', 'manager']), async (req: Request, res: Response) => {
  try {
    // Update active devices count before returning metrics
    await updateActiveDevicesCount();

    const metrics = getSecurityMetrics();
    const alerts = checkSecurityAlerts();

    res.json({
      metrics,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /v1/security/alerts
 * Get current security alerts (admin only)
 */
router.get('/alerts', authRequired(['owner', 'manager']), async (req: Request, res: Response) => {
  try {
    const alerts = checkSecurityAlerts();

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /v1/security/health
 * Security health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const metrics = getSecurityMetrics();
    const alerts = checkSecurityAlerts();

    // Determine overall health status
    const criticalAlerts = alerts.filter(alert => alert.severity === 'high');
    const status =
      criticalAlerts.length > 0 ? 'critical' : alerts.length > 0 ? 'warning' : 'healthy';

    res.json({
      status,
      metrics: {
        deviceLogins: metrics.deviceLogins,
        checkinsScanned: metrics.checkinsScanned,
        devicesActive24h: metrics.devicesActive24h,
        alertCount: alerts.length,
        criticalAlertCount: criticalAlerts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in security health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
