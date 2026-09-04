import Head from "next/head";
import { BRAND } from "../../lib/brand";
import Kicker from "../../components/Kicker";
import Card from "../../components/Card";
import AppHeader from "../../components/AppHeader";
import AppFooter from "../../components/AppFooter";
import AuditReport from "../../components/AuditReport";
import PreviewLink from "../../components/PreviewLink";
import { CtaButton, GhostButton } from "../../components/Button";
import { AGENCY } from "../../lib/agency";

/**
 * Stable preview link for a cached audit: /audit/<auditId>, where auditId is
 * the HMAC-derived id of the cache record (see lib/audit-cache.js). Same
 * URL every time that site is audited, so the link can be pasted into a
 * ticket or an email and keep working for the life of the cache entry.
 *
 * Gated exactly like the internal tool at /: no session cookie, no report —
 * the audit id is a lookup key, never an authorization token. Anonymous
 * visitors are bounced to /login with `next` set to this page, so signing
 * in lands them back here instead of at the tool's empty input.
 */
export default function AuditPreview({ userEmail, auditId, result, cachedAtLabel, url }) {
  const notFound = !result;

  return (
    <>
      <Head>
        <title>
          {notFound ? "Audit not found" : `${result.business_name} — AI Visibility Audit`} | {AGENCY.name}
        </title>
        {/* A cached report is internal-only and never a search result. */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ minHeight: "100vh", background: BRAND.base, color: BRAND.body, fontFamily: BRAND.fontText }}>
        <AppHeader
          right={
            <>
              {userEmail && (
                <span title="Signed in" style={{ color: BRAND.muted, fontSize: 13 }}>{userEmail}</span>
              )}
              <GhostButton href="/api/auth/logout" style={{ padding: "8px 16px", fontSize: 13 }}>Sign out</GhostButton>
            </>
          }
        />

        <div style={{ background: BRAND.groundDark, padding: `clamp(2rem, 5vw, 3.5rem) ${BRAND.sectionPaddingInline}` }}>
          <Kicker onDark>Saved Audit</Kicker>
          <h1 style={{ fontFamily: BRAND.fontDisplay, color: BRAND.inkOnDark,
            fontSize: BRAND.textH1Fluid, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.06,
            marginTop: 18, marginBottom: 14, maxWidth: "20ch" }}>
            AI Visibility Audit
          </h1>
          {url && (
            <p style={{ color: BRAND.inkOnDark2, fontSize: BRAND.textBodyLg, maxWidth: 600, wordBreak: "break-all" }}>
              {url}
            </p>
          )}
        </div>

        <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 40px" }}>
          {notFound ? (
            <Card style={{ padding: 28 }}>
              <h2 style={{ fontFamily: BRAND.fontDisplay, fontSize: 22, fontWeight: 600,
                color: BRAND.ink, marginBottom: 8 }}>
                This audit is no longer available
              </h2>
              <p style={{ color: BRAND.body, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Saved audits are kept for one week. This link has either expired or was never
                valid — run the audit again to get a fresh report and a new link.
              </p>
              <CtaButton href="/">Back to the audit tool</CtaButton>
            </Card>
          ) : (
            <>
              <PreviewLink auditId={auditId} />
              <AuditReport
                result={result}
                meta={
                  cachedAtLabel ? (
                    <p style={{ color: BRAND.muted, fontSize: 12, marginTop: 6 }}>
                      Saved audit — generated {cachedAtLabel}
                    </p>
                  ) : null
                }
              />
              <div className="no-print" style={{ marginTop: 28 }}>
                <GhostButton href="/" style={{ padding: "10px 20px", fontSize: 13 }}>
                  Run a new audit
                </GhostButton>
              </div>
            </>
          )}
        </div>

        <AppFooter />
      </div>
    </>
  );
}

// Formatted server-side and passed down as a finished string: rendering a
// date on the client would format it in the visitor's locale and mismatch
// the server's HTML on hydration.
function formatCachedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

export async function getServerSideProps({ req, params }) {
  const { getSession } = await import("../../lib/auth");
  const id = String(params.id || "");

  const session = getSession(req);
  if (!session) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(`/audit/${id}`)}`,
        permanent: false,
      },
    };
  }

  const { getAuditById } = await import("../../lib/audit-cache");
  const record = await getAuditById(id);

  // A missing/expired audit renders an explanatory page rather than a 404 —
  // the visitor is a signed-in colleague following a shared link, and
  // "kept for one week, run it again" is the answer they need.
  if (!record) {
    return { props: { userEmail: session.email, auditId: id, result: null, cachedAtLabel: null, url: null } };
  }

  // cachedAt/url/auditId are cache bookkeeping, not part of the report —
  // split them out so `result` is exactly what the audit itself produced.
  const { cachedAt, url = null, auditId, ...result } = record;
  return {
    props: {
      userEmail: session.email,
      auditId,
      result,
      cachedAtLabel: formatCachedAt(cachedAt),
      url,
    },
  };
}
