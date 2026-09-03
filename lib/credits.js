import { put, del, BlobError } from '@vercel/blob';

export const STARTING_CREDITS = 3;

function userSlug(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '-');
}

function claimKey(email, slot) {
  return `users/${userSlug(email)}/claim-${slot}.json`;
}

// put() throws (allowOverwrite defaults to false) when a pathname already
// exists, which the SDK surfaces as a plain BlobError. Other failure modes
// (auth, rate limit, store down, etc.) throw their own specific subclasses,
// so a bare BlobError here reliably means "this slot is already claimed."
function isAlreadyClaimed(e) {
  return e?.constructor === BlobError;
}

// Atomically reserves one of a user's 3 lifetime credits by claiming the
// first free numbered slot (claim-1, claim-2, claim-3). Because put() can
// only ever succeed once per pathname, concurrent requests racing for the
// same slot have exactly one winner — this is what makes the limit
// race-safe under concurrent audits, unlike a read-then-write counter.
export async function spendCredit(email) {
  for (let slot = 1; slot <= STARTING_CREDITS; slot++) {
    try {
      await put(claimKey(email, slot), JSON.stringify({
        email: email.trim().toLowerCase(),
        claimedAt: new Date().toISOString(),
      }), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });
      return { allowed: true, credits: STARTING_CREDITS - slot, slot };
    } catch (e) {
      if (!isAlreadyClaimed(e)) throw e;
      // Slot already taken — try the next one.
    }
  }
  return { allowed: false, credits: 0 };
}

// Releases a reserved slot, e.g. when the scrape it paid for failed.
export async function refundCredit(email, slot) {
  if (!slot) return;
  await del(claimKey(email, slot)).catch(() => {});
}
