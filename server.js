/**
 * 小魔女代儲 — 蓋塔挑戰 (TikTok LIVE gift tower game)
 * Fully our own code. No paid services, no TikPlays.
 *
 * - Serves the overlay page (public/overlay.html, 1080x1920, OBS Browser Source)
 * - Pushes game state to the overlay over Server-Sent Events (/events)
 * - Connects to TikTok LIVE with tiktok-live-connector (username only, no login)
 * - Sim/demo mode: POST /api/sim to inject events without going live
 *
 * Run:  npm install   (once)
 *       npm start     (or: node server.js)
 * Overlay URL for OBS:  http://localhost:3000/?demo=true   (demo/sim mode)
 *                       http://localhost:3000/               (live mode)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const tts = require('./tts'); // witch voice (Edge TTS, free) — speakText() never throws, returns null on failure

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PRICES_FILE = path.join(ROOT, 'prices.json');
const CONFIG_FILE = path.join(ROOT, 'config.json');
const DAILY_FILE = path.join(ROOT, 'daily.json');

// Real 代儲 price tables (Drive 01_遊戲價格資料庫, verified 2026-11-23).
// Read per request so a price edit lands without a restart; a bad file
// serves an empty list instead of crashing the game.
function loadPrices() {
  try {
    const p = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    if (p && Array.isArray(p.games)) return p;
  } catch (_) { /* missing/bad prices.json: overlay hides the price card */ }
  return { currency: 'TWD', games: [] };
}

// ---- price announcer (round 4 plan change) -------------------------------
// The server is the clock for the price rotation: every
// priceRotation.intervalSeconds it advances to the next game and prepares
// the one-line chat message with the SAME content as the on-screen card
// (same top items). The overlay follows this index via SSE, and the live
// operation reads GET /api/announce/next. The server NEVER sends chat
// itself — during a live, Muse posts the message from the host account's
// logged-in browser session (see README). No unofficial send API, no
// session-cookie scraping.
function sortedPriceItems(game) {
  // same order as the on-screen card: numeric prices high first,
  // "截圖詢問" (no fixed price) last
  return (game.items || []).slice().sort((a, b) => {
    const an = typeof a.price === 'number', bn = typeof b.price === 'number';
    if (an && bn) return b.price - a.price;
    if (an) return -1;
    if (bn) return 1;
    return 0;
  });
}

function buildAnnounceText(game, line) {
  const max = (config.priceRotation && config.priceRotation.maxItemsPerCard) || 6;
  const items = sortedPriceItems(game).slice(0, max);
  const asc = items.slice().reverse(); // cheapest first — reads naturally in chat
  const parts = asc.map((it) => (typeof it.price === 'number' ? `${it.name}${it.price}元` : `${it.name}${it.price}`));
  // keep it a one-liner: if the list runs long, keep the cheapest items and cut the rest with …
  let shown = parts.slice();
  let cut = false;
  while (shown.length > 1 && (`${game.name}代儲：${shown.join('、')}`).length > 110) { shown.pop(); cut = true; }
  const suffix = line ? `，詳情 LINE ${line}` : '';
  return `${game.name}代儲：${shown.join('、')}${cut ? '…' : ''}${suffix}`;
}

let announceIdx = 0;
let announceAt = Date.now();
let announceTimer = null;

function getAnnounce() {
  const prices = loadPrices();
  const games = prices.games || [];
  if (!games.length) return null;
  const idx = ((announceIdx % games.length) + games.length) % games.length;
  const game = games[idx];
  return {
    index: idx,
    total: games.length,
    game: game.name,
    text: buildAnnounceText(game, (config.brand && config.brand.line) || ''),
    intervalSeconds: (config.priceRotation && config.priceRotation.intervalSeconds) || 10,
    at: new Date(announceAt).toISOString(),
  };
}

function startAnnounceTimer() {
  clearInterval(announceTimer);
  const sec = (config.priceRotation && config.priceRotation.intervalSeconds) || 10;
  announceTimer = setInterval(() => {
    const games = (loadPrices().games || []);
    if (!games.length) return;
    announceIdx = (announceIdx + 1) % games.length;
    announceAt = Date.now();
    broadcast();
  }, sec * 1000);
}

// Demo/sim "next price card": advance the announcer now (and restart the
// interval so the next auto-advance is a full interval away) + bump
// priceTick so the overlay flips immediately.
function forceNextAnnounce() {
  const games = (loadPrices().games || []);
  if (games.length) announceIdx = (announceIdx + 1) % games.length;
  announceAt = Date.now();
  startAnnounceTimer();
  state.priceTick += 1;
  broadcast();
}

function parseConfig(raw) {
  const cfg = JSON.parse(raw);
  cfg.giftMapping = cfg.giftMapping || { block: [], golden: [], wreck: [] };
  cfg.triggers = cfg.triggers || {};
  return cfg;
}

// ---- hot reload: config.json + daily.json -------------------------------
// config.json used to be read once at boot, so any edit needed a restart —
// and a restart zeroes the tower (height/blocks/feed live in memory).
// Now the server re-reads on every request (mtime check) AND watches the
// files, so edits land in ~1s without a restart and without touching the
// tower. A broken file keeps the last good copy, logs the error, and never
// crashes the server. mtime comparison (not the watcher alone) survives
// atomic replace-by-rename writes; fs.watchFile polling is the backstop
// in case a rename kills the fs.watch handle.
let config = null;
let configMtimeMs = -1;
function tryReloadConfig() {
  try {
    const st = fs.statSync(CONFIG_FILE);
    const cfg = parseConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config = cfg;
    configMtimeMs = st.mtimeMs;
    return true;
  } catch (e) {
    console.error('[config] reload failed, keeping last good config:', e.message);
    return false;
  }
}
function ensureConfigFresh() {
  let m = -1;
  try { m = fs.statSync(CONFIG_FILE).mtimeMs; } catch (_) { m = -1; }
  if (m !== configMtimeMs) tryReloadConfig();
}
tryReloadConfig();
if (!config) config = { giftMapping: { block: [], golden: [], wreck: [] }, triggers: {} };

