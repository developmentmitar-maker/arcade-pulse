// ============================================
// GET /api/snapshots — Snapshot History
// ============================================

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const website = searchParams.get('website');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const changesOnly = searchParams.get('changesOnly') === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (website) {
      query.website = website;
    }
    if (changesOnly) {
      query.hasChanges = true;
    }

    const snapshots = await Snapshot.find(query)
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean();

    return Response.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('Snapshots error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
