/**
 * Server-Sent Events Broadcaster
 * 
 * Manages SSE connections and broadcasts events to subscribed clients
 */

import { DashboardEvent, SSEConnection, EventFilter, EventBroadcaster } from './types';

class SSEBroadcaster implements EventBroadcaster {
  private connections = new Map<string, SSEConnection>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventIdCounter = 0;

  constructor() {
    this.startHeartbeat();
  }

  addConnection(connection: SSEConnection): void {
    this.connections.set(connection.id, connection);
    
    // Send initial connection event
    this.sendToConnection(connection, {
      id: this.generateEventId(),
      type: 'connection.established',
      data: JSON.stringify({
        connectionId: connection.id,
        connectedAt: connection.connectedAt.toISOString(),
        orgId: connection.orgId,
        locationId: connection.locationId,
      }),
    });

    console.log(`[SSE] Connection added: ${connection.id} (org: ${connection.orgId}, location: ${connection.locationId})`);
    console.log(`[SSE] Total connections: ${this.connections.size}`);
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        connection.response.end();
      } catch (error) {
        // Connection might already be closed
      }
      this.connections.delete(connectionId);
      console.log(`[SSE] Connection removed: ${connectionId}`);
      console.log(`[SSE] Total connections: ${this.connections.size}`);
    }
  }

  broadcast(event: DashboardEvent, filter?: EventFilter): void {
    const targetConnections = this.getFilteredConnections(filter);
    
    const sseEvent = {
      id: this.generateEventId(),
      type: event.type,
      data: JSON.stringify(event),
    };

    let successCount = 0;
    let failureCount = 0;

    for (const connection of targetConnections) {
      try {
        this.sendToConnection(connection, sseEvent);
        successCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send event to connection ${connection.id}:`, error);
        this.removeConnection(connection.id);
        failureCount++;
      }
    }

    console.log(`[SSE] Broadcast ${event.type}: ${successCount} sent, ${failureCount} failed`);
  }

  sendHeartbeat(): void {
    const heartbeatEvent = {
      id: this.generateEventId(),
      type: 'heartbeat',
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        connections: this.connections.size,
      }),
    };

    const connectionsToRemove: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      try {
        this.sendToConnection(connection, heartbeatEvent);
        connection.lastHeartbeat = new Date();
      } catch (error) {
        console.error(`[SSE] Heartbeat failed for connection ${connectionId}:`, error);
        connectionsToRemove.push(connectionId);
      }
    }

    // Remove failed connections
    for (const connectionId of connectionsToRemove) {
      this.removeConnection(connectionId);
    }

    if (this.connections.size > 0) {
      console.log(`[SSE] Heartbeat sent to ${this.connections.size} connections`);
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectionsByOrg(orgId: string): SSEConnection[] {
    return Array.from(this.connections.values()).filter(
      connection => connection.orgId === orgId
    );
  }

  private getFilteredConnections(filter?: EventFilter): SSEConnection[] {
    if (!filter) {
      return Array.from(this.connections.values());
    }

    return Array.from(this.connections.values()).filter(connection => {
      // Must match organization
      if (connection.orgId !== filter.orgId) {
        return false;
      }

      // If filter specifies locationId, connection must match or be null (all locations)
      if (filter.locationId !== undefined) {
        if (connection.locationId !== null && connection.locationId !== filter.locationId) {
          return false;
        }
      }

      return true;
    });
  }

  private sendToConnection(connection: SSEConnection, event: any): void {
    const response = connection.response;
    
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
    if (event.data) {
      response.write(`data: ${event.data}\n`);
    }
    response.write('\n');
  }

  private generateEventId(): string {
    return `${Date.now()}-${++this.eventIdCounter}`;
  }

  private startHeartbeat(): void {
    // Send heartbeat every 15 seconds as specified in the plan
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 15000);
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const [connectionId] of this.connections) {
      this.removeConnection(connectionId);
    }
  }
}

// Singleton instance
export const eventBroadcaster = new SSEBroadcaster();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SSE] Shutting down event broadcaster...');
  eventBroadcaster.destroy();
});

process.on('SIGINT', () => {
  console.log('[SSE] Shutting down event broadcaster...');
  eventBroadcaster.destroy();
});
