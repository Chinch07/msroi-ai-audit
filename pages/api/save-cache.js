import { put } from '@vercel/blob';

function urlToCacheKey(url) {
  return 'audits/' + url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9.-]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/\/$/, '') + '.json';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { url, result } = req.body;
    if (!url || !result) return res.status(400).json({ ok: false });
    const payload = { ...result, cachedAt: new Date().toISOString() };
    await put(urlToCacheKey(url), JSON.stringify(payload), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
