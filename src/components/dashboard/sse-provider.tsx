'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SSEProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/sse');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'snapshot-update') {
          // Refresh the page data when a new snapshot is available
          router.refresh();
        }
        // Heartbeats are silently consumed to keep connection alive
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource will automatically reconnect
      console.log('SSE connection lost, reconnecting...');
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [router]);

  return <>{children}</>;
}
