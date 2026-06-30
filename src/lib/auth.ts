import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
export const TOKEN_NAME = 'arcade_token';

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash?: string) {
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${TOKEN_NAME}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;
  await dbConnect();
  const user = await User.findById(payload.id).lean();
  return user;
}

export function makeAuthCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function makeClearCookie() {
  return `${TOKEN_NAME}=deleted; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
