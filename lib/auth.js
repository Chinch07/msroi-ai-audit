// Server-only magic-link auth for the internal audit tool.
//
// No database: sessions and sign-in links are stateless, HMAC-signed tokens.
// The internal page and internal-only API routes verify the session cookie
// server-side (getServerSideProps / requireSession). The public /free-audit
// route and its endpoints do NOT use any of this — they stay open and are
// limited by the credit system in lib/credits.js.
//
// Magic-link and credit tokens are additionally single-use, enforced via a
// Vercel Blob atomic claim (put() with the default allowOverwrite:false —
// same pattern as lib/credits.js's spendCredit), since a purely stateless
// signed token can otherwise be replayed for its whole TTL.

import crypto from 'crypto';
import { put, BlobError } from '@vercel/blob';

const SESSION_COOKIE = 'aimg_session';
const MAGIC_TTL_SECONDS = 15 * 60; // sign-in links expire fast
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day session
const CREDIT_TTL_SECONDS = 15 * 60; // long enough for the agentic audit loop
const PURPOSE_MAGIC = 'm';
const PURPOSE_SESSION = 's';
const PURPOSE_CREDIT = 'c';

// A credit token authorizes one whole audit run against one URL, which the
// client drives as up to this many sequential /api/audit calls. This is the
// single source of truth for that cap — /api/check-credits hands it back to
// the client (see MAX_CREDIT_CALLS export below) so free-audit.jsx's loop
// reads it instead of hardcoding its own matching number that could drift
// out of sync. Bounding replay to this many calls total (rather than
// leaving it unbounded) turns "unlimited free Claude calls from one spent
// credit" into "at most one run's worth."
export const MAX_CREDIT_CALLS = 8;
const LINK_COOLDOWN_MS = 60 * 1000; // at most one sign-in email per address per minute

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function randomId() {
  return crypto.randomBytes(16).toString('hex');
}

// AUTH_SECRET must be a long random string set only on the server. Missing or
// weak values fail loudly rather than silently issuing forgeable tokens.
function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET is not configured (set a random 32+ character string).');
  }
  return secret;
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(body) {
  return b64url(crypto.createHmac('sha256', getSecret()).update(body).digest());
}

function createToken(email, purpose, ttlSeconds, extra = {}) {
  const payload = { e: email.trim().toLowerCase(), p: purpose, exp: nowSec() + ttlSeconds, j: randomId(), ...extra };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

// Verifies signature (constant-time), purpose, and expiry. Returns
// { email, jti, slot, url } on success or null on any failure — never throws
// for a bad token. Does NOT check single-use consumption; callers that need
// that (verifyMagicToken, verifyCreditToken) layer it on top.
function verifyToken(token, expectedPurpose) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected;
  try {
    expected = sign(body);
  } catch {
    return null; // AUTH_SECRET missing — treat as unauthenticated
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || payload.p !== expectedPurpose) return null;
  if (typeof payload.exp !== 'number' || payload.exp < nowSec()) return null;
  if (typeof payload.e !== 'string' || !payload.e) return null;
  return { email: payload.e, slot: payload.s, jti: payload.j, url: payload.u };
}

// put() throws (allowOverwrite defaults to false) when a pathname already
// exists, which the SDK surfaces as a plain BlobError. Other failure modes
// (auth, rate limit, store down, etc.) throw their own specific subclasses —
// those are NOT "already claimed," so re-throwing/rejecting on them fails
// closed instead of silently allowing a replay.
function isAlreadyClaimed(e) {
  return e?.constructor === BlobError;
}

// Outcomes for claimOnce(). A shared const object (rather than bare string
// literals at every call site) means a typo'd comparison is a ReferenceError
// instead of a silently-wrong always-false check.
const CLAIM = { CLAIMED: 'claimed', TAKEN: 'taken', ERROR: 'error' };

