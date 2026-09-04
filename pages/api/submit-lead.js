import { put } from '@vercel/blob';
import { Resend } from 'resend';
import { AGENCY } from '../../lib/agency';

const resend = new Resend(process.env.RESEND_API_KEY);
const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_TO || AGENCY.contactEmail;
// Shares MAIL_FROM with the magic-link sign-in flow rather than hardcoding a
// separate sandbox sender: 'onboarding@resend.dev' 403s against any recipient
// except the Resend account owner once the account is off the sandbox default.
const MAIL_FROM = process.env.MAIL_FROM || 'AI Audit <onboarding@resend.dev>';
const BRAND_GREEN = '#007513';

// Lead fields are attacker-supplied and land in an HTML email, so they're
// escaped rather than interpolated raw — an unescaped `website` value is a
// script/markup injection straight into a colleague's inbox.
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, phone, website } = req.body || {};
    if (!name || !email || !website) {
      return res.status(400).json({ error: 'Name, email and website are required.' });
    }

    const lead = { name, email, phone, website, submittedAt: new Date().toISOString() };
    const key = 'leads/' + String(email).replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + Date.now() + '.json';
    await put(key, JSON.stringify(lead), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    const row = (label, value, shaded) =>
      `<tr><td style="padding:10px;${shaded ? 'background:#f7f9f7;' : ''}font-weight:bold;width:120px;">${label}</td>` +
      `<td style="padding:10px;${shaded ? 'background:#f7f9f7;' : ''}">${value}</td></tr>`;

    await resend.emails.send({
      from: MAIL_FROM,
      to: LEAD_NOTIFY_TO,
      subject: `New AI Audit Lead: ${name} (${website})`,
      html:
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">` +
        `<h2 style="color:${BRAND_GREEN};margin:0 0 20px;">New ${esc(AGENCY.toolName)} Lead</h2>` +
        `<table style="width:100%;border-collapse:collapse;">` +
        row('Name', esc(name), true) +
        row('Email', `<a href="mailto:${esc(email)}" style="color:${BRAND_GREEN};">${esc(email)}</a>`, false) +
        row('Phone', esc(phone) || 'Not provided', true) +
        row('Website', `<a href="${esc(website)}" style="color:${BRAND_GREEN};">${esc(website)}</a>`, false) +
        `</table>` +
        `<p style="margin-top:16px;color:#333;font-size:14px;">Open the full report in the internal tool by entering their website URL.</p>` +
        `</div>`,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Submit lead error:', e);
    return res.status(500).json({ error: e.message });
  }
}
