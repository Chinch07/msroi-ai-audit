import { useState, useEffect } from "react";
import Head from "next/head";

const LOGO_B64 = "/logo.png";
const BRAND = {
  "agencyName": "Main Street ROI",
  "logoHeight": 50,
  "headingFont": "'Roboto Slab', serif",
  "monoFont": "Arial, sans-serif",
  "primary": "#007513",
  "primaryBg": "#e8f5e8",
  "heroBg": "#1a5c1a",
  "heroText": "#ffffff",
  "heroSubText": "#c8e6c8",
  "headerBg": "#ffffff",
  "footerBg": "#1a5c1a",
  "footerText": "#c8e6c8",
  "bg": "#f7f9f7",
  "card": "#ffffff",
  "border": "#ddeedd",
  "text": "#3a3a3a",
  "textMuted": "#666666",
  "textDim": "#999999",
  "headingColor": "#1a5c1a",
  "white": "#ffffff",
  "good": "#2d7a2d",
  "goodBg": "#e8f5e8",
  "warn": "#c47f00",
  "warnBg": "#fff8e1",
  "bad": "#c0392b",
  "badBg": "#fdecea",
  "info": "#1a5c8a",
  "infoBg": "#e8f0fa",
  "sec1": "#6d4c9e",
  "sec1Bg": "#f3effe",
  "sec2": "#c47f00",
  "sec2Bg": "#fff8e1",
  "barBg": "#c8e6c8",
  "ringBg": "#c8e6c8",
  "scoreText": "#1a5c1a",
  "cardShadow": "0 1px 4px rgba(0,117,19,0.08)",
  "cardShadowActive": "0 2px 12px rgba(0,117,19,0.15)",
  "pdfHeader": [
    26,
    92,
    26
  ],
  "pdfPrimary": [
    26,
    92,
    26
  ],
  "pdfSec1": [
    109,
    76,
    158
  ],
  "pdfSec2": [
    196,
    127,
    0
  ],
  "socialLinks": [
    {
      "href": "https://www.facebook.com/MainStreetROI",
      "label": "Facebook",
      "svg": "<path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'/>"
    },
    {
      "href": "https://www.google.com/maps/place/Main+Street+ROI/@40.7427237,-73.99567,17z",
      "label": "Google Business",
      "svg": "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>"
    },
    {
      "href": "https://twitter.com/MainStreetROI",
      "label": "X",
      "svg": "<path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/>"
    },
    {
      "href": "https://www.linkedin.com/company/main-street-roi",
      "label": "LinkedIn",
      "svg": "<path d='M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z'/><circle cx='4' cy='4' r='2'/>"
    },
    {
      "href": "https://www.youtube.com/@mainstreetroi",
      "label": "YouTube",
      "svg": "<path d='M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z'/><polygon points='9.75 15.02 15.5 12 9.75 8.98 9.75 15.02' fill='#1a5c1a'/>"
    }
  ]
};

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

function ScoreRing({ score, size = 80, color }) {
  const c = color || BRAND.primary;
  const radius = (size - 10) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={BRAND.ringBg} strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={c} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size/2} y={size/2+6} textAnchor="middle" fill={BRAND.scoreText}
        fontSize={size*0.22} fontWeight="700" fontFamily={BRAND.monoFont}
        style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  );
}

function PlatformScore({ platform, score }) {
  const p = PLATFORMS.find(p => p.id === platform);
  const pct = score ?? 0;
  const labelColor = pct >= 75 ? BRAND.good : pct >= 50 ? BRAND.warn : BRAND.bad;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      padding:"16px 12px", background: BRAND.card, borderRadius:10,
      border:`1px solid ${BRAND.border}`, flex:1, minWidth:100,
      boxShadow: BRAND.cardShadow }}>
      <ScoreRing score={pct} size={72} color={p.color} />
      <span style={{ fontSize:11, color: BRAND.textMuted, fontFamily:"Arial, sans-serif",
        letterSpacing:"0.05em", fontWeight:600 }}>{p.label}</span>
    </div>
  );
}