// Shared one-time-claim primitive: every single-use/rate-limit check in this
// file (magic link, credit-call slots, link-request cooldown, credit refund)
// is "has this key been claimed before," backed by the same atomic
// put()-with-allowOverwrite:false pattern lib/credits.js's spendCredit uses.
// Returns CLAIM.CLAIMED (first time), CLAIM.TAKEN (already claimed), or
// CLAIM.ERROR (any other storage failure — logged here, once, so every
// caller fails closed without needing to duplicate the try/catch/logging).
async function claimOnce(key) {
  try {
    await put(`auth-claims/${key}.json`, JSON.stringify({ claimedAt: new Date().toISOString() }), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return CLAIM.CLAIMED;
  } catch (e) {
    if (isAlreadyClaimed(e)) return CLAIM.TAKEN;
    console.error(`claimOnce(${key}) storage error:`, e);
    return CLAIM.ERROR;
  }
}

// One-time claim for a magic sign-in link: the same 15-minute link can only
// ever be exchanged for a session once.
async function claimMagicLink(jti) {
  if (!jti) return false;
  return (await claimOnce(`magic/${jti}`)) === CLAIM.CLAIMED;
}

// Atomically reserves the Nth call slot for this credit token's jti. Bounds
// a single credit token to MAX_CREDIT_CALLS total /api/audit calls — enough
// for one legitimate multi-turn audit run, not enough to be free unlimited
// usage.
async function claimCreditCall(jti) {
  if (!jti) return false;
  for (let n = 1; n <= MAX_CREDIT_CALLS; n++) {
    const outcome = await claimOnce(`credit/${jti}-${n}`);
    if (outcome === CLAIM.CLAIMED) return true;
    if (outcome === CLAIM.ERROR) return false; // storage error — fail closed, don't try more slots
    // CLAIM.TAKEN — this slot's used, try the next one
  }
  return false; // all MAX_CREDIT_CALLS slots already used for this token
}

// One-time claim for refunding a credit token: closes the hole where a raw
// {email, slot} refund request was trusted at face value, letting anyone
// reset ANY email's credits with zero authentication. What this guarantees:
// a refund can only name the (email, slot) actually encoded in a validly
// signed token, and a given token's jti can only be used to refund once.
// What it does NOT guarantee: it doesn't stop someone with a legitimate
// token for their OWN address from calling this endpoint directly without
// ever running a real (failed) audit — check-credits mints a fresh jti per
// spend, so spend-then-immediately-refund-then-spend-again is still
// possible for a user abusing their own API access, not just via the
// browser's error-path flow. Closing that would require /api/audit to
// record failure state server-side and this to check it. Separate claim
// namespace from claimCreditCall, so refunding doesn't interact with the
// audit-call bound.
async function claimRefund(jti) {
  if (!jti) return false;
  return (await claimOnce(`refund/${jti}`)) === CLAIM.CLAIMED;
}

export function createMagicToken(email) {
  return createToken(email, PURPOSE_MAGIC, MAGIC_TTL_SECONDS);
}

export function createSessionToken(email) {
  return createToken(email, PURPOSE_SESSION, SESSION_TTL_SECONDS);
}

// Verifies a magic link AND atomically consumes it. Returns null if the
// signature/purpose/expiry checks fail, OR if this link was already used —
// from the caller's perspective both look like "invalid or expired link."
export async function verifyMagicToken(token) {
  const result = verifyToken(token, PURPOSE_MAGIC);
  if (!result) return null;
  const claimed = await claimMagicLink(result.jti);
  if (!claimed) return null;
  return result;
}

// Checks a magic link's signature, purpose, and expiry WITHOUT consuming it.
// Used to render the "click to finish signing in" confirmation page from a
// bare GET, since a GET (or HEAD) on the emailed link isn't necessarily the
// user — corporate mail security (e.g. Microsoft Defender for Office 365
// Safe Links) routinely pre-fetches/"detonates" links in incoming mail to
// scan them before the user ever opens the message. If the GET itself
// consumed the token via verifyMagicToken(), that scan wins the single-use
// claim and the real user's click always sees "expired." Actual consumption
// only happens in verifyMagicToken(), called from the user's POST.
export function previewMagicToken(token) {
  return verifyToken(token, PURPOSE_MAGIC);
}

export function verifySessionToken(token) {
  return verifyToken(token, PURPOSE_SESSION);
}

// A credit token is proof that check-credits successfully spent one of a
// user's audits. /api/audit requires either a session or one of these, so a
// direct POST that skips the credit spend is rejected. It's bound to the
// specific URL it was issued for (a captured token can't be redirected to
// audit a different site) and consumed across at most MAX_CREDIT_CALLS calls
// (enough for one run's tool-use loop, not enough to be unlimited replay).
export function createCreditToken(email, slot, url) {
  return createToken(email, PURPOSE_CREDIT, CREDIT_TTL_SECONDS, { s: slot, u: (url || '').trim() });
}

// Verifies a credit token, checks it's bound to `url`, and atomically
// consumes one of its call slots. `url` must match exactly what the token
// was created for — this is deliberately strict (no "skip the check if url
// is missing") so the binding can't be bypassed by simply omitting it.
export async function verifyCreditToken(token, url) {
  const result = verifyToken(token, PURPOSE_CREDIT);
  if (!result) return null;
  if (result.url !== (url || '').trim()) return null;
  const claimed = await claimCreditCall(result.jti);
  if (!claimed) return null;
  return result;
}

// Verifies a credit token and atomically consumes a one-time refund claim
// for it, returning { email, slot } to refund — derived entirely from the
// signed token, never from caller-supplied values. /api/refund-credit uses
// this instead of trusting a raw { email, slot } body (which let anyone
// reset anyone's credits with zero authentication), and the one-time claim
// stops the same token being refunded more than once. Doesn't check the url
// binding or touch the claimCreditCall namespace — refunding is independent
// of how many audit calls were made.
export async function verifyRefundToken(token) {
  const result = verifyToken(token, PURPOSE_CREDIT);
  if (!result || !result.slot) return null;
  const claimed = await claimRefund(result.jti);
  if (!claimed) return null;
  return result;
}

// Allowlist entries containing '@' are matched as exact emails; entries
// without are matched as whole domains. Defaults to aimediagroup.com.
// Configure with INTERNAL_ALLOWLIST, e.g. "aimediagroup.com,partnerco.com".
function allowlist() {
  const raw = process.env.INTERNAL_ALLOWLIST || 'aimediagroup.com';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email) {
  if (typeof email !== 'string') return false;
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const domain = e.slice(e.indexOf('@') + 1);
  return allowlist().some((entry) => (entry.includes('@') ? entry === e : entry === domain));
}

// Throttles sign-in link requests to at most one per address per
// LINK_COOLDOWN_MS window, so the endpoint can't be looped to mail-bomb an
// employee's inbox or burn Resend quota. The window is baked into the key
// itself (a fixed time bucket) rather than a read-timestamp-then-write, so
// concurrent requests can't all slip through before the first write lands.
// Tradeoff: this is a fixed window, not a sliding one, so a request right at
// a bucket boundary and another just after it can land ~instantly apart —
// acceptable for a cost/spam guard, not a hard security boundary.
export async function allowLinkRequest(email) {
  const slug = email.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '-');
  const bucket = Math.floor(Date.now() / LINK_COOLDOWN_MS);
  return (await claimOnce(`link-cooldown/${slug}-${bucket}`)) === CLAIM.CLAIMED;
}

