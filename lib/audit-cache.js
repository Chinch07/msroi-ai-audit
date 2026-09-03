import crypto from 'crypto';
import { list, put, del } from '@vercel/blob';

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

// Length of the hex audit id used in /audit/<id> preview links. 16 hex chars
// = 64 bits of an HMAC — short enough to paste into Slack, wide enough that
// guessing one is hopeless even if the route were ever un-gated.
const AUDIT_ID_LENGTH = 16;
const AUDIT_ID_RE = new RegExp(`^[0-9a-f]{${AUDIT_ID_LENGTH}}$`);

const CACHE_PREFIX = 'audits/';

export function urlToCacheKey(url) {
  return CACHE_PREFIX + url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9.-]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/\/$/, '') + '.json';
}

// Deliberately the same AUTH_SECRET that signs sessions in lib/auth.js —
// one secret to configure and rotate, not two. The 'audit-id:' prefix is
// domain separation: it keeps this HMAC from ever colliding with the token
// signatures in lib/auth.js, which HMAC a different (unprefixed) input with
// the same key.
//
// Consequence of sharing the secret: rotating AUTH_SECRET changes every
// audit id, so previously-shared preview links stop resolving. The audits
// themselves are untouched (they're still keyed by URL) — re-open one from
// the tool to get its new link.
function auditIdSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET is not configured (set a random 32+ character string).');
  }
  return secret;
}

// The id is derived from the cache key rather than stored, which is what
// makes the reverse lookup in getAuditById possible without a second index
// blob to keep in sync: every audit's id is recomputable from its pathname.
export function auditIdForKey(cacheKey) {
  return crypto
    .createHmac('sha256', auditIdSecret())
    .update(`audit-id:${cacheKey}`)
    .digest('hex')
    .slice(0, AUDIT_ID_LENGTH);
}

export function auditIdForUrl(url) {
  return auditIdForKey(urlToCacheKey(url));
}

function isFresh(data) {
  if (!data?.cachedAt) return false;
  return Date.now() - new Date(data.cachedAt).getTime() <= CACHE_TTL_MS;
}

export async function getCachedAudit(url) {
  const cacheKey = urlToCacheKey(url);
  try {
    const { blobs } = await list({ prefix: cacheKey });
    if (!blobs.length) return null;
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    if (!isFresh(data)) {
      await del(blobs[0].url).catch(() => {});
      return null;
    }
    // Recomputed rather than read off the record, so audits cached before
    // preview links existed still get a working id.
    return { ...data, auditId: auditIdForKey(cacheKey) };
  } catch (e) {
    console.warn('Cache read failed:', e.message);
    return null;
  }
}

// Resolves a preview-link id back to its cached audit, or null if there is
// no such audit (bad/rotated id) or it has aged out.
//
// Implemented as a scan over the cache prefix — recomputing each blob's id
// from its own pathname — instead of an id-to-URL index blob. One list()
// call per preview load, no second write on the audit path, and nothing
// that can fall out of sync. With a one-week TTL and one entry per audited
// domain the prefix stays small; if it ever grows past a few thousand
// entries, that's the point to add a real `audit-ids/<id>.json` pointer.
export async function getAuditById(auditId) {
  if (typeof auditId !== 'string' || !AUDIT_ID_RE.test(auditId)) return null;
  try {
    let cursor;
    do {
      const page = await list({ prefix: CACHE_PREFIX, cursor });
      for (const blob of page.blobs) {
        if (auditIdForKey(blob.pathname) !== auditId) continue;
        const data = await (await fetch(blob.url)).json();
        if (!isFresh(data)) {
          await del(blob.url).catch(() => {});
          return null;
        }
        return { ...data, auditId };
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return null;
  } catch (e) {
    console.warn('Audit lookup by id failed:', e.message);
    return null;
  }
}

// Returns the audit's id on success, or null if the write failed — callers
// use it to build the /audit/<id> preview link. A cache-write failure is
// still non-fatal (the caller already has the report in hand); it just
// means there's no shareable link for this run.
export async function setCachedAudit(url, auditData) {
  const cacheKey = urlToCacheKey(url);
  try {
    const payload = { ...auditData, url, cachedAt: new Date().toISOString() };
    await put(cacheKey, JSON.stringify(payload), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return auditIdForKey(cacheKey);
  } catch (e) {
    console.warn('Cache write failed:', e.message);
    return null;
  }
}
