// ============================================
// POST /api/unsubscribe — Email Unsubscription
// ============================================

import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return Response.json(
        { success: false, error: 'Email not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return Response.json(
        { success: true, data: { message: 'Already unsubscribed' } },
        { status: 200 }
      );
    }

    user.isActive = false;
    await user.save();

    return Response.json(
      { success: true, data: { message: 'Successfully unsubscribed' } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return Response.json(
      { success: false, error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    );
  }
}
