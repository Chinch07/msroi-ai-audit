import { Resend } from 'resend';
import { createMagicToken, isEmailAllowed, allowLinkRequest, baseUrl, safeNextPath } from '../../../lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM || 'AI Audit <onboarding@resend.dev>';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, next } = req.body || {};

  // Respond identically whether or not the email is allowed, so this endpoint
  // can't be used to enumerate who has access. The link is only ever emailed
  // to an allowlisted address.
  if (!isEmailAllowed(email)) return res.status(200).json({ ok: true });

  try {
    const address = email.trim().toLowerCase();

    // Throttle before doing any signing/sending work, so the endpoint can't
    // be looped to mail-bomb an address or burn Resend quota. Same 200
    // response either way — a rate-limited request isn't distinguishable
    // from a normal one, it just doesn't trigger a new send.
    if (!(await allowLinkRequest(address))) return res.status(200).json({ ok: true });

    const token = createMagicToken(address);
    // Where to land after sign-in — set when the user arrived from a gated
    // page such as an /audit/<id> preview link. Validated here (and again in
    // verify.js before the redirect actually happens) so the emailed link
    // can only ever point back into this app.
    const nextPath = safeNextPath(next);
    const link =
      `${baseUrl(req)}/api/auth/verify?token=${encodeURIComponent(token)}` +
      (nextPath ? `&next=${encodeURIComponent(nextPath)}` : '');

    await resend.emails.send({
      from: MAIL_FROM,
      to: address,
      subject: 'Your AI Visibility Audit sign-in link',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#cc0000;margin:0 0 8px;">AI Visibility Audit</h2>
        <p style="color:#333;font-size:14px;line-height:1.5;">Click the button below to sign in to the internal audit tool. This link expires in 15 minutes and can only be used from this email.</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#cc0000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Sign in →</a>
        </p>
        <p style="color:#888;font-size:12px;line-height:1.5;">If you didn't request this, you can ignore this email. If the button doesn't work, paste this URL into your browser:<br><span style="color:#666;word-break:break-all;">${link}</span></p>
      </div>`,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('request-link error:', e);
    return res.status(500).json({ error: 'Could not send the sign-in link. Try again shortly.' });
  }
}
