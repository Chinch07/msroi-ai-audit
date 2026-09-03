import { useState } from "react";
import Head from "next/head";
import { BRAND, cardStyle, darkFieldStyle } from "../lib/brand";
import Kicker from "../components/Kicker";
import Card from "../components/Card";
import ScoreRing from "../components/ScoreRing";
import { CtaButton } from "../components/Button";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { AGENCY } from "../lib/agency";

function LockedSection() {
  return (
    <div style={{ position: "relative", marginTop: 24 }}>
      <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none",
        ...cardStyle, padding: 28 }}>
        {["Keyword Opportunities", "Pages to Optimize", "Blog Topics", "Coverage Gaps"].map(t => (
          <div key={t} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: BRAND.ink, fontFamily: BRAND.fontText }}>{t}</div>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 13, background: BRAND.hair, borderRadius: 3,
                marginBottom: 6, width: i === 3 ? "60%" : "100%" }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(244,245,245,0.8)", borderRadius: BRAND.radius }}>
        <div style={{ textAlign: "center", padding: "32px 28px", maxWidth: 420, ...cardStyle }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontFamily: BRAND.fontDisplay, color: BRAND.ink, fontWeight: 700,
            fontSize: 18, marginBottom: 12 }}>
            We&apos;ll Be In Touch Soon!
          </h3>
          <p style={{ color: BRAND.body, fontSize: 14, lineHeight: 1.6, marginBottom: 12, fontFamily: BRAND.fontText }}>
            Your full report — including keyword audit, page-by-page recommendations, and a content roadmap — is ready. One of our team members will reach out to walk you through everything personally.
          </p>
          <p style={{ color: BRAND.ink, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: BRAND.fontText }}>
            Expect to hear from us within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

function LimitModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(14,15,17,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, zIndex: 1000 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...cardStyle,
        padding: "32px 28px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h3 style={{ fontFamily: BRAND.fontDisplay, color: BRAND.ink, fontWeight: 700,
          fontSize: 18, marginBottom: 12 }}>
          You&apos;ve Used All Your Free Audits
        </h3>
        <p style={{ color: BRAND.body, fontSize: 14, lineHeight: 1.6, marginBottom: 20, fontFamily: BRAND.fontText }}>
          Each email gets 3 free AI visibility audits, and you&apos;ve used yours. If you&apos;d like to
          view a report you already ran, enter that same website URL again.
        </p>
        <CtaButton onClick={onClose}>Got It</CtaButton>
        <p style={{ color: BRAND.muted, fontSize: 12, marginTop: 18, marginBottom: 0, fontFamily: BRAND.fontText }}>
          Want more? Email <a href={`mailto:${AGENCY.contactEmail}`}
            style={{ color: BRAND.ink, fontWeight: 600 }}>{AGENCY.contactEmail}</a>
        </p>
      </div>
    </div>
  );
}

// Field styling for the dark hero form — exact match to the real Contact
// form's fieldClass ("rounded-[2px] border border-ink-on-dark-muted/25
// bg-ink-on-dark/[0.03] px-4 py-3 text-ink-on-dark outline-none
// transition-colors focus-visible:border-ink-on-dark-2"): px-4 py-3 is
// 16px/12px, and focus is indicated by the border brightening to
// ink-on-dark-2 — no outline ring, matching the real site exactly.
// Errors never turn red (that's reserved for the CTA) — an invalid field
// uses the same ink-on-dark-2 border the real site uses for focus.
function darkInputStyle(hasError) {
  return {
    ...darkFieldStyle,
    width: "100%",
    padding: "12px 16px",
    fontSize: 15,
    fontFamily: BRAND.fontText,
    outline: "none",
    boxSizing: "border-box",
    border: `1px solid ${hasError ? BRAND.inkOnDark2 : "rgba(180, 182, 185, 0.25)"}`,
  };
}

