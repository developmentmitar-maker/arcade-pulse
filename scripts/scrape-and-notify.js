#!/usr/bin/env node
/**
 * GitHub Actions Scraper Script
 * 
 * This script runs in GitHub Actions to bypass Vercel Hobby's 10-second timeout.
 * Flow:
 *   1. Launch Playwright and scrape both portals
 *   2. Connect to MongoDB and compare with previous snapshots
 *   3. Save new snapshots to MongoDB
 *   4. If changes detected, call Vercel /api/notify endpoint
 */
require('dotenv').config({ path: '.env.local' });

console.log('Mongo URI:', process.env.MONGODB_URI);
console.log('SMTP HOST:', process.env.SMTP_HOST);
console.log('CRON:', process.env.CRON_SECRET);

const mongoose = require('mongoose');
const { chromium } = require('playwright');

// MongoDB connection
const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[scraper] Connected to MongoDB');
};

// Define Snapshot schema
const snapshotSchema = new mongoose.Schema({
  website: { type: String, required: true, index: true },
  sections: { type: Object, required: true },
  checkedAt: { type: Date, default: Date.now, index: true },
  hasChanges: { type: Boolean, default: false },
  changes: [{ section: String, oldValue: String, newValue: String }],
});

const Snapshot = mongoose.models.Snapshot || mongoose.model('Snapshot', snapshotSchema);

