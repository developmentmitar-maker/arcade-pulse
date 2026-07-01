// ============================================
// Arcade Portal Scraper
// ============================================
// Scrapes https://go.cloudskillsboost.google/arcade
// This is a Google Sites page — content is JS-rendered,
// so we must use Playwright to execute JS before extracting text.

import type { Page } from 'playwright-core';
import type { SectionData } from '@/types';

const URL = 'https://go.cloudskillsboost.google/arcade';

export async function scrapeArcadePortal(page: Page): Promise<SectionData> {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Log URL to detect any redirects
  console.log('[arcade] Loaded URL:', await page.url());

  // Additional settle time for Google-hosted pages
  await page.waitForTimeout(3000);

  // Wait for Google Sites content container to appear
  await page.waitForSelector('div[data-is-root-theme]', { timeout: 30000 }).catch(() => null);

  // Additional settle time for lazy-loaded content
  await page.waitForTimeout(2000);

  // Extract meaningful text blocks from the rendered page
  const rawText = await page.evaluate(() => {
    // Prefer visible text containers; skip nav/footer boilerplate
    const skipSelectors = ['nav', 'header', 'footer', 'script', 'style', 'noscript'];
    const skipSet = new Set(skipSelectors);

    function extractText(node: Element): string {
      if (skipSet.has(node.tagName.toLowerCase())) return '';
      if ((node as HTMLElement).offsetParent === null && node.tagName !== 'BODY') return ''; // hidden
      const children = Array.from(node.childNodes);
      return children
        .map((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            return child.textContent?.trim() ?? '';
          }
          if (child.nodeType === Node.ELEMENT_NODE) {
            return extractText(child as Element);
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    return extractText(document.body);
  });

  return parseArcadeSections(rawText);
}

// ============================================
// Section Parsing
// ============================================
// Splits the page text into three buckets using heading-based
// section detection. Falls back to keyword search if no headings found.

function parseArcadeSections(raw: string): SectionData {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 300); // filter noise

  // Deduplicate consecutive identical lines (Google Sites repeats labels)
  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }

  // Try to find section headings and bucket lines under them
  const SECTION_PATTERNS: Record<keyof SectionData, RegExp> = {
    games:         /\b(games?|arcade\s*game|new\s*game|challenge|quest|skill\s*badge|lab)\b/i,
    bonus:         /\b(bonus|extra\s*credit|bonus\s*point|milestone|reward)\b/i,
    announcements: /\b(announcement|update|news|notice|important|registration|open|closed|deadline)\b/i,
  };

  const buckets: Record<keyof SectionData, string[]> = {
    games: [],
    bonus: [],
    announcements: [],
  };

  let currentSection: keyof SectionData | null = null;

  for (let i = 0; i < deduped.length; i++) {
    const line = deduped[i];

    // Detect section headings (short lines that match a section keyword)
    if (line.length <= 60) {
      for (const key of Object.keys(SECTION_PATTERNS) as (keyof SectionData)[]) {
        if (SECTION_PATTERNS[key].test(line)) {
          currentSection = key;
          break;
        }
      }
    }

    // Add line to current section bucket (skip the heading itself)
    if (currentSection && i > 0) {
      buckets[currentSection].push(line);
    }
  }

  // If heading-based detection found nothing, fall back to keyword scan
  if (!buckets.games.length && !buckets.bonus.length && !buckets.announcements.length) {
    for (const line of deduped) {
      for (const key of Object.keys(SECTION_PATTERNS) as (keyof SectionData)[]) {
        if (SECTION_PATTERNS[key].test(line)) {
          buckets[key].push(line);
        }
      }
    }
  }

  // Build final values — cap at 15 lines each to avoid huge strings
  const build = (items: string[], fallback: string) =>
    items.length > 0 ? [...new Set(items)].slice(0, 15).join(' | ') : fallback;

  return {
    games:         build(buckets.games, 'Coming Soon'),
    bonus:         build(buckets.bonus, 'Coming Soon'),
    announcements: build(buckets.announcements, 'No Updates'),
  };
}
