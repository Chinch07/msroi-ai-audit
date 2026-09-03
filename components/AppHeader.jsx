import { BRAND } from "../lib/brand";

/**
 * Minimal brand header — real logo mark + kicker label, hairline bottom
 * border. This is a standalone tool, not a marketing page, so it
 * intentionally skips the real site's mega-menu; `right` accepts an
 * optional slot (the internal tool uses it for the signed-in email +
 * sign-out link).
 */
export default function AppHeader({ label = "AI Visibility Audit", right = null }) {
  return (
    <>
      {/* The label is decorative context (the page's own H1 says what it
          needs to say) — on narrow phones there isn't room for it next to
          the logo without the two colliding, so it drops first rather than
          squeezing into the logo. `gap` on the header is a floor under
          space-between, so even before that breakpoint the label can never
          sit flush against the logo. */}
      <style>{`
        @media (max-width: 560px) {
          .app-header-label { display: none; }
        }
      `}</style>
      <header
        style={{
          background: BRAND.surface,
          borderBottom: `1px solid ${BRAND.hair}`,
          padding: `20px ${BRAND.sectionPaddingInline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          rowGap: 10,
        }}
      >
        {/* Official logo, used as-is, never re-typeset — matches the real
            header's h-7 (28px) sizing. The wordmark's glyphs sit slightly
            above true vertical center within the SVG's viewBox, so a small
            nudge down keeps it visually centered against the kicker label
            on the right rather than optically "floating" high. */}
        <img
          src="/logo.png"
          alt="Main Street ROI"
          style={{ height: 28, width: "auto", marginTop: 5, flexShrink: 0 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span
            className="app-header-label"
            style={{
              fontFamily: BRAND.fontText,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: BRAND.kickerTracking,
              textTransform: "uppercase",
              color: BRAND.muted,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          {right}
        </div>
      </header>
    </>
  );
}
