/**
 * Server-Sent Events Type Definitions
 *
 * Defines the event system for real-time dashboard updates
 */

import { Response } from 'express';

export type EventType =
  | 'visit.checkin'
  | 'visit.checkout'
  | 'membership.expiring'
  | 'payment.failed';

export interface BaseEvent {
  id: string; // monotonic ID
  type: EventType;
  at: string; // ISO8601 timestamp
  orgId: string; // UUID
  locationId: string | null; // UUID or null
}

export interface VisitCheckinEvent extends BaseEvent {
  type: 'visit.checkin';
  payload: {
    visitId: string;
    memberId: string;
    memberName: string;
    gymId: string;
    gymName: string;
    checkinAt: string;
  };
}

export interface VisitCheckoutEvent extends BaseEvent {
  type: 'visit.checkout';
  payload: {
    visitId: string;
    memberId: string;
    memberName: string;
    gymId: string;
    gymName: string;
    checkoutAt: string;
    durationMinutes: number;
  };
}

export interface MembershipExpiringEvent extends BaseEvent {
  type: 'membership.expiring';
  payload: {
    membershipId: string;
    memberId: string;
    memberName: string;
    planName: string;
    expiresAt: string;
    daysLeft: number;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  type: 'payment.failed';
  payload: {
    paymentId: string;
    invoiceId: string;
    memberId: string;
    memberName: string;
    amountMxnCents: number;
    reason: string;
    retryCount: number;
  };
}

export type DashboardEvent =
  | VisitCheckinEvent
  | VisitCheckoutEvent
  | MembershipExpiringEvent
  | PaymentFailedEvent;

export interface SSEConnection {
  id: string;
  orgId: string;
  locationId: string | null;
  userId: string;
  response: Response; // Express Response object
  lastHeartbeat: Date;
  connectedAt: Date;
}

export interface EventFilter {
  orgId: string;
  locationId?: string | null;
  eventTypes?: EventType[];
}

export interface EventBroadcaster {
  addConnection(connection: SSEConnection): void;
  removeConnection(connectionId: string): void;
  broadcast(event: DashboardEvent, filter?: EventFilter): void;
  sendHeartbeat(): void;
  getConnectionCount(): number;
  getConnectionsByOrg(orgId: string): SSEConnection[];
}
