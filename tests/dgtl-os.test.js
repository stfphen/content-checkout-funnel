import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "public", "os", "index.html");
const src = fs.readFileSync(FILE, "utf8");

/** Pull the DATA literal out of the page and evaluate it in isolation. */
function extractData() {
  const start = src.indexOf("const DATA = {");
  assert.ok(start > -1, "DATA block not found");
  const end = src.indexOf("\n};", start);
  assert.ok(end > -1, "DATA block is not terminated by a line-leading };");
  const block = src.slice(start, end + 3);
  return new Function(block + "\nreturn DATA;")();
}

const DATA = extractData();
const ids = DATA.nodes.map((n) => n.id);
const allTools = DATA.nodes.flatMap((n) => n.tools.map((t) => ({ ...t, node: n.id })));

test("dgtl-os: is a single self-contained file with no external dependencies", () => {
  assert.equal(/<script\s[^>]*src=/i.test(src), false, "no external <script src>");
  assert.equal(/@import/i.test(src), false, "no CSS @import");
  // <link> is allowed only for inline data: URIs (the favicon)
  const links = src.match(/<link\s[^>]*>/gi) || [];
  links.forEach((l) =>
    assert.match(l, /href="data:/, `<link> must use a data: URI, got: ${l.slice(0, 60)}`));
  // url() may only appear for in-document SVG references such as url(#grid)
  const urls = src.match(/url\((?!#)[^)]*\)/g) || [];
  assert.deepEqual(urls, [], "no CSS url() pointing outside the document");
});

test("dgtl-os: node ids are unique and non-empty", () => {
  assert.ok(ids.length >= 7, `expected at least 7 nodes, got ${ids.length}`);
  assert.equal(new Set(ids).size, ids.length, "duplicate node id");
  ids.forEach((id) => assert.match(id, /^[a-z0-9-]+$/, `bad node id: ${id}`));
});

test("dgtl-os: nodes carry the fields the renderer needs", () => {
  DATA.nodes.forEach((n) => {
    assert.ok(n.label, `${n.id} needs a label`);
    assert.ok(n.icon, `${n.id} needs an icon`);
    assert.ok(n.x >= 0 && n.x <= 100, `${n.id} x out of range: ${n.x}`);
    assert.ok(n.y >= 0 && n.y <= 100, `${n.id} y out of range: ${n.y}`);
    assert.match(n.color, /^#[0-9a-fA-F]{6}$/, `${n.id} colour must be a hex value`);
    assert.ok(Array.isArray(n.tools) && n.tools.length > 0, `${n.id} has no tools`);
  });
});

test("dgtl-os: every icon referenced by a node or tool exists in ICONS", () => {
  const iconNames = [...src.matchAll(/^\s{2}([a-z]+):\s*'/gm)].map((m) => m[1]);
  assert.ok(iconNames.length > 15, `only found ${iconNames.length} icons — parser drifted`);
  DATA.nodes.forEach((n) =>
    assert.ok(iconNames.includes(n.icon), `node ${n.id} uses unknown icon "${n.icon}"`));
  allTools.forEach((t) => {
    if (t.icon) assert.ok(iconNames.includes(t.icon), `tool "${t.label}" uses unknown icon "${t.icon}"`);
  });
});

test("dgtl-os: edges reference real nodes, with no self-links or duplicates", () => {
  const seen = new Set();
  DATA.edges.forEach((e) => {
    assert.ok(ids.includes(e.from), `edge from unknown node: ${e.from}`);
    assert.ok(ids.includes(e.to), `edge to unknown node: ${e.to}`);
    assert.notEqual(e.from, e.to, `self-edge on ${e.from}`);
    const key = [e.from, e.to].sort().join("::");
    assert.equal(seen.has(key), false, `duplicate edge ${key}`);
    seen.add(key);
  });
});

test("dgtl-os: every node is reachable from the dashboard", () => {
  const adj = new Map(ids.map((id) => [id, []]));
  DATA.edges.forEach((e) => { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); });
  const seen = new Set(["dashboard"]);
  const queue = ["dashboard"];
  while (queue.length) {
    adj.get(queue.shift()).forEach((n) => { if (!seen.has(n)) { seen.add(n); queue.push(n); } });
  }
  const orphans = ids.filter((id) => !seen.has(id));
  assert.deepEqual(orphans, [], `orphaned nodes: ${orphans.join(", ")}`);
});

test("dgtl-os: tool statuses are valid and match their url", () => {
  allTools.forEach((t) => {
    assert.ok(t.label, `tool in ${t.node} has no label`);
    assert.ok(["live", "soon", "private"].includes(t.status),
      `tool "${t.label}" has bad status "${t.status}"`);
    // A tool with no url must not claim to be live — it renders as a Soon badge.
    if (!t.url) assert.equal(t.status, "soon", `"${t.label}" has no url but is marked ${t.status}`);
  });
});

test("dgtl-os: every url is https or an in-page anchor (no http, no javascript:)", () => {
  const urls = allTools.map((t) => t.url).concat(DATA.nodes.map((n) => n.repo)).filter(Boolean);
  assert.ok(urls.length > 10, "expected a populated set of links");
  urls.forEach((u) => assert.match(u, /^(https:\/\/|#)/, `unsafe or non-https url: ${u}`));
});

test("dgtl-os: github backlinks are present and well formed", () => {
  const gh = allTools.map((t) => t.url).concat(DATA.nodes.map((n) => n.repo))
    .filter((u) => u && u.includes("github.com"));
  assert.ok(gh.length >= 8, `expected several github backlinks, got ${gh.length}`);
  // owner-only (the repo list) and owner/repo (a specific project) are both valid
  gh.forEach((u) => assert.match(u, /^https:\/\/github\.com\/[\w.-]+/, `malformed repo url: ${u}`));
});

test("dgtl-os: the published page cannot be edited by visitors", () => {
  // The editor is behind a compile-time flag...
  assert.match(src, /const EDIT_MODE_ENABLED = (true|false);/,
    "EDIT_MODE_ENABLED must stay a single flippable literal");
  // ...and, when on, still requires an explicit ?edit=1 / #edit opt-in.
  assert.match(src, /editRequested\s*=\s*params\.get\("edit"\)\s*===\s*"1"\s*\|\|\s*location\.hash === "#edit"/);
  assert.match(src, /state\.edit = EDIT_MODE_ENABLED && editRequested/);
  // A locally stored draft must never be honoured on the plain URL.
  assert.match(src, /if \(EDIT_MODE_ENABLED && editRequested\) \{\s*try \{\s*const raw = localStorage\.getItem\(DRAFT_KEY\)/);
  // No write path to a server exists at all.
  assert.equal(/\bfetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/.test(src), false,
    "the page must not talk to a backend");
});

test("dgtl-os: external links are rel-protected and icons are inline SVG, not emoji", () => {
  assert.match(src, /target="_blank" rel="noopener noreferrer"/);
  // Emoji would break the cross-device promise; ⌘/− and box drawing are fine.
  const emoji = src.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || [];
  assert.deepEqual(emoji, [], `found emoji: ${emoji.join(" ")}`);
});
