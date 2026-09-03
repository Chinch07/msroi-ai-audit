import { BRAND } from "../lib/brand";
import { AGENCY } from "../lib/agency";

/** Minimal dark footer band — no sitemap, just copyright + tool name. */
export default function AppFooter() {
  return (
    <footer
      style={{
        background: BRAND.groundDark,
        borderTop: `1px solid ${BRAND.hairDark}`,
        padding: "20px clamp(1.5rem, 5vw, 3rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <span style={{ color: BRAND.inkOnDarkMuted, fontSize: 13, fontFamily: BRAND.fontText }}>
        Copyright &copy; {new Date().getFullYear()} {AGENCY.name}
      </span>
      <span
        style={{
          color: BRAND.inkOnDarkMuted,
          fontSize: 12,
          fontFamily: BRAND.fontText,
          letterSpacing: BRAND.kickerTracking,
          textTransform: "uppercase",
        }}
      >
        AI Visibility Audit Tool
      </span>
    </footer>
  );
}
