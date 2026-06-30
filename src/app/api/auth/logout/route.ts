import { makeClearCookie } from '@/lib/auth';

export async function POST() {
  const res = Response.json({ ok: true }, { status: 200 });
  res.headers.set('Set-Cookie', makeClearCookie());
  return res;
}
