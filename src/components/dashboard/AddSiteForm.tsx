"use client";
import { useState } from 'react';

export default function AddSiteForm({ onAdded }: { onAdded?: (site:any)=>void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    });
    if (res.ok) {
      const data = await res.json();
      setName(''); setUrl('');
      onAdded && onAdded(data.site);
    } else {
      const d = await res.json();
      setError(d.error || 'Failed');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="text-red-500">{error}</div>}
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Site name" className="w-full p-2 border rounded" />
      <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://example.com" className="w-full p-2 border rounded" />
      <button className="px-3 py-2 bg-indigo-600 text-white rounded">Add site</button>
    </form>
  );
}
