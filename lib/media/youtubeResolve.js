import { safeFetch } from "../enrichment/ssrfGuard.js";
import { parseYouTubeUrl, sanitizeHeroVideo, uploadsPlaylistFor } from "./youtube.js";

/**
 * Server-side resolution of a pasted YouTube URL into a ready-to-store
 * heroVideo block. Network is needed only for channel handles (@handle, /c/,
 * /user/) whose channel id isn't in the URL:
 * - With YOUTUBE_API_KEY: Data API v3 (forHandle / forUsername).
 * - Without (or for /c/ custom URLs the API can't look up): fetch the public
 *   channel page through safeFetch (SSRF-guarded) and extract the canonical
 *   "channelId":"UC…" marker.
 * oEmbed enrichment (title/thumbnail, keyless) is best-effort — failures only
 * omit the metadata.
 */

const CHANNEL_ID_IN_PAGE = /"channelId":"(UC[A-Za-z0-9_-]{22})"/;
const REQUEST_TIMEOUT_MS = 8000;

function resolveError(message) {
  const error = new Error(message);
  error.name = "YouTubeResolveError";
  return error;
}

function withTimeout(options = {}) {
  return { ...options, signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS) };
}

async function channelIdFromDataApi(parsed, apiKey, fetchImpl) {
  // The Data API has no lookup for legacy /c/ custom URLs — page scrape covers those.
  if (parsed.handleType === "c") return "";
  const param =
    parsed.handleType === "user"
      ? `forUsername=${encodeURIComponent(parsed.handle)}`
      : `forHandle=${encodeURIComponent(`@${parsed.handle}`)}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&${param}&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetchImpl(url, withTimeout());
    if (!response.ok) return "";
    const data = await response.json();
    const id = data?.items?.[0]?.id;
    return typeof id === "string" ? id : "";
  } catch {
    return "";
  }
}

async function channelIdFromPage(parsed, fetchImpl, lookup) {
  const path =
    parsed.handleType === "handle"
      ? `/@${parsed.handle}`
      : `/${parsed.handleType}/${parsed.handle}`;
  try {
    const response = await safeFetch(
      `https://www.youtube.com${path}`,
      withTimeout({ headers: { "Accept-Language": "en" } }),
      { fetchImpl, lookup }
    );
    if (!response.ok) return "";
    const html = await response.text();
    const match = CHANNEL_ID_IN_PAGE.exec(html);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

async function fetchOEmbedMeta(targetUrl, fetchImpl) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    const response = await fetchImpl(url, withTimeout());
    if (!response.ok) return { title: "", thumbnail: "" };
    const data = await response.json();
    return {
      title: typeof data?.title === "string" ? data.title : "",
      thumbnail: typeof data?.thumbnail_url === "string" ? data.thumbnail_url : ""
    };
  } catch {
    return { title: "", thumbnail: "" };
  }
}

/**
 * @param {string} url    Pasted YouTube URL.
 * @param {object} [opts]
 * @param {"video"|"playlist"} [opts.prefer]  When the URL names both a video
 *   and a playlist (watch?v=…&list=…), which one to store.
 * @param {Function} [opts.fetchImpl]         Injectable for tests.
 * @param {Function} [opts.lookup]            Injectable DNS lookup (safeFetch).
 * @returns {Promise<{heroVideo: object, meta: {title, thumbnail, detected}}>}
 * @throws {Error} name "YouTubeResolveError" → route maps to 400.
 */
export async function resolveYouTubeInput(url, { prefer, fetchImpl = fetch, lookup } = {}) {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) {
    throw resolveError(
      "That doesn't look like a YouTube video, playlist, or channel link."
    );
  }

  let { kind, videoId, playlistId } = parsed;

  if (kind === "video" && prefer === "playlist" && parsed.playlistId) {
    kind = "playlist";
    videoId = "";
  } else if (kind === "video" && prefer === "video") {
    playlistId = "";
  }

  if (kind === "channel" && parsed.needsResolution) {
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    let channelId = apiKey ? await channelIdFromDataApi(parsed, apiKey, fetchImpl) : "";
    if (!channelId) channelId = await channelIdFromPage(parsed, fetchImpl, lookup);
    playlistId = uploadsPlaylistFor(channelId);
    if (!playlistId) {
      throw resolveError(
        "Could not resolve that channel. Try the channel's /channel/UC… URL instead."
      );
    }
  }

  const heroVideo = sanitizeHeroVideo({
    url,
    kind,
    videoId: kind === "video" ? videoId : "",
    playlistId: kind === "video" ? "" : playlistId
  });
  if (!heroVideo.kind) {
    throw resolveError("Could not extract a playable video, playlist, or channel from that link.");
  }

  // Best-effort title/thumbnail for the admin UI (keyless oEmbed).
  let meta = { title: "", thumbnail: "" };
  if (heroVideo.kind === "video") {
    meta = await fetchOEmbedMeta(`https://www.youtube.com/watch?v=${heroVideo.videoId}`, fetchImpl);
  } else if (heroVideo.kind === "playlist") {
    meta = await fetchOEmbedMeta(
      `https://www.youtube.com/playlist?list=${heroVideo.playlistId}`,
      fetchImpl
    );
  }

  return {
    heroVideo,
    meta: {
      ...meta,
      // Both ids from the original URL so the UI can offer video-vs-playlist.
      detected: { videoId: parsed.videoId, playlistId: parsed.playlistId }
    }
  };
}
