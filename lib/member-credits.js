// Monthly audit quota for signed-in members (paying clients), as distinct
// from lib/credits.js's 3-lifetime-audit quota for anonymous /free-audit
// visitors. Same atomic-claim mechanism, different pool and different reset
// behavior.
//
// The reset is structural, not scheduled: the YYYY-MM bucket is part of the
// blob pathname, so on the 1st every member is simply writing to a fresh
// namespace. There is no cron job to fail, no counter to reset, and no way
// for a missed job to silently leave someone locked out.
//
// Buckets are UTC. A member in a western timezone therefore rolls over
// slightly before their local month does. Accepted tradeoff: the
// alternative is storing a timezone per member to administer a quota that
// only resets monthly.

import { put, list, del, BlobError } from '@vercel/blob';

// Overridable per-deployment without a code change. Parsed defensively —
// a typo'd env var must not silently become 0 audits (locking every member
// out) or NaN (which would make every comparison false and grant unlimited).
export function monthlyLimit() {
  const raw = parseInt(process.env.MEMBER_MONTHLY_LIMIT ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}

function userSlug(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '-');
}

// UTC year-month, e.g. "2026-09". Zero-padded so string sort matches
// chronological order if these are ever listed.
export function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function periodPrefix(email, period) {
  return `member-credits/${userSlug(email)}/${period}/`;
}

function claimKey(email, period, slot) {
  return `${periodPrefix(email, period)}claim-${slot}.json`;
}

// put() throws (allowOverwrite defaults to false) when a pathname already
// exists, surfaced by the SDK as a plain BlobError. Other failure modes
// (auth, rate limit, store down) throw their own subclasses — so a bare
// BlobError reliably means "this slot is already claimed," and anything
// else propagates rather than being mistaken for a taken slot.
function isAlreadyClaimed(e) {
  return e?.constructor === BlobError;
}

// Reserves one of this member's audits for the current month by claiming
// the first free numbered slot. Because put() can only ever succeed once
// per pathname, concurrent requests racing for the same slot have exactly
// one winner — the limit holds under parallel audits, which a
// read-count-then-write counter would not.
export async function spendMemberCredit(email) {
  const period = currentPeriod();
  const limit = monthlyLimit();
  for (let slot = 1; slot <= limit; slot++) {
    try {
      await put(
        claimKey(email, period, slot),
        JSON.stringify({ email: email.trim().toLowerCase(), period, claimedAt: new Date().toISOString() }),
        { access: 'public', contentType: 'application/json', addRandomSuffix: false }
      );
      return { allowed: true, used: slot, remaining: limit - slot, limit, period, slot };
    } catch (e) {
      if (!isAlreadyClaimed(e)) throw e;
      // Slot taken — try the next one.
    }
  }
  return { allowed: false, used: limit, remaining: 0, limit, period };
}

// Read-only usage for display ("7 of 10 audits used this month"). Never
// gates anything on its own — spendMemberCredit is the authority, since a
// count read here could be stale by the time it's acted on.
export async function getMemberUsage(email) {
  const period = currentPeriod();
  const limit = monthlyLimit();
  try {
    const { blobs } = await list({ prefix: periodPrefix(email, period) });
    const used = Math.min(blobs.length, limit);
    return { used, remaining: Math.max(0, limit - used), limit, period };
  } catch (e) {
    console.warn('Member usage lookup failed:', e.message);
    // Display-only: report the quota as full rather than as exhausted, so a
    // transient storage blip doesn't tell a paying client they're locked
    // out. The actual gate (spendMemberCredit) still fails closed.
    return { used: 0, remaining: limit, limit, period };
  }
}

// Releases a reserved slot when the audit it paid for failed. Scoped to the
// current period: a refund is only ever attempted against the month the
// credit was spent in, so a run that fails across a month boundary at
// midnight UTC leaves the old month's slot spent rather than deleting an
// unrelated slot in the new one. Rare, and the failure mode is "member
// loses one audit" rather than "member silently gets an extra."
export async function refundMemberCredit(email, slot) {
  if (!slot) return;
  await del(claimKey(email, currentPeriod(), slot)).catch(() => {});
}
