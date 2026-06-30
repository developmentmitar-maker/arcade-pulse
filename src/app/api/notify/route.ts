// ============================================
// POST /api/notify — Notification Trigger
// ============================================
// Called by GitHub Actions after scraping is complete.
// This endpoint ONLY handles notifications - no scraping.
// Safe for Vercel Hobby plan (< 10s).

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { notifySubscribers } from '@/lib/notifier';
import sseManager from '@/lib/sse-manager';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { websiteId, changes, snapshotId } = body;

    if (!websiteId || !changes || !snapshotId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Send notifications
    const notifResult = await notifySubscribers(websiteId, changes, snapshotId);

    // Broadcast SSE
    sseManager.publish({
      type: 'snapshot-update',
      data: { websiteId, changes, snapshotId },
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      data: {
        websiteId,
        notificationsSent: notifResult.sent,
        notificationsFailed: notifResult.failed,
      },
    });
  } catch (error) {
    console.error('[notify] Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      },
      { status: 500 }
    );
  }
}
