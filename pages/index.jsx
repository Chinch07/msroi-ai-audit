import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { BRAND } from "../lib/brand";
import Kicker from "../components/Kicker";
import Card from "../components/Card";
import { CtaButton, GhostButton } from "../components/Button";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import AuditReport from "../components/AuditReport";
import PreviewLink from "../components/PreviewLink";
import { AGENCY } from "../lib/agency";

function LoadingDots() {
  return (
    <span style={{ display:"inline-flex", gap:5 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:8, height:8, borderRadius:"50%", background: BRAND.primary,
          display:"inline-block", animation:"bounce 1.2s infinite", animationDelay:`${i*0.2}s` }} />
      ))}
    </span>
  );
}



function AuditApp({ userEmail }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  // Set from whichever path produced the report — a cache hit hands one back
  // immediately, a fresh run gets one once the result is written to the
  // cache. Null means "no shareable link yet," which is also what a failed
  // cache write looks like, so the link is only offered when it resolves.
  const [auditId, setAuditId] = useState(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  // Identifies the current run, so a late-resolving cache write can tell
  // whether the report it saved is still the one on screen.
  const runIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;


  const analyze = async () => {
    if (!url.trim()) return;
    const runId = ++runIdRef.current;
    setLoading(true); setError(""); setResult(null); setAuditId(null);

    // Normalize and validate the URL before spending an audit call on it.
    let normalizedUrl = url.trim().replace(/\/+$/, ""); // strip trailing slashes
    if (!normalizedUrl.startsWith("http")) normalizedUrl = "https://" + normalizedUrl;
    try {
      const parsed = new URL(normalizedUrl);
      if (!parsed.hostname.includes(".")) throw new Error();
    } catch {
      setError("Please enter a valid website URL — e.g. yourbusiness.com");
      setLoading(false);
      return;
    }

    setStatus("Checking cache…");
    await new Promise(r => setTimeout(r, 100));
    setStatus("Checking cache…");
    // Check cache first
    setStatus("Checking cache…");
    try {
      const cacheRes = await fetch("/api/check-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl })
      });
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.hit && cacheData.result) {
          setResult(cacheData.result);
          setAuditId(cacheData.auditId || null);
          setStatus("");
          setLoading(false);
          return;
        }
      }
    } catch(e) { console.warn("Cache check failed:", e.message); }

    setStatus("Researching website…");

    const systemPrompt = `You are an expert AI visibility and digital marketing analyst for ${AGENCY.name}.
You evaluate websites for their readiness to appear in AI-powered search platforms: ChatGPT, Google Gemini, Claude, and Perplexity.

Use web search to research the given website, then return ONLY a JSON audit report with NO markdown fences.

Return ONLY this JSON schema:
{
  "business_name": "string",
  "business_description": "one sentence",
  "overall_score": 0-100,
  "platform_scores": { "chatgpt": 0-100, "gemini": 0-100, "claude": 0-100, "perplexity": 0-100 },
  "factors": {
    "eeat": { "score": 0-100, "summary": "string", "positives": ["..."], "issues": ["..."], "recommendations": ["..."] },
    "blogging": { "score": 0-100, "summary": "string", "positives": ["..."], "issues": ["..."], "recommendations": ["..."] },
    "structured_data": { "score": 0-100, "summary": "string", "positives": ["..."], "issues": ["..."], "recommendations": ["..."] },
    "gaps": { "score": 0-100, "summary": "string", "positives": ["..."], "issues": ["..."], "recommendations": ["..."] }
  },
  "top_wins": ["string x3"],
  "quick_wins": ["string x3"],
  "blog_topics": {
    "summary": "string",
    "items": [
      { "title": "string", "rationale": "string" },
      { "title": "string", "rationale": "string" },
      { "title": "string", "rationale": "string" },
      { "title": "string", "rationale": "string" },
      { "title": "string", "rationale": "string" }
    ]
  },
  "pages_to_optimize": {
    "summary": "string",
    "items": [
      { "page": "string", "rationale": "string" },
      { "page": "string", "rationale": "string" },
      { "page": "string", "rationale": "string" },
      { "page": "string", "rationale": "string" },
      { "page": "string", "rationale": "string" }
    ]
  },
  "target_keywords": {
    "summary": "string",
    "items": [
      { "keyword": "string", "volume": "monthly search volume as plain number e.g. 2400/mo, no ~ prefix", "difficulty": null_or_number, "intent": "informational/commercial/navigational/transactional", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false },
      { "keyword": "string", "volume": "string", "difficulty": null_or_number, "intent": "string", "rationale": "string", "from_ahrefs": true_or_false }
    ]
  }
}
Return ONLY valid JSON. No commentary before or after.`;

    try {
      const messages = [{
        role: "user",
        content: `Audit this website for AI readiness and visibility: ${normalizedUrl}\n\nSearch for the website. Be concise in all text fields (1-2 sentences max per field). Return the complete JSON audit report.`
      }];
      let data;
      let iterations = 0;
      while (iterations < 8) {
        iterations++;
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, system: systemPrompt, url: normalizedUrl })
        });
        const responseText = await response.text();
        let dataParsed;
        try { dataParsed = JSON.parse(responseText); }
        catch(e) { throw new Error("Non-JSON response (" + response.status + "): " + responseText.slice(0,300)); }
        data = dataParsed;

        // ── Cache HIT — render immediately and stop here ──
        // Returns rather than breaks: breaking out of the loop falls into
        // the JSON-parsing block below, which finds no content blocks on a
        // cached response and throws "No JSON found" over the report it
        // just rendered. Unreachable in practice (the /api/check-cache call
        // above hits the same cache first and returns), but this is the
        // second of the two cache paths and it should behave like the first.
        if (data.__cached && data.result) {
          setResult(data.result);
          setAuditId(data.auditId || data.result.auditId || null);
          setStatus("");
          return;
        }

        if (data.error) throw new Error(`API Error [${data.error.type}]: ${data.error.message}`);
        if (data.stop_reason === "end_turn") break;
        if (data.stop_reason === "tool_use") {
          setStatus(`Researching website… (pass ${iterations})`);
          messages.push({ role:"assistant", content:data.content });
          messages.push({ role:"user", content:"Please continue and return the complete JSON audit report now." });
        } else { break; }
      }
      setStatus("Building your report…");
      if (!data) throw new Error("No response received.");
      const textBlocks = (data.content||[]).filter(b => b.type==="text");
      const raw = textBlocks.map(b => b.text).join("");
      const cleaned = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found. Raw: " + raw.slice(0,300));
      let parsed;
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch(e) { throw new Error("JSON parse failed: " + e.message); }
      let parsedForCache = { ...parsed };
      setResult(parsedForCache);
      setStatus("");

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "audit_generated",
        audit_url: normalizedUrl,
        audit_overall_score: parsed.overall_score,
      });

      // Fetch real Ahrefs keyword data via server-side route (key in env vars)
      if (parsed.target_keywords?.items?.length > 0) {
        try {
          const kwList = parsed.target_keywords.items.map(k => k.keyword).join(", ");
          const kwResponse = await fetch("/api/ahrefs-keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keywords: kwList })
          });
          if (kwResponse.ok) {
            const kwData = await kwResponse.json();
            if (kwData.items && Array.isArray(kwData.items) && kwData.items.length > 0) {
              const enrichedItems = parsedForCache.target_keywords.items.map(item => {
                const match = kwData.items.find(k =>
                  k.keyword?.toLowerCase() === item.keyword?.toLowerCase()
                );
                if (match) {
                  return { ...item,
                    volume: match.volume ? String(match.volume).replace(/^~/, "") : item.volume,
                    difficulty: match.difficulty ?? null,
                    intent: match.intent || item.intent,
                    from_ahrefs: true,
                  };
                }
                return item;
              });
              parsedForCache = { ...parsedForCache, target_keywords: { ...parsedForCache.target_keywords, items: enrichedItems, real_data: true } };
              setResult(parsedForCache);
            }
          }
        } catch(e) { console.warn("Keyword enrichment failed:", e.message); }
      }
      // Still not awaited — the report is already on screen, and the
      // shareable link appears once the write lands. The runId check keeps a
      // slow save from attaching the previous site's link to a run the user
      // has already started over; a failed write leaves auditId null, so no
      // /audit/<id> link is offered that would resolve to nothing.
      fetch("/api/save-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl, result: parsedForCache })
      })
        .then(res => res.json())
        .then(data => { if (runIdRef.current === runId) setAuditId(data?.auditId || null); })
        .catch(e => console.warn("Cache save failed:", e.message));
    } catch(e) {
      setError(e.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background: BRAND.base, color: BRAND.body, fontFamily: BRAND.fontText }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        input { outline:none; }
        input::placeholder { color:#b4b6b9; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <AppHeader
        right={
          <>
            {userEmail && <span title="Signed in" style={{ color: BRAND.muted, fontSize: 13 }}>{userEmail}</span>}
            <GhostButton href="/api/auth/logout" style={{ padding: "8px 16px", fontSize: 13 }}>Sign out</GhostButton>
          </>
        }
      />

      {/* Hero band */}
      <div style={{ background: BRAND.groundDark, padding:`clamp(2rem, 5vw, 3.5rem) ${BRAND.sectionPaddingInline}` }}>
        <Kicker onDark>Internal Tool</Kicker>
        <h1 style={{ fontFamily: BRAND.fontDisplay, color: BRAND.inkOnDark,
          fontSize: BRAND.textH1Fluid, fontWeight:700, letterSpacing:"-0.02em", lineHeight: 1.06, marginTop:18, marginBottom:14, maxWidth:"20ch" }}>
          AI Visibility Audit
        </h1>
        <p style={{ color: BRAND.inkOnDark2, fontSize: BRAND.textBodyLg, maxWidth:600 }}>
          Discover how your website performs across ChatGPT, Gemini, Claude, and Perplexity — and get a clear action plan to improve your AI readiness.
        </p>
      </div>

      <div style={{ maxWidth:880, margin:"0 auto", padding:"32px 24px 40px" }}>

        {/* Input card */}
        <Card id="url-input-section" style={{ padding:28, marginBottom:32, animation:"fadeUp 0.4s ease forwards" }}>
          <div style={{ display:"flex", gap:12, flexWrap: "wrap" }}>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !loading && analyze()}
              placeholder="Enter website URL — e.g. yourbusiness.com"
              style={{ flex:1, minWidth: 220, background: BRAND.base, border:`1px solid ${BRAND.hair}`,
                borderRadius:BRAND.radius, padding:"13px 16px", color: BRAND.ink, fontSize:15,
                fontFamily: BRAND.fontText, transition:"border-color 0.2s" }} />
            <CtaButton onClick={analyze} disabled={loading || !url.trim()}>
              {loading ? "Analyzing…" : "Run Audit"}
            </CtaButton>
          </div>

          {loading && (
            <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:10 }}>
              <LoadingDots />
              <span style={{ color: BRAND.muted, fontSize:13 }}>{status}</span>
            </div>
          )}
          {error && <div style={{ marginTop:12, color: BRAND.ink, fontWeight: 600, fontSize:13,
            padding:"10px 14px", background: BRAND.base, borderRadius:BRAND.radius, border:`1px solid ${BRAND.ink}` }}>
            {error}
          </div>}
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Above the report, not inside it: the link is a tool affordance,
                not part of the audit, and #audit-results is what the PDF
                export prints. */}
            <PreviewLink auditId={auditId} />
            <AuditReport result={result} />
          </>
        )}

        {!result && !loading && (
          <div style={{ textAlign:"center", paddingTop:60, opacity:0.6 }}>
            <div style={{ fontSize:44, marginBottom:16, color: BRAND.muted }}>▶</div>
            <Kicker style={{ justifyContent: "center" }}>Enter a URL above to begin your audit</Kicker>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

export default function App({ userEmail }) {
  return (
    <>
      <Head><title>{AGENCY.toolName} | {AGENCY.name}</title></Head>
      <AuditApp userEmail={userEmail} />
    </>
  );
}

// Server-side gate: the internal tool is only reachable with a valid session
// cookie. Anonymous visitors are redirected to the passwordless sign-in page.
// The public /free-audit route has no such guard and stays open.
export async function getServerSideProps({ req }) {
  const { getSession } = await import("../lib/auth");
  const session = getSession(req);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { userEmail: session.email } };
}