function FactorCard({ factor, data }) {
  const [open, setOpen] = useState(false);
  const f = FACTORS.find(f => f.id === factor);
  const score = data?.score ?? 0;
  const color = score >= 75 ? BRAND.good : score >= 50 ? BRAND.warn : BRAND.bad;
  const bgColor = score >= 75 ? BRAND.goodBg : score >= 50 ? BRAND.warnBg : BRAND.badBg;
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: BRAND.card, border:`1px solid ${open ? BRAND.primary : BRAND.border}`,
      borderRadius:10, padding:"16px 20px", cursor:"pointer",
      transition:"all 0.2s", boxShadow: open ? BRAND.cardShadowActive : BRAND.cardShadow }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:22 }}>{f?.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color: BRAND.headingColor, fontWeight:700, fontSize:15, fontFamily: BRAND.headingFont }}>
              {f?.label}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color, background: bgColor, padding:"2px 10px", borderRadius:20,
                fontWeight:700, fontSize:13, fontFamily:"Arial, sans-serif" }}>{score}/100</span>
              <span style={{ color: BRAND.textDim, fontSize:12 }}>{open ? "▲" : "▼"}</span>
            </div>
          </div>
          <div style={{ marginTop:8, height:5, background: BRAND.barBg, borderRadius:3 }}>
            <div style={{ height:"100%", width:`${score}%`, background:color, borderRadius:3, transition:"width 1s ease" }} />
          </div>
        </div>
      </div>
      {open && data && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${BRAND.border}` }}>
          {data.summary && <p style={{ color: BRAND.textMuted, fontSize:14, lineHeight:1.7, marginBottom:14,
            fontFamily:"Arial, sans-serif" }}>{data.summary}</p>}
          {[
            ["STRENGTHS",       data.positives,       BRAND.good, BRAND.goodBg,  "+"],
            ["ISSUES",          data.issues,          BRAND.bad,  BRAND.badBg,   "!"],
            ["RECOMMENDATIONS", data.recommendations, BRAND.info, BRAND.infoBg,  "→"],
          ].map(([title, items, c, bg, sym]) => items?.length > 0 && (
            <div key={title} style={{ marginBottom:12 }}>
              <div style={{ color:c, fontSize:10, fontFamily:"Arial, sans-serif", marginBottom:6,
                letterSpacing:"0.12em", fontWeight:700, textTransform:"uppercase" }}>{title}</div>
              {items.map((item, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6, padding:"6px 10px",
                  background:bg, borderRadius:6, alignItems:"flex-start" }}>
                  <span style={{ color:c, flexShrink:0, fontWeight:700, fontSize:13 }}>{sym}</span>
                  <span style={{ color: BRAND.text, fontSize:13, lineHeight:1.6, fontFamily:"Arial, sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewSectionCard({ section, data }) {
  const [open, setOpen] = useState(true);
  const s = NEW_SECTIONS.find(s => s.id === section);
  if (!data || !data.items?.length) return null;
  const colorMap = {
    blog_topics:       { accent: BRAND.sec1, bg: BRAND.sec1Bg },
    pages_to_optimize: { accent: BRAND.primary, bg: BRAND.primaryBg },
    target_keywords:   { accent: BRAND.sec2, bg: BRAND.sec2Bg },
  };
  const c = colorMap[section];
  return (
    <div style={{ background: BRAND.card, border:`1px solid ${BRAND.border}`,
      borderRadius:10, overflow:"hidden", boxShadow: BRAND.cardShadow }}>
      <div onClick={() => setOpen(!open)} style={{ padding:"16px 20px", cursor:"pointer",
        display:"flex", alignItems:"center", gap:12, background:c.bg,
        borderBottom: open ? `1px solid ${BRAND.border}` : "none" }}>
        <span style={{ fontSize:22 }}>{s?.icon}</span>
        <span style={{ color: BRAND.headingColor, fontWeight:700, fontSize:15,
          fontFamily: BRAND.headingFont, flex:1 }}>{s?.label}</span>
        <span style={{ color: BRAND.textDim, fontSize:12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"20px" }}>
          {data.summary && <p style={{ color: BRAND.textMuted, fontSize:13, lineHeight:1.7,
            marginBottom:16, fontFamily:"Arial, sans-serif" }}>{data.summary}</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.items.map((item, i) => (
              <div key={i} style={{ display:"flex", gap:14, padding:"14px 16px",
                background: BRAND.bg, borderRadius:8, border:`1px solid ${BRAND.border}`,
                alignItems:"flex-start" }}>
                <span style={{ color: BRAND.white, background: c.accent, fontFamily:"Arial, sans-serif",
                  fontWeight:700, fontSize:12, minWidth:26, height:26, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  {i+1}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ color: BRAND.headingColor, fontSize:14, fontWeight:700,
                    marginBottom:4, fontFamily: BRAND.headingFont }}>
                    {item.title || item.keyword || item.page}
                  </div>
                  {item.rationale && <div style={{ color: BRAND.textMuted, fontSize:13,
                    lineHeight:1.6, fontFamily:"Arial, sans-serif" }}>{item.rationale}</div>}
                  {(item.volume || item.difficulty != null || item.cpc) && (
                    <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                      {item.from_ahrefs && (
                        <span style={{ color:"#fff", background: BRAND.primary, fontSize:10,
                          fontWeight:700, padding:"2px 7px", borderRadius:10,
                          fontFamily:"Arial, sans-serif", letterSpacing:"0.06em" }}>
                          AHREFS
                        </span>
                      )}
                      {item.volume && (
                        <span style={{ color: c.accent, fontSize:11, fontFamily:"Arial, sans-serif",
                          fontWeight:700, background:c.bg, padding:"2px 8px", borderRadius:12 }}>
                          {String(item.volume || "").replace(/^~/, "")}
                        </span>
                      )}
                      {item.difficulty != null && (
                        <span style={{ color:"#fff",
                          background: item.difficulty >= 70 ? "#c0392b" : item.difficulty >= 40 ? "#c47f00" : "#2d7a2d",
                          fontSize:11, fontFamily:"Arial, sans-serif",
                          fontWeight:700, padding:"2px 8px", borderRadius:12 }}>
                          KD: {item.difficulty}
                        </span>
                      )}
                      {item.cpc && (
                        <span style={{ color: BRAND.textMuted, fontSize:11,
                          background: BRAND.border, padding:"2px 8px",
                          borderRadius:12, fontFamily:"Arial, sans-serif" }}>
                          {item.cpc}
                        </span>
                      )}
                      {item.intent && (
                        <span style={{ color: BRAND.textMuted, fontSize:11,
                          background: BRAND.border, padding:"2px 8px",
                          borderRadius:12, fontFamily:"Arial, sans-serif" }}>
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
    </div>
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
    <div style={{ background: BRAND.card, border:`1px solid ${BRAND.primary}33`,
      borderRadius:12, padding:20, marginBottom:24, boxShadow: BRAND.cardShadow }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <span style={{ fontSize:18 }}>📊</span>
        <span style={{ color: BRAND.headingColor, fontWeight:700, fontSize:14,
          fontFamily: BRAND.headingFont }}>Real Data from Ahrefs</span>
        <span style={{ background: BRAND.primaryBg, color: BRAND.primary, fontSize:10,
          fontWeight:700, padding:"2px 8px", borderRadius:12, fontFamily:"Arial, sans-serif",
          letterSpacing:"0.08em" }}>LIVE</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
        {metrics.map(({ label, value }) => (
          <div key={label} style={{ background: BRAND.bg, borderRadius:8, padding:"10px 14px",
            border:`1px solid ${BRAND.border}` }}>
            <div style={{ color: BRAND.textDim, fontSize:10, fontFamily:"Arial, sans-serif",
              fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
              {label}
            </div>
            <div style={{ color: BRAND.primary, fontWeight:700, fontSize:18,
              fontFamily: BRAND.monoFont }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function exportToPDF(result, url) {
  if (typeof window === "undefined" || !window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210, margin = 20;
  let y = margin;
  const addPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed = 20) => { if (y + needed > 280) addPage(); };

  // Header
  doc.setFillColor(...BRAND.pdfHeader);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text("AI VISIBILITY AUDIT REPORT", margin, 16);
  doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text(url, W-margin, 13, { align:"right" });
  doc.text(new Date().toLocaleDateString(), W-margin, 20, { align:"right" });
  doc.text("Powered by " + BRAND.agencyName, W-margin, 27, { align:"right" });
  y = 42;

  // Business name
  doc.setTextColor(...BRAND.pdfPrimary);
  doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text(result.business_name || "Business Audit", margin, y); y += 7;
  doc.setTextColor(100,100,100); doc.setFontSize(10); doc.setFont("helvetica","normal");
  const desc = doc.splitTextToSize(result.business_description || "", W-margin*2);
  doc.text(desc, margin, y); y += desc.length*5 + 10;

  // Ahrefs data box
  if (result.ahrefs_data) {
    doc.setFillColor(247,249,247);
    doc.roundedRect(margin, y, W-margin*2, 22, 3, 3, "F");
    doc.setTextColor(...BRAND.pdfPrimary); doc.setFontSize(9); doc.setFont("helvetica","bold");
    doc.text("REAL DATA FROM AHREFS", margin+5, y+7);
    const ahMetrics = [
      `DR: ${result.ahrefs_data.domain_rating || "—"}`,
      `Traffic: ${result.ahrefs_data.organic_traffic?.toLocaleString() || "—"}/mo`,
      `Keywords: ${result.ahrefs_data.organic_keywords?.toLocaleString() || "—"}`,
      `Backlinks: ${result.ahrefs_data.backlinks?.toLocaleString() || "—"}`,
    ];
    doc.setTextColor(60,60,60); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(ahMetrics.join("   ·   "), margin+5, y+15);
    y += 28;
  }

  // Overall score
  doc.setFillColor(232,245,232);
  doc.roundedRect(margin, y, W-margin*2, 20, 3, 3, "F");
  doc.setTextColor(...BRAND.pdfPrimary); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text("OVERALL AI READINESS SCORE", margin+6, y+8);
  const sc = result.overall_score;
  const scColor = sc >= 75 ? [45,122,45] : sc >= 50 ? [196,127,0] : [192,57,43];
  doc.setTextColor(...scColor); doc.setFontSize(18);
  doc.text(`${sc}/100`, W-margin-6, y+13, { align:"right" });
  y += 28;

  // Platform scores
  doc.setTextColor(102,102,102); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("PLATFORM SCORES", margin, y); y += 6;
  const platforms = Object.entries(result.platform_scores || {});
  const colW = (W-margin*2)/platforms.length;
  platforms.forEach(([name, score], i) => {
    const x = margin + i*colW;
    doc.setFillColor(247,249,247);
    doc.roundedRect(x, y, colW-3, 18, 2, 2, "F");
    doc.setTextColor(100,100,100); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(name.toUpperCase(), x+(colW-3)/2, y+6, { align:"center" });
    const sc2 = score >= 75 ? [45,122,45] : score >= 50 ? [196,127,0] : [192,57,43];
    doc.setTextColor(...sc2); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text(`${score}`, x+(colW-3)/2, y+14, { align:"center" });
  });
  y += 26;

  // Wins
  checkPage(36);
  [["TOP WINS", result.top_wins, [45,122,45]], ["QUICK WINS", result.quick_wins, [196,127,0]]].forEach(([title,items,color], ci) => {
    const x = margin + ci*((W-margin*2-6)/2 + 6);
    const hw = (W-margin*2-6)/2;
    doc.setFillColor(247,249,247);
    doc.roundedRect(x, y, hw, (items?.length||3)*9+14, 2, 2, "F");
    doc.setTextColor(...color); doc.setFontSize(8); doc.setFont("helvetica","bold");
    doc.text(title, x+5, y+8);
    (items||[]).forEach((item, ii) => {
      const ls = doc.splitTextToSize(`• ${item}`, hw-10);
      doc.setTextColor(60,60,60); doc.setFont("helvetica","normal"); doc.setFontSize(8);
      doc.text(ls[0], x+5, y+14+ii*9);
    });
  });
  y += ((result.top_wins?.length||3)*9)+22;

  // Factors
  const FL = [{id:"eeat",label:"E-E-A-T & Content Quality"},{id:"blogging",label:"Blogging & Freshness"},
    {id:"structured_data",label:"Structured Data"},{id:"gaps",label:"Coverage Gaps"}];
  FL.forEach(factor => {
    const data = result.factors?.[factor.id]; if (!data) return;
    checkPage(28);
    doc.setFillColor(...BRAND.pdfPrimary); doc.rect(margin, y, 3, 12, "F");
    doc.setTextColor(...BRAND.pdfPrimary); doc.setFontSize(11); doc.setFont("helvetica","bold");
    doc.text(factor.label, margin+7, y+8);
    const sc3 = data.score >= 75 ? [45,122,45] : data.score >= 50 ? [196,127,0] : [192,57,43];
    doc.setTextColor(...sc3); doc.text(`${data.score}/100`, W-margin, y+8, { align:"right" });
    y += 16;
    if (data.summary) {
      doc.setTextColor(100,100,100); doc.setFontSize(9); doc.setFont("helvetica","normal");
      const ls = doc.splitTextToSize(data.summary, W-margin*2);
      checkPage(ls.length*5+5); doc.text(ls, margin, y); y += ls.length*5+5;
    }
    [["STRENGTHS",data.positives,[45,122,45]],["ISSUES",data.issues,[192,57,43]],["RECOMMENDATIONS",data.recommendations,[26,92,138]]].forEach(([t,items,c]) => {
      if (!items?.length) return;
      checkPage(items.length*8+12);
      doc.setTextColor(...c); doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.text(t, margin, y); y += 5;
      items.forEach(item => {
        const ls = doc.splitTextToSize(`→ ${item}`, W-margin*2-4);
        checkPage(ls.length*5+3);
        doc.setTextColor(60,60,60); doc.setFont("helvetica","normal");
        doc.text(ls, margin+3, y); y += ls.length*5+2;
      }); y += 3;
    }); y += 6;
  });

  // New sections
  [[`blog_topics`,"Blog Article Topics",BRAND.pdfSec1],[`pages_to_optimize`,"Pages to Optimize",BRAND.pdfPrimary],[`target_keywords`,"Target Keywords",BRAND.pdfSec2]].forEach(([id,label,color]) => {
    const data = result[id]; if (!data?.items?.length) return;
    checkPage(28);
    doc.setFillColor(...color); doc.rect(margin, y, 3, 12, "F");
    doc.setTextColor(...color); doc.setFontSize(11); doc.setFont("helvetica","bold");
    doc.text(label, margin+7, y+8); y += 16;
    if (data.summary) {
      doc.setTextColor(100,100,100); doc.setFontSize(9); doc.setFont("helvetica","normal");
      const ls = doc.splitTextToSize(data.summary, W-margin*2);
      checkPage(ls.length*5+5); doc.text(ls, margin, y); y += ls.length*5+6;
    }
    data.items.forEach((item, i) => {
      const title2 = item.title||item.keyword||item.page||"";
      const rationale = item.rationale||item.volume||"";
      checkPage(18);
      doc.setFillColor(247,249,247);
      doc.roundedRect(margin, y, W-margin*2, rationale ? 18 : 10, 2, 2, "F");
      doc.setTextColor(...color); doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.text(`${i+1}.`, margin+4, y+7);
      doc.setTextColor(...BRAND.pdfPrimary);
      const tls = doc.splitTextToSize(title2, W-margin*2-20);
      doc.text(tls[0], margin+12, y+7);
      if (rationale) {
        doc.setTextColor(100,100,100); doc.setFont("helvetica","normal"); doc.setFontSize(8);
        const rls = doc.splitTextToSize(rationale, W-margin*2-12);
        doc.text(rls[0], margin+12, y+13);
      }
      y += rationale ? 22 : 14;
    }); y += 8;
  });

  // Footer
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFillColor(...BRAND.pdfHeader); doc.rect(0, 287, W, 10, "F");
    doc.setTextColor(200,220,200); doc.setFontSize(7);
    doc.text(`Generated by ${BRAND.agencyName} · AI Visibility Audit`, margin, 293);
    doc.text(`Page ${p} of ${total}`, W-margin, 293, { align:"right" });
  }
  doc.save(`AI-Audit-${(result.business_name||"report").replace(/\s+/g,"-")}.pdf`);
}


const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD || "";

function PasswordGate({ children }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(!ACCESS_PASSWORD);
  const [err, setErr] = useState(false);
  if (unlocked) return children;
  return (
    <div style={{ minHeight:"100vh", background: BRAND.bg, display:"flex",
      alignItems:"center", justifyContent:"center", fontFamily:"Arial, sans-serif" }}>
      <div style={{ background:"#fff", border:`1px solid ${BRAND.border}`, borderRadius:12,
        padding:40, width:360, boxShadow:"0 4px 20px rgba(0,0,0,0.1)", textAlign:"center" }}>
        <img src="/logo.png" alt="Logo" style={{ height:48, marginBottom:24, objectFit:"contain" }} />
        <h2 style={{ fontFamily: BRAND.headingFont, color: BRAND.headingColor, marginBottom:8, fontSize:20 }}>
          AI Visibility Audit
        </h2>
        <p style={{ color:"#666", fontSize:13, marginBottom:24 }}>Enter your team password to continue</p>
        <input type="password" value={input}
          onChange={e => { setInput(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && (() => { if(input===ACCESS_PASSWORD) setUnlocked(true); else setErr(true); })()}
          placeholder="Password"
          style={{ width:"100%", padding:"11px 14px",
            border:`2px solid ${err ? "#e74c3c" : BRAND.border}`,
            borderRadius:8, fontSize:14, marginBottom:12, color:"#333" }} />
        {err && <p style={{ color:"#e74c3c", fontSize:12, marginBottom:12 }}>Incorrect password</p>}
        <button onClick={() => { if(input===ACCESS_PASSWORD) setUnlocked(true); else setErr(true); }}
          style={{ width:"100%", background: BRAND.primary, color:"#fff", border:"none",
            borderRadius:8, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer",
            textTransform:"uppercase", letterSpacing:"0.05em" }}>
          Enter →
        </button>
      </div>
    </div>
  );
}
function AuditApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [jsPDFReady, setJsPDFReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMounted(true);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => setJsPDFReady(true);
    document.head.appendChild(script);
  }, []);

  if (!mounted) return null;

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null);
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) normalizedUrl = "https://" + normalizedUrl;
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
          setStatus("");
          setLoading(false);
          return;
        }
      }
    } catch(e) { console.warn("Cache check failed:", e.message); }

    setStatus("Researching website…");

    const systemPrompt = `You are an expert AI visibility and digital marketing analyst for ${BRAND.agencyName}.
You evaluate websites for their readiness to appear in AI-powered search platforms: ChatGPT, Google Gemini, Claude, and Perplexity.

Use web search to research the given website thoroughly, then return ONLY a JSON audit report with NO markdown fences.

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
  "ahrefs_data": {
    "domain_rating": null_or_number,
    "organic_traffic": null_or_number,
    "organic_keywords": null_or_number,
    "backlinks": null_or_number,
    "referring_domains": null_or_number
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

        // ── Cache HIT — render immediately and skip loop ──
        if (data.__cached && data.result) {
          setStatus("Loading from cache…");
          const parsed = data.result;
          setResult(parsed);
          setStatus("");
          if (parsed.target_keywords?.items?.length > 0) {
            try {
              const kwList = parsed.target_keywords.items.map(k => k.keyword).join(", ");
              const kwRes = await fetch("/api/ahrefs-keywords", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords: kwList })
              });
              if (kwRes.ok) {
                const kwData = await kwRes.json();
                if (kwData.items?.length > 0) {
                  const enrichedItems = parsedForCache.target_keywords.items.map(item => {
                    const match = kwData.items.find(k => k.keyword?.toLowerCase() === item.keyword?.toLowerCase());
                    return match ? { ...item, volume: String(match.volume||"").replace(/^~/,""), difficulty: match.difficulty??null, intent: match.intent||item.intent, from_ahrefs: true } : item;
                  });
                  parsedForCache = { ...parsedForCache, target_keywords: { ...parsedForCache.target_keywords, items: enrichedItems } };
                  setResult(parsedForCache);
                }
              }
            } catch(e) { console.warn("KW enrichment failed:", e.message); }
          }
          // Save to cache after Ahrefs enrichment
          fetch("/api/save-cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: normalizedUrl, result: parsedForCache })
          }).catch(e => console.warn("Cache save failed:", e.message));
          break;
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

      setResult(parsed); setStatus("");
      let parsedForCache2 = parsed;

      // Always fetch real Ahrefs keyword data server-side (key is in env vars)
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
              setResult(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                updated.target_keywords = { ...prev.target_keywords };
                updated.target_keywords.items = prev.target_keywords.items.map(item => {
                  const match = kwData.items.find(k =>
                    k.keyword?.toLowerCase() === item.keyword?.toLowerCase()
                  );
                  if (match) {
                    return {
                      ...item,
                      volume: match.volume ? String(match.volume).replace(/^~/, "") : item.volume,
                      difficulty: match.difficulty ?? null,
                      intent: match.intent || item.intent,
                      from_ahrefs: true,
                    };
                  }
                  return item;
                });
                updated.target_keywords.real_data = true;
                return updated;
              });
            }
          }
        } catch(e) { console.warn("Keyword enrichment failed:", e.message); }
      }

    } catch(e) {
      setError(e.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const overallColor = result
    ? result.overall_score >= 75 ? BRAND.good : result.overall_score >= 50 ? BRAND.warn : BRAND.bad
    : BRAND.primary;

  const SOCIAL_LINKS = BRAND.socialLinks || [];

  return (
    <div style={{ minHeight:"100vh", background: BRAND.bg, color: BRAND.text, fontFamily:"Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input { outline:none; }
        input::placeholder { color:#bbb; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .run-btn:hover { opacity:0.85 !important; }
        .export-btn:hover { opacity:0.85 !important; }
        .key-toggle:hover { opacity:0.75 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: BRAND.headerBg, borderBottom:`3px solid ${BRAND.primary}`,
        padding:"0 40px", display:"flex", alignItems:"center",
        justifyContent:"space-between", height:70, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <img src={LOGO_B64} alt={BRAND.agencyName} style={{ height: BRAND.logoHeight || 50, objectFit:"contain" }} />
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>

          <div style={{ fontSize:12, color: BRAND.primary, letterSpacing:"0.1em",
            fontWeight:600, textTransform:"uppercase" }}>
            AI Visibility Audit Tool
          </div>
        </div>
      </div>

      
      
      {/* Hero band */}
      <div style={{ background: BRAND.heroBg, padding:"28px 40px 24px" }}>
        <h1 style={{ fontFamily: BRAND.headingFont, color: BRAND.heroText,
          fontSize:28, fontWeight:700, marginBottom:6 }}>
          AI Visibility Audit
        </h1>
        <p style={{ color: BRAND.heroSubText, fontSize:14, maxWidth:600 }}>
          Discover how your website performs across ChatGPT, Gemini, Claude, and Perplexity — and get a clear action plan to improve your AI readiness.
        </p>
      </div>

      <div style={{ maxWidth:880, margin:"0 auto", padding:"32px 24px 40px" }}>

        {/* Input card */}
        <div style={{ background: BRAND.card, border:`1px solid ${BRAND.border}`,
          borderRadius:12, padding:28, marginBottom:32,
          boxShadow: BRAND.cardShadow, animation:"fadeUp 0.4s ease forwards" }}>
          <div style={{ display:"flex", gap:12 }}>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !loading && analyze()}
              placeholder="Enter website URL — e.g. yourbusiness.com"
              style={{ flex:1, background: BRAND.bg, border:`2px solid ${BRAND.border}`,
                borderRadius:8, padding:"13px 16px", color: BRAND.text, fontSize:15,
                fontFamily:"Arial, sans-serif", transition:"border-color 0.2s" }} />
            <button onClick={analyze} disabled={loading || !url.trim()} className="run-btn"
              style={{ background: loading ? "#aaa" : BRAND.primary, color:"#fff",
                border:"none", borderRadius:8, padding:"13px 28px",
                fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap",
                transition:"opacity 0.2s" }}>
              {loading ? "Analyzing…" : "Run Audit →"}
            </button>
          </div>

          {loading && (
            <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:10 }}>
              <LoadingDots />
              <span style={{ color: BRAND.textMuted, fontSize:13 }}>{status}</span>
            </div>
          )}
          {error && <div style={{ marginTop:12, color:"#c0392b", fontSize:13,
            padding:"10px 14px", background:"#fdecea", borderRadius:6, border:"1px solid #f5c6cb" }}>
            ⚠ {error}
          </div>}
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation:"fadeUp 0.5s ease forwards" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              marginBottom:24, gap:16 }}>
              <div>
                <h2 style={{ fontFamily: BRAND.headingFont, fontSize:26, fontWeight:700,
                  color: BRAND.headingColor, marginBottom:4 }}>{result.business_name}</h2>
                <p style={{ color: BRAND.textMuted, fontSize:13 }}>{result.business_description}</p>
              </div>
              <button onClick={() => exportToPDF(result, url)} className="export-btn"
                disabled={!jsPDFReady}
                style={{ background: BRAND.primary, color:"#fff", border:"none", borderRadius:8,
                  padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer",
                  letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap",
                  flexShrink:0, marginLeft:16, transition:"opacity 0.2s" }}>
                ↓ Export PDF
              </button>
            </div>

            {/* Ahrefs real data panel */}
            {result.ahrefs_data && <AhrefsDataPanel data={result.ahrefs_data} />}

            {/* Scores */}
            <div style={{ background: BRAND.card, border:`1px solid ${BRAND.border}`,
              borderRadius:12, padding:24, marginBottom:24, boxShadow: BRAND.cardShadow }}>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:110, padding:"8px 0" }}>
                  <ScoreRing score={result.overall_score} size={96} color={overallColor} />
                  <div style={{ marginTop:6, color: BRAND.textMuted, fontSize:11,
                    fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Overall</div>
                </div>
                <div style={{ flex:1, display:"flex", gap:10, flexWrap:"wrap" }}>
                  {PLATFORMS.map(p => <PlatformScore key={p.id} platform={p.id} score={result.platform_scores?.[p.id]} />)}
                </div>
              </div>
            </div>

            {/* Wins */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
              {[["TOP WINS",result.top_wins,BRAND.good,BRAND.goodBg,"✓"],
                ["QUICK WINS",result.quick_wins,BRAND.warn,BRAND.warnBg,"→"]].map(([title,items,color,bg,sym]) => (
                <div key={title} style={{ background: BRAND.card, border:`1px solid ${BRAND.border}`,
                  borderRadius:10, padding:20, boxShadow: BRAND.cardShadow }}>
                  <div style={{ color, fontSize:11, fontWeight:700, letterSpacing:"0.1em",
                    textTransform:"uppercase", marginBottom:12 }}>{title}</div>
                  {items?.map((item,i) => (
                    <div key={i} style={{ display:"flex", gap:8, marginBottom:8, padding:"6px 10px",
                      background:bg, borderRadius:6, alignItems:"flex-start" }}>
                      <span style={{ color, fontWeight:700, flexShrink:0 }}>{sym}</span>
                      <span style={{ color: BRAND.text, fontSize:13, lineHeight:1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Audit factors */}
            <div style={{ marginBottom:24 }}>
              <h3 style={{ fontFamily: BRAND.headingFont, fontSize:16, color: BRAND.headingColor,
                fontWeight:700, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${BRAND.border}` }}>
                Audit Factors
                <span style={{ fontSize:12, color: BRAND.textMuted, fontWeight:400,
                  fontFamily:"Arial, sans-serif", marginLeft:10 }}>— click any row to expand</span>
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {FACTORS.map(f => <FactorCard key={f.id} factor={f.id} data={result.factors?.[f.id]} />)}
              </div>
            </div>

            {/* Content & keyword sections */}
            <div style={{ marginTop:8 }}>
              <h3 style={{ fontFamily: BRAND.headingFont, fontSize:16, color: BRAND.headingColor,
                fontWeight:700, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${BRAND.border}` }}>
                Content & Keyword Opportunities
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <NewSectionCard section="blog_topics"       data={result.blog_topics} />
                <NewSectionCard section="pages_to_optimize" data={result.pages_to_optimize} />
                <NewSectionCard section="target_keywords"   data={result.target_keywords} />
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign:"center", paddingTop:60, opacity:0.45 }}>
            <div style={{ fontSize:52, marginBottom:16 }}>▶</div>
            <div style={{ fontSize:14, color: BRAND.textMuted, fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.1em" }}>
              Enter a URL above to begin your audit
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: BRAND.footerBg, padding:"20px 40px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <span style={{ color: BRAND.footerText, fontSize:13 }}>
          Copyright &copy; 2026 {BRAND.agencyName}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {SOCIAL_LINKS.map(({ href, label, svg }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.15)",
                transition:"background 0.2s", textDecoration:"none" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="white" dangerouslySetInnerHTML={{ __html: svg }} />
            </a>
          ))}
        </div>
        <span style={{ color: BRAND.footerText, fontSize:12 }}>AI Visibility Audit Tool</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Head><title>AI Visibility Audit</title></Head>
      <PasswordGate><AuditApp /></PasswordGate>
    </>
  );
}
