import { useState } from "react";
import { BRAND } from "../lib/brand";
import Kicker from "./Kicker";
import Card from "./Card";
import ScoreRing from "./ScoreRing";
import { CtaButton } from "./Button";

/**
 * The rendered audit report. Extracted from pages/index.jsx so the internal
 * tool and the /audit/<id> preview route render identical output from the
 * same cached record — a preview link that looked subtly different from the
 * page it was shared out of would be worse than no preview link.
 *
 * The #audit-results id is load-bearing: the @media print block in
 * globals.css hides everything except this subtree, which is what "Export
 * PDF" (window.print) actually produces. Keep it on the outermost node.
 */

const PLATFORMS = [
  { id: "chatgpt", label: "ChatGPT", color: "#10a37f" },
  { id: "gemini",  label: "Gemini",  color: "#4285f4" },
  { id: "claude",  label: "Claude",  color: "#d97757" },
  { id: "perplexity", label: "Perplexity", color: "#20b2aa" },
];
const FACTORS = [
  { id: "eeat",           label: "E-E-A-T & Content Quality", icon: "📋" },
  { id: "blogging",       label: "Blogging & Freshness",       icon: "✍️" },
  { id: "structured_data",label: "Structured Data",            icon: "🔧" },
  { id: "gaps",           label: "Coverage Gaps",              icon: "🗺️" },
];
const NEW_SECTIONS = [
  { id: "blog_topics",       label: "Blog Article Topics",          icon: "💡" },
  { id: "pages_to_optimize", label: "Pages to Expand / Optimize",   icon: "📄" },
  { id: "target_keywords",   label: "Target Keywords",              icon: "🔑" },
];

// Switched from client-side jsPDF generation (a hand-rolled A4 layout that
// had to duplicate every score/color rule from the actual UI) to the
// browser's native print dialog: @media print in globals.css hides
// everything except #audit-results, so "Export PDF" now literally means
// "print the report you are already looking at" — pixel-consistent with
// the UI by construction, no separate layout to maintain, no jsPDF CDN
// dependency to load.
export function exportToPDF() {
  window.print();
}

function PlatformScore({ platform, score }) {
  const p = PLATFORMS.find(p => p.id === platform);
  const pct = score ?? 0;
  return (
    <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      padding:"16px 12px", flex:1, minWidth:100 }}>
      <ScoreRing score={pct} size={72} color={p.color} />
      <span style={{ fontSize:11, color: BRAND.muted, fontFamily: BRAND.fontText,
        letterSpacing:"0.08em", fontWeight:600, textTransform:"uppercase" }}>{p.label}</span>
    </Card>
  );
}