// Secure flag is set in production and whenever the request arrives over
// https, but omitted for local http so `next dev` testing works.
function isSecureReq(req) {
  if (process.env.NODE_ENV === 'production') return true;
  const proto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim();
  return proto === 'https';
}

export function sessionCookieHeader(token, req, { clear = false } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${clear ? 0 : SESSION_TTL_SECONDS}`,
  ];
  if (isSecureReq(req)) parts.push('Secure');
  return parts.join('; ');
}

function readSessionCookie(req) {
  const header = req.headers?.cookie || '';
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}

// Returns { email } for a valid session cookie, or null. Use in
// getServerSideProps to gate pages.
export function getSession(req) {
  const token = readSessionCookie(req);
  if (!token) return null;
  return verifySessionToken(token);
}

// API-route guard. Sends 401 and returns null when unauthenticated; returns
// the session otherwise. Usage: `if (!requireSession(req, res)) return;`
export function requireSession(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  return session;
}

// Validates a post-sign-in destination before it's used in a redirect.
// Returns the path, or null if it isn't a plain same-origin path.
//
// A preview link at /audit/<id> bounces an anonymous visitor to
// /login?next=/audit/<id> so signing in lands them back on the report they
// clicked rather than on the tool's empty input. That destination travels
// through the sign-in email as a query param, so it is attacker-influenced
// and must never be redirected to as-is: anything absolute ("https://evil",
// "//evil") or protocol-relative would turn our own sign-in flow into an
// open redirect. Only a single leading slash followed by a non-slash,
// non-backslash character is accepted — no scheme, no host, no
// backslash-based host smuggling that some browsers normalize to "//".
export function safeNextPath(value) {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== 'string' || path.length > 512) return null;
  if (!/^\/[^/\\]/.test(path)) return null;
  return path;
}

// Absolute base URL for building magic links. Prefers APP_BASE_URL. Deployed
// environments (Vercel) MUST set APP_BASE_URL and fail closed if it's
// missing — a magic-link URL can never be derived from request headers
// (Host / X-Forwarded-Host), because those are client-influenced and a
// spoofed value would get emailed to a real user as a "sign in" link
// pointing at attacker infrastructure. Only local development (no untrusted
// proxy hop) is allowed to auto-detect from the request.
export function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');

  if (process.env.VERCEL) {
    throw new Error('APP_BASE_URL must be set in this environment — magic links cannot be derived from request headers.');
  }

  const proto =
    (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim() ||
    (isSecureReq(req) ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
