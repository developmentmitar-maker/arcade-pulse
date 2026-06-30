'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { Suspense } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setMessage('No email address provided.');
      return;
    }

    async function unsubscribe() {
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();

        if (json.success) {
          setStatus('success');
          setMessage(json.data.message);
        } else {
          setStatus('error');
          setMessage(json.error || 'Failed to unsubscribe');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    }

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(240,80%,60%)] to-[hsl(190,95%,45%)] mb-6">
          <Zap className="w-6 h-6 text-white" />
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Arcade Pulse
        </h1>

        <div className="mt-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
              <p className="text-[var(--color-text-secondary)]">
                Unsubscribing...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
              <p className="text-[var(--color-text-primary)] font-medium">
                {message}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                You won&apos;t receive any more notifications.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[var(--color-destructive)]" />
              <p className="text-[var(--color-text-primary)] font-medium">
                {message}
              </p>
            </div>
          )}
        </div>

        <a
          href="/"
          className="inline-block mt-6 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
