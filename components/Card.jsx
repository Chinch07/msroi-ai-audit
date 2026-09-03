import { BRAND } from "../lib/brand";

/**
 * Flat card wrapper — hairline border, 2px radius, NO box-shadow. The real
 * site's doctrine is explicitly "flat; no shadows, no glow"; do not add
 * boxShadow to `style` here even for an "active"/"open" state — use the
 * border color instead (see FactorCard in pages for the pattern).
 */
export default function Card({ children, dark = false, style = {}, onClick, className, id }) {
  // Interactive cards (FactorCard's expand/collapse) need keyboard parity
  // with the click handler — a bare onClick div is mouse-only otherwise.
  const interactive = typeof onClick === "function";
  return (
    <div
      id={id}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      className={className}
      style={{
        background: dark ? BRAND.groundDark : BRAND.surface,
        border: `1px solid ${dark ? BRAND.hairDark : BRAND.hair}`,
        borderRadius: BRAND.radius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
