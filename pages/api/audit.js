import { put, list } from '@vercel/blob';

const CACHE_TTL_MS = 78 * 60 * 60 * 1000; // 78 hours

function urlToCacheKey(url) {
  return 'audits/' + url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9.-]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/\/$/, '') + '.json';
}

async function getCachedAudit(cacheKey) {
  try {
    const { blobs } = await list({ prefix: cacheKey });
    if (!blobs.length) return null;
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    const age = Date.now() - new Date(data.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data;
  } catch (e) {
    console.warn('Cache read failed:', e.message);
    return null;
  }
}

async function setCachedAudit(cacheKey, auditData) {
  try {
    const payload = { ...auditData, cachedAt: new Date().toISOString() };
    await put(cacheKey, JSON.stringify(payload), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
  } catch (e) {
    console.warn('Cache write failed:', e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });

  const { messages, system, url } = req.body;

  // Check cache on first call of a new audit
  if (url && messages?.length === 1) {
    const cacheKey = urlToCacheKey(url);
    const cached = await getCachedAudit(cacheKey);
    if (cached) {
      console.log('Cache HIT:', url);
      return res.status(200).json({ __cached: true, result: cached });
    }
    console.log('Cache MISS:', url);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      }),
    });

    const data = await response.json();

    // Save to cache when Claude finishes
    if (data.stop_reason === 'end_turn' && url) {
      const textBlocks = (data.content || []).filter(b => b.type === 'text');
      const raw = textBlocks.map(b => b.text).join('');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          await setCachedAudit(urlToCacheKey(url), parsed);
          console.log('Cached:', url);
        } catch (e) { console.warn('Cache save failed:', e.message); }
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