// ---- daily rotation (daily.json) ----------------------------------------
// {"default": {"tickerLines": [...], "tips": [...]},
//  "2026-11-24": {"tickerLines": [...], "tips": [...]}} — date keys are
// YYYY-MM-DD in Asia/Taipei (the host runs UTC, so never use local time).
// Resolved per request: today's entry, or default when there is none, so
// the rotation flips at Taipei midnight with no restart. Missing file =
// empty default; broken file = last good copy, never a crash.
const TAIPEI_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
function taipeiToday() { return TAIPEI_DATE.format(new Date()); }
let dailyCache = { default: { tickerLines: [], tips: [] } };
let dailyMtimeMs = -1;
function tryReloadDaily() {
  try {
    const st = fs.statSync(DAILY_FILE);
    const d = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8'));
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('daily.json must be a JSON object');
    dailyCache = d;
    dailyMtimeMs = st.mtimeMs;
    return true;
  } catch (e) {
    if (e && e.code === 'ENOENT') { dailyCache = { default: { tickerLines: [], tips: [] } }; dailyMtimeMs = -1; return false; }
    console.error('[daily] reload failed, keeping last good daily:', e.message);
    return false;
  }
}
function ensureDailyFresh() {
  let m = -1;
  try { m = fs.statSync(DAILY_FILE).mtimeMs; } catch (_) { m = -1; }
  if (m !== dailyMtimeMs) tryReloadDaily();
}
function resolveDaily() {
  ensureDailyFresh();
  const date = taipeiToday();
  const entry = (dailyCache && dailyCache[date]) || null;
  const def = (dailyCache && dailyCache.default) || {};
  const pick = entry || def;
  return {
    date,
    tickerLines: Array.isArray(pick.tickerLines) ? pick.tickerLines : [],
    tips: Array.isArray(pick.tips) ? pick.tips : [],
  };
}
tryReloadDaily();
try { fs.watchFile(CONFIG_FILE, { interval: 1000 }, () => ensureConfigFresh()); } catch (_) {}
try { fs.watchFile(DAILY_FILE, { interval: 1000 }, () => ensureDailyFresh()); } catch (_) {}
try { fs.watch(CONFIG_FILE, () => ensureConfigFresh()); } catch (_) {}
try { fs.watch(DAILY_FILE, () => ensureDailyFresh()); } catch (_) {}

// ---------------------------------------------------------------- state ----
let blockSeq = 0;
const state = {
  height: 0,                 // total layers
  goal: config.goalHeight || 50,
  best: 0,                   // best height ever (persisted)
  towerNumber: 1,
  blocks: [],                // [{id, type:'block'|'golden', layers:1|3, by, gift, from, to}]
  topGifters: [],            // [{name, diamonds}] sorted desc, top 3 kept for display
  feed: [],                  // [{text, at}] newest first, max 6
  events: [],                // [{kind, at, user, gift, milestone}] newest first, max 8 — drives NPC actions in the overlay
  fx: [],                    // transient free-action effects [{id, kind, variant, user, avatar, text, reaction, at}] — overlay renders each once
  battle: { active: false, endsAt: 0, duration: 60, build: 0, wreck: 0, lastWin: null },
  // hype mode: any gift starts/refreshes it (presentation + music only —
  // never game rules). outfit follows the LATEST triggering gift:
  // 'bikini' on building gifts, 'sexy' on wreck gifts, 'normal' otherwise.
  hype: { active: false, endsAt: 0, startedAt: 0, outfit: 'normal' },
  totalShares: 0,
  totalChats: 0,
  likeCombo: { count: 0, endsAt: 0 },   // likes inside a 60s window — combo meter + 50-like streak event
  shareCount: 0,
  combo: 0,
  comboEndsAt: 0,            // timestamp ms; combo resets after the window
  goldenNext: false,         // combo x5 armed: next floor placement is golden
  celebrated: false,         // goal reached for this tower
  totalGifts: 0,
  totalLikes: 0,
  live: false,
  tiktokUser: config.tiktokUsername || '',
  recentChat: [],            // [{time, user, avatar, text, kind}] newest first, max 100 — GET /api/chat + SSE
  priceTick: 0,              // increments when demo/sim forces the next price card
};

function loadData() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (typeof d.best === 'number') state.best = d.best;
    if (typeof d.towerNumber === 'number') state.towerNumber = d.towerNumber;
  } catch (_) { /* first run: no data file yet */ }
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ best: state.best, towerNumber: state.towerNumber }, null, 2));
  } catch (e) { console.error('[data] save failed:', e.message); }
}
loadData();

// ------------------------------------------------------------- helpers -----
function snapshot() {
  return {
    height: state.height,
    goal: state.goal,
    best: state.best,
    towerNumber: state.towerNumber,
    blocks: state.blocks,
    topGifters: state.topGifters.slice(0, 3),
    feed: state.feed.slice(0, 6),
    events: state.events.slice(0, 8),
    fx: state.fx.slice(0, 6),
    battle: state.battle,
    hype: {
      active: state.hype.active,
      outfit: state.hype.outfit,
      endsAt: state.hype.endsAt,
      remainingSeconds: state.hype.active ? Math.max(0, Math.ceil((state.hype.endsAt - Date.now()) / 1000)) : 0,
    },
    combo: state.combo,
    goldenNext: state.goldenNext,
    celebrated: state.celebrated,
    totalGifts: state.totalGifts,
    totalLikes: state.totalLikes,
    totalShares: state.totalShares,
    totalChats: state.totalChats,
    likeCombo: { count: state.likeCombo.count, active: Date.now() < state.likeCombo.endsAt },
    // seconds until the next auto-build floor (null = disabled / battle / tower complete)
    autoBuildNextIn: (() => {
      const ab = config.autoBuild || {};
      if (!ab.enabled || state.battle.active || state.celebrated) return null;
      return Math.max(0, Math.ceil(((ab.intervalSeconds || 120) * 1000 - (Date.now() - lastGiftAt)) / 1000));
    })(),
    chat: state.recentChat.slice(0, 50),
    announce: getAnnounce(),
    priceTick: state.priceTick,
    live: state.live,
    tiktokUser: state.tiktokUser,
  };
}

