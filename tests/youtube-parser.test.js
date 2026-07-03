import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_HERO_VIDEO,
  hasHeroVideo,
  parseYouTubeUrl,
  sanitizeHeroVideo,
  uploadsPlaylistFor
} from "../lib/media/youtube.js";

const VID = "dQw4w9WgXcQ";
const LIST = "PLBCF2DAC6FFB574DE";
const CHANNEL = "UC" + "a".repeat(22);
const UPLOADS = "UU" + "a".repeat(22);

test("parseYouTubeUrl classifies every supported URL form", () => {
  const cases = [
    // [input, expected subset]
    [`https://www.youtube.com/watch?v=${VID}`, { kind: "video", videoId: VID, playlistId: "" }],
    [`https://youtube.com/watch?v=${VID}&t=42s`, { kind: "video", videoId: VID }],
    [`https://m.youtube.com/watch?v=${VID}`, { kind: "video", videoId: VID }],
    [`https://youtu.be/${VID}`, { kind: "video", videoId: VID }],
    [`https://youtu.be/${VID}?si=xyz`, { kind: "video", videoId: VID }],
    [`www.youtube.com/watch?v=${VID}`, { kind: "video", videoId: VID }], // scheme-less
    [`https://www.youtube.com/shorts/${VID}`, { kind: "video", videoId: VID }],
    [`https://www.youtube.com/live/${VID}`, { kind: "video", videoId: VID }],
    [`https://www.youtube.com/embed/${VID}`, { kind: "video", videoId: VID }],
    [`https://www.youtube-nocookie.com/embed/${VID}`, { kind: "video", videoId: VID }],
    [`https://www.youtube.com/playlist?list=${LIST}`, { kind: "playlist", playlistId: LIST }],
    [`https://www.youtube.com/embed/videoseries?list=${LIST}`, { kind: "playlist", playlistId: LIST }],
    [`https://www.youtube.com/watch?list=${LIST}`, { kind: "playlist", playlistId: LIST }],
    // Both v= and list= → video, with the playlist offered alongside:
    [
      `https://www.youtube.com/watch?v=${VID}&list=${LIST}&index=3`,
      { kind: "video", videoId: VID, playlistId: LIST }
    ],
    [
      `https://www.youtube.com/channel/${CHANNEL}`,
      { kind: "channel", channelId: CHANNEL, playlistId: UPLOADS, needsResolution: false }
    ],
    [
      "https://www.youtube.com/@SomeCreator",
      { kind: "channel", handle: "SomeCreator", handleType: "handle", needsResolution: true }
    ],
    [
      "https://www.youtube.com/c/SomeStudio",
      { kind: "channel", handle: "SomeStudio", handleType: "c", needsResolution: true }
    ],
    [
      "https://www.youtube.com/user/legacyname",
      { kind: "channel", handle: "legacyname", handleType: "user", needsResolution: true }
    ]
  ];

  for (const [input, expected] of cases) {
    const parsed = parseYouTubeUrl(input);
    assert.ok(parsed, `expected a parse for ${input}`);
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(parsed[key], value, `${input} → ${key}`);
    }
  }
});

test("parseYouTubeUrl rejects non-YouTube and hostile input", () => {
  const rejected = [
    "",
    null,
    "not a url",
    "https://vimeo.com/12345",
    "https://evil.example/watch?v=" + VID,
    "https://youtube.com.evil.example/watch?v=" + VID,
    "javascript:alert(1)",
    "https://www.youtube.com/watch?v=short", // bad id length
    "https://www.youtube.com/watch", // no v, no list
    "https://www.youtube.com/playlist", // no list
    "https://www.youtube.com/channel/notachannelid",
    "https://www.youtube.com/@", // empty handle
    "https://www.youtube.com/results?search_query=x",
    "https://www.youtube.com/feed/subscriptions",
    // Mixes (RD…) are not embeddable playlists:
    "https://www.youtube.com/watch?list=RDdQw4w9WgXcQ",
    "https://" + "a".repeat(600) + ".com/watch?v=" + VID // oversized input
  ];
  for (const input of rejected) {
    assert.equal(parseYouTubeUrl(input), null, `expected null for ${String(input).slice(0, 60)}`);
  }
});

test("uploadsPlaylistFor derives UU playlists only from UC channel ids", () => {
  assert.equal(uploadsPlaylistFor(CHANNEL), UPLOADS);
  assert.equal(uploadsPlaylistFor("UU" + "a".repeat(22)), "");
  assert.equal(uploadsPlaylistFor("nope"), "");
  assert.equal(uploadsPlaylistFor(""), "");
});

test("sanitizeHeroVideo coerces invalid input to the empty block", () => {
  const empties = [
    undefined,
    null,
    "string",
    [],
    {},
    { kind: "video" }, // no id
    { kind: "video", videoId: "short" },
    { kind: "playlist", playlistId: "" },
    { kind: "playlist", playlistId: "RD" + "x".repeat(20) }, // mix
    { kind: "vaporwave", videoId: VID },
    { kind: "channel", videoId: VID } // channel without playlist
  ];
  for (const input of empties) {
    assert.deepEqual(sanitizeHeroVideo(input), EMPTY_HERO_VIDEO, JSON.stringify(input));
  }
});

test("sanitizeHeroVideo keeps valid blocks and scrubs cross-field noise", () => {
  const video = sanitizeHeroVideo({
    url: `https://youtu.be/${VID}`,
    kind: "video",
    videoId: VID,
    playlistId: LIST // ignored for kind video
  });
  assert.deepEqual(video, { url: `https://youtu.be/${VID}`, kind: "video", videoId: VID, playlistId: "" });

  const playlist = sanitizeHeroVideo({ kind: "playlist", playlistId: LIST, videoId: VID, url: "" });
  assert.deepEqual(playlist, { url: "", kind: "playlist", videoId: "", playlistId: LIST });

  const channel = sanitizeHeroVideo({
    url: "https://www.youtube.com/@SomeCreator",
    kind: "channel",
    playlistId: UPLOADS
  });
  assert.equal(channel.kind, "channel");
  assert.equal(channel.playlistId, UPLOADS);

  // Non-YouTube display url is scrubbed but the block survives:
  const scrubbed = sanitizeHeroVideo({ url: "https://evil.example/x", kind: "video", videoId: VID });
  assert.equal(scrubbed.url, "");
  assert.equal(scrubbed.videoId, VID);
});

test("hasHeroVideo reflects playability", () => {
  assert.equal(hasHeroVideo(EMPTY_HERO_VIDEO), false);
  assert.equal(hasHeroVideo(undefined), false);
  assert.equal(hasHeroVideo({ kind: "video", videoId: VID }), true);
  assert.equal(hasHeroVideo({ kind: "playlist", playlistId: LIST }), true);
  assert.equal(hasHeroVideo({ kind: "channel", playlistId: UPLOADS }), true);
  assert.equal(hasHeroVideo({ kind: "channel", playlistId: "" }), false);
});
