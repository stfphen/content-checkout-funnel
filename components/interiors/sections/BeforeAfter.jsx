"use client";

import { useState } from "react";
import styles from "../Interiors.module.css";

// Before/after comparison. A full-surface range input drives the reveal, so
// the slider is keyboard- and touch-accessible out of the box (arrow keys move
// the divider). Direct manipulation only: position follows the input value
// with no animation, which also makes it reduced-motion safe by construction.
export default function BeforeAfter({ pair }) {
  // pair.initial biases the resting split when the "before" story lives in
  // one region of the frame (e.g. wiring on the right half); default 50.
  const [position, setPosition] = useState(() => {
    const initial = Number(pair?.initial);
    return Number.isFinite(initial) ? Math.min(95, Math.max(5, initial)) : 50;
  });
  const before = pair?.before || {};
  const after = pair?.after || {};

  if (!before.src || !after.src) return null;

  return (
    <div className={styles.baBlock}>
      <div className={styles.baFrame}>
        <img src={before.src} alt={before.alt || ""} loading="lazy" />
        {/* After overlay occupies the right of the divider so the labels
            (before left, after right) match what is actually shown. */}
        <div
          className={styles.baAfter}
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <img src={after.src} alt={after.alt || ""} loading="lazy" />
        </div>
        <span className={styles.baTag + " " + styles.baTagBefore} aria-hidden="true">
          Before
        </span>
        <span className={styles.baTag + " " + styles.baTagAfter} aria-hidden="true">
          After
        </span>
        <input
          type="range"
          className={styles.baRange}
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Reveal the after photo"
        />
        <div className={styles.baDivider} style={{ left: `${position}%` }} />
        <div className={styles.baHandle} style={{ left: `${position}%` }} aria-hidden="true">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M5 1 1 6l4 5M11 1l4 5-4 5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
      </div>
      {pair.caption && <p className={styles.baCaption}>{pair.caption}</p>}
    </div>
  );
}