const sseClients = new Set();
function broadcast() {
  const payload = 'data: ' + JSON.stringify(snapshot()) + '\n\n';
  for (const res of sseClients) {
    try { res.write(payload); } catch (_) { /* client gone */ }
  }
}

function addFeed(text) {
  state.feed.unshift({ text, at: Date.now() });
  if (state.feed.length > 6) state.feed.length = 6;
}

// Significant game events, newest first. The overlay watches these to fire
// config-driven NPC actions (npcActions in config.json). Game rules don't
// depend on this list — it's presentation metadata only.
function pushEvent(kind, user, gift, milestone, diamonds) {
  state.events.unshift({ kind, at: Date.now(), user: user || '', gift: gift || '', milestone: milestone || 0, diamonds: diamonds || 0 });
  if (state.events.length > 8) state.events.length = 8;
}

// ------------------------------------------------- transient fx + tiers ----
// Free actions are first-class events: every like/share/chat produces a
// visible effect AND a named event (feed entry and/or NPC action), never
// "nothing happens". Gifts are never throttled; free actions are throttled
// to one fx per kind per 500ms so a storm can't bury the screen.
let fxSeq = 0;
const fxCursor = {};
const fxLastVariant = {};
const fxLastAt = {};
const chatters = new Set();      // distinct chatters this run (10th triggers a fairy event)
let battleScores = {};           // name -> {build, wreck, avatar} during a battle
let battleTimer = null;
let lastChatEventAt = 0;

// Welcome greetings: joins are batched so a rush of joiners doesn't spam
// the screen — one greeting per batch window, at most one every few
// seconds, same name deduped for a minute. Greeting is visual only and
// never adds floors (that's config.triggers.join, still off by default).
let welcomeQueue = [];          // names waiting for the next greeting
let welcomeTimer = null;
let lastWelcomeAt = 0;
const welcomedRecently = new Map(); // name -> timestamp (dedupe)
function queueWelcome(user) {
  const w = config.welcome || {};
  if (w.enabled === false) return;
  if (!user || user === '觀眾') return; // nameless join — nothing to greet by
  const now = Date.now();
  const dedupeMs = (w.dedupeSeconds || 60) * 1000;
  if (welcomedRecently.get(user) && now - welcomedRecently.get(user) < dedupeMs) return;
  welcomedRecently.set(user, now);
  if (!welcomeQueue.includes(user)) welcomeQueue.push(user);
  if (!welcomeTimer) {
    welcomeTimer = setTimeout(flushWelcome, (w.batchWindowSeconds || 3) * 1000);
  }
}
function flushWelcome() {
  welcomeTimer = null;
  if (!welcomeQueue.length) return;
  const w = config.welcome || {};
  const minMs = (w.minIntervalSeconds || 5) * 1000;
  const now = Date.now();
  if (now - lastWelcomeAt < minMs) {
    welcomeTimer = setTimeout(flushWelcome, minMs - (now - lastWelcomeAt));
    return;
  }
  // prune stale dedupe entries
  const dedupeMs = (w.dedupeSeconds || 60) * 1000;
  for (const [name, at] of welcomedRecently) if (now - at >= dedupeMs) welcomedRecently.delete(name);
  lastWelcomeAt = now;
  const names = welcomeQueue.splice(0, welcomeQueue.length);
  const shown = names.slice(0, 3);
  const text = names.length > 3
    ? `👋 歡迎 ${shown.join('、')} 等 ${names.length} 位朋友進來！`
    : `👋 歡迎 ${shown.join('、')} 進來！`;
  addFeed(text);
  pushFx('welcome', { text, names: shown });
  pushEvent('welcome', shown.join('、'), '');
  broadcast();
}

function tierForDiamonds(d) {
  const tiers = (config.giftTiers && config.giftTiers.tiers) || [];
  let name = 'small';
  for (const t of tiers) if ((d || 0) >= (t.min || 0)) name = t.name;
  return name;
}

// Witch kiss: building gifts (block/golden only — the wreck branch returns
// earlier) may trigger the kiss animation, at most once per cooldown.
// The overlay renders it when the gift fx carries kiss:true.
let lastKissAt = 0;
function shouldKiss() {
  const k = config.kiss || {};
  if (k.enabled === false) return false;
  const now = Date.now();
  if (now - lastKissAt < (k.cooldownSeconds || 3) * 1000) return false;
  lastKissAt = now;
  return true;
}

// Hype mode: ANY gift starts/refreshes it; each new gift extends the end
// by durationSeconds, capped at maxSeconds total from the first trigger.
// The outfit follows the LATEST triggering gift (build -> bikini, wreck ->
// sexy); an unmapped gift (side null) extends hype without changing the
// outfit. Hype never changes game rules — presentation + music only.
function triggerHype(side) {
  const h = config.hype || {};
  if (h.enabled === false) return;
  const now = Date.now();
  const durMs = (h.durationSeconds || 20) * 1000;
  const maxMs = (h.maxSeconds || 60) * 1000;
  if (!state.hype.active) {
    state.hype.active = true;
    state.hype.startedAt = now;
    state.hype.endsAt = now + durMs;
  } else {
    state.hype.endsAt = Math.min(now + durMs, state.hype.startedAt + maxMs);
  }
  if (side === 'build') state.hype.outfit = 'bikini';
  else if (side === 'wreck') state.hype.outfit = 'sexy';
}
function endHypeIfExpired() {
  if (state.hype.active && Date.now() > state.hype.endsAt) {
    state.hype.active = false;
    state.hype.outfit = 'normal';
    state.hype.endsAt = 0;
    state.hype.startedAt = 0;
    broadcast();
  }
}

// Witch voice, with a cap so a slow/unreachable TTS service never stalls
// a chat reply or /api/say: on timeout/failure the bubble still shows.
function speakWithTimeout(text, ms) {
  const timeoutMs = ms || 8000;
  return Promise.race([
    tts.speakText(text, config.voice || {}),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]).catch(() => null);
}

