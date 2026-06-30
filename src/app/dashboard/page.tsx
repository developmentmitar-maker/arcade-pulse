import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { TOKEN_NAME } from '@/lib/auth';
import DashboardApp from '@/components/dashboard/DashboardApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Arcade Pulse',
  description: 'Your personal Arcade Pulse monitoring dashboard.',
};

export default async function DashboardPage() {
  // Server-side auth guard (belt-and-suspenders beyond proxy middleware)
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  const userEmail = typeof payload.email === 'string' ? payload.email : undefined;

  return <DashboardApp userEmail={userEmail} />;
}
