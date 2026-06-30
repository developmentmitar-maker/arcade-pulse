'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Circle, ArrowUpCircle } from 'lucide-react';
import type { SnapshotDocument } from '@/types';

export default function ActivityTimeline() {
  const [snapshots, setSnapshots] = useState<SnapshotDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  async function fetchSnapshots() {
    try {
      const res = await fetch('/api/snapshots?limit=20');
      const json = await res.json();
      if (json.success) {
        setSnapshots(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-6">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="animate-shimmer h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="animate-shimmer h-4 w-3/4 rounded" />
                <div className="animate-shimmer h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group snapshots by date
  const grouped = snapshots.reduce<Record<string, SnapshotDocument[]>>((acc, snap) => {
    const dateKey = format(new Date(snap.checkedAt), 'dd MMM yyyy');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(snap);
    return acc;
  }, {});

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-6">
        Recent Activity
      </h3>

      {snapshots.length === 0 ? (
        <div className="text-center py-8">
          <Circle className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-muted)] text-sm">
            No activity yet. Waiting for first check...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, snaps]) => (
            <div key={date}>
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                {date}
              </p>

              <div className="relative pl-6 space-y-4">
                {/* Timeline connector line */}
                <div className="absolute left-[7px] top-2 bottom-2 timeline-connector" />

                {snaps.map((snap) => (
                  <div key={snap._id} className="relative flex gap-3 items-start">
                    {/* Timeline dot */}
                    <div className="absolute -left-6 top-1">
                      {snap.hasChanges ? (
                        <ArrowUpCircle className="w-4 h-4 text-[var(--color-accent)]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[var(--color-text-muted)]" fill="currentColor" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {format(new Date(snap.checkedAt), 'h:mm a')}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {snap.website === 'arcade-portal' ? 'Arcade' : 'Facilitator'}
                        </span>
                      </div>

                      {snap.hasChanges ? (
                        <div className="space-y-1">
                          {snap.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="text-xs rounded-lg px-3 py-2 bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium"
                            >
                              {change.section.charAt(0).toUpperCase() + change.section.slice(1)} Updated
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          No changes detected
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
