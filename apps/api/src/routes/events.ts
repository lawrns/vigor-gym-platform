import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { eventBroadcaster } from '../utils/eventBroadcaster.js';
import { validateSSEQuery, DashboardValidationError } from '../lib/validation/dashboard.js';

const router = express.Router();

/**
 * GET /v1/events - Subscribe to real-time dashboard events
 * Query Parameters:
 * - orgId: Required UUID of the organization
 * - locationId: Optional UUID of specific gym location (null = all locations)
 */
router.get('/',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const companyId = req.tenant!.companyId;

      // Validate query parameters
      let validatedQuery;
      try {
        validatedQuery = validateSSEQuery({
          orgId: req.query.orgId,
          locationId: req.query.locationId || null,
        });
      } catch (error) {
        if (error instanceof DashboardValidationError) {
          return res.status(422).json({
            error: error.code,
            message: error.message,
            field: error.field,
          });
        }
        throw error;
      }

      const { orgId, locationId } = validatedQuery;

      // Enforce tenant isolation - user must belong to the requested organization
      if (companyId !== orgId) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied to organization data',
        });
      }

      const subscriberId = randomUUID();

      // Add subscriber to event broadcaster with location filtering
      eventBroadcaster.addSubscriber(subscriberId, companyId, res, locationId || null);

      // The response is now handled by the event broadcaster
      // Connection will be kept alive until client disconnects
    } catch (error) {
      console.error('Error setting up event subscription:', error);
      res.status(500).json({ message: 'Failed to establish event subscription' });
    }
  }
);

/**
 * GET /v1/events/subscribe - Legacy endpoint for backward compatibility
 */
router.get('/subscribe',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const subscriberId = randomUUID();
      const companyId = req.tenant!.companyId;

      // Add subscriber to event broadcaster (no location filtering for legacy)
      eventBroadcaster.addSubscriber(subscriberId, companyId, res, null);

      // The response is now handled by the event broadcaster
      // Connection will be kept alive until client disconnects
    } catch (error) {
      console.error('Error setting up event subscription:', error);
      res.status(500).json({ message: 'Failed to establish event subscription' });
    }
  }
);

/**
 * GET /v1/events/health
 * Health check for event system
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const totalSubscribers = eventBroadcaster.getSubscriberCount();
    
    res.json({
      status: 'ok',
      service: 'event-broadcaster',
      subscribers: totalSubscribers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Event health check error:', error);
    res.status(500).json({
      status: 'error',
      service: 'event-broadcaster',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /v1/events/test
 * Test endpoint to send a test event (development only)
 */
router.post('/test',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    try {
      const companyId = req.tenant!.companyId;
      const {
        type = 'visit.checkin',
        locationId = null,
        payload = {
          visitId: 'test-visit-123',
          memberId: 'test-member-456',
          memberName: 'Test Member',
          gymId: locationId || 'test-gym-789',
          gymName: 'Test Gym',
          checkinAt: new Date().toISOString(),
        }
      } = req.body;

      eventBroadcaster.broadcast({
        id: `test-${Date.now()}`,
        type,
        at: new Date().toISOString(),
        orgId: companyId,
        locationId,
        payload,
      });

      res.json({
        message: 'Test event sent',
        event: {
          type,
          orgId: companyId,
          locationId,
          payload,
        },
        subscriberCount: eventBroadcaster.getSubscriberCount(companyId),
      });
    } catch (error) {
      console.error('Error sending test event:', error);
      res.status(500).json({ message: 'Failed to send test event' });
    }
  }
);

export default router;
