"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { hasHeroVideo } from "../lib/media/youtube";

/**
 * Muted, looping, non-interactive YouTube background for the funnel hero.
 * kind=video loops one video; kind=playlist plays in order and loops;
 * kind=channel plays the channel's uploads playlist shuffled (embeds cap
 * playlists at 200 items — accepted).
 *
 * Design rules (see 52-Decision-Log 2026-07-03):
 * - IFrame Player API for ALL kinds: the iframe is revealed only on a real
 *   PLAYING event, so a deleted video / blocked embed / refused autoplay just
 *   leaves the hero image (which always stays underneath as poster + LCP).
 * - Mounting is deferred to idle so the image paints (LCP) before any YouTube
 *   bytes move; SSR renders an empty div (hydration-safe by construction).
 * - Failure -> silent image fallback via a 10s no-PLAYING watchdog + onError.
 * - prefers-reduced-motion renders nothing (plus a CSS display:none guard).
 */

const WATCHDOG_MS = 10000;
const MAX_ERROR_SKIPS = 3;

// Singleton loader for https://www.youtube.com/iframe_api (dedupes strict-mode
// double-mounts and multiple heroes; onerror resets so a later mount retries).
let ytApiPromise;
function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        ytApiPromise = undefined;
        reject(new Error("yt-api-blocked"));
      };
      document.head.appendChild(script);
    });
  }
  return ytApiPromise;
}

function idleCall(fn) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}

export default function YouTubeHeroPlayer({ video }) {
  const reducedMotion = useReducedMotion();
  const targetRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const playable = hasHeroVideo(video);
  const kind = video?.kind;
  const videoId = video?.videoId || "";
  const playlistId = video?.playlistId || "";

  useEffect(() => {
    if (!playable || reducedMotion || typeof window === "undefined") return undefined;

    let cancelled = false;
    let player = null;
    let watchdog = null;
    const listConfigured = { current: false };
    const errorSkips = { current: 0 };

    // Every YT call goes through this so a torn-down player can't throw into React.
    const safe = (fn) => {
      try {
        return fn();
      } catch {
        return undefined;
      }
    };

    const fail = () => {
      if (cancelled) return;
      window.clearTimeout(watchdog);
      safe(() => player?.destroy());
      player = null;
      setFailed(true);
    };

    const cancelIdle = idleCall(async () => {
      let YT;
      try {
        YT = await loadYouTubeApi();
      } catch {
        fail();
        return;
      }
      if (cancelled || !targetRef.current) return;

      watchdog = window.setTimeout(fail, WATCHDOG_MS);

      const playerVars = {
        autoplay: 1,
        mute: 1,
        controls: 0,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        origin: window.location.origin,
        ...(kind === "video"
          ? { loop: 1, playlist: videoId }
          : { listType: "playlist", list: playlistId })
      };

      try {
        player = new YT.Player(targetRef.current, {
          host: "https://www.youtube-nocookie.com",
          ...(kind === "video" ? { videoId } : {}),
          playerVars,
          events: {
            onReady: (event) => {
              safe(() => {
                event.target.mute();
                event.target.playVideo();
                const iframe = event.target.getIframe();
                if (iframe) {
                  iframe.title = "Background video";
                  iframe.tabIndex = -1;
                  iframe.referrerPolicy = "strict-origin-when-cross-origin";
                }
              });
            },
            onStateChange: (event) => {
              if (cancelled || event.data !== YT.PlayerState.PLAYING) return;
              window.clearTimeout(watchdog);
              if ((kind === "playlist" || kind === "channel") && !listConfigured.current) {
                listConfigured.current = true;
                safe(() => event.target.setLoop(true));
                if (kind === "channel") {
                  const jumped = safe(() => {
                    event.target.setShuffle(true);
                    const count = event.target.getPlaylist()?.length ?? 0;
                    if (count > 1) {
                      // Jump into the shuffled order so the hero doesn't always
                      // open on the newest upload; the re-buffer's own PLAYING
                      // event reveals the iframe.
                      event.target.playVideoAt(Math.floor(Math.random() * count));
                      return true;
                    }
                    return false;
                  });
                  if (jumped) return;
                }
              }
              setPlaying(true);
            },
            onError: () => {
              if (cancelled) return;
              if (kind !== "video" && errorSkips.current < MAX_ERROR_SKIPS) {
                errorSkips.current += 1;
                safe(() => player?.nextVideo());
                return;
              }
              fail();
            }
          }
        });
      } catch {
        fail();
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
      window.clearTimeout(watchdog);
      safe(() => player?.destroy());
      player = null;
    };
  }, [playable, reducedMotion, kind, videoId, playlistId]);

  // reducedMotion is null on the server/first paint — render the (empty,
  // invisible) wrapper then; only a confirmed `true` suppresses the video.
  if (!playable || reducedMotion === true || failed) return null;

  return (
    <div className={`hero__video${playing ? " is-playing" : ""}`} aria-hidden="true">
      <div ref={targetRef} />
    </div>
  );
}
