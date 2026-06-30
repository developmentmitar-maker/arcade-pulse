// ============================================
// GET /api/cron — Scheduled Scrape Trigger
// ============================================
// Flow:
//   1. Verify CRON_SECRET (Bearer token in Authorization header)
//   2. Connect to MongoDB
//   3. Scrape both portals via Playwright (JS-rendered pages)
//   4. Compare results against previous snapshot
//   5. Save new snapshot to MongoDB
//   6. If changes detected → send Brevo email + broadcast SSE
//   7. Return JSON summary

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';
import { scrapeAll } from '@/lib/scraper';
import { detectChanges } from '@/lib/diff';
import { notifySubscribers } from '@/lib/notifier';
import sseManager from '@/lib/sse-manager';
import type { SectionData } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Playwright needs up to 60s on Vercel Pro; hobby plan cap is 10s

export async function GET(request: NextRequest) {
  // ── Step 1: Auth check ────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // ── Step 2: Connect MongoDB ──────────────────────────────────
    await dbConnect();

    // ── Step 3: Scrape all monitored portals ─────────────────────
    console.log('[cron] Starting scrape run...');
    const results = await scrapeAll();

    const summary = {
      checkedAt: new Date().toISOString(),
      durationMs: 0,
      websites: [] as Array<{
        websiteId: string;
        success: boolean;
        hasChanges: boolean;
        changeCount: number;
        error?: string;
      }>,
      totalNotificationsSent: 0,
      totalNotificationsFailed: 0,
    };

    // ── Step 4–6: Process each scraped site ──────────────────────
    for (const result of results) {
      // Load the most recent previous snapshot for comparison
      const previousSnapshot = await Snapshot.findOne({ website: result.websiteId })
        .sort({ checkedAt: -1 })
        .lean();

      const previousSections: SectionData | null = previousSnapshot
        ? (previousSnapshot.sections as SectionData)
        : null;

      // Only diff when the scrape succeeded
      const changes = result.success
        ? detectChanges(result.sections, previousSections)
        : [];

      const hasChanges = changes.length > 0;

      // Save snapshot regardless of success/failure (so we track errors too)
      const snapshot = await Snapshot.create({
        website: result.websiteId,
        sections: result.sections,
        checkedAt: result.scrapedAt,
        hasChanges,
        changes,
      });

      // Send email + SSE only when real changes exist
      if (hasChanges) {
        console.log(`[cron] Changes detected for ${result.websiteId} (${changes.length} section(s))`);
        const notifResult = await notifySubscribers(result.websiteId, changes, snapshot._id);
        summary.totalNotificationsSent += notifResult.sent;
        summary.totalNotificationsFailed += notifResult.failed;
        console.log(`[cron] Emails: ${notifResult.sent} sent, ${notifResult.failed} failed`);
      }

      summary.websites.push({
        websiteId: result.websiteId,
        success: result.success,
        hasChanges,
        changeCount: changes.length,
        ...(result.error ? { error: result.error } : {}),
      });
    }

    // ── Step 6b: Broadcast SSE so live dashboard updates instantly ─
    sseManager.publish({
      type: 'snapshot-update',
      data: { summary },
      timestamp: new Date().toISOString(),
    });

    summary.durationMs = Date.now() - startTime;
    console.log(`[cron] Done in ${summary.durationMs}ms`);

    return Response.json({ success: true, data: summary });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Cron job failed';
    console.error('[cron] Fatal error:', errMsg);
    return Response.json(
      { success: false, error: errMsg, durationMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
