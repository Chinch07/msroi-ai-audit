import { useEffect, useState } from "react";
import { BRAND } from "../lib/brand";

/**
 * Shared score gauge. `color` overrides the ring/number color (used for
 * per-platform brand colors); otherwise the ring falls back to the
 * good/warn/bad status triad, which is deliberately NOT brand red — see
 * lib/brand.js.
 */
export default function ScoreRing({ score, size = 100, color, trackColor, onDark = false }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const statusColor = score >= 75 ? BRAND.good : score >= 50 ? BRAND.warn : BRAND.bad;
  const ringColor = color || statusColor;
  const track = trackColor || (onDark ? BRAND.hairDark : BRAND.hair);
  const textColor = onDark ? BRAND.inkOnDark : BRAND.ink;

  const r = (size - size * 0.2) / 2;
  const c = 2 * Math.PI * r;
  const fill = mounted ? (score / 100) * c : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={size * 0.09} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth={size * 0.09}
        strokeDasharray={`${fill} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: `stroke-dasharray 1s ${BRAND.ease}` }}
      />
      <text
        x={size / 2}
        y={size / 2 + size * 0.07}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="600"
        fill={textColor}
        fontFamily={BRAND.fontText}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}
      </text>
    </svg>
  );
}
