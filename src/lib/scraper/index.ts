// ============================================
// Scraper Orchestrator
// ============================================
// Launches a single Chromium instance, scrapes both
// websites in parallel, and returns structured results.
//
// WHY PLAYWRIGHT?
// Both target pages are heavily JS-rendered (Google Sites + Firebase SPA).
// Raw fetch() returns empty shell HTML. Chromium is required to execute JS
// and render the actual content before text extraction.

import type { ScrapeResult, WebsiteId } from '@/types';
import { scrapeArcadePortal } from './arcade-portal';
import { scrapeFacilitatorPortal } from './facilitator-portal';

export async function scrapeAll(): Promise<ScrapeResult[]> {
  let browser = null;

  try {
    // Set environment variable to skip browser validation checks
    process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';
    
    // Dynamic imports for serverless compatibility (avoids bundling issues)
    const chromium = await import('@sparticuz/chromium');
    const playwright = await import('playwright-core');
    const playwrightChromium = playwright.chromium;

    // Get executable path from Sparticuz Chromium
    const executablePath = await chromium.default.executablePath();
    
    console.log('[scraper] Launching browser with executable:', executablePath);

    browser = await playwrightChromium.launch({
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath,
      headless: chromium.default.headless,
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      // Block images, fonts, media — only need HTML + JS for text extraction
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    // Block heavy resources to speed up page loads
    await context.route(
      /\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|mp4|mp3|ico)$/i,
      (route) => route.abort()
    );

    // Open two pages in parallel
    const [page1, page2] = await Promise.all([
      context.newPage(),
      context.newPage(),
    ]);

    const websiteIds: WebsiteId[] = ['arcade-portal', 'facilitator-portal'];
    const scrapedAt = new Date();

    // Run both scrapers concurrently
    const results = await Promise.allSettled([
      scrapeArcadePortal(page1),
      scrapeFacilitatorPortal(page2),
    ]);

    const scrapeResults: ScrapeResult[] = results.map((result, index) => {
      const websiteId = websiteIds[index];

      if (result.status === 'fulfilled') {
        console.log(`[scraper] ✓ ${websiteId} scraped successfully`);
        return {
          websiteId,
          sections: result.value,
          scrapedAt,
          success: true,
        };
      } else {
        const errMsg = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason ?? 'Unknown error');
        console.error(`[scraper] ✗ ${websiteId} failed: ${errMsg}`);
        return {
          websiteId,
          sections: {
            games: 'Error fetching data',
            bonus: 'Error fetching data',
            announcements: 'Error fetching data',
          },
          scrapedAt,
          success: false,
          error: errMsg,
        };
      }
    });

    return scrapeResults;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Orchestrator failed';
    console.error('[scraper] Orchestrator error:', errMsg);

    const errorSections = {
      games: 'Error fetching data',
      bonus: 'Error fetching data',
      announcements: 'Error fetching data',
    };

    return [
      { websiteId: 'arcade-portal', sections: errorSections, scrapedAt: new Date(), success: false, error: errMsg },
      { websiteId: 'facilitator-portal', sections: errorSections, scrapedAt: new Date(), success: false, error: errMsg },
    ];
  } finally {
    // Always close the browser to free memory
    if (browser) {
      await browser.close().catch((e) => console.error('[scraper] Failed to close browser:', e));
    }
  }
}
