"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Sign up failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'good' : 'strong';
  const strengthColors: Record<string, string> = { weak: '#ef4444', good: '#f59e0b', strong: '#22c55e' };
  const strengthLabels: Record<string, string> = { weak: 'Too short', good: 'Good', strong: 'Strong' };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Left — Branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(190 80% 8%) 0%, hsl(230 25% 7%) 50%, hsl(260 80% 10%) 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(190 95% 45% / 0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(260 80% 60% / 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className={`relative z-10 text-center ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎮</div>
          <h1
            className="gradient-text"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 38, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}
          >
            Join Arcade Pulse
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
            Create your free account and never miss a Google Arcade update again.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'left' }}>
            {[
              { icon: '🔔', label: 'Email Alerts', desc: 'Instant Gmail notifications on every change' },
              { icon: '📊', label: 'Live Dashboard', desc: 'See real-time arcade data in one place' },
              { icon: '🆓', label: 'Always Free', desc: 'No credit card required' },
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

      {/* Right — Signup form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className={`w-full max-w-sm ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
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
                Create account
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                Start monitoring Google Arcade for free
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
                  id="signup-email"
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
                  id="signup-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-field"
                />
                {passwordStrength && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'good' ? '66%' : '100%',
                          background: strengthColors[passwordStrength],
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: strengthColors[passwordStrength], fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  Confirm password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-field"
                  style={{
                    borderColor:
                      confirmPassword && confirmPassword !== password
                        ? 'var(--color-destructive)'
                        : confirmPassword && confirmPassword === password
                        ? 'var(--color-success)'
                        : undefined,
                  }}
                />
              </div>

              <button
                id="signup-submit"
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
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in →
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
