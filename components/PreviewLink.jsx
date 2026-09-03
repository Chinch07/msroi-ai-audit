import { useEffect, useState } from "react";
import { BRAND } from "../lib/brand";
import Card from "./Card";

const COPIED_RESET_MS = 2000;

/**
 * The shareable /audit/<id> link for a cached audit, with a copy button.
 *
 * The absolute URL is built from window.location on the client rather than
 * from a server-rendered APP_BASE_URL, so the link always points at the
 * origin the user is actually on (localhost, a Vercel preview deployment,
 * production) instead of at whatever the env var says.
 *
 * Hidden from print — the PDF export is the report, not the link to it.
 */
export default function PreviewLink({ auditId }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(t);
  }, [copied]);

  if (!auditId) return null;

  const path = `/audit/${auditId}`;
  const absolute = origin ? origin + path : path;

  // navigator.clipboard is unavailable on insecure origins and can reject
  // when the permission is denied; falling back to selecting the input lets
  // the user copy manually rather than leaving a button that does nothing.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
    } catch {
      const field = document.getElementById("preview-link-field");
      field?.select();
    }
  };

  return (
    <Card
      className="no-print"
      style={{ padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center",
        gap: 12, flexWrap: "wrap" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 220 }}>
        <span style={{ color: BRAND.muted, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: BRAND.fontText }}>
          Shareable link
        </span>
        <input
          id="preview-link-field"
          readOnly
          value={absolute}
          onFocus={(e) => e.target.select()}
          style={{ border: "none", background: "transparent", padding: 0, width: "100%",
            color: BRAND.ink, fontSize: 13, fontFamily: BRAND.fontText, textOverflow: "ellipsis" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: BRAND.muted, fontSize: 12, fontFamily: BRAND.fontText }}>
          Sign-in required
        </span>
        <button
          type="button"
          onClick={copy}
          style={{ border: `1px solid ${BRAND.ink}`, background: "transparent", color: BRAND.ink,
            borderRadius: BRAND.radius, padding: "8px 16px", fontSize: 13, fontWeight: 600,
            fontFamily: BRAND.fontText, cursor: "pointer" }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </Card>
  );
}
