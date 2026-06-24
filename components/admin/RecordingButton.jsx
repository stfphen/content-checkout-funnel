"use client";

import { useRef, useState } from "react";

// Minimal recording control: a single play/pause button that streams the call
// recording — no scrubber. Used in the Calls log and the lead Call panel.
export default function RecordingButton({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!src) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  return (
    <span className="rec-player">
      <button
        type="button"
        className="rec-player__btn"
        onClick={toggle}
        aria-label={playing ? "Pause recording" : "Play recording"}
        aria-pressed={playing}
        title={playing ? "Pause recording" : "Play recording"}
      >
        {playing ? (
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
            <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3.5 1.8 12 7 3.5 12.2 Z" fill="currentColor" />
          </svg>
        )}
      </button>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </span>
  );
}
