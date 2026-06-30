// ============================================
// POST /api/trigger — Manual Scrape Trigger
// ============================================
// Admin/dev endpoint to manually trigger a scrape.
// Same logic as the cron route.

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';
import { scrapeAll } from '@/lib/scraper';
import { detectChanges } from '@/lib/diff';
import { notifySubscribers } from '@/lib/notifier';
import sseManager from '@/lib/sse-manager';
import type { SectionData } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const results = await scrapeAll();

    const summary = {
      checkedAt: new Date().toISOString(),
      triggeredManually: true,
      websites: [] as Array<{
        websiteId: string;
        success: boolean;
        hasChanges: boolean;
        changeCount: number;
      }>,
      totalNotificationsSent: 0,
      totalNotificationsFailed: 0,
    };

    for (const result of results) {
      const previousSnapshot = await Snapshot.findOne({
        website: result.websiteId,
      })
        .sort({ checkedAt: -1 })
        .lean();

      const previousSections: SectionData | null = previousSnapshot
        ? (previousSnapshot.sections as SectionData)
        : null;

      const changes = result.success
        ? detectChanges(result.sections, previousSections)
        : [];

      const hasChanges = changes.length > 0;

      const snapshot = await Snapshot.create({
        website: result.websiteId,
        sections: result.sections,
        checkedAt: result.scrapedAt,
        hasChanges,
        changes,
      });

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

    sseManager.publish({
      type: 'snapshot-update',
      data: { summary },
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true, data: summary });
  } catch (error) {
    console.error('Trigger error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Manual trigger failed',
      },
      { status: 500 }
    );
  }
}