export default function FreeAudit() {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.website.trim()) e.website = "Website is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("loading");
    setError("");
    let auditToken = null;
    try {
      await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let url = form.website.trim().replace(/\/+$/, ""); // strip trailing slashes
      if (!url.startsWith("http")) url = "https://" + url;

      // Basic URL validation — catches garbage input before it burns a
      // cache lookup or a credit slot.
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes(".")) throw new Error();
      } catch {
        setErrors({ website: "Please enter a valid website URL — e.g. yourbusiness.com" });
        setStep("form");
        return;
      }

      setStatus("Checking for existing audit...");
      const cacheRes = await fetch("/api/check-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.hit && cacheData.result) {
          setResult(cacheData.result);
          setStep("results");
          return;
        }
      }

      setStatus("Checking your available audits...");
      const creditsRes = await fetch("/api/check-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, url }),
      });
      const creditsData = await creditsRes.json();
      if (!creditsRes.ok || !creditsData.allowed) {
        setStep("form");
        setShowLimitModal(true);
        return;
      }
      auditToken = creditsData.auditToken;
      // Read from the server rather than hardcoding a matching number here —
      // this must never exceed lib/auth.js's MAX_CREDIT_CALLS, since each
      // call consumes one of the token's bounded call slots. No local
      // fallback number: /api/check-credits always sets this on an
      // { allowed: true } response, and a stale hardcoded duplicate here is
      // exactly the drift this was meant to eliminate. If it's ever
      // missing, the loop below simply won't run rather than guessing.
      const maxAuditCalls = creditsData.maxAuditCalls;

      setStatus("Researching your website...");
      const systemPrompt = `You are an expert AI visibility analyst. Research the given website and return ONLY a valid JSON audit report with NO markdown fences.

Return ONLY this JSON:
{
  "business_name": "string",
  "business_description": "one sentence",
  "overall_score": 0-100,
  "platform_scores": { "chatgpt": 0-100, "gemini": 0-100, "claude": 0-100, "perplexity": 0-100 },
  "quick_wins": ["string", "string", "string"],
  "top_wins": ["string", "string", "string"],
  "factors": {
    "eeat": { "score": 0-100, "summary": "string" },
    "blogging": { "score": 0-100, "summary": "string" },
    "structured_data": { "score": 0-100, "summary": "string" },
    "gaps": { "score": 0-100, "summary": "string" }
  },
  "target_keywords": { "summary": "string", "items": [{ "keyword": "string", "volume": "string", "difficulty": null, "intent": "string", "rationale": "string", "from_ahrefs": false }] },
  "blog_topics": { "summary": "string", "items": [{ "title": "string", "rationale": "string" }] },
  "pages_to_optimize": { "summary": "string", "items": [{ "page": "string", "rationale": "string" }] }
}`;

      const messages = [{ role: "user", content: `Audit this website for AI visibility: ${url}\n\nBe concise. Return the complete JSON report.` }];
      let data;
      let iterations = 0;
      while (iterations < maxAuditCalls) {
        iterations++;
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, system: systemPrompt, auditToken, url }),
        });
        const responseText = await response.text();
        let dataParsed;
        try { dataParsed = JSON.parse(responseText); }
        catch(e) { throw new Error("Non-JSON response (" + response.status + "): " + responseText.slice(0, 200)); }
        data = dataParsed;
        if (data.error) throw new Error("API Error: " + (data.error.message || JSON.stringify(data.error)));
        if (data.stop_reason === "end_turn") break;
        if (data.stop_reason === "tool_use") {
          setStatus("Analyzing your website... (pass " + iterations + ")");
          messages.push({ role: "assistant", content: data.content });
          const toolResults = data.content
            .filter(b => b.type === "tool_use")
            .map(b => ({ type: "tool_result", tool_use_id: b.id, content: "Search complete." }));
          messages.push({ role: "user", content: toolResults });
        } else break;
      }

      setStatus("Building your report...");
      const textBlocks = (data?.content || []).filter(b => b.type === "text");
      const raw = textBlocks.map(b => b.text).join("");
      const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse audit report.");
      const parsed = JSON.parse(jsonMatch[0]);

      fetch("/api/save-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, result: parsed }),
      }).catch(() => {});

      setResult(parsed);
      setStep("results");
    } catch(e) {
      if (auditToken) {
        fetch("/api/refund-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auditToken }),
        }).catch(() => {});
      }
      setError(e.message || "Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const isFormStep = step === "form";

  return (
    <>
      <Head>
        <title>Free {AGENCY.toolName} | {AGENCY.name}</title>
        <meta name="description" content="Find out how your website performs across ChatGPT, Gemini, Claude, and Perplexity." />
      </Head>
      <style>{`
        .fa-hero-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: start; }
        @media (min-width: 768px) {
          .fa-hero-grid.two-col { grid-template-columns: 1.1fr 1fr; gap: 56px; }
        }
        /* Focus indicator for the dark-band form fields — exact match to
           the real Contact form's mechanism: the border brightens to
           ink-on-dark-2, no outline ring. !important is needed only
           because inline styles otherwise beat this selector rule. */
        .dark-field:focus-visible {
          border-color: ${BRAND.inkOnDark2} !important;
        }
      `}</style>
      <div style={{ minHeight: "100vh", background: BRAND.base, fontFamily: BRAND.fontText }}>
        <AppHeader label="Free AI Visibility Audit" />

        {/* Dark hero band — two-column (headline / form) while collecting the
            lead, matching the real Contact page's asymmetric grid. Once the
            user has submitted, the hero collapses back to a single column
            and the loading/results view takes over below. */}
        <div style={{ background: BRAND.groundDark, padding: `clamp(2.5rem, 6vw, 4.5rem) ${BRAND.sectionPaddingInline}` }}>
          <div className={`fa-hero-grid ${isFormStep ? "two-col" : ""}`} style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div>
              <Kicker onDark>Free Audit</Kicker>
              <h1 style={{ color: BRAND.inkOnDark, fontFamily: BRAND.fontDisplay, fontWeight: 700,
                letterSpacing: "-0.02em", fontSize: BRAND.textDisplayFluid, lineHeight: 1.05,
                marginTop: 20, maxWidth: isFormStep ? "13ch" : "18ch" }}>
                Is Your Website Visible to AI?
              </h1>
              <p style={{ color: BRAND.inkOnDark2, fontSize: BRAND.textBodyLg, maxWidth: 480, marginTop: 24 }}>
                Find out how your business performs across ChatGPT, Gemini, Claude, and Perplexity. And what to fix first.
              </p>
            </div>

            {isFormStep && (
              <div>
                {/* Visually the kicker eyebrow carries this label (matching
                    the real Contact page, which has no visible <h2> in its
                    form column either) — but the form still needs a real
                    heading for screen-reader/heading-navigation users, so
                    one is present, just visually hidden. */}
                <h2 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden",
                  clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>Get Your Free Audit</h2>
                <Kicker onDark>Get Your Free Audit</Kicker>
                <p style={{ color: BRAND.inkOnDark2, fontSize: BRAND.textBodyLg, marginTop: 16 }}>
                  Enter your details and we&apos;ll run a live AI visibility audit on your website. No cost, no obligation.
                </p>
                {error && (
                  <p style={{ color: BRAND.inkOnDark, fontWeight: 700, fontSize: 14, marginTop: 20 }} role="alert">
                    {error}
                  </p>
                )}
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: BRAND.inkOnDark }}>Full Name *</span>
                    <input type="text" placeholder="Jane Smith" value={form.name} className="dark-field"
                      onChange={e => setForm({...form, name: e.target.value})}
                      style={darkInputStyle(Boolean(errors.name))} />
                    {errors.name && <span style={{ color: BRAND.inkOnDark, fontWeight: 700, fontSize: 12 }}>{errors.name}</span>}
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: BRAND.inkOnDark }}>Email Address *</span>
                    <input type="email" placeholder="jane@company.com" value={form.email} className="dark-field"
                      onChange={e => setForm({...form, email: e.target.value})}
                      style={darkInputStyle(Boolean(errors.email))} />
                    {errors.email && <span style={{ color: BRAND.inkOnDark, fontWeight: 700, fontSize: 12 }}>{errors.email}</span>}
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: BRAND.inkOnDark }}>Phone Number</span>
                    <input type="tel" placeholder="(555) 000-0000" value={form.phone} className="dark-field"
                      onChange={e => setForm({...form, phone: e.target.value})}
                      style={darkInputStyle(false)} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: BRAND.inkOnDark }}>Website URL *</span>
                    <input type="text" placeholder="yourwebsite.com" value={form.website} className="dark-field"
                      onChange={e => setForm({...form, website: e.target.value})}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      style={darkInputStyle(Boolean(errors.website))} />
                    {errors.website && <span style={{ color: BRAND.inkOnDark, fontWeight: 700, fontSize: 12 }}>{errors.website}</span>}
                  </label>
                  <CtaButton onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                    Run My Free AI Audit
                  </CtaButton>
                  <p style={{ color: BRAND.inkOnDarkMuted, fontSize: 12, textAlign: "center", margin: 0 }}>
                    We respect your privacy. Your information will never be shared or sold.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 60px" }}>

          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: "50%",
                    background: BRAND.primary,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <p style={{ color: BRAND.ink, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{status}</p>
              <p style={{ color: BRAND.muted, fontSize: 13 }}>
                This usually takes 60–90 seconds. We&apos;re analyzing your site across all major AI platforms.
              </p>
            </div>
          )}

          {step === "results" && result && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: BRAND.fontDisplay, color: BRAND.ink, marginBottom: 6 }}>
                  {result.business_name}
                </h2>
                <p style={{ color: BRAND.muted, fontSize: 14 }}>{result.business_description}</p>
              </div>

              <Card style={{ padding: 28, textAlign: "center", marginBottom: 20 }}>
                <Kicker style={{ justifyContent: "center", marginBottom: 16 }}>Overall AI Visibility Score</Kicker>
                <ScoreRing score={result.overall_score} size={130} />
                <div style={{ color: BRAND.muted, fontSize: 13, marginTop: 12 }}>
                  {result.overall_score >= 70 ? "Strong AI presence" :
                   result.overall_score >= 40 ? "Moderate — significant room to grow" :
                   "Low visibility — immediate action needed"}
                </div>
              </Card>

              <Card style={{ padding: 24, marginBottom: 20 }}>
                <Kicker style={{ marginBottom: 20 }}>Platform Breakdown</Kicker>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { key: "chatgpt", label: "ChatGPT", color: "#10a37f" },
                    { key: "gemini", label: "Gemini", color: "#4285f4" },
                    { key: "claude", label: "Claude", color: "#d97757" },
                    { key: "perplexity", label: "Perplexity", color: "#20b2aa" },
                  ].map(p => (
                    <div key={p.key} style={{ textAlign: "center" }}>
                      <ScoreRing score={result.platform_scores?.[p.key] || 0} size={80} color={p.color} />
                      <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 6, fontWeight: 600 }}>
                        {p.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {result.quick_wins?.length > 0 && (
                <Card style={{ padding: 24, marginBottom: 20 }}>
                  <Kicker style={{ marginBottom: 16 }}>Quick Wins</Kicker>
                  {result.quick_wins.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                      marginBottom: i < result.quick_wins.length - 1 ? 14 : 0 }}>
                      <div style={{ minWidth: 24, height: 24, borderRadius: "50%",
                        background: BRAND.primary, color: "#fff", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ color: BRAND.body, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{w}</p>
                    </div>
                  ))}
                </Card>
              )}

              {result.top_wins?.length > 0 && (
                <Card style={{ padding: 24, marginBottom: 20 }}>
                  <Kicker style={{ marginBottom: 16 }}>Top Strengths</Kicker>
                  {result.top_wins.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                      marginBottom: i < result.top_wins.length - 1 ? 14 : 0 }}>
                      <div style={{ color: BRAND.good, fontSize: 18, flexShrink: 0 }}>✓</div>
                      <p style={{ color: BRAND.body, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{w}</p>
                    </div>
                  ))}
                </Card>
              )}

              <LockedSection />

              <p style={{ textAlign: "center", color: BRAND.muted, fontSize: 12,
                marginTop: 32, lineHeight: 1.6 }}>
                Report generated by {AGENCY.name}&apos;s AI Visibility Engine.<br/>
                Questions? Email <a href={`mailto:${AGENCY.contactEmail}`}
                  style={{ color: BRAND.ink, fontWeight: 600 }}>{AGENCY.contactEmail}</a>
              </p>
            </div>
          )}
        </div>
        <AppFooter />
      </div>
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}
    </>
  );
}
