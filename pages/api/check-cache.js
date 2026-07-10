import { list } from '@vercel/blob';

const CACHE_TTL_MS = 78 * 60 * 60 * 1000;

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
  if (req.method !== 'POST') return res.status(405).json({ hit: false });
  try {
    const { url } = req.body;
    if (!url) return res.status(200).json({ hit: false });
    const cacheKey = urlToCacheKey(url);
    const { blobs } = await list({ prefix: cacheKey });
    if (!blobs.length) return res.status(200).json({ hit: false });
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    const age = Date.now() - new Date(data.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return res.status(200).json({ hit: false });
    return res.status(200).json({ hit: true, result: data });
  } catch (e) {
    return res.status(200).json({ hit: false });
  }
}