// Change detection
function detectChanges(current, previous) {
  if (!previous) return [];
  
  const changes = [];
  for (const section of ['games', 'bonus', 'announcements']) {
    const oldVal = String(previous[section] || '').trim();
    const newVal = String(current[section] || '').trim();
    
    if (oldVal !== newVal && newVal !== 'Section not found' && newVal !== 'Error fetching data') {
      changes.push({ section, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

// Arcade Portal scraper
async function scrapeArcadePortal(page) {
  try {
    await page.goto('https://go.cloudskillsboost.google/arcade', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Log URL to detect any redirects
    console.log('[arcade] Loaded URL:', await page.url());

    // Additional settle time for Google-hosted pages
    await page.waitForTimeout(3000);

    await page.waitForSelector('body', { timeout: 30000 });

    const sections = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      
      const gamesHeading = headings.find((h) =>
        /the arcade/i.test(h.textContent || '')
      );
      const bonusHeading = headings.find((h) =>
        /bonus/i.test(h.textContent || '')
      );
      const announcementsHeading = headings.find((h) =>
        /announcements/i.test(h.textContent || '')
      );

      const extractText = (heading) => {
        if (!heading) return 'Section not found';
        let text = '';
        let sibling = heading.nextElementSibling;
        while (sibling && !/^h[1-4]$/i.test(sibling.tagName)) {
          text += (sibling.innerText || '') + '\n';
          sibling = sibling.nextElementSibling;
        }
        return text.trim() || 'No content';
      };

      return {
        games: extractText(gamesHeading),
        bonus: extractText(bonusHeading),
        announcements: extractText(announcementsHeading),
      };
    });

    return sections;
  } catch (error) {
    console.error('[scraper] Arcade portal error:', error.message);
    return {
      games: 'Error fetching data',
      bonus: 'Error fetching data',
      announcements: 'Error fetching data',
    };
  }
}

// Facilitator Portal scraper
async function scrapeFacilitatorPortal(page) {
  try {
    await page.goto('https://rsvp.withgoogle.com/events/arcade-facilitator', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Log URL to detect any redirects
    console.log('[facilitator] Loaded URL:', await page.url());

    // Additional settle time for Google-hosted pages
    await page.waitForTimeout(3000);

    await page.waitForSelector('body', { timeout: 30000 });

    const sections = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      
      const gamesHeading = headings.find((h) =>
        /facilitator program/i.test(h.textContent || '')
      );
      const bonusHeading = headings.find((h) =>
        /bonus/i.test(h.textContent || '')
      );
      const announcementsHeading = headings.find((h) =>
        /announcements/i.test(h.textContent || '')
      );

      const extractText = (heading) => {
        if (!heading) return 'Section not found';
        let text = '';
        let sibling = heading.nextElementSibling;
        while (sibling && !/^h[1-4]$/i.test(sibling.tagName)) {
          text += (sibling.innerText || '') + '\n';
          sibling = sibling.nextElementSibling;
        }
        return text.trim() || 'No content';
      };

      return {
        games: extractText(gamesHeading),
        bonus: extractText(bonusHeading),
        announcements: extractText(announcementsHeading),
      };
    });

    return sections;
  } catch (error) {
    console.error('[scraper] Facilitator portal error:', error.message);
    return {
      games: 'Error fetching data',
      bonus: 'Error fetching data',
      announcements: 'Error fetching data',
    };
  }
}

// Portfolio scraper
async function scrapePortfolio(page) {
  try {
    await page.goto('https://www.iam-rahularora.me', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log('[portfolio] Loaded URL:', await page.url());

    await page.waitForTimeout(3000);

    const body = await page.locator('body').innerText();

    return {
      games: body,
      bonus: '',
      announcements: '',
    };
  } catch (error) {
    console.error('[scraper] Portfolio error:', error.message);

    return {
      games: 'Error fetching data',
      bonus: '',
      announcements: '',
    };
  }
}

async function main() {
  const startTime = Date.now();
  console.log('[scraper] Starting GitHub Actions scrape...');

  let browser = null;

  try {
    // Connect to MongoDB
    await dbConnect();

    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    // Block heavy resources to speed up
    await context.route(
      /\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|mp4|mp3|ico)$/i,
      (route) => route.abort()
    );

    console.log('[scraper] Browser launched, opening pages...');

    const [page1, page2, page3] = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ]);

    // Scrape both sites in parallel
    console.log('[scraper] Scraping portals...');
    const results = await Promise.allSettled([
      scrapeArcadePortal(page1),
      scrapeFacilitatorPortal(page2),
      scrapePortfolio(page3),
    ]);

    const websiteIds = ['arcade-portal', 'facilitator-portal', 'portfolio'];
    const scrapedAt = new Date();

    // Process each result
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const websiteId = websiteIds[i];

      if (result.status === 'fulfilled') {
        const sections = result.value;
        console.log(`[scraper] ✓ ${websiteId} scraped successfully`);

        // Get previous snapshot from MongoDB
        const previousSnapshot = await Snapshot.findOne({ website: websiteId })
          .sort({ checkedAt: -1 })
          .lean();

        const previousSections = previousSnapshot ? previousSnapshot.sections : null;
        const changes = detectChanges(sections, previousSections);
        const hasChanges = changes.length > 0;

        // Save new snapshot to MongoDB
        const snapshot = await Snapshot.create({
          website: websiteId,
          sections,
          checkedAt: scrapedAt,
          hasChanges,
          changes,
        });

        console.log(`[scraper] Snapshot saved for ${websiteId} (changes: ${hasChanges})`);

        // If changes detected, notify Vercel to send emails
        if (hasChanges && changes.length > 0) {
          console.log(`[scraper] ${changes.length} changes detected for ${websiteId}, calling /api/notify...`);
          
          try {
            const response = await fetch(`${process.env.APP_URL}/api/notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({ 
                websiteId, 
                changes, 
                snapshotId: snapshot._id.toString() 
              }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
              console.log(`[scraper] ✓ Notifications sent: ${data.data?.notificationsSent || 0}`);
            } else {
              console.error(`[scraper] ✗ Notification API error:`, data.error);
            }
          } catch (err) {
            console.error(`[scraper] ✗ Failed to call /api/notify:`, err.message);
          }
        } else {
          console.log(`[scraper] No changes for ${websiteId}, skipping notifications`);
        }
      } else {
        console.error(`[scraper] ✗ ${websiteId} scrape failed:`, result.reason?.message);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[scraper] ✓ Complete in ${durationMs}ms`);

  } catch (error) {
    console.error('[scraper] Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('[scraper] Browser closed');
    }
    await mongoose.connection.close();
    console.log('[scraper] MongoDB disconnected');
  }
}

main();
