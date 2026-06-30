'use client';

import { useEffect, useState, useCallback } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  lastCheckedAt: string | null;
  intervalHours?: number;
}

export default function CountdownTimer({
  lastCheckedAt,
  intervalHours = 2,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  const calculateTimeLeft = useCallback(() => {
    if (!lastCheckedAt) {
      setTimeLeft('Waiting...');
      return;
    }

    const nextCheck = new Date(lastCheckedAt);
    nextCheck.setHours(nextCheck.getHours() + intervalHours);

    const now = new Date();
    const diff = nextCheck.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('Check imminent...');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    } else if (minutes > 0) {
      setTimeLeft(`${minutes}m ${seconds}s`);
    } else {
      setTimeLeft(`${seconds}s`);
    }
  }, [lastCheckedAt, intervalHours]);

  useEffect(() => {
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="w-5 h-5 text-[var(--color-accent)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Next Check
        </h3>
      </div>
      <p
        className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {timeLeft}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">
        Checks every {intervalHours} hours
      </p>
    </div>
  );
}
