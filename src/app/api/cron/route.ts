// ============================================
// GET /api/cron — Scheduled Scrape Trigger
// ============================================
// Called by Vercel Cron every 2 hours.
// Scrapes both websites, detects changes, sends notifications.

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';
import { scrapeAll } from '@/lib/scraper';
import { detectChanges } from '@/lib/diff';
import { notifySubscribers } from '@/lib/notifier';
import sseManager from '@/lib/sse-manager';
import type { SectionData } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for Playwright scraping

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or has valid secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // 1. Scrape both websites
    const results = await scrapeAll();

    const summary = {
      checkedAt: new Date().toISOString(),
      websites: [] as Array<{
        websiteId: string;
        success: boolean;
        hasChanges: boolean;
        changeCount: number;
      }>,
      totalNotificationsSent: 0,
      totalNotificationsFailed: 0,
    };

    // 2. Process each result
    for (const result of results) {
      // Get previous snapshot for comparison
      const previousSnapshot = await Snapshot.findOne({
        website: result.websiteId,
      })
        .sort({ checkedAt: -1 })
        .lean();

      const previousSections: SectionData | null = previousSnapshot
        ? (previousSnapshot.sections as SectionData)
        : null;

      // 3. Detect changes
      const changes = result.success
        ? detectChanges(result.sections, previousSections)
        : [];

      const hasChanges = changes.length > 0;

      // 4. Save new snapshot
      const snapshot = await Snapshot.create({
        website: result.websiteId,
        sections: result.sections,
        checkedAt: result.scrapedAt,
        hasChanges,
        changes,
      });

      // 5. Send notifications if changes detected
      if (hasChanges) {
        const notifResult = await notifySubscribers(
          result.websiteId,
          changes,
          snapshot._id
        );
        summary.totalNotificationsSent += notifResult.sent;
        summary.totalNotificationsFailed += notifResult.failed;
      }

      summary.websites.push({
        websiteId: result.websiteId,
        success: result.success,
        hasChanges,
        changeCount: changes.length,
      });
    }

    // 6. Broadcast SSE event for live dashboard updates
    sseManager.publish({
      type: 'snapshot-update',
      data: { summary },
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true, data: summary });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
      },
      { status: 500 }
    );
  }
}
