import { refundCredit } from '../../lib/credits';
import { refundMemberCredit } from '../../lib/member-credits';
import { verifyRefundToken, getSession, ROLE } from '../../lib/auth';

// Refunds the one credit a failed /free-audit run reserved. Previously took
// a raw { email, slot } body and trusted it outright, which meant anyone
// could reset anyone else's credit count with zero authentication —
// defeating the whole point of the 3-credit limit. Now requires the actual
// signed auditToken issued by /api/check-credits for that reservation;
// email/slot are read from the verified token, never from the request body,
// and the token can only be used for a refund once.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: false });
  try {
    const { auditToken } = req.body || {};
    const claim = await verifyRefundToken(auditToken);
    if (!claim) return res.status(200).json({ ok: false });

    // Which pool the credit came from isn't in the token, so the caller's
    // session decides. A member's failed run must refund the monthly pool —
    // routing it to the anonymous lifetime pool instead would delete a
    // pathname that doesn't exist and silently cost them one of their ten.
    // The email still comes from the verified token, never the session, so
    // this can't be used to refund an address you aren't.
    const session = getSession(req);
    if (session?.role === ROLE.MEMBER) {
      await refundMemberCredit(claim.email, claim.slot);
    } else {
      await refundCredit(claim.email, claim.slot);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
