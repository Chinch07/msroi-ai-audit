// Agency identity strings. Companion to lib/brand.js: brand.js is how the
// app looks, this is what it calls itself. Both are intended to be the only
// files that differ from the sibling app (aimediagroup-ai-audit).
//
// Server code must NOT read CONTACT_EMAIL for anything security-relevant —
// it's display copy. The real notification recipient is LEAD_NOTIFY_TO and
// the real access rules are INTERNAL_ALLOWLIST / MEMBER_ALLOWLIST.

export const AGENCY = {
  name: "Main Street ROI",
  domain: "mainstreetroi.com",
  contactEmail: "info@mainstreetroi.com",
  emailPlaceholder: "you@mainstreetroi.com",
  toolName: "AI Visibility Audit",
};
