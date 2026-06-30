'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    setToast(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (json.success) {
        setToast({ type: 'success', message: json.data.message });
        setEmail('');
      } else {
        setToast({ type: 'error', message: json.error || 'Failed to subscribe' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
      // Auto-dismiss toast after 4 seconds
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <>
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Get Notified
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Receive instant email alerts when updates are detected.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="subscribe-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input-field flex-1"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
