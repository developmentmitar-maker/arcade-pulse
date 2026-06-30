'use client';

import { Gamepad2, Gift, Megaphone } from 'lucide-react';
import type { SectionData } from '@/types';

interface SectionCardProps {
  section: keyof SectionData;
  value: string;
  websiteName: string;
  lastUpdated?: string;
  recentlyChanged?: boolean;
}

const SECTION_CONFIG = {
  games: {
    icon: Gamepad2,
    label: 'Games',
    badgeClass: 'section-badge games',
    glowColor: 'hsl(260, 80%, 60%)',
  },
  bonus: {
    icon: Gift,
    label: 'Bonus',
    badgeClass: 'section-badge bonus',
    glowColor: 'hsl(38, 92%, 50%)',
  },
  announcements: {
    icon: Megaphone,
    label: 'Announcements',
    badgeClass: 'section-badge announcements',
    glowColor: 'hsl(190, 95%, 45%)',
  },
};

export default function SectionCard({
  section,
  value,
  websiteName,
  lastUpdated,
  recentlyChanged = false,
}: SectionCardProps) {
  const config = SECTION_CONFIG[section];
  const Icon = config.icon;

  return (
    <div
      className="glass-card p-6 animate-fade-in relative overflow-hidden"
      style={
        recentlyChanged
          ? {
              borderColor: config.glowColor,
              boxShadow: `0 0 20px ${config.glowColor}33`,
            }
          : undefined
      }
    >
      {/* Glow effect for recent changes */}
      {recentlyChanged && (
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
          style={{ background: config.glowColor }}
        />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className={config.badgeClass}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          {recentlyChanged && (
            <span className="text-xs font-semibold text-[var(--color-accent)] animate-pulse">
              NEW
            </span>
          )}
        </div>

        <p className="text-[var(--color-text-primary)] font-medium text-base mb-3 leading-relaxed line-clamp-3">
          {value}
        </p>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{websiteName}</span>
          {lastUpdated && <span>{lastUpdated}</span>}
        </div>
      </div>
    </div>
  );
}
