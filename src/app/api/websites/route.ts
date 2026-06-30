import dbConnect from '@/lib/db';
import Website from '@/lib/models/website';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  await dbConnect();
  const sites = await Website.find({ owner: user._id }).lean();
  return new Response(JSON.stringify({ sites }), { status: 200 });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { name, url } = await req.json();
  if (!name || !url) return new Response(JSON.stringify({ error: 'Missing name or url' }), { status: 400 });

  await dbConnect();
  const site = await Website.create({ owner: user._id, name, url });
  return new Response(JSON.stringify({ site }), { status: 201 });
}
