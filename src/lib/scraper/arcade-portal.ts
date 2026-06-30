// ============================================
// Arcade Portal Scraper
// ============================================
// Scrapes https://go.cloudskillsboost.google/arcade
// Extracts Games, Bonus, and Announcements sections.

import type { Page } from 'playwright-core';
import type { SectionData } from '@/types';

export async function scrapeArcadePortal(page: Page): Promise<SectionData> {
  const url = 'https://go.cloudskillsboost.google/arcade';

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for the Google Sites content to render
  await page.waitForTimeout(3000);

  // Extract all visible text content from the page
  const pageContent = await page.evaluate(() => {
    const body = document.body;
    if (!body) return '';
    return body.innerText || body.textContent || '';
  });

  // Parse sections from the page content using keyword matching
  const sections = extractSections(pageContent);

  return sections;
}

function extractSections(content: string): SectionData {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  let games = 'Coming Soon';
  let bonus = 'Coming Soon';
  let announcements = 'No Updates';

  // Look for game-related content
  const gamesKeywords = ['game', 'challenge', 'quest', 'lab', 'skill badge'];
  const bonusKeywords = ['bonus', 'extra', 'reward', 'point'];
  const announcementKeywords = ['announce', 'update', 'news', 'important', 'notice'];

  const gamesContent: string[] = [];
  const bonusContent: string[] = [];
  const announcementsContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (gamesKeywords.some((k) => lowerLine.includes(k))) {
      gamesContent.push(line);
    }
    if (bonusKeywords.some((k) => lowerLine.includes(k))) {
      bonusContent.push(line);
    }
    if (announcementKeywords.some((k) => lowerLine.includes(k))) {
      announcementsContent.push(line);
    }
  }

  if (gamesContent.length > 0) {
    games = gamesContent.slice(0, 10).join(' | ');
  }
  if (bonusContent.length > 0) {
    bonus = bonusContent.slice(0, 10).join(' | ');
  }
  if (announcementsContent.length > 0) {
    announcements = announcementsContent.slice(0, 10).join(' | ');
  }

  return { games, bonus, announcements };
}
