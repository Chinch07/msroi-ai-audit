import { verifyMagicToken, previewMagicToken, createSessionToken, sessionCookieHeader, safeNextPath } from '../../../lib/auth';

// isEmailAllowed's format check permits HTML metacharacters in the address
// local-part (it only anchors on having an '@' and a '.'), and the token
// payload carries whatever email request-link.js signed into it verbatim.
// confirmPage below is the only place in this codebase that interpolates
// that value into HTML, so it's escaped here rather than trusted as already-safe.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function errorPage(message) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in link problem</title></head>
  <body style="font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
    <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <h2 style="color:#007513;margin:0 0 8px;font-size:20px;">Link expired or invalid</h2>
      <p style="color:#666;font-size:14px;line-height:1.5;margin:0 0 24px;">${message}</p>
      <a href="/login" style="background:#007513;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Request a new link</a>
    </div>
  </body></html>`;
}

// Deliberately requires a real user click (form submit) rather than
// consuming the token on page load. Corporate mail security (Microsoft
// Defender for Office 365 Safe Links and similar) fetches links in incoming
// mail to scan them before the user opens the message — that scan is a bare
// GET/HEAD with no JS execution and no button click. Landing here doesn't
// touch the single-use claim, so a scanner visiting first can't burn the
// link out from under the real user; only the POST below does that.
function confirmPage(token, email, nextPath) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm sign-in</title></head>
  <body style="font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
    <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <h2 style="color:#007513;margin:0 0 8px;font-size:20px;">AI Visibility Audit</h2>
      <p style="color:#666;font-size:14px;line-height:1.5;margin:0 0 24px;">Signing in as <strong>${escapeHtml(email)}</strong>. Click below to finish.</p>
      <form method="POST" action="/api/auth/verify?token=${encodeURIComponent(token)}${nextPath ? '&amp;next=' + encodeURIComponent(nextPath) : ''}">
        <button type="submit" style="background:#007513;color:#fff;border:none;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;cursor:pointer;">Sign in →</button>
      </form>
    </div>
  </body></html>`;
}

export default async function handler(req, res) {
  const raw = req.query.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  // Where to send the user once signed in. Re-validated on both the GET and
  // the POST rather than trusted from the query string, since it rode here
  // through an email link — see safeNextPath in lib/auth.js.
  const nextPath = safeNextPath(req.query.next);

  if (req.method === 'GET') {
    const preview = previewMagicToken(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!preview) {
      return res
        .status(401)
        .send(errorPage('This sign-in link is invalid or has expired. Sign-in links are valid for 15 minutes.'));
    }
    return res.status(200).send(confirmPage(token, preview.email, nextPath));
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const result = await verifyMagicToken(token);
  if (!result) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(401)
      .send(errorPage('This sign-in link is invalid or has expired. Sign-in links are valid for 15 minutes.'));
  }

  // The role was fixed when the link was minted, so a member's link can
  // never be exchanged for an internal session even if the allowlists
  // change between the email being sent and the link being clicked.
  const session = createSessionToken(result.email, result.role);
  res.setHeader('Set-Cookie', sessionCookieHeader(session, req));
  res.writeHead(302, { Location: nextPath || '/' });
  res.end();
}
