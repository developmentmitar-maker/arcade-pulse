'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { StatusInfo } from '@/types';

export default function StatusCard() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="animate-shimmer h-4 w-32 rounded mb-4" />
        <div className="animate-shimmer h-8 w-24 rounded mb-2" />
        <div className="animate-shimmer h-4 w-48 rounded" />
      </div>
    );
  }

  const isHealthy = status?.healthy ?? false;
  const lastChecked = status?.lastCheckedAt
    ? formatDistanceToNow(new Date(status.lastCheckedAt), { addSuffix: true })
    : 'Never';

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          System Status
        </h3>
        {isHealthy ? (
          <Shield className="w-5 h-5 text-[var(--color-success)]" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-[var(--color-destructive)]" />
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={`status-dot ${isHealthy ? 'healthy' : status?.lastCheckedAt ? 'error' : 'unknown'}`} />
        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          {isHealthy ? 'Healthy' : status?.lastCheckedAt ? 'Degraded' : 'Waiting'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-[var(--color-text-secondary)]">Last Checked:</span>
          <span className="text-[var(--color-text-primary)] font-medium">{lastChecked}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-[var(--color-text-secondary)]">Subscribers:</span>
          <span className="text-[var(--color-text-primary)] font-medium">{status?.totalSubscribers ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
