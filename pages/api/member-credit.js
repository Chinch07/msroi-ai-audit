import { spendMemberCredit, getMemberUsage } from '../../lib/member-credits';
import { requireSession, createCreditToken, MAX_CREDIT_CALLS, ROLE } from '../../lib/auth';

// Member equivalent of /api/check-credits: spends one of the signed-in
// member's monthly audits and hands back a token authorizing exactly that
// run at /api/audit.
//
// Identity comes from the session cookie, never from the request body — a
// member cannot spend (or inspect) another member's quota by naming them.
export default async function handler(req, res) {
  const session = requireSession(req, res, { role: ROLE.MEMBER });
  if (!session) return;

  // GET is the read-only "how many do I have left" call the tool makes on
  // page load. It must not spend anything.
  if (req.method === 'GET') {
    return res.status(200).json(await getMemberUsage(session.email));
  }

  if (req.method !== 'POST') return res.status(405).json({ allowed: false });

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ allowed: false, error: 'A website URL is required.' });
    }

    const result = await spendMemberCredit(session.email);
    if (!result.allowed) return res.status(200).json(result);

    // Bound to this URL and to MAX_CREDIT_CALLS calls, same as the public
    // flow's token — see lib/auth.js.
    const auditToken = createCreditToken(session.email, result.slot, url);
    return res.status(200).json({ ...result, auditToken, maxAuditCalls: MAX_CREDIT_CALLS });
  } catch (e) {
    console.error('member-credit error:', e);
    return res.status(500).json({ allowed: false, error: 'Could not reserve an audit. Try again shortly.' });
  }
}
