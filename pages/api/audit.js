import { getCachedAudit, setCachedAudit } from '../../lib/audit-cache';
import { getSession, verifyCreditToken, ROLE } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, url, auditToken } = req.body || {};

  // Authorize before doing any paid work.
  //
  // Three tiers, and only ONE of them is unlimited:
  //   internal — session cookie alone is sufficient.
  //   member   — signed in, but still must present a credit token from
  //              /api/member-credit. The session proves who they are; the
  //              token proves they had quota left. Accepting the session on
  //              its own here would make the monthly cap a browser-side
  //              suggestion that devtools could skip straight past.
  //   public   — no session; must present a credit token from
  //              /api/check-credits (the 3-lifetime-audit pool).
  //
  // Both token paths are bound to this exact url and consumable for only a
  // bounded number of calls, so a captured token can't be redirected at
  // another site or replayed indefinitely.
  const session = getSession(req);
  if (!session || session.role === ROLE.MEMBER) {
    const credit = await verifyCreditToken(auditToken, url);
    if (!credit) {
      return res.status(401).json({ error: 'A valid session or audit credit is required.' });
    }
    // A member's token must belong to that member. Without this, one member
    // could drive their whole run on another member's freshly-issued token
    // and drain someone else's monthly quota.
    if (session && credit.email !== session.email) {
      return res.status(403).json({ error: 'This audit credit belongs to a different account.' });
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
