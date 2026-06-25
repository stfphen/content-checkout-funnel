"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

// Pinned, dismissible banner that surfaces how many funding-scan leads still need
// human review. Replaces the old pattern where the only review signal was the
// per-lead checklist buried mid-card. Dismissal is local/session-only (mock-data,
// no persistence layer touched); it reappears on reload if work remains.
export function FundingReviewBanner({ count, targetId = "funding-scan-leads" }) {
  const [dismissed, setDismissed] = useState(false);
  if (!count || dismissed) return null;

  return (
    <div className="funding-review-banner" role="status" aria-live="polite">
      <span className="funding-review-banner__icon" aria-hidden="true">
        <AlertTriangle size={18} strokeWidth={2} />
      </span>
      <p className="funding-review-banner__text">
        {count} funding {count === 1 ? "lead needs" : "leads need"} human review.{" "}
        <a className="funding-review-banner__link" href={`#${targetId}`}>
          Review now
        </a>
      </p>
      <button
        type="button"
        className="funding-review-banner__close"
        aria-label="Dismiss review reminder"
        onClick={() => setDismissed(true)}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
