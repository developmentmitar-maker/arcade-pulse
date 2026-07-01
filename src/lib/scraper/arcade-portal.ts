// ============================================
// Arcade Portal Scraper
// ============================================
// Scrapes https://go.cloudskillsboost.google/arcade
// Extracts structured game data from Bootstrap cards

import type { Page } from 'playwright-core';
import type { SectionData } from '@/types';

const URL = 'https://go.cloudskillsboost.google/arcade';

export async function scrapeArcadePortal(page: Page): Promise<SectionData> {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Log URL to detect any redirects
  console.log('[arcade] Loaded URL:', page.url());

  // Additional settle time for Google-hosted pages
  await page.waitForTimeout(3000);

  // Wait for Google Sites content container to appear
  await page.waitForSelector('div[data-is-root-theme]', { timeout: 30000 }).catch(() => null);

  // Additional settle time for lazy-loaded content
  await page.waitForTimeout(2000);

  // Extract game cards using Bootstrap card structure
  const sections = await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll('.shuffle-item')
    );

    const games = cards
      .map((card) => {
        const title =
          card.querySelector('.card-title')?.textContent?.trim() || '';

        const accessCodeText = Array.from(card.querySelectorAll('p'))
          .find((p) => p.textContent?.includes('Access code'));

        const accessCode = accessCodeText
          ? accessCodeText.textContent
              ?.replace('Access code:', '')
              .trim()
          : '';

        const pointsText = Array.from(card.querySelectorAll('p'))
          .find((p) => p.textContent?.includes('Arcade points'));

        const points = pointsText
          ? pointsText.textContent?.trim()
          : '';

        if (!title) return '';

        return `${title} | Access code: ${accessCode} | ${points}`;
      })
      .filter(Boolean)
      .join('\n');

    return {
      games: games || 'No games found',
      bonus: '',
      announcements: '',
    };
  });

  return sections;
}
