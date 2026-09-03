// Main Street ROI brand tokens. Single source of truth for this app — do
// not redefine these values inline in a page or component; import from here.
//
// This file is the ONLY intended difference between this app and its sibling
// (aimediagroup-ai-audit). Both render the same components from the same
// component library; swapping this file is what makes one look like Main
// Street ROI and the other like Ai Media Group. Keep the exported shape
// identical to the sibling's so a component written against one works
// unmodified against the other.
//
// LOCKED:
// - green #007513 is the ONE brand accent, hover/focus #005c0f. Never reused
//   for the score-triad "good" state or form-validation errors — see
//   `status` below. Those are semantic colors and stay independent of brand.
// - Flat: no shadows, no glow, hairline borders instead. Radius is 8px
//   (softer than the sibling's 2px) to match Main Street ROI's existing look.
// - Roboto Slab for display/headings, Arial for body text.

export const BRAND = {
  // ---- Core palette --------------------------------------------------
  ink: "#1a1a1a",        // headlines, metrics, anchors on light
  groundDark: "#1a5c1a", // dark frames: hero band, footer
  base: "#f7f9f7",       // the single light base, warm off-white
  surface: "#ffffff",    // one optional lifted surface; never for banding
  body: "#3f4145",       // paragraph text on light
  muted: "#6e7176",      // kickers, labels, secondary on light

  inkOnDark: "#ffffff",      // headline + primary text on the green frame
  inkOnDark2: "#dbe8db",     // subheads, readable copy on the green frame
  inkOnDarkMuted: "#a8c4a8", // kickers + secondary labels on the green frame

  hair: "#e0e5e0",     // hairline on light
  hairDark: "#2d6b2d", // hairline on the green frame

  primary: "#007513",    // Main Street ROI green, the single accent
  primaryInk: "#005c0f", // hover/focus of primary elements only

  // ---- Score-status triad (semantic, independent of brand) -----------
  // `good` is deliberately a different, muted green from the brand accent:
  // a score badge must read as "this score is healthy," not as "this is a
  // Main Street ROI button."
  good: "#2d7a2d",
  goodBg: "#eaf3ea",
  warn: "#c47f00",
  warnBg: "#fdf2e2",
  bad: "#c0392b",
  badBg: "#fbeae8",

  // ---- Secondary content-category accents ----------------------------
  // Never the brand green — that stays the one reserved CTA accent, not a
  // decorative category tag.
  info: "#317a9d",
  infoBg: "#e9f1f5",
  sec1: "#317a9d",
  sec1Bg: "#e9f1f5",
  sec2: "#c47f00",
  sec2Bg: "#fdf2e2",

  // ---- Type ------------------------------------------------------------
  // Roboto Slab is loaded in pages/_document.js. Georgia is the fallback so
  // a failed font load still renders a slab/serif headline rather than
  // silently collapsing the display face into the body face.
  fontDisplay: '"Roboto Slab", Georgia, "Times New Roman", serif',
  fontText: 'Arial, Helvetica, sans-serif',

  textDisplayFluid: "clamp(2.375rem, 1rem + 6vw, 4.5rem)", // hero-grade headline
  textH1Fluid: "clamp(2.25rem, 1rem + 4vw, 3.25rem)",      // page-level H1
  textH2Fluid: "clamp(1.75rem, 1rem + 2.5vw, 2.375rem)",
  textH3: "1.75rem",
  textBodyLg: "1.25rem",

  // ---- Shape / motion ---------------------------------------------------
  radius: "8px",
  ease: "cubic-bezier(0.2, 0.6, 0.2, 1)",
  kickerTracking: "0.14em",
  sectionPaddingInline: "clamp(1.5rem, 5vw, 3rem)",
};

// Convenience shadow-free card styles — spread into a style object, never
// add boxShadow alongside these (the doctrine is flat, no shadow/glow).
export const cardStyle = {
  background: BRAND.surface,
  border: `1px solid ${BRAND.hair}`,
  borderRadius: BRAND.radius,
};

export const cardStyleDark = {
  background: BRAND.groundDark,
  border: `1px solid ${BRAND.hairDark}`,
  borderRadius: BRAND.radius,
};

// Translucent form-field treatment for inputs sitting directly on the dark
// green frame. A plain white input box on a dark band reads as a foreign
// component dropped onto the page — this keeps a field feeling like part of
// the surface it sits on.
export const darkFieldStyle = {
  background: "rgba(255, 255, 255, 0.06)",
  border: `1px solid rgba(219, 232, 219, 0.28)`,
  borderRadius: BRAND.radius,
  color: BRAND.inkOnDark,
};