// Muse host hook: make the witch say `text` on screen (speech bubble +
// feed entry + voice audio when TTS works). Presentation-only — it does
// NOT post into TikTok chat (that is a live browser operation).
async function saySomething(text, who) {
  const clean = String(text || '').trim().slice(0, 60);
  if (!clean) return null;
  const audioUrl = await speakWithTimeout(clean);
  const fx = pushFx('say', { text: clean, user: who || '', audioUrl: audioUrl || null }, true);
  addFeed(`🗨️ 小魔女：${clean}`);
  broadcast();
  return fx;
}

function nextFxVariant(poolName) {
  const pool = (config.fxPools && config.fxPools[poolName]) || [];
  if (!pool.length) return poolName;
  const start = fxCursor[poolName] == null ? Math.floor(Math.random() * pool.length) : fxCursor[poolName];
  let idx = (start + 1 + Math.floor(Math.random() * 2)) % pool.length;
  if (pool[idx] === fxLastVariant[poolName]) idx = (idx + 1) % pool.length;
  fxCursor[poolName] = idx;
  fxLastVariant[poolName] = pool[idx];
  return pool[idx];
}

function pushFx(kind, fields, force) {
  const now = Date.now();
  if (!force && kind !== 'gift' && fxLastAt[kind] && now - fxLastAt[kind] < 500) return null;
  fxLastAt[kind] = now;
  const fx = { id: ++fxSeq, kind, at: now, ...(fields || {}) };
  state.fx.unshift(fx);
  if (state.fx.length > 6) state.fx.length = 6;
  return fx;
}

function recordBattleScore(user, diamonds, side, avatar) {
  if (!state.battle.active || !user) return;
  const e = battleScores[user] || (battleScores[user] = { build: 0, wreck: 0, avatar: avatar || '' });
  if (side === 'wreck') e.wreck += diamonds || 0;
  else e.build += diamonds || 0;
  if (avatar) e.avatar = avatar;
}

function startBattle() {
  if (!config.battle || config.battle.enabled === false) return false;
  if (state.battle.active) return false;
  state.battle = { active: true, endsAt: Date.now() + ((config.battle.durationSeconds || 60) * 1000), duration: config.battle.durationSeconds || 60, build: 0, wreck: 0, lastWin: state.battle.lastWin || null };
  battleScores = {};
  addFeed(`⚔️ 衝塔 60 秒開戰！蓋 vs 拆！`);
  pushEvent('battleStart', '', '');
  clearTimeout(battleTimer);
  battleTimer = setTimeout(endBattle, (config.battle.durationSeconds || 60) * 1000);
  broadcast();
  return true;
}

function endBattle() {
  if (!state.battle.active) return;
  clearTimeout(battleTimer);
  const b = state.battle;
  const buildWon = b.build >= b.wreck;
  const side = buildWon ? 'build' : 'wreck';
  const sideName = buildWon ? '蓋塔派' : '拆塔派';
  let name = '';
  let best = -1;
  for (const [n, s] of Object.entries(battleScores)) {
    const v = side === 'build' ? s.build : s.wreck;
    if (v > best) { best = v; name = n; }
  }
  b.active = false;
  b.endsAt = 0;
  b.lastWin = { side, name: name || '觀眾', build: b.build, wreck: b.wreck, at: Date.now() };
  addFeed(`⚔️ 衝塔結束！${sideName}獲勝，👑 ${b.lastWin.name} 加冕！`);
  pushEvent('battleWin', b.lastWin.name, side);
  broadcast();
}

function recordGiftValue(user, diamonds, avatar) {
  if (!user) return;
  const entry = state.topGifters.find((g) => g.name === user);
  if (entry) { entry.diamonds += diamonds; if (avatar) entry.avatar = avatar; }
  else state.topGifters.push({ name: user, diamonds, avatar: avatar || '' });
  state.topGifters.sort((a, b) => b.diamonds - a.diamonds);
}

function checkMilestones(prevHeight, newHeight) {
  const every = config.milestoneEvery || 10;
  const crossed = [];
  for (let m = Math.floor(prevHeight / every) * every + every; m <= newHeight; m += every) {
    crossed.push(m);
  }
  return crossed;
}

function checkGoal() {
  if (!state.celebrated && state.height >= state.goal) {
    state.celebrated = true;
    if (state.height > state.best) { state.best = state.height; saveData(); }
    addFeed(`🎉 達成目標 ${state.goal} 層！`);
    pushEvent('goal', '', '');
    if (config.autoResetSeconds && config.autoResetSeconds > 0) {
      setTimeout(() => resetTower(true), config.autoResetSeconds * 1000);
    }
  }
}

// ---- auto-build (round 6: 兩個都要) -------------------------------------
// When nobody sends a gift for autoBuild.intervalSeconds, the tower grows
// +1 floor on its own (attributed to 小精靈) so a quiet stream never looks
// dead. Any real gift re-arms the timer; battles and a finished tower pause
// it. Auto floors use the normal addFloors path (milestones/zones/goal all
// work) but never touch Top 3 gifters or battle scores — no recordGiftValue
// and no recordBattleScore call here. The interval is config-driven and
// hot-reloaded like the rest of config.json (see tryReloadConfig).
// Round 7: every auto-built floor fires one of six rotating dopamine
// effects (config fxPools.autoBuild, picked by nextFxVariant — never the
// same twice in a row) and the feed line rotates through 3 wordings. The
// event kind is 'autoBuild' (not 'gift') so the generic gift NPC wave
// doesn't double-fire — the fx renderer owns the witch/cat/fairy reaction.
let lastGiftAt = Date.now();
const AUTO_BUILD_FEED = [
  `🧚 小精靈幫忙蓋了一層 🧱 +1 層`,
  `✨ 小精靈施法！塔長高 1 層`,
  `🧚 小精靈悄悄放了一塊磚 +1 層`,
];
let autoBuildFeedIdx = Math.floor(Math.random() * AUTO_BUILD_FEED.length);
function autoBuildTick() {
  const ab = config.autoBuild || {};
  if (!ab.enabled) return;
  if (state.battle.active) return;
  if (state.celebrated) return;
  const intervalMs = Math.max(5, ab.intervalSeconds || 120) * 1000;
  if (Date.now() - lastGiftAt < intervalMs) return;
  lastGiftAt = Date.now();
  const variant = nextFxVariant('autoBuild');
  addFloors(1, 'block', '小精靈', '小精靈幫忙');
  autoBuildFeedIdx = (autoBuildFeedIdx + 1 + Math.floor(Math.random() * 2)) % AUTO_BUILD_FEED.length;
  addFeed(AUTO_BUILD_FEED[autoBuildFeedIdx]);
  pushEvent('autoBuild', '小精靈', '小精靈幫忙', 0, 0);
  pushFx('autoBuild', { variant, floor: state.height });
  broadcast();
}

