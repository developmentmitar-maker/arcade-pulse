// ============================================
// Scraper Orchestrator
// ============================================
// Launches a single Chromium instance, scrapes both
// websites in parallel, and returns structured results.

import type { ScrapeResult, WebsiteId } from '@/types';
import { scrapeArcadePortal } from './arcade-portal';
import { scrapeFacilitatorPortal } from './facilitator-portal';

export async function scrapeAll(): Promise<ScrapeResult[]> {
  let browser = null;

  try {
    // Dynamic imports for serverless compatibility
    const chromium = await import('@sparticuz/chromium');
    const { chromium: playwrightChromium } = await import('playwright-core');

    browser = await playwrightChromium.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    // Create two pages to scrape in parallel
    const [page1, page2] = await Promise.all([
      context.newPage(),
      context.newPage(),
    ]);

    const results = await Promise.allSettled([
      scrapeArcadePortal(page1),
      scrapeFacilitatorPortal(page2),
    ]);

    const websiteIds: WebsiteId[] = ['arcade-portal', 'facilitator-portal'];
    const scrapeResults: ScrapeResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          websiteId: websiteIds[index],
          sections: result.value,
          scrapedAt: new Date(),
          success: true,
        };
      } else {
        return {
          websiteId: websiteIds[index],
          sections: {
            games: 'Error fetching data',
            bonus: 'Error fetching data',
            announcements: 'Error fetching data',
          },
          scrapedAt: new Date(),
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    return scrapeResults;
  } catch (error) {
    console.error('Scraper orchestrator error:', error);
    // Return error results for both websites
    return [
      {
        websiteId: 'arcade-portal',
        sections: {
          games: 'Error fetching data',
          bonus: 'Error fetching data',
          announcements: 'Error fetching data',
        },
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        websiteId: 'facilitator-portal',
        sections: {
          games: 'Error fetching data',
          bonus: 'Error fetching data',
          announcements: 'Error fetching data',
        },
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    ];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
