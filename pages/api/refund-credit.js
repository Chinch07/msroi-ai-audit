import { refundCredit } from '../../lib/credits';
import { verifyRefundToken } from '../../lib/auth';

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
    await refundCredit(claim.email, claim.slot);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
