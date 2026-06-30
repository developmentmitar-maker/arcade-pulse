"use client";
import { useEffect, useState } from 'react';
import { Globe, LogOut, Plus, X, ExternalLink, Loader2 } from 'lucide-react';

interface Site {
  _id: string;
  name: string;
  url: string;
}

interface DashboardAppProps {
  userEmail?: string;
}

export default function DashboardApp({ userEmail }: DashboardAppProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/websites');
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  async function handleAddSite(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });
      if (res.ok) {
        const data = await res.json();
        setSites((prev) => [data.site, ...prev]);
        setName('');
        setUrl('');
        setShowAdd(false);
      } else {
        const d = await res.json();
        setAddError(d.error || 'Failed to add site');
      }
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Top nav bar */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'linear-gradient(180deg, var(--color-surface) 0%, transparent 100%)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🚀</span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 18,
                background: 'linear-gradient(135deg, #818CF8, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Arcade Pulse
            </span>
            <span
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1px solid hsl(190 95% 45% / 0.3)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              DASHBOARD
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {userEmail && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                {userEmail}
              </span>
            )}
            <button
              id="dashboard-logout"
              onClick={handleLogout}
              disabled={logoutLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-destructive)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-destructive)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              }}
            >
              {logoutLoading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <LogOut size={14} />}
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                margin: '0 0 6px',
              }}
            >
              Monitored Sites
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              Manage the websites Arcade Pulse is watching for you
            </p>
          </div>
          <button
            id="dashboard-add-site-toggle"
            onClick={() => { setShowAdd(!showAdd); setAddError(null); }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            {showAdd ? <X size={14} /> : <Plus size={14} />}
            {showAdd ? 'Cancel' : 'Add site'}
          </button>
        </div>

        {/* Add site panel */}
        {showAdd && (
          <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 15, margin: '0 0 16px' }}>
              Add a new site
            </h3>
            {addError && (
              <div style={{
                background: 'var(--color-destructive-soft)',
                border: '1px solid var(--color-destructive)',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 14,
                fontSize: 13,
                color: 'var(--color-destructive)',
              }}>
                {addError}
              </div>
            )}
            <form onSubmit={handleAddSite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                id="add-site-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Site name"
                required
                className="input-field"
                style={{ flex: '1 1 180px' }}
              />
              <input
                id="add-site-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                required
                className="input-field"
                style={{ flex: '2 1 240px' }}
              />
              <button
                id="add-site-submit"
                type="submit"
                disabled={addLoading}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                {addLoading && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
                Add site
              </button>
            </form>
          </div>
        )}

        {/* Sites list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={28} style={{ color: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : sites.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
            <Globe size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 16, margin: '0 0 8px' }}>No sites yet</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              Click <strong>Add site</strong> above to start monitoring a website.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sites.map((site, i) => (
              <div
                key={site._id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, hsl(240 80% 65% / 0.2), hsl(190 95% 45% / 0.2))',
                    border: '1px solid hsl(240 80% 65% / 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 15, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {site.name}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {site.url}
                  </p>
                </div>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--color-text-muted)',
                    fontSize: 12,
                    textDecoration: 'none',
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-primary)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)';
                  }}
                >
                  <ExternalLink size={12} />
                  Visit
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Back to monitor */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a
            href="/"
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)'; }}
          >
            ← Back to live monitor
          </a>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
