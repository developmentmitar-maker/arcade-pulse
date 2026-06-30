// ============================================
// GET /api/status — Scraper Health Status
// ============================================

import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';
import User from '@/lib/models/user';
import type { StatusInfo } from '@/types';
import { addHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // Get the most recent snapshot
    const latestSnapshot = await Snapshot.findOne()
      .sort({ checkedAt: -1 })
      .lean();

    // Count active subscribers
    const totalSubscribers = await User.countDocuments({ isActive: true });

    // Determine health status
    const lastCheckedAt = latestSnapshot?.checkedAt
      ? new Date(latestSnapshot.checkedAt).toISOString()
      : null;

    // Next check is 2 hours after last check
    const nextCheckAt = lastCheckedAt
      ? addHours(new Date(lastCheckedAt), 2).toISOString()
      : null;

    // Consider healthy if last check was within the last 3 hours
    const healthy = lastCheckedAt
      ? new Date().getTime() - new Date(lastCheckedAt).getTime() < 3 * 60 * 60 * 1000
      : false;

    const status: StatusInfo = {
      healthy,
      lastCheckedAt,
      nextCheckAt,
      totalSubscribers,
      lastCheckSuccess: true, // Will be updated based on snapshot data
    };

    return Response.json({ success: true, data: status });
  } catch (error) {
    console.error('Status error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