// -------------------------------------------------------- floor actions ---
function addFloors(count, type, by, gift) {
  const prev = state.height;
  if (type === 'golden') {
    // A golden block is one tall block worth 3 layers.
    state.blocks.push({ id: ++blockSeq, type: 'golden', layers: 3, by, gift, from: prev + 1, to: prev + 3 });
    state.height += 3;
  } else {
    for (let i = 0; i < count; i++) {
      state.blocks.push({ id: ++blockSeq, type: 'block', layers: 1, by, gift, from: prev + i + 1, to: prev + i + 1 });
    }
    state.height += count;
  }
  if (state.battle.active) state.battle.build += (type === 'golden' ? 3 : count);
  const crossed = checkMilestones(prev, state.height);
  for (const m of crossed) { addFeed(`✨ 里程碑！塔來到 ${m} 層！`); pushEvent('milestone', by, gift, m); }
  if (state.height > state.best) { state.best = state.height; saveData(); }
  checkGoal();
}

// Combo: gifts within the window build the counter; at the threshold the
// NEXT floor placement is a golden block (worth 3 layers) + bonus floors.
function noteGiftForCombo() {
  const now = Date.now();
  const windowMs = (config.comboWindowSeconds || 10) * 1000;
  // the window ends at comboEndsAt (last gift + window): reset as soon as
  // we are past it. The old check (now - comboEndsAt > windowMs) only
  // fired a full window AFTER expiry, so a combo lingered ~2x the window.
  if (now > state.comboEndsAt) state.combo = 0;
  state.combo += 1;
  state.comboEndsAt = now + windowMs;
  if (state.combo >= (config.comboThreshold || 5) && !state.goldenNext) {
    state.goldenNext = true;
    addFeed(`🔥 連擊 x${state.combo}！下一層是金磚！`);
    pushEvent('combo', '', '');
  }
}

function handleGift(giftName, user, diamonds, repeatCount, avatar) {
  lastGiftAt = Date.now(); // any real gift re-arms the auto-build timer
  const name = String(giftName || '').toLowerCase();
  const inList = (list) => (list || []).some((g) => String(g).toLowerCase() === name);
  const reps = Math.max(1, repeatCount || 1);
  const dm = diamonds || 0;
  // hype: ANY gift starts/refreshes it; outfit follows the gift type
  triggerHype(inList(config.giftMapping.wreck) ? 'wreck'
    : (inList(config.giftMapping.block) || inList(config.giftMapping.golden)) ? 'build' : null);
  state.totalGifts += reps;
  const hBefore = state.height;

  if (inList(config.giftMapping.wreck)) {
    removeFloors(config.wreckRemovesFloors || 2, user, giftName);
    recordBattleScore(user, dm * reps, 'wreck', avatar);
    pushEvent('wreck', user, giftName, 0, dm);
    // every gift lands visibly: close-up card + shockwave (gifts never throttled)
    pushFx('gift', { user, avatar: avatar || '', gift: giftName, diamonds: dm, floors: -(hBefore - state.height), tier: 'wreck' });
    noteGiftForCombo();
    broadcast();
    return;
  }

  let tier = null;
  if (inList(config.giftMapping.block)) tier = 'block';
  else if (inList(config.giftMapping.golden)) tier = 'golden';
  if (!tier) { broadcast(); return; } // unmapped gift: counted in feed only

  recordGiftValue(user, dm * reps, avatar);
  recordBattleScore(user, dm * reps, 'build', avatar);
  pushEvent(tier === 'golden' ? 'golden' : 'gift', user, giftName, 0, dm);

  for (let r = 0; r < reps; r++) {
    if (state.goldenNext) {
      state.goldenNext = false;
      state.combo = 0;
      addFloors(1, 'golden', user, giftName);
      const bonus = config.comboBonusFloors || 2;
      if (bonus > 0) addFloors(bonus, 'block', user, giftName);
      addFeed(`${user} 連擊金磚！${giftName} +${3 + bonus} 層`);
    } else if (tier === 'golden') {
      addFloors(1, 'golden', user, giftName);
      addFeed(`${user} 送出 ${giftName} 🌟 +3 層`);
    } else {
      addFloors(1, 'block', user, giftName);
      addFeed(`${user} 送出 ${giftName} 🧱 +1 層`);
    }
  }
  const gained = state.height - hBefore;
  pushFx('gift', { user, avatar: avatar || '', gift: giftName, diamonds: dm, floors: gained, tier: tierForDiamonds(dm), kiss: shouldKiss() });
  // Combo is counted AFTER this gift's floors are placed, so the golden
  // block armed at x5 applies to the NEXT gift, not this one.
  noteGiftForCombo();
  broadcast();
}

function removeFloors(count, user, giftName) {
  let removed = 0;
  while (removed < count && state.blocks.length > 0) {
    const top = state.blocks.pop();
    removed += top.layers;
  }
  state.height = Math.max(0, state.height - removed);
  if (state.height < state.goal) state.celebrated = false;
  if (state.battle.active) state.battle.wreck += removed;
  addFeed(`${user} 送出 ${giftName} 💣 −${removed} 層`);
  if (state.height === 0) pushEvent('zero', user, giftName);
}

function handleFollow(user) {
  if (!config.triggers.follow) return;
  addFloors(1, 'block', user, '追蹤');
  addFeed(`${user} 追蹤了直播 🧱 +1 層`);
  pushEvent('follow', user, '追蹤');
  broadcast();
}

