import { Response } from 'express';
import { logger } from './auditLogger.js';

interface EventSubscriber {
  id: string;
  companyId: string;
  locationId: string | null; // Added location filtering
  response: Response;
  lastPing: Date;
  connectedAt: Date; // Added connection timestamp
}

interface BroadcastEvent {
  id: string; // Added monotonic ID
  type: string;
  at: string; // ISO8601 timestamp
  orgId: string; // Renamed from companyId for consistency
  locationId: string | null; // Added location context
  payload: any; // Renamed from data for consistency
}

class EventBroadcaster {
  private subscribers: Map<string, EventSubscriber> = new Map();
  private pingInterval: NodeJS.Timeout;
  private eventIdCounter = 0;

  constructor() {
    // Send heartbeat every 15 seconds as per plan requirements
    this.pingInterval = setInterval(() => {
      this.sendHeartbeatToAll();
    }, 15000);

    // Clean up dead connections every 5 minutes
    setInterval(
      () => {
        this.cleanupDeadConnections();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Add a new subscriber for real-time events
   */
  addSubscriber(
    id: string,
    companyId: string,
    response: Response,
    locationId: string | null = null
  ): void {
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    const now = new Date();

    // Send initial connection event
    this.sendToSubscriber(response, {
      id: this.generateEventId(),
      type: 'connection.established',
      at: now.toISOString(),
      orgId: companyId,
      locationId,
      payload: {
        status: 'connected',
        subscriberId: id,
        connectedAt: now.toISOString(),
      },
    });

    // Store subscriber
    this.subscribers.set(id, {
      id,
      companyId,
      locationId,
      response,
      lastPing: now,
      connectedAt: now,
    });

    // Handle client disconnect
    response.on('close', () => {
      this.removeSubscriber(id);
    });

    logger.info({ subscriberId: id, companyId, locationId }, 'New event subscriber connected');
  }

  /**
   * Remove a subscriber
   */
  removeSubscriber(id: string): void {
    const subscriber = this.subscribers.get(id);
    if (subscriber) {
      try {
        subscriber.response.end();
      } catch (error) {
        // Connection already closed
      }
      this.subscribers.delete(id);
      logger.info({ subscriberId: id }, 'Event subscriber disconnected');
    }
  }

  /**
   * Broadcast event to all subscribers of a company with optional location filtering
   */
  broadcast(event: BroadcastEvent): void {
    const targetSubscribers = Array.from(this.subscribers.values()).filter(sub => {
      // Must match organization
      if (sub.companyId !== event.orgId) {
        return false;
      }

      // If event has locationId, subscriber must match or be null (all locations)
      if (event.locationId !== null) {
        if (sub.locationId !== null && sub.locationId !== event.locationId) {
          return false;
        }
      }

      return true;
    });

    if (targetSubscribers.length === 0) {
      logger.debug(
        {
          orgId: event.orgId,
          locationId: event.locationId,
          eventType: event.type,
        },
        'No subscribers for event'
      );
      return;
    }

    logger.info(
      {
        orgId: event.orgId,
        locationId: event.locationId,
        eventType: event.type,
        subscriberCount: targetSubscribers.length,
      },
      'Broadcasting event'
    );

    targetSubscribers.forEach(subscriber => {
      this.sendToSubscriber(subscriber.response, event);
    });
  }

  /**
   * Send event to specific subscriber using SSE format
   */
  private sendToSubscriber(response: Response, event: BroadcastEvent): void {
    try {
      // Check if connection is still writable
      if (response.destroyed || response.writableEnded) {
        throw new Error('Connection is closed');
      }

      // Send SSE formatted event
      if (event.id) {
        response.write(`id: ${event.id}\n`);
      }
      if (event.type) {
        response.write(`event: ${event.type}\n`);
      }
      response.write(`data: ${JSON.stringify(event)}\n`);
      response.write('\n');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to send event to subscriber');
    }
  }

  /**
   * Send heartbeat to all subscribers to keep connections alive (every 15s)
   */
  private sendHeartbeatToAll(): void {
    const now = new Date();
    const heartbeatEvent: BroadcastEvent = {
      id: this.generateEventId(),
      type: 'heartbeat',
      at: now.toISOString(),
      orgId: '', // Will be set per subscriber
      locationId: null,
      payload: {
        timestamp: now.toISOString(),
        connections: this.subscribers.size,
      },
    };

    this.subscribers.forEach((subscriber, id) => {
      try {
        const subscriberHeartbeat = {
          ...heartbeatEvent,
          orgId: subscriber.companyId,
          locationId: subscriber.locationId,
        };
        this.sendToSubscriber(subscriber.response, subscriberHeartbeat);
        subscriber.lastPing = now;
      } catch (error) {
        // Connection is dead, will be cleaned up later
        logger.debug({ subscriberId: id }, 'Failed to send heartbeat to subscriber');
      }
    });

    if (this.subscribers.size > 0) {
      logger.debug(`Heartbeat sent to ${this.subscribers.size} subscribers`);
    }
  }

  /**
   * Clean up dead connections
   */
  private cleanupDeadConnections(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deadSubscribers: string[] = [];

    this.subscribers.forEach((subscriber, id) => {
      if (subscriber.lastPing < fiveMinutesAgo) {
        deadSubscribers.push(id);
      }
    });

    deadSubscribers.forEach(id => {
      this.removeSubscriber(id);
    });

    if (deadSubscribers.length > 0) {
      logger.info({ count: deadSubscribers.length }, 'Cleaned up dead connections');
    }
  }

  /**
   * Get current subscriber count
   */
  getSubscriberCount(companyId?: string): number {
    if (companyId) {
      return Array.from(this.subscribers.values()).filter(sub => sub.companyId === companyId)
        .length;
    }
    return this.subscribers.size;
  }

  /**
   * Generate monotonic event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${++this.eventIdCounter}`;
  }

  /**
   * Shutdown the broadcaster
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    this.subscribers.forEach((subscriber, id) => {
      this.removeSubscriber(id);
    });

    logger.info('Event broadcaster shutdown');
  }
}

// Singleton instance
const eventBroadcaster = new EventBroadcaster();

/**
 * Broadcast visit check-in event
 */
export function broadcastVisitCheckin(
  visitId: string,
  companyId: string,
  locationId: string,
  memberId: string,
  memberName: string,
  gymName: string
): void {
  eventBroadcaster.broadcast({
    id: `visit-checkin-${Date.now()}`,
    type: 'visit.checkin',
    at: new Date().toISOString(),
    orgId: companyId,
    locationId,
    payload: {
      visitId,
      memberId,
      memberName,
      gymId: locationId,
      gymName,
      checkinAt: new Date().toISOString(),
    },
  });
}

/**
 * Broadcast visit check-out event
 */
export function broadcastVisitCheckout(
  visitId: string,
  companyId: string,
  locationId: string,
  memberId: string,
  memberName: string,
  gymName: string,
  durationMinutes: number
): void {
  eventBroadcaster.broadcast({
    id: `visit-checkout-${Date.now()}`,
    type: 'visit.checkout',
    at: new Date().toISOString(),
    orgId: companyId,
    locationId,
    payload: {
      visitId,
      memberId,
      memberName,
      gymId: locationId,
      gymName,
      checkoutAt: new Date().toISOString(),
      durationMinutes,
    },
  });
}

/**
 * Broadcast membership expiring event
 */
export function broadcastMembershipExpiring(
  membershipId: string,
  companyId: string,
  memberId: string,
  memberName: string,
  planName: string,
  expiresAt: string,
  daysLeft: number
): void {
  eventBroadcaster.broadcast({
    id: `membership-expiring-${Date.now()}`,
    type: 'membership.expiring',
    at: new Date().toISOString(),
    orgId: companyId,
    locationId: null, // Memberships are org-wide
    payload: {
      membershipId,
      memberId,
      memberName,
      planName,
      expiresAt,
      daysLeft,
    },
  });
}

/**
 * Broadcast payment failed event
 */
export function broadcastPaymentFailed(
  paymentId: string,
  invoiceId: string,
  companyId: string,
  memberId: string,
  memberName: string,
  amountMxnCents: number,
  reason: string,
  retryCount: number
): void {
  eventBroadcaster.broadcast({
    id: `payment-failed-${Date.now()}`,
    type: 'payment.failed',
    at: new Date().toISOString(),
    orgId: companyId,
    locationId: null, // Payments are org-wide
    payload: {
      paymentId,
      invoiceId,
      memberId,
      memberName,
      amountMxnCents,
      reason,
      retryCount,
    },
  });
}

export { eventBroadcaster };
