import { useState } from "react";
import { BRAND } from "../lib/brand";

/**
 * Shared button primitives, ported from the shared audit-tool component library's
 * ui.tsx (CtaButton / GhostButton). Rendered as plain <button>/<a> here
 * since every call site fires a local handler rather than Next `Link`
 * navigation. Red is reserved for CtaButton — never use it for a "bad"
 * state, an error, or a secondary action.
 */
export function CtaButton({ children, onClick, href, disabled, type = "button", className, style = {} }) {
  const [hover, setHover] = useState(false);
  // Exact match to the real site's form Send button (ContactForm.tsx):
  // gap-2 (8px), px-7 py-3.5 (28px/14px), disabled:opacity-60 — the red
  // fill itself never changes on disabled, only its opacity does.
  const shared = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: BRAND.radius,
    background: hover && !disabled ? BRAND.primaryInk : BRAND.primary,
    opacity: disabled ? 0.6 : 1,
    color: "#fff",
    border: "none",
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: BRAND.fontText,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: `background-color 200ms ${BRAND.ease}`,
    textDecoration: "none",
    whiteSpace: "nowrap",
    ...style,
  };
  const arrow = <span aria-hidden>&rarr;</span>;
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
  if (href) {
    // An <a> can't be natively disabled — strip the href and block
    // activation instead, so a disabled link CTA can't still navigate.
    return (
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={className}
        style={{ ...shared, pointerEvents: disabled ? "none" : undefined }}
        {...handlers}
      >
        {children} {arrow}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={shared} {...handlers}>
      {children} {arrow}
    </button>
  );
}

/** Hairline-border secondary button. `onDark` swaps to the dark-frame
 *  treatment. Pass `href` for a link (e.g. the header's sign-out action)
 *  instead of `onClick` for a button. */
export function GhostButton({ children, onClick, href, onDark = false, disabled, type = "button", style = {} }) {
  const [hover, setHover] = useState(false);
  const borderColor = onDark ? (hover ? BRAND.primary : BRAND.hairDark) : hover ? BRAND.primary : BRAND.ink;
  const shared = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    borderRadius: BRAND.radius,
    border: `1px solid ${borderColor}`,
    background: "transparent",
    color: onDark ? BRAND.inkOnDark : BRAND.ink,
    padding: "13px 28px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: BRAND.fontText,
    textDecoration: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: `border-color 200ms ${BRAND.ease}`,
    ...style,
  };
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        style={{ ...shared, pointerEvents: disabled ? "none" : undefined }}
        {...handlers}
      >
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={shared} {...handlers}>
      {children}
    </button>
  );
}
