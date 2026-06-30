import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import { verifyPassword, signToken, makeAuthCookie, TOKEN_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'Missing email or password' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = verifyPassword(password, user.passwordHash);
    if (!ok) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ id: user._id.toString(), email: user.email });
    const res = Response.json({ ok: true }, { status: 200 });
    res.headers.set('Set-Cookie', makeAuthCookie(token));
    return res;
  } catch (e) {
    console.error('[login]', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
