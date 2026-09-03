import { useState } from "react";
import Head from "next/head";
import { BRAND, cardStyle } from "../lib/brand";
import { AGENCY } from "../lib/agency";
import Kicker from "../components/Kicker";
import { CtaButton } from "../components/Button";

/**
 * Sign-in for member clients. Mechanically identical to /login — same
 * endpoint, same magic-link flow — but presented as a client portal rather
 * than an internal tool, and the tier the address resolves to is decided
 * server-side by resolveRole(), never by which page it was submitted from.
 *
 * That's the important property: a member submitting on /login, or a staff
 * address submitting here, both still get exactly the access their
 * allowlist entry grants. These two pages are copy, not security.
 */
export default function MembersLogin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function requestLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong.");
    }
  }

  return (
    <>
      <Head>
        <title>Member Sign In | {AGENCY.toolName}</title>
        {/* A client portal door is not a search result. */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: "100vh", background: BRAND.base, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: BRAND.fontText, padding: 16 }}>
        <div style={{ ...cardStyle, padding: 40, width: 420, maxWidth: "100%", textAlign: "center" }}>
          <img src="/logo.png" alt={AGENCY.name} style={{ height: 34, marginBottom: 32, objectFit: "contain" }} />
          <Kicker style={{ justifyContent: "center" }}>Member Access</Kicker>
          <h2 style={{ color: BRAND.ink, fontFamily: BRAND.fontDisplay, fontWeight: 700,
            letterSpacing: "-0.02em", marginTop: 14, marginBottom: 8, fontSize: BRAND.textH3 }}>
            {AGENCY.toolName}
          </h2>

          {status === "sent" ? (
            <div>
              <p style={{ color: BRAND.body, fontSize: 14, lineHeight: 1.6, marginTop: 16 }}>
                If <strong>{email.trim().toLowerCase()}</strong> has member access, a sign-in link
                is on its way. Check your inbox and click the link to continue.
              </p>
              <p style={{ color: BRAND.muted, fontSize: 12, marginTop: 16 }}>
                The link expires in 15 minutes.
              </p>
              <button
                onClick={() => { setStatus("idle"); setEmail(""); }}
                style={{ marginTop: 20, background: "none", border: "none", color: BRAND.ink,
                  fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: BRAND.fontText }}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={requestLink} style={{ marginTop: 24 }}>
              <p style={{ color: BRAND.muted, fontSize: 13, marginBottom: 20, textAlign: "left" }}>
                Enter the email address on your account to get a sign-in link
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@yourcompany.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  /* An error darkens the border to ink — it never turns the
                     brand green, which would read as success. */
                  border: `1px solid ${error ? BRAND.ink : BRAND.hair}`,
                  borderRadius: BRAND.radius,
                  fontSize: 14,
                  marginBottom: 12,
                  color: BRAND.ink,
                  fontFamily: BRAND.fontText,
                  boxSizing: "border-box",
                }}
              />
              {error && (
                <p style={{ color: BRAND.ink, fontWeight: 600, fontSize: 12, marginBottom: 12, textAlign: "left" }}>
                  {error}
                </p>
              )}
              <CtaButton type="submit" disabled={status === "sending"} style={{ width: "100%", justifyContent: "center" }}>
                {status === "sending" ? "Sending…" : "Send sign-in link"}
              </CtaButton>
              <p style={{ color: BRAND.muted, fontSize: 12, marginTop: 18, marginBottom: 0 }}>
                Not a member yet?{" "}
                <a href="/free-audit" style={{ color: BRAND.ink, fontWeight: 600 }}>
                  Try the free audit
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