function FactorCard({ factor, data }) {
  const [open, setOpen] = useState(true);
  const f = FACTORS.find(f => f.id === factor);
  const score = data?.score ?? 0;
  const color = score >= 75 ? BRAND.good : score >= 50 ? BRAND.warn : BRAND.bad;
  const bgColor = score >= 75 ? BRAND.goodBg : score >= 50 ? BRAND.warnBg : BRAND.badBg;
  return (
    <Card onClick={() => setOpen(!open)} className="factor-card"
      style={{ padding:"16px 20px", cursor:"pointer", border: `1px solid ${open ? BRAND.ink : BRAND.hair}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:22 }}>{f?.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color: BRAND.ink, fontWeight:600, fontSize:15, fontFamily: BRAND.fontDisplay }}>
              {f?.label}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color, background: bgColor, padding:"2px 10px", borderRadius:BRAND.radius,
                fontWeight:700, fontSize:13, fontFamily: BRAND.fontText, fontVariantNumeric: "tabular-nums" }}>{score}/100</span>
              <span style={{ color: BRAND.muted, fontSize:12 }}>{open ? "▲" : "▼"}</span>
            </div>
          </div>
          <div style={{ marginTop:8, height:5, background: BRAND.hair, borderRadius:3 }}>
            <div style={{ height:"100%", width:`${score}%`, background:color, borderRadius:3, transition:"width 1s ease" }} />
          </div>
        </div>
      </div>
      {open && data && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${BRAND.hair}` }}>
          {data.summary && <p style={{ color: BRAND.body, fontSize:14, lineHeight:1.7, marginBottom:14,
            fontFamily: BRAND.fontText }}>{data.summary}</p>}
          {[
            ["STRENGTHS",       data.positives,       BRAND.good, BRAND.goodBg,  "+"],
            ["ISSUES",          data.issues,          BRAND.bad,  BRAND.badBg,   "!"],
            ["RECOMMENDATIONS", data.recommendations, BRAND.info, BRAND.infoBg,  "→"],
          ].map(([title, items, c, bg, sym]) => items?.length > 0 && (
            <div key={title} style={{ marginBottom:12 }}>
              <div style={{ color:c, fontSize:10, fontFamily: BRAND.fontText, marginBottom:6,
                letterSpacing: BRAND.kickerTracking, fontWeight:700, textTransform:"uppercase" }}>{title}</div>
              {items.map((item, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6, padding:"6px 10px",
                  background:bg, borderRadius:BRAND.radius, alignItems:"flex-start" }}>
                  <span style={{ color:c, flexShrink:0, fontWeight:700, fontSize:13 }}>{sym}</span>
                  <span style={{ color: BRAND.body, fontSize:13, lineHeight:1.6, fontFamily: BRAND.fontText }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NewSectionCard({ section, data }) {
  const [open, setOpen] = useState(true);
  const s = NEW_SECTIONS.find(s => s.id === section);
  if (!data || !data.items?.length) return null;
  // Category accents deliberately skip brand red — red stays the one
  // reserved CTA color, never a decorative content-category tag.
  const colorMap = {
    blog_topics:       { accent: BRAND.sec1, bg: BRAND.sec1Bg },
    pages_to_optimize: { accent: BRAND.ink,  bg: BRAND.base },
    target_keywords:   { accent: BRAND.sec2, bg: BRAND.sec2Bg },
  };
  const c = colorMap[section];
  return (
    <Card style={{ overflow:"hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding:"16px 20px", cursor:"pointer",
        display:"flex", alignItems:"center", gap:12, background:c.bg,
        borderBottom: open ? `1px solid ${BRAND.hair}` : "none" }}>
        <span style={{ fontSize:22 }}>{s?.icon}</span>
        <span style={{ color: BRAND.ink, fontWeight:600, fontSize:15,
          fontFamily: BRAND.fontDisplay, flex:1 }}>{s?.label}</span>
        <span style={{ color: BRAND.muted, fontSize:12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"20px" }}>
          {data.summary && <p style={{ color: BRAND.body, fontSize:13, lineHeight:1.7,
            marginBottom:16, fontFamily: BRAND.fontText }}>{data.summary}</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.items.map((item, i) => (
              <div key={i} style={{ display:"flex", gap:14, padding:"14px 16px",
                background: BRAND.base, borderRadius:BRAND.radius, border:`1px solid ${BRAND.hair}`,
                alignItems:"flex-start" }}>
                <span style={{ color: "#fff", background: c.accent, fontFamily: BRAND.fontText,
                  fontWeight:700, fontSize:12, minWidth:26, height:26, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  {i+1}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ color: BRAND.ink, fontSize:14, fontWeight:600,
                    marginBottom:4, fontFamily: BRAND.fontDisplay }}>
                    {item.title || item.keyword || item.page}
                  </div>
                  {item.rationale && <div style={{ color: BRAND.body, fontSize:13,
                    lineHeight:1.6, fontFamily: BRAND.fontText }}>{item.rationale}</div>}
                  {(item.volume || item.difficulty != null || item.cpc) && (
                    <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                      {item.from_ahrefs && (
                        <span style={{ color: BRAND.inkOnDark, background: BRAND.ink, fontSize:10,
                          fontWeight:700, padding:"2px 7px", borderRadius:10,
                          fontFamily: BRAND.fontText, letterSpacing:"0.06em" }}>
                          AHREFS
                        </span>
                      )}
                      {item.volume && (
                        <span style={{ color: c.accent, fontSize:11, fontFamily: BRAND.fontText,
                          fontWeight:700, background:c.bg, padding:"2px 8px", borderRadius:12 }}>
                          {String(item.volume || "").replace(/^~/, "")}
                        </span>
                      )}
                      {item.difficulty != null && (
                        <span style={{ color:"#fff",
                          background: item.difficulty >= 70 ? BRAND.bad : item.difficulty >= 40 ? BRAND.warn : BRAND.good,
                          fontSize:11, fontFamily: BRAND.fontText,
                          fontWeight:700, padding:"2px 8px", borderRadius:12 }}>
                          KD: {item.difficulty}
                        </span>
                      )}
                      {item.intent && (
                        <span style={{ color: BRAND.muted, fontSize:11,
                          background: BRAND.hair, padding:"2px 8px",
                          borderRadius:12, fontFamily: BRAND.fontText }}>
                          {item.intent}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AhrefsDataPanel({ data }) {
  if (!data) return null;
  const hasData = Object.values(data).some(v => v !== null && v !== undefined);
  if (!hasData) return null;
  const metrics = [
    { label: "Domain Rating", value: data.domain_rating ? `${data.domain_rating}/100` : "—" },
    { label: "Organic Traffic", value: data.organic_traffic ? data.organic_traffic.toLocaleString() + "/mo" : "—" },
    { label: "Organic Keywords", value: data.organic_keywords ? data.organic_keywords.toLocaleString() : "—" },
    { label: "Backlinks", value: data.backlinks ? data.backlinks.toLocaleString() : "—" },
    { label: "Referring Domains", value: data.referring_domains ? data.referring_domains.toLocaleString() : "—" },
  ];
  return (
    <Card style={{ padding:20, marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <span style={{ fontSize:18 }}>📊</span>
        <span style={{ color: BRAND.ink, fontWeight:600, fontSize:14,
          fontFamily: BRAND.fontDisplay }}>Real Data from Ahrefs</span>
        <span style={{ background: BRAND.ink, color: BRAND.inkOnDark, fontSize:10,
          fontWeight:700, padding:"2px 8px", borderRadius:12, fontFamily: BRAND.fontText,
          letterSpacing:"0.08em" }}>LIVE</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
        {metrics.map(({ label, value }) => (
          <div key={label} style={{ background: BRAND.base, borderRadius:BRAND.radius, padding:"10px 14px",
            border:`1px solid ${BRAND.hair}` }}>
            <div style={{ color: BRAND.muted, fontSize:10, fontFamily: BRAND.fontText,
              fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
              {label}
            </div>
            <div style={{ color: BRAND.ink, fontWeight:700, fontSize:18,
              fontFamily: BRAND.fontText, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * `meta` renders under the business description — the preview route uses it
 * for the "cached on <date>" provenance line, so a shared report always
 * says how old it is instead of passing week-old scores off as live.
 */
export default function AuditReport({ result, meta = null }) {
  if (!result) return null;
  const overallColor =
    result.overall_score >= 75 ? BRAND.good : result.overall_score >= 50 ? BRAND.warn : BRAND.bad;

  return (
    <div id="audit-results" style={{ animation:"fadeUp 0.5s ease forwards" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:24, gap:16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: BRAND.fontDisplay, fontSize:26, fontWeight:600,
            color: BRAND.ink, marginBottom:4 }}>{result.business_name}</h2>
          <p style={{ color: BRAND.muted, fontSize:13 }}>{result.business_description}</p>
          {meta}
        </div>
        <CtaButton onClick={exportToPDF}>
          Export PDF
        </CtaButton>
      </div>

      {/* Ahrefs real data panel */}
      {result.ahrefs_data && <AhrefsDataPanel data={result.ahrefs_data} />}

      {/* Scores */}
      <Card style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:110, padding:"8px 0" }}>
            <ScoreRing score={result.overall_score} size={96} color={overallColor} />
            <div style={{ marginTop:6, color: BRAND.muted, fontSize:11,
              fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Overall</div>
          </div>
          <div style={{ flex:1, display:"flex", gap:10, flexWrap:"wrap" }}>
            {PLATFORMS.map(p => <PlatformScore key={p.id} platform={p.id} score={result.platform_scores?.[p.id]} />)}
          </div>
        </div>
      </Card>

      {/* Wins */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        {[["Top Wins",result.top_wins,BRAND.good,BRAND.goodBg,"✓"],
          ["Quick Wins",result.quick_wins,BRAND.warn,BRAND.warnBg,"→"]].map(([title,items,color,bg,sym]) => (
          <Card key={title} style={{ padding:20 }}>
            <Kicker style={{ marginBottom:12, color }}>{title}</Kicker>
            {items?.map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8, padding:"6px 10px",
                background:bg, borderRadius:BRAND.radius, alignItems:"flex-start" }}>
                <span style={{ color, fontWeight:700, flexShrink:0 }}>{sym}</span>
                <span style={{ color: BRAND.body, fontSize:13, lineHeight:1.6 }}>{item}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Audit factors */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14,
          paddingBottom:8, borderBottom:`1px solid ${BRAND.hair}` }}>
          <Kicker>Audit Factors</Kicker>
          <span style={{ fontSize:12, color: BRAND.muted, fontWeight:400,
            fontFamily: BRAND.fontText }}>— click any row to expand</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {FACTORS.map(f => <FactorCard key={f.id} factor={f.id} data={result.factors?.[f.id]} />)}
        </div>
      </div>

      {/* Content & keyword sections */}
      <div style={{ marginTop:8 }}>
        <div style={{ marginBottom: 14, paddingBottom:8, borderBottom:`1px solid ${BRAND.hair}` }}>
          <Kicker>Content &amp; Keyword Opportunities</Kicker>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <NewSectionCard section="blog_topics"       data={result.blog_topics} />
          <NewSectionCard section="pages_to_optimize" data={result.pages_to_optimize} />
          <NewSectionCard section="target_keywords"   data={result.target_keywords} />
        </div>
      </div>
    </div>
  );
}
