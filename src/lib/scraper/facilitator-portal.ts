// ============================================
// Facilitator Portal Scraper
// ============================================
// Scrapes https://rsvp.withgoogle.com/events/arcade-facilitator/home
// This is a Firebase/React SPA — content is fully JS-rendered.
// We must wait for the custom element <rsvp-connected-guest-client>
// to hydrate before extracting any content.

import type { Page } from 'playwright-core';
import type { SectionData } from '@/types';

const URL = 'https://rsvp.withgoogle.com/events/arcade-facilitator/home';

export async function scrapeFacilitatorPortal(page: Page): Promise<SectionData> {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for the RSVP SPA to hydrate — the root custom element or any main content block
  const hydrated = await Promise.race([
    page.waitForSelector('rsvp-connected-guest-client', { timeout: 12000 }).then(() => true).catch(() => false),
    page.waitForSelector('main, [role="main"], .content', { timeout: 12000 }).then(() => true).catch(() => false),
  ]);

  // Give the SPA time to render its content after hydration
  await page.waitForTimeout(hydrated ? 3000 : 5000);

  // Grab the full body text, skipping script/style tags
  const rawText = await page.evaluate(() => {
    const skipTags = new Set(['script', 'style', 'noscript', 'svg', 'path']);

    function walk(node: Element): string {
      if (skipTags.has(node.tagName.toLowerCase())) return '';
      if (node.getAttribute('aria-hidden') === 'true') return '';

      const parts: string[] = [];
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const t = child.textContent?.trim();
          if (t) parts.push(t);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const sub = walk(child as Element);
          if (sub) parts.push(sub);
        }
      }
      return parts.join('\n');
    }

    return walk(document.body);
  });

  return parseFacilitatorSections(rawText);
}

// ============================================
// Section Parsing
// ============================================
// The facilitator portal has clear section labels like
// "Games", "Bonus", "Announcements" which we use as anchors.
// We bucket the following lines under each heading.

function parseFacilitatorSections(raw: string): SectionData {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 400);

  // Deduplicate adjacent identical lines (SPAs often render labels twice)
  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }

  const SECTION_PATTERNS: Record<keyof SectionData, RegExp> = {
    games:         /\b(games?|new\s*game|arcade\s*game|challenge|quest|skill\s*badge|lab\s*activity)\b/i,
    bonus:         /\b(bonus|bonus\s*track|extra\s*credit|milestone|reward|points?\s*extra)\b/i,
    announcements: /\b(announcement|update|notice|important|deadline|registration|open|closed|info)\b/i,
  };

  const buckets: Record<keyof SectionData, string[]> = {
    games: [],
    bonus: [],
    announcements: [],
  };

  let currentSection: keyof SectionData | null = null;
  let linesAfterHeading = 0;

  for (let i = 0; i < deduped.length; i++) {
    const line = deduped[i];

    // Detect section headings — short line that matches a section keyword
    if (line.length <= 80) {
      let matched = false;
      for (const key of Object.keys(SECTION_PATTERNS) as (keyof SectionData)[]) {
        if (SECTION_PATTERNS[key].test(line)) {
          currentSection = key;
          linesAfterHeading = 0;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    // Add up to 20 lines after the heading to the current bucket
    if (currentSection && linesAfterHeading < 20) {
      buckets[currentSection].push(line);
      linesAfterHeading++;
    }
  }

  // Fall back: if heading detection found nothing, do a simple keyword scan
  if (!buckets.games.length && !buckets.bonus.length && !buckets.announcements.length) {
    for (const line of deduped) {
      for (const key of Object.keys(SECTION_PATTERNS) as (keyof SectionData)[]) {
        if (SECTION_PATTERNS[key].test(line)) {
          buckets[key].push(line);
        }
      }
    }
  }

  const build = (items: string[], fallback: string) =>
    items.length > 0 ? [...new Set(items)].slice(0, 15).join(' | ') : fallback;

  return {
    games:         build(buckets.games, 'Coming Soon'),
    bonus:         build(buckets.bonus, 'Coming Soon'),
    announcements: build(buckets.announcements, 'No Updates'),
  };
}
