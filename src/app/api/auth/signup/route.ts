import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import { hashPassword, signToken, makeAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Missing email or password' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.passwordHash) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { passwordHash: hashPassword(password), isActive: true } },
      { upsert: true, new: true }
    );

    const token = signToken({ id: user._id.toString(), email: user.email });

    const res = Response.json({ ok: true }, { status: 201 });
    res.headers.set('Set-Cookie', makeAuthCookie(token));
    return res;
  } catch (e) {
    console.error('[signup]', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
