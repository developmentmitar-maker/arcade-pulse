// ============================================
// Arcade Pulse — Shared TypeScript Types
// ============================================

export type WebsiteId = 'arcade-portal' | 'facilitator-portal';

export interface WebsiteConfig {
  id: WebsiteId;
  name: string;
  url: string;
  description: string;
}

export const WEBSITES: Record<WebsiteId, WebsiteConfig> = {
  'arcade-portal': {
    id: 'arcade-portal',
    name: 'Google Arcade Portal',
    url: 'https://go.cloudskillsboost.google/arcade',
    description: 'Game Codes, New Games, Announcements, Challenge Updates',
  },
  'facilitator-portal': {
    id: 'facilitator-portal',
    name: 'Arcade Facilitator Portal',
    url: 'https://rsvp.withgoogle.com/events/arcade-facilitator/home',
    description: 'Games Section, Bonus Section, Announcements',
  },
};

export interface SectionData {
  games: string;
  bonus: string;
  announcements: string;
}

export interface ScrapeResult {
  websiteId: WebsiteId;
  sections: SectionData;
  scrapedAt: Date;
  success: boolean;
  error?: string;
}

export interface ChangeDetail {
  section: keyof SectionData;
  previousValue: string;
  currentValue: string;
}

export interface SnapshotDocument {
  _id: string;
  website: WebsiteId;
  sections: SectionData;
  checkedAt: string;
  hasChanges: boolean;
  changes: ChangeDetail[];
}

export interface StatusInfo {
  healthy: boolean;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  totalSubscribers: number;
  lastCheckSuccess: boolean;
}

export interface SSEEvent {
  type: 'snapshot-update' | 'heartbeat';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SubscribeRequest {
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