function handleShare(user) {
  if (!config.triggers.share) return;
  state.totalShares += 1;
  state.shareCount += 1;
  addFloors(1, 'block', user, '分享');
  addFeed(`${user} 分享了直播 🧱 +1 層`);
  pushEvent('share', user, '分享');
  pushFx('share', { user, variant: nextFxVariant('share') });
  // every 5 shares = cat thanks event (real event: NPC action + feed + confetti)
  if (state.shareCount % 5 === 0) {
    addFeed(`🔗 分享滿 ${state.shareCount} 次！白貓謝謝大家！`);
    pushEvent('shareThanks', user, '分享');
  }
  broadcast();
}

function matchChatEntry(comment) {
  const list = config.chatKeywords || [];
  const text = String(comment || '');
  for (const entry of list) {
    for (const kw of (entry.keywords || [])) {
      if (kw && text.toLowerCase().includes(String(kw).toLowerCase())) return entry;
    }
  }
  return null;
}

// Chat reply pools: each keyword group carries 3-4 witch-voiced variants;
// rotate with no immediate repeat (same pattern as nextFxVariant).
const chatReplyCursor = {};
const chatReplyLast = {};
function nextChatReply(entry) {
  const pool = (entry && entry.replies) || [];
  if (!pool.length) return '';
  const key = entry.reaction || 'chat';
  const start = chatReplyCursor[key] == null ? Math.floor(Math.random() * pool.length) : chatReplyCursor[key];
  let idx = (start + 1 + Math.floor(Math.random() * 2)) % pool.length;
  if (pool[idx] === chatReplyLast[key]) idx = (idx + 1) % pool.length;
  chatReplyCursor[key] = idx;
  chatReplyLast[key] = pool[idx];
  return pool[idx];
}

async function handleChat(user, avatar, comment) {
  const text = String(comment || '').slice(0, 24);
  if (!text) return;
  state.totalChats += 1;
  const entry = matchChatEntry(text);
  const reaction = (entry && entry.reaction) || '';
  // the witch talks back: a rotating reply variant from the group's pool,
  // spoken aloud when TTS works (the bubble shows either way)
  let reply = '';
  let audioUrl = null;
  if (reaction && entry) {
    reply = nextChatReply(entry);
    if (reply) {
      try { audioUrl = await speakWithTimeout(reply); } catch (_) { audioUrl = null; }
    }
  }
  // monitoring log: every chat, newest first (GET /api/chat, SSE snapshot.chat)
  state.recentChat.unshift({ time: new Date().toISOString(), user, avatar: avatar || '', text, kind: reaction || 'chat' });
  if (state.recentChat.length > 100) state.recentChat.length = 100;
  // every chat: avatar + name bubble (visible presence event, never silent)
  pushFx('chat', { user, avatar: avatar || '', text, reaction: reaction || '', reply: reply || '', audioUrl: audioUrl || null });
  // at most one chat NPC event per 2s so a chat flood can't pile up actions
  const now = Date.now();
  if (now - lastChatEventAt >= 2000) {
    lastChatEventAt = now;
    if (reaction) {
      const kind = { cheer: 'chatCheer', tease: 'chatTease', heart: 'chatHeart', yawn: 'chatYawn' }[reaction] || '';
      if (kind) {
        const feedText = {
          chatCheer: `💬 ${user}：加油！女巫為大家打氣！`,
          chatTease: `💬 ${user}：拆！南瓜出來搗蛋！`,
          chatHeart: `💬 ${user}：愛你！白貓比愛心！`,
          chatYawn: `💬 ${user}：好睏……女巫打哈欠！`,
        }[kind];
        addFeed(feedText);
        pushEvent(kind, user, text);
      }
    } else {
      pushEvent('chat', user, text);
    }
  }
  // 10th distinct chatter = fairy flyover event
  const before = chatters.size;
  chatters.add(user);
  if (chatters.size > before && chatters.size % 10 === 0) {
    addFeed(`🎉 第 ${chatters.size} 位聊天觀眾！精靈飛越！`);
    pushEvent('chatParty', user, text);
  }
  broadcast();
}

let likesSinceFloor = 0;
function handleLike(user, likeCount) {
  if (!config.triggers.likes) return;
  const n = Math.max(1, likeCount || 1);
  state.totalLikes += n;
  // like combo meter: likes inside a 60s window build a streak (visible on screen)
  const now = Date.now();
  if (now > state.likeCombo.endsAt) { state.likeCombo.count = 0; state.likeCombo.endsAt = now + 60000; }
  const prevCombo = state.likeCombo.count;
  state.likeCombo.count += n;
  const per = config.likesPerFloor || 200;
  likesSinceFloor += n;
  let added = 0;
  while (likesSinceFloor >= per) {
    likesSinceFloor -= per;
    addFloors(1, 'block', user || '觀眾', '按讚');
    added++;
  }
  if (added) {
    addFeed(`❤️ 讚數衝破 ${per}，塔長高 ${added} 層！`);
    pushEvent('likeFloor', user || '觀眾', '按讚');
  }
  // 50 likes inside the window = star rain event (real event, not just particles)
  if (prevCombo < 50 && state.likeCombo.count >= 50) {
    addFeed(`❤️ 讚數連擊 50！星星雨！`);
    pushEvent('likeStreak', user || '觀眾', '按讚');
  }
  // every like batch is a visible effect (rotating pool); floor batches burst bigger
  // (force: a floor burst must never be swallowed by the 500ms throttle)
  pushFx('like', { user: user || '觀眾', variant: added ? 'megaBurst' : nextFxVariant('like'), count: n }, added > 0);
  broadcast();
}

function handleJoin(user) {
  queueWelcome(user);
  if (!config.triggers.join) return;
  addFloors(1, 'block', user, '進場');
  addFeed(`${user} 加入直播 🧱 +1 層`);
  pushEvent('join', user, '進場');
  broadcast();
}

