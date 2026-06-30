// ============================================
// Facilitator Portal Scraper
// ============================================
// Scrapes https://rsvp.withgoogle.com/events/arcade-facilitator/home
// Extracts Games, Bonus, and Announcements sections.

import type { Page } from 'playwright-core';
import type { SectionData } from '@/types';

export async function scrapeFacilitatorPortal(page: Page): Promise<SectionData> {
  const url = 'https://rsvp.withgoogle.com/events/arcade-facilitator/home';

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for the RSVP platform content to render
  await page.waitForTimeout(3000);

  // Extract all visible text content from the page
  const pageContent = await page.evaluate(() => {
    const body = document.body;
    if (!body) return '';
    return body.innerText || body.textContent || '';
  });

  // Parse sections from the page content
  const sections = extractSections(pageContent);

  return sections;
}

function extractSections(content: string): SectionData {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  let games = 'Coming Soon';
  let bonus = 'Coming Soon';
  let announcements = 'No Updates';

  const gamesKeywords = ['game', 'challenge', 'quest', 'lab', 'skill badge', 'arcade'];
  const bonusKeywords = ['bonus', 'extra', 'reward', 'point', 'milestone'];
  const announcementKeywords = ['announce', 'update', 'news', 'important', 'notice', 'registration'];

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
