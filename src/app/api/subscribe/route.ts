// ============================================
// POST /api/subscribe — Email Subscription
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

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.isActive) {
        return Response.json(
          { success: true, data: { message: 'Already subscribed!' } },
          { status: 200 }
        );
      }

      // Reactivate previously unsubscribed user
      existingUser.isActive = true;
      await existingUser.save();

      return Response.json(
        { success: true, data: { message: 'Welcome back! Subscription reactivated.' } },
        { status: 200 }
      );
    }

    // Create new subscriber
    await User.create({ email: email.toLowerCase() });

    return Response.json(
      { success: true, data: { message: 'Successfully subscribed!' } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json(
      { success: false, error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