function resetTower(auto) {
  if (state.battle.active) { clearTimeout(battleTimer); state.battle.active = false; state.battle.endsAt = 0; }
  state.blocks = [];
  state.height = 0;
  state.celebrated = false;
  state.combo = 0;
  state.goldenNext = false;
  state.hype.active = false; state.hype.outfit = 'normal'; state.hype.endsAt = 0; state.hype.startedAt = 0;
  lastGiftAt = Date.now(); // a new tower gets a full auto-build interval
  // tower-scoped state resets with the tower: TOP 3 / climber / Top 1
  // spotlight must not show the previous tower's gifters on an empty tower.
  // (Stream totals — totalLikes/totalShares/totalChats — are NOT reset.)
  state.topGifters = [];
  state.towerNumber += 1;
  saveData();
  // a new tower starts with a clean feed — only the reset entry itself
  state.feed = [];
  addFeed(auto ? `🔄 自動開新塔（第 ${state.towerNumber} 座）` : `🔄 開新塔！第 ${state.towerNumber} 座塔開始蓋`);
  pushEvent('reset', '', '');
  broadcast();
}

// ------------------------------------------------------------- TikTok -----
let tiktok = null;
let tiktokRetry = null;

function connectTikTok() {
  const username = (config.tiktokUsername || '').trim();
  if (!username) {
    console.log('[tiktok] no username in config.json — live mode off, use ?demo=true / sim panel.');
    return;
  }
  // tiktok-live-connector 2.x renamed the class: TikTokLiveConnection (v1: WebcastPushConnection).
  let Conn;
  try {
    const mod = require('tiktok-live-connector');
    Conn = mod.TikTokLiveConnection || mod.WebcastPushConnection;
    if (!Conn) throw new Error('no connection class exported by tiktok-live-connector');
  } catch (e) {
    console.error('[tiktok] tiktok-live-connector not usable:', e && e.message ? e.message : e);
    scheduleReconnect();
    return;
  }
  console.log(`[tiktok] connecting as @${username} ...`);
  try {
    tiktok = new Conn(username, {});
  } catch (e) {
    console.error('[tiktok] failed to create connection:', e && e.message ? e.message : e);
    scheduleReconnect();
    return;
  }

  tiktok.connect()
    .then((st) => {
      state.live = true;
      state.tiktokUser = username;
      console.log(`[tiktok] connected — @${username} is LIVE (room ${st && st.roomId ? st.roomId : '?'})`);
      broadcast();
    })
    .catch((err) => {
      state.live = false;
      console.error('[tiktok] connect failed:', err && err.message ? err.message : err);
      scheduleReconnect();
    });

  // v2 data shapes (tiktok-live-connector 2.x): the user is nested under
  // data.user (uniqueId/nickname, avatar at profilePicture.url[0]); gift
  // name/type/diamonds live under data.giftDetails; repeatEnd is 0/1.
  const who = (d) => (d && d.user && (d.user.uniqueId || d.user.nickname)) || '觀眾';
  const avatarOf = (d) => {
    const u = d && d.user;
    if (!u) return '';
    const pic = u.profilePicture || u.profilePictureMedium || u.profilePictureLarge;
    if (pic && Array.isArray(pic.url) && pic.url[0]) return pic.url[0];
    return u.profilePictureUrl || '';
  };

  tiktok.on('gift', (data) => {
    const details = data.giftDetails || {};
    // Streakable gifts (giftType 1) fire repeatedly; only the final event
    // (repeatEnd = 1) counts, with the full repeatCount.
    if (details.giftType === 1 && !data.repeatEnd) return;
    const giftName = details.giftName || data.giftName || '';
    const diamonds = details.diamondCount || data.diamondCount || 0;
    handleGift(giftName, who(data), diamonds, data.repeatCount || 1, avatarOf(data));
  });
  tiktok.on('follow', (data) => handleFollow(who(data)));
  tiktok.on('share', (data) => handleShare(who(data)));
  tiktok.on('chat', (data) => { handleChat(who(data), avatarOf(data), data.comment || '').catch((e) => console.error('[chat]', e && e.message ? e.message : e)); });
  tiktok.on('like', (data) => handleLike(who(data), data.likeCount || 1));
  tiktok.on('member', (data) => handleJoin(who(data)));
  tiktok.on('disconnected', (info) => {
    state.live = false;
    console.log('[tiktok] disconnected — will retry in 10s', info && info.reason ? `(${info.reason})` : '');
    broadcast();
    scheduleReconnect();
  });
  // An 'error' event with no listener throws and kills the process — always listen.
  tiktok.on('error', (err) => {
    console.error('[tiktok] connection error:', err && err.message ? err.message : err);
  });
}

function scheduleReconnect() {
  if (tiktokRetry) return;
  tiktokRetry = setTimeout(() => {
    tiktokRetry = null;
    tiktok = null;
    connectTikTok();
  }, 10000);
}

// -------------------------------------------------------------- server ----
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
};

