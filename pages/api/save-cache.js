import { setCachedAudit } from '../../lib/audit-cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { url, result } = req.body;
    if (!url || !result) return res.status(400).json({ ok: false });
    // Null auditId means the cache write failed — the caller still has its
    // report, it just has no shareable preview link for this run.
    const auditId = await setCachedAudit(url, result);
    return res.status(200).json({ ok: Boolean(auditId), auditId });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
