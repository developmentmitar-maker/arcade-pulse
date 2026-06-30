// ============================================
// Change Detection / Diff Engine
// ============================================
// Compares current scrape results against the most
// recent snapshot in MongoDB and returns a list of changes.

import type { SectionData, ChangeDetail } from '@/types';

/**
 * Normalizes text for comparison by trimming whitespace,
 * collapsing multiple spaces, and lowering case.
 */
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Compare current sections against previous sections.
 * Returns an array of ChangeDetail objects for sections that differ.
 */
export function detectChanges(
  current: SectionData,
  previous: SectionData | null
): ChangeDetail[] {
  // If no previous snapshot exists, everything is "new" but we don't
  // treat the first snapshot as a "change" to avoid spam.
  if (!previous) {
    return [];
  }

  const changes: ChangeDetail[] = [];
  const sectionKeys: (keyof SectionData)[] = ['games', 'bonus', 'announcements'];

  for (const key of sectionKeys) {
    const currentVal = current[key] || '';
    const previousVal = previous[key] || '';

    if (normalize(currentVal) !== normalize(previousVal)) {
      changes.push({
        section: key,
        previousValue: previousVal,
        currentValue: currentVal,
      });
    }
  }

  return changes;
}
