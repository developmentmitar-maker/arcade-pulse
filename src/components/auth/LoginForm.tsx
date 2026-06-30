"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => { setMounted(true); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Left — Branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(240 80% 12%) 0%, hsl(230 25% 7%) 50%, hsl(190 80% 8%) 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(240 80% 65% / 0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '5%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(190 95% 45% / 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className={`relative z-10 text-center ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
          <h1
            className="gradient-text"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: '-1px',
              marginBottom: 16,
            }}
          >
            Arcade Pulse
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 340 }}>
            Real-time monitoring for Google Arcade.<br />
            Get instant alerts when new games, bonus points, or announcements drop.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {[
              { icon: '⚡', label: 'Instant Notifications', desc: 'Get emailed the moment updates appear' },
              { icon: '🎯', label: 'Two Portals Monitored', desc: 'Arcade Portal & Facilitator Portal' },
              { icon: '🔒', label: 'Private Dashboard', desc: 'Your personal monitoring hub' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>{item.label}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '2px 0 0' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div
          className={`w-full max-w-sm ${mounted ? 'animate-slide-up' : 'opacity-0'}`}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span style={{ fontSize: 40 }}>🚀</span>
            <h1
              className="gradient-text"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, marginTop: 8 }}
            >
              Arcade Pulse
            </h1>
          </div>

          <div className="glass-card" style={{ padding: '36px 32px' }}>
            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-text-primary)',
                  fontSize: 24,
                  fontWeight: 700,
                  margin: '0 0 6px',
                }}
              >
                Welcome back
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                Sign in to your account
              </p>
            </div>

            {error && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'var(--color-destructive-soft)',
                  border: '1px solid var(--color-destructive)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--color-destructive)',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
              >
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