function sendJson(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (_) { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Hot reload: every request re-checks config.json / daily.json mtimes,
  // so edits land without a restart (and without touching the tower).
  ensureConfigFresh();
  ensureDailyFresh();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // --- SSE event stream -------------------------------------------------
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('data: ' + JSON.stringify(snapshot()) + '\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // --- API --------------------------------------------------------------
  if (pathname === '/api/state' && req.method === 'GET') {
    sendJson(res, snapshot());
    return;
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    sendJson(res, {
      goal: config.goalHeight,
      demo: !!config.demo,
      giftMapping: config.giftMapping,
      triggers: config.triggers,
      comboThreshold: config.comboThreshold,
      comboWindowSeconds: config.comboWindowSeconds,
      tiktokUsername: config.tiktokUsername || '',
      npcActions: config.npcActions || {},
      zones: config.zones || [],
      giftTiers: config.giftTiers || {},
      fxPools: config.fxPools || {},
      chatKeywords: config.chatKeywords || [],
      milestoneCopies: config.milestoneCopies || [],
      battle: config.battle || { durationSeconds: 60, enabled: true },
      idleTimeoutSeconds: config.idleTimeoutSeconds || 30,
      autoBuild: config.autoBuild || { enabled: false, intervalSeconds: 120 },
      backgrounds: config.backgrounds || { snow: true },
      assets: config.assets || {},
      brand: config.brand || {},
      sounds: config.sounds || {},
      priceRotation: config.priceRotation || { enabled: true, intervalSeconds: 10, maxItemsPerCard: 6 },
      priceTicker: config.priceTicker || { enabled: true, speedSeconds: 30, separator: ' · ' },
      customTickerLines: config.customTickerLines || [],
      tips: config.tips || [],
      tipsIntervalSeconds: config.tipsIntervalSeconds || 8,
      // NOTE: /api/config is an explicit whitelist — every new config
      // section must be added here or it won't show up (and can't be
      // verified from outside), even though the server itself reads it.
      welcome: config.welcome || { enabled: true, minIntervalSeconds: 5, batchWindowSeconds: 3, dedupeSeconds: 60 },
      kiss: config.kiss || { enabled: true, cooldownSeconds: 3, durationMs: 1500 },
      music: config.music || { enabled: true, volume: 0.15, src: '' },
      hype: config.hype || { enabled: true, durationSeconds: 20, maxSeconds: 60 },
      voice: config.voice || { enabled: true, voice: 'zh-TW-HsiaoChenNeural', rate: '-5%', pitch: '-2Hz' },
      // Daily rotation, resolved for today (Asia/Taipei): today's entry,
      // or default when there is no entry for today.
      daily: resolveDaily(),
    });
    return;
  }

  // Real 代儲 price tables (prices.json, verified against Drive).
  // {currency, games:[{name, items:[{name, price}]}]} — price is a number
  // (TWD) or the exact string "截圖詢問" / "截圖詢問洽詢" (no fixed price).
  if (pathname === '/api/prices' && req.method === 'GET') {
    sendJson(res, loadPrices());
    return;
  }

  // Price announcer queue (round 4 plan change): the one-line message the
  // live operation posts into TikTok chat. Same content and interval as the
  // on-screen price rotation; the server is the rotation clock.
  // GET /api/announce/next -> {index, total, game, text, intervalSeconds, at}
  if ((pathname === '/api/announce/next' || pathname === '/api/announce') && req.method === 'GET') {
    const a = getAnnounce();
    if (!a) { sendJson(res, { announce: null, error: 'no games in prices.json' }); return; }
    sendJson(res, a);
    return;
  }

  // Recent chat + recent game events, for monitoring (e.g. Muse polling
  // over Tailscale while the game runs on the host PC).
  // GET /api/chat?limit=50 -> {chat:[{time,user,avatar,text,kind}], events:[...]}
  // kind is the chat-keyword reaction (cheer/tease/heart/yawn) or 'chat'.
  // Read-only: TikTok has no official send API and sending needs the
  // account session, so there is deliberately no chat-SEND endpoint.
  if (pathname === '/api/chat' && req.method === 'GET') {
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    sendJson(res, {
      chat: state.recentChat.slice(0, limit),
      events: state.events.slice(0, limit),
    });
    return;
  }

  // Muse host hook (presentation-only): make the witch say `text` on
  // screen — speech bubble + feed entry + voice audio when TTS works.
  // POST /api/say {"text":"...","who":"..."} -> {ok, fx, audioUrl}
  // It does NOT post into TikTok chat; that is a live browser operation.
  if (pathname === '/api/say' && req.method === 'POST') {
    const body = await readBody(req);
    const fx = await saySomething(body.text, body.who);
    if (!fx) { sendJson(res, { ok: false, error: 'empty text' }, 400); return; }
    sendJson(res, { ok: true, fx, audioUrl: fx.audioUrl || null });
    return;
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    resetTower(false);
    sendJson(res, { ok: true, state: snapshot() });
    return;
  }

  if (pathname === '/api/sim' && req.method === 'POST') {
    const body = await readBody(req);
    const user = body.user || '測試觀眾';
    switch (body.action) {
      case 'gift': {
        // body.gift: a gift NAME (e.g. "Rose") or a tier ("block"/"golden"/"wreck")
        const g = String(body.gift || 'Rose');
        const tier = ['block', 'golden', 'wreck'].includes(g) ? g : null;
        // Approximate diamond values for known gifts (so the demo leaderboard ranks realistically).
        const DIAMONDS = { Rose: 1, 'Finger Heart': 5, Donut: 30, Cake: 100, Fireworks: 299 };
        if (tier) {
          const sample = { block: 'Rose', golden: 'Donut', wreck: 'Fireworks' }[tier];
          handleGift(sample, user, DIAMONDS[sample] || 1, 1, body.avatar || '');
        } else {
          handleGift(g, user, DIAMONDS[g] || 1, 1, body.avatar || '');
        }
        break;
      }
      case 'chat': {
        await handleChat(user, body.avatar || '', body.text || '加油！');
        break;
      }
      case 'say': {
        await saySomething(body.text, user);
        break;
      }
      case 'battle': {
        if (body.stop) endBattle();
        else startBattle();
        break;
      }
      case 'follow': handleFollow(user); break;
      case 'share': handleShare(user); break;
      case 'like': handleLike(user, body.count || 200); break;
      case 'join': handleJoin(user); break;
      case 'price': forceNextAnnounce(); break; // force next price card + announcer (overlay watches priceTick; SSE carries announce)
      case 'reset': resetTower(false); break;
      default:
        sendJson(res, { ok: false, error: 'unknown action: ' + body.action }, 400);
        return;
    }
    sendJson(res, { ok: true, state: snapshot() });
    return;
  }

  // --- Static files -----------------------------------------------------
  let filePath = pathname === '/' ? '/overlay.html' : pathname;
  filePath = path.normalize(path.join(ROOT, 'public', filePath));
  if (!filePath.startsWith(path.join(ROOT, 'public'))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

const PORT = config.port || 3000;
server.listen(PORT, () => {
  console.log(`[server] 小魔女蓋塔挑戰 running at http://localhost:${PORT}/`);
  console.log(`[server] OBS overlay: http://localhost:${PORT}/?demo=true  (demo)`);
  console.log(`[server] goal=${state.goal} floors | best=${state.best} | tower #${state.towerNumber}`);
  if (config.demo) console.log('[server] demo/sim mode enabled (config.demo=true)');
  startAnnounceTimer();
  // Gift combo expires with its window: sweep once a second so the overlay
  // pill (and the armed golden block) clear even when no new gift arrives.
  setInterval(() => {
    if (state.combo > 0 && Date.now() > state.comboEndsAt) {
      state.combo = 0;
      state.goldenNext = false;
      broadcast();
    }
    endHypeIfExpired();
    autoBuildTick();
  }, 1000);
  connectTikTok();
});
