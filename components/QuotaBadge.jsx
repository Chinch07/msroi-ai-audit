import { BRAND } from "../lib/brand";

/**
 * Remaining-audits indicator for member accounts. Renders nothing for
 * internal staff (who have no quota) and nothing until usage has actually
 * loaded — showing a placeholder number a paying client might misread as
 * their real balance is worse than showing nothing for a moment.
 *
 * Display only. The authority is spendMemberCredit(); this can be stale.
 */
export default function QuotaBadge({ usage }) {
  if (!usage) return null;
  const { remaining, limit } = usage;
  const exhausted = remaining <= 0;
  const low = !exhausted && remaining <= Math.max(1, Math.floor(limit * 0.2));
  const color = exhausted ? BRAND.bad : low ? BRAND.warn : BRAND.muted;
  const bg = exhausted ? BRAND.badBg : low ? BRAND.warnBg : BRAND.base;

  return (
    <span
      title={`Resets on the 1st of each month`}
      style={{
        color,
        background: bg,
        border: `1px solid ${exhausted ? BRAND.bad : low ? BRAND.warn : BRAND.hair}`,
        borderRadius: BRAND.radius,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: BRAND.fontText,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      {remaining} of {limit} audits left
    </span>
  );
}
