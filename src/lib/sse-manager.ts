// ============================================
// SSE Connection Manager
// ============================================
// In-memory pub/sub using event callbacks.
// Broadcasts events to all connected SSE clients.

import type { SSEEvent } from '@/types';

type SSECallback = (event: SSEEvent) => void;

class SSEManager {
  private listeners: Set<SSECallback> = new Set();

  subscribe(callback: SSECallback): void {
    this.listeners.add(callback);
  }

  unsubscribe(callback: SSECallback): void {
    this.listeners.delete(callback);
  }

  publish(event: SSEEvent): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('SSE callback error:', error);
      }
    });
  }

  get connectionCount(): number {
    return this.listeners.size;
  }
}

// Singleton instance (survives across requests in same process)
declare global {
  // eslint-disable-next-line no-var
  var sseManager: SSEManager | undefined;
}

const sseManager = global.sseManager ?? new SSEManager();

if (process.env.NODE_ENV !== 'production') {
  global.sseManager = sseManager;
}

export default sseManager;
