'use client';

import { Activity, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,80%,60%/0.08)] via-transparent to-[hsl(190,95%,45%/0.08)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[hsl(240,80%,60%/0.12)] to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        <nav className="absolute top-6 right-6 flex items-center gap-3">
          <a href="/dashboard" className="text-sm text-[var(--color-text-muted)] px-3 py-2 rounded hover:bg-[var(--color-surface)]">Dashboard</a>
          <a href="/login" className="text-sm px-3 py-2 bg-[var(--color-primary)] text-white rounded">Log in</a>
          <a href="/signup" className="text-sm px-3 py-2 border border-[var(--color-border)] rounded">Sign up</a>
        </nav>
        {/* Logo icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(240,80%,60%)] to-[hsl(190,95%,45%)] mb-6 animate-float">
          <Zap className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          <span className="gradient-text">Arcade Pulse</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[var(--color-text-secondary)] text-base sm:text-lg max-w-xl mx-auto mb-6">
          Real-time Google Arcade Update Monitor
        </p>

        {/* Live indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="status-dot healthy" />
          <span className="text-sm text-[var(--color-text-secondary)]">
            <Activity className="w-3.5 h-3.5 inline mr-1" />
            Live Monitoring
          </span>
        </div>
      </div>
    </header>
  );
}
