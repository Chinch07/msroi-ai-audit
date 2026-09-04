import { BRAND } from "../lib/brand";

/**
 * Uppercase tracked eyebrow label with a short leading hairline tick,
 * matching the real site's kicker pattern (used above every H1 and
 * section header). `onDark` swaps the muted tone and tick color for use on
 * BRAND.groundDark.
 */
export default function Kicker({ children, onDark = false, style = {} }) {
  const color = onDark ? BRAND.inkOnDarkMuted : BRAND.muted;
  const tick = onDark ? BRAND.hairDark : BRAND.hair;
  return (
    <p
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: 0,
        fontFamily: BRAND.fontText,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: BRAND.kickerTracking,
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      <span aria-hidden style={{ display: "inline-block", width: 24, height: 1, background: tick }} />
      {children}
    </p>
  );
}
