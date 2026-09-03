import { getCachedAudit, setCachedAudit } from '../../lib/audit-cache';
import { getSession, verifyCreditToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, url, auditToken } = req.body || {};

  // Authorize before doing any paid work. Internal users are gated by their
  // session cookie (unlimited); the public /free-audit flow must present a
  // credit token minted by /api/check-credits, which only issues one after a
  // real credit is spent, bound to this exact url, and consumable for only
  // a bounded number of calls. A direct POST with neither is rejected, so
  // the 3-credit limit can't be bypassed by calling this endpoint straight.
  if (!getSession(req)) {
    const credit = await verifyCreditToken(auditToken, url);
    if (!credit) {
      return res.status(401).json({ error: 'A valid session or audit credit is required.' });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });

  // Check cache on first call of a new audit
  if (url && messages?.length === 1) {
    const cached = await getCachedAudit(url);
    if (cached) {
      console.log('Cache HIT:', url);
      // auditId is hoisted alongside the record so the client can build the
      // /audit/<id> preview link from either cache path.
      return res.status(200).json({ __cached: true, result: cached, auditId: cached.auditId });
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
          await setCachedAudit(url, parsed);
          console.log('Cached:', url);
        } catch (e) { console.warn('Cache save failed:', e.message); }
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
