import { getCachedAudit } from '../../lib/audit-cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ hit: false });
  try {
    const { url } = req.body;
    if (!url) return res.status(200).json({ hit: false });
    const data = await getCachedAudit(url);
    if (!data) return res.status(200).json({ hit: false });
    // auditId is hoisted out of the record as well so the internal tool can
    // build the /audit/<id> preview link without reaching into `result`.
    return res.status(200).json({ hit: true, result: data, auditId: data.auditId });
  } catch (e) {
    return res.status(200).json({ hit: false });
  }
}
