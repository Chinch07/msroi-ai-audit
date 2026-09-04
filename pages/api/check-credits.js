import { spendCredit } from '../../lib/credits';
import { createCreditToken, MAX_CREDIT_CALLS } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ allowed: false });
  try {
    const { email, url } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ allowed: false, error: 'Valid email is required.' });
    }
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ allowed: false, error: 'A website URL is required.' });
    }
    const result = await spendCredit(email);
    if (!result.allowed) return res.status(200).json(result);
    // Hand back a short-lived signed token that authorizes exactly this
    // credit's audit run at /api/audit, bound to this URL so a captured
    // token can't be redirected to audit a different site. Without it, the
    // audit endpoint can't be driven by the public flow, so the 3-credit
    // limit is enforced server-side rather than only in the browser.
    const auditToken = createCreditToken(email, result.slot, url);
    // maxAuditCalls tells the client how many /api/audit calls this token is
    // good for, so the client's tool-use loop cap is read from the server's
    // actual enforced limit (lib/auth.js's MAX_CREDIT_CALLS) instead of
    // duplicating that number and risking the two drifting out of sync.
    return res.status(200).json({ ...result, auditToken, maxAuditCalls: MAX_CREDIT_CALLS });
  } catch (e) {
    return res.status(500).json({ allowed: false, error: e.message });
  }
}
