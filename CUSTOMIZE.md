# CUSTOMIZE.md — Make This Game Yours

> **License — still to choose:** this repo has no `LICENSE` file yet. The owner
> still needs to pick one before publishing. Two common options: **MIT** — the
> most permissive, anyone can use, modify and sell with attribution;
> **Apache-2.0** — like MIT, plus an explicit patent grant. (Also note:
> `package.json` currently says `"license": "ISC"` from the initial scaffold —
> confirm or change it to match the license you choose.)

> **Raw source generations stay out of the repo:** the `assets-raw/` folder
> (green-screen originals, generation metadata) is git-ignored and is not
> included in the release zip. Only the finished, cleaned assets in
> `public/assets/` are published.

This game is built to be forked. **The game rules never need to change:**
gift → floors, combo golden brick, goal, wreck, battle, idle logic all live in
`server.js` + `config.json` and work the same whatever art you put on top.
Almost everything visible is swappable in three ways:

| How | What it means |
|---|---|
| **Drop-in replace** | Overwrite the file at the same path with your own file (same format). No other edit needed. |
| **Config line** | Change one value in `config.json` (paths in `assets`, text in `brand` / `zones` / `milestoneCopies`, numbers in the rules). Restart the server. |
| **Code change** | Edit `public/overlay.html` (look / copy) or `server.js` (behaviour). Needed only for the items listed at the bottom. |

Asset paths are **config-driven**: `config.json` has an `assets` map
(slot → file path, served from `public/`). `server.js` returns the whole map
at `GET /api/config`, and `overlay.html` reads every image from it at load.
If a slot is missing from `config.json`, the overlay falls back to the
built-in default path (the current file), so a missing key never breaks the
screen. Swap an asset by **replacing the file OR changing one config line**.

Current asset layout:

```
public/assets/
├── brand/        logo.png
├── background/   bg-night.jpg
├── characters/   witch.png, witch-cast.png, cat-happy.png, cat-scared.png, cat-heart.png
├── npcs/         fairy.png, pumpkin-devil.png, lucky-cat.png, climber.png
├── props/        wrecking-ball.png
└── bricks/       brick-purple.png, brick-purple-alt.png, brick-gold.png
```

---

## 5-minute reskin (quickstart)

1. **Logo** — replace `public/assets/brand/logo.png` with your square logo.
2. **Background** — replace `public/assets/background/bg-night.jpg` with your
   scene (1080×1920, JPG).
3. **Two characters** — replace `public/assets/characters/witch.png` (main
   character, idle pose) and `cat-happy.png` (mascot, happy face).
4. **Colours** — edit the `:root` block at the top of `public/overlay.html`
   (gold, pink, purple, gradients — one block, see "Colours / theme").
5. **Brand footer** — in `config.json`, set `brand.line` (e.g. `"@your-line"`)
   and `brand.shop` (e.g. `"your-shop-name"`).
6. **Title** — in `public/overlay.html`, change `#title` (and the
   `<title>` tag) to your game's name.
7. Restart: `npm start`, open `http://localhost:3000/?demo=true`, check the
   footer shows your brand and the new art renders.

That's it — the tower, gifts, combo, battle and idle logic are unchanged.

---

## What to swap, item by item

### Logo
- **What:** the round brand avatar at the top-left, next to the game title.
- **Where:** file `public/assets/brand/logo.png`, config key `assets.logo`.
- **Size/format:** square PNG, 1080×1080 (current file). Displayed as an
  88px circle with a gold ring. Any square PNG works; transparency is fine
  (the ring is CSS). Keep it readable at 88px — simple shapes, no small text.
- **How:** drop-in replace, or point `assets.logo` at your file.

### Background scene
- **What:** the full-stage night-sky scene behind everything.
- **Where:** file `public/assets/background/bg-night.jpg`, config key
  `assets.background`.
- **Size/format:** JPG, **1080×1920** (exact stage size, portrait). It is
  shown `cover`, so anything that ratio works, but 1080×1920 is pixel-perfect.
  Keep the middle band fairly dark / low-contrast — the tower, panels and
  text sit on top of it.
- **How:** drop-in replace, or point `assets.background` at your file.

### Main character (witch + cast pose)
- **What:** the hero who sits on top of the tower. Two poses: idle
  (`witch.png`, bobbing) and casting (`witch-cast.png`, shown during cast /
  dance actions, then swaps back).
- **Where:** files `public/assets/characters/witch.png` and
  `witch-cast.png`; config keys `assets.witch`, `assets.witchCast`.
- **Size/format:** PNG with transparency. Current files are detailed smooth
  illustrations (redrawn 2026-11-24; the witch is the most detailed
  character in the set): witch 1536×1664, witch-cast 1504×1680.
  Displayed ~200px wide on the tower top. Draw both poses at the same scale
  and canvas size so the swap doesn't jump. Keep the character centred with
  transparent padding around it. Kiss pose (`witch-kiss.png`, config key
  `assets.witchKiss`): shown big on building gifts (block/golden only, max
  once per `kiss.cooldownSeconds`, default 3s); if the file is missing the
  overlay falls back to the idle witch image.
- **How:** drop-in replace both files (keep the two-pose idea), or change
  the two config lines. The cast pose is triggered by config
  (`npcActions` / `giftTiers` — which events use the `cast` action), so no
  code change is needed to keep the behaviour.
- **Hype outfits (three total):** normal clothes (base) → festive summer
  dress on building gifts (`witch-bikini.png`, config key
  `assets.witchBikini`) → sparkly party dress on wreck gifts
  (`witch-sexy.png`, config key `assets.witchSexy`). Both are **festive
  fallbacks, not bikini/sexy renders** — the image tool declined those
  prompts, so a summer floral dress + straw hat and a purple party dress +
  gold sash were generated instead (same face/hair/hat, dancing pose,
  transparent background, 1536×1664). The latest triggering gift wins the
  outfit; when hype ends she goes back to normal clothes. Swap the files
  (same names) if you get real bikini/sexy art later — no code change.
- **Chat replies:** each `chatKeywords` group carries a `replies` pool
  (3–4 short witch-voiced lines, Traditional Chinese). The server rotates
  them with no immediate repeat and the reply shows as the witch's speech
  bubble (plus the group's NPC reaction). Edit the pool text in
  `config.json` only — no code change. Replies are spoken aloud when the
  voice feature below is on.
- **Humming idle:** in calm mode the witch sometimes hums (gentle bob +
  ♪ notes for ~4s); never during hype, when she dances instead. No config
  — it is one of the six idle actions.

### Mascot (cat variants)
- **What:** the mascot at the bottom-left. Three faces, swapped by the game:
  happy (default), scared (when the tower is wrecked), heart (when someone
  sends love / a golden brick).
- **Where:** files `public/assets/characters/cat-happy.png`,
  `cat-scared.png`, `cat-heart.png`; config keys `assets.catHappy`,
  `assets.catScared`, `assets.catHeart`.
- **Size/format:** PNG with transparency. Current files are detailed smooth
  illustrations (redrawn 2026-11-24): cat-happy 1360×1520, cat-scared
  1328×1552, cat-heart 1136×2080.
  Displayed ~170px wide. Draw all three faces at the same scale and canvas
  size so the face swap doesn't jump.
- **How:** drop-in replace, or change the three config lines. Which face
  shows when is decided by the game events (wreck → scared, love/golden →
  heart); to change *when* a face appears you only need `npcActions` in
  `config.json` (see "NPC actions" in the README) — no code change.

### Guest NPCs (fairy / pumpkin / lucky cat / climber)
- **What:** four guest characters with fixed jobs:
  - **Fairy** (`fairy.png`) — flies across the screen on big moments
    (combo, milestone, battle win, 10th chatter).
  - **Pumpkin devil** (`pumpkin-devil.png`) — pushes the wrecking ball in
    when the tower is wrecked or someone chats "拆 / 壞".
  - **Lucky cat** (`lucky-cat.png`) — walks in only on big gifts (single
    gift ≥ the `big` tier, or a combo golden), throws coins, leaves after 8s.
  - **Climber** (`climber.png`) — the little red-hat climber on the right of
    the tower; he *is* the current Top 1 gifter (his name tag follows him).
- **Where:** files `public/assets/npcs/`; config keys `assets.fairy`,
  `assets.pumpkin`, `assets.luckyCat`, `assets.climber`.
- **Size/format:** PNG with transparency. Current files (redrawn 2026-11-24
  as detailed smooth illustrations — except the lucky cat, which is still
  the original pixel version): fairy 1712×1232, pumpkin 1664×1536, lucky
  cat 1227×1480, climber 1280×1920. Displayed
  roughly 110–250px wide. Any character works as long as it reads at that
  size and has transparent padding.
- **How:** drop-in replace, or change the config lines. *When* each guest
  appears is set in `config.json` (`npcActions` + `giftTiers`) — no code
  change. Giving a guest a **new behaviour** (a new entrance, a new action)
  is a code change — see "What genuinely needs code".

### Wrecking ball
- **What:** the ball that swings in from the top-right whenever the tower
  loses floors.
- **Where:** file `public/assets/props/wrecking-ball.png`; config key
  `assets.wreckingBall`.
- **Size/format:** PNG with transparency. Current file 1055×1513 (tall:
  ball + chain). Displayed 300px wide, swinging from the top edge. Keep the
  chain at the top of the canvas — the swing pivots on the image's top
  centre.
- **How:** drop-in replace, or change the config line.

### Bricks (colours / textures)
- **What:** the tower blocks. Normal blocks use `brick-purple.png` with a
  CSS `hue-rotate` that cycles 6 colours as the tower grows; golden blocks
  (worth 3 floors) use `brick-gold.png`.
- **Where:** files `public/assets/bricks/brick-purple.png`,
  `brick-gold.png`; config keys `assets.brickPurple`, `assets.brickGold`.
  `brick-purple-alt.png` (`assets.brickPurpleAlt`) is a **spare alternate
  texture, currently unused** — point `assets.brickPurple` at it to use it.
- **Size/format:** PNG, 800×35 (very wide, short strip — one brick). The
  texture is stretched to the block size. For the hue-rotate colour cycle to
  work, the base texture should be a saturated colour (purple now); a
  grey/white texture won't shift colour. A gold texture stays gold because
  golden blocks don't get the hue filter.
- **How:** drop-in replace, or change the config lines. To change the colour
  cycle itself (how many colours, which hues), edit the `.block.c1`–`.c5`
  rules in `public/overlay.html` — a small CSS change, not a game change.

### Sounds
- **What:** five game sounds: build (+1 floor), golden (golden brick),
  wreck (tower loses floors), goal (target reached), milestone (every 10
  floors). **Default: synthesized WebAudio — no audio files ship with this
  repo.**
- **Where:** config key `sounds` in `config.json`:
  `{"build": "", "golden": "", "wreck": "", "goal": "", "milestone": ""}`.
- **Format:** each value is an optional path like
  `"assets/sounds/build.mp3"` (relative to `public/`). MP3 or WAV, short
  clips (under ~2s), normalised volume. Put your files under
  `public/assets/sounds/` (create the folder — it doesn't exist yet).
- **How:** config line only. Empty string / missing key = keep the
  synthesized sound for that slot. A wrong path plays **nothing** for that
  sound (no crash, no fallback beep) — test each sound after adding it.
  **No audio files are included — do not add any to the repo.**

### Background music
- **What:** soft ASMR ambience for the live: a slow detuned pad, sparse
  music-box notes on a pentatonic scale, and very soft filtered rain
  noise. **Default: generative WebAudio — no audio file needed, loops
  forever and never repeats exactly.**
- **Where:** config key `music` in `config.json`:
  `{"enabled": true, "volume": 0.15, "src": ""}`.
- **How:** config line only. Set `src` to an audio file path (e.g.
  `"assets/music/ambient.mp3"`, relative to `public/`) to play that file
  on loop **instead** of the generative music. Volume is the master music
  gain (0.15 = quiet background). The 🔊 button mutes music + SFX
  together; the sim panel (demo only) has a separate 🎵 music toggle.
  Browsers block autoplay until a gesture — the overlay retries starting
  the music every 2s and resumes on any click/tap.
- **Hype energy:** any gift flips the music to hype — faster note tempo,
  louder notes, a gentle driving pulse beat, brighter pad chords, and
  (for a file track) playbackRate ~1.1 + slightly higher volume. The
  level crossfades over ~1s when hype starts and ends. Config is the
  `hype` section (`enabled` / `durationSeconds` / `maxSeconds`): 20s with
  no gift fades back to calm; each gift extends the timer, capped at 60s
  total. Hype never changes game rules — presentation + music only.

### Witch voice (Edge TTS)
- **What:** the witch speaks with a soft female Chinese voice whenever she
  "says" something — POST /api/say and chat replies. Server-side
  Microsoft Edge TTS (free, no API key): the server generates an MP3,
  caches it under `public/assets/speech/<hash>.mp3` (same sentence =
  same file, never regenerated), and the overlay plays it when the
  matching speech bubble appears. If TTS fails or is unreachable, the
  bubble still shows with no audio — never a crash.
- **Where:** config key `voice` in `config.json`:
  `{"enabled": true, "voice": "zh-TW-HsiaoChenNeural", "rate": "-5%", "pitch": "-2Hz"}`.
  One line to change the voice later (e.g. `zh-CN-XiaoxiaoNeural` also
  works — tested). Replies stay short (one sentence) so the audio is
  quick to generate and hear.
- **How:** config line only. The TTS code lives in `server.js` (`tts.js` +
  `edge-drm.mjs` — the Sec-MS-GEC v2 token the service requires; a plain
  SHA-256 does not work). It needs the `ws` npm package (`npm install`;
  already in `package.json`). The generated MP3s are served by the server
  itself (MIME `audio/mpeg`).

### Muse host hook (POST /api/say)
- **What:** lets Muse speak through the witch live: `POST /api/say`
  `{"text": "...", "who": "..."}` → the witch shows a speech bubble with
  the text, a short feed entry is added, and the voice audio plays when
  TTS works. Test it with `POST /api/sim {"action": "say", "text": "...",
  "user": "..."}`. Presentation-only — the witch's words appear ON SCREEN;
  she cannot type into TikTok chat (that is a live browser operation).
  No auth (local server, same as the other sim/announce endpoints).

### Colours / theme
- **What:** the whole palette — page background, panel backgrounds, gold /
  pink / purple accents, footer gradient, goal-bar gradient, combo pill.
- **Where:** the `:root` block at the very top of `public/overlay.html`
  (inside `<style>`, clearly commented `THEME`). Every main colour in the
  CSS is a `var(--...)` that points back to that block.
- **How:** edit that one block only. Example: change `--gold:#ffd700` and
  every gold border, label and glow that uses it follows. Gradients are
  variables too (`--brand-gradient`, `--goal-gradient`, `--panel-gradient`,
  `--combo-gradient`). A few one-off accents (the rainbow side-progress bar,
  confetti colours, the crane hook) are still hard-coded hex in the CSS/JS —
  they are decorative; change them only if you want a total reskin.
- **Note:** text colours are `--text` (white), `--text-soft` and
  `--text-muted` (lavender). If your background is light, these are the
  three to flip first.

### All UI text / copy
UI copy lives in **two places** — text in `config.json` needs no code change,
text in `public/overlay.html` / `server.js` is a one-line edit each:

| Copy | Where |
|---|---|
| Game title + subtitle, header labels (goal / current / best / tower #), stats labels (likes / shares / chats), TOP 3 + feed headings, How-to-Build card, celebration text, sim-panel buttons + hint, demo/live tags, battle HUD, combo pill, cat speech bubbles, NPC say bubbles ("嘿嘿嘿！", "發大財！"), gift/mega card templates, zone banner format | `public/overlay.html` (search the Chinese text; each is one line) |
| Milestone banner lines (`{m}` = floor count) | `config.json` → `milestoneCopies` |
| Price ticker (marquee: on/off / loop seconds / separator) | `config.json` → `priceTicker` |
| Custom marquee lines (appended after the prices) | `config.json` → `customTickerLines` |
| Announcer schedule for live chat (interval / max items per message) | `config.json` → `priceRotation` |
| Tips ticker lines + interval | `config.json` → `tips` / `tipsIntervalSeconds` |
| Price ticker content (game names, items, prices) | `prices.json` — never from the overlay |
| Battle-start explainer (5s, rides the tips ticker line) | `public/overlay.html` (`showBattleExplainer`, one line) |
| Zone names (Chinese + English) | `config.json` → `zones` |
| Chat keyword → reaction mapping (which words trigger cheer / tease / heart / yawn) | `config.json` → `chatKeywords` |
| Feed / activity-log lines ("送出 Rose +1 層", "里程碑！塔來到 10 層！", battle open/close lines, "連擊 x5！下一層是金磚！") | `server.js` (`addFeed(...)` calls) — one line each, Traditional Chinese |
| Page `<title>` (browser tab) | `public/overlay.html` head |

No copy is fetched from anywhere else. If you translate the game, work
through that table top to bottom.

### Price ticker (代儲價目跑馬燈)
- **What:** a single continuously scrolling marquee strip at the bottom of the
  stage (pink strip, above the tips ticker and above the footer). Prices are
  not a main element of the scene — the game is — so the marquee carries them
  without taking up the middle of the stage. Its content is auto-built from
  `prices.json`: every game, all items sorted cheap → expensive, games
  separated by `｜`, ending with the LINE CTA; inquiry items show as
  "截圖詢問" (never as a price). The line loops seamlessly.
- **Where:** data in `prices.json` (`{"currency": "TWD", "games":
  [{"name", "items": [{"name", "price"}]}]}`); behaviour in `config.json`
  → `priceTicker` (`enabled` / `speedSeconds` / `separator`).
  Served at `GET /api/prices`.
- **Set your own marquee content:** `config.json` → `customTickerLines` is a
  list of strings appended after the prices (e.g. event announcements,
  limited offers). Put whatever you want in the marquee by editing that list —
  no code changes needed.
- **Price format:** a number (TWD) or the exact string `"截圖詢問"` (no fixed
  price — the ticker shows the string as-is). Never write `0` or invent a price
  for an item that has none. Ask-priced items sort last.
- **How:** add a game by appending one object to `prices.json`'s `games`
  array and saving — **no restart, no OBS browser-source refresh needed**.
  `prices.json` is re-read on every request, and the overlay re-fetches
  `/api/prices` + `/api/config` every 60 seconds, rebuilding the marquee only
  when the text actually changed (so a scroll never restarts mid-way). New
  prices appear on screen within 60 seconds; the tower is untouched.
  Prices are **never edited from the overlay** — there is no price-editing UI,
  only the sim button/key (P) that advances the announcer queue. Verify new
  prices against the Drive price tables (`01_遊戲價格資料庫`); Drive wins if
  they differ.
- **Hot reload (no restart):** `config.json` is auto-reloaded by the server
  (mtime check on every request + file watcher, survives atomic replace-by-
  rename); edits land in `GET /api/config` within ~2 seconds — `tips`,
  `customTickerLines` and `priceTicker` all take effect without a restart.
  A broken JSON file keeps the last good copy and logs an error; the server
  never crashes on a bad file.
- **Daily rotation:** `daily.json` —
  `{"default": {"tickerLines": [...], "tips": [...]}, "2026-11-24": {...}}`
  with `YYYY-MM-DD` date keys in Asia/Taipei time. The server resolves
  today's entry per request (or `default` when there is none) and flips at
  Taipei midnight with no restart. Daily `tickerLines` run after the prices
  and `customTickerLines`; daily `tips` join the tips rotation pool.
  `GET /api/config` returns the resolved day in its `daily` field
  (`{date, tickerLines, tips}`) for verification.
- **Announcer (live chat):** the server also rotates the same prices on the
  `priceRotation` interval as a one-line chat message at
  `GET /api/announce/next` (also in the SSE stream / `/api/state` as
  `announce`); the marquee shows all items all the time, while the chat
  message rotates one game at a time (top 6 items). The server never sends
  chat — during a live, Muse posts that line from the host account's
  logged-in browser. See README "直播時把報價發進聊天室".

### Tips ticker (底部提示跑馬燈)
- **What:** the one-line ticker above the footer, cycling through the
  interaction rules in plain words (e.g. "送玫瑰 +1 層"), always running.
  It sits directly above the price marquee — two stacked strips with distinct
  styling (tips = gold/rules, marquee = pink/prices), neither covering the
  tower, the panels, or the footer.
- **Where:** `config.json` → `tips` (list of lines) and `tipsIntervalSeconds`
  (seconds per line, default 8). Rotation never repeats the same line twice
  in a row. Daily tips from `daily.json` join the same pool (see Price ticker
  → Daily rotation above).
- **How:** config only — edit the list and save; the server auto-reloads
  `config.json`, no restart needed.

### Brand footer (LINE / shop)
- **What:** the gradient pill at the bottom: `💬 LINE：… · 🛒 …`.
- **Where:** config key `brand` in `config.json`:
  `{"line": "@your-line-id", "shop": "your-shop-name"}`. The overlay renders
  it from `CONFIG.brand` at load.
- **How:** config line only. The shipped defaults are **placeholders** —
  the public copy shows `@your-line-id` / `your-shop-name` until the owner
  sets their real values. Never put a real LINE ID or shop name in a public
  fork; set it in your own private copy of `config.json`.

### Gift mapping + tiers
- **What:** which TikTok gifts build / gold / wreck the tower, and the
  diamond-value tiers that decide how big the celebration is.
- **Where:** `config.json` → `giftMapping` (`block` / `golden` / `wreck`
  lists of TikTok gift English names) and `giftTiers` (`tiers`: small ≥0 /
  mid ≥30 / big ≥99 diamonds; `actions`: which NPC actions each tier plays).
- **How:** config only. Use the gift's English name exactly as
  `tiktok-live-connector` reports it (e.g. `"Rose"`, `"Donut"`,
  `"Fireworks"`). A gift not listed here is counted but builds nothing.
  Changing the numbers never touches `server.js`.

### Zones
- **What:** the named height bands the tower passes through
  (e.g. 0 起始區 / 10 微風區 / 20 高空區 / 30 雲海區 / 37 雲端之上),
  each with a banner + confetti when reached.
- **Where:** `config.json` → `zones` (each: `min` floor, `name`, `en`).
- **How:** config only. Add, remove or rename bands freely; keep them
  sorted by `min` ascending and keep a `min: 0` entry first.

### Chat keywords
- **What:** chat words that make NPCs react (cheer / tease / heart / yawn).
- **Where:** `config.json` → `chatKeywords`
  (`keywords` → `reaction`).
- **How:** config only. Chat never adds floors — it only changes the
  picture and the NPCs.

### Goal height
- **What:** the target floor count (default 50). Reaching it triggers the
  full-screen celebration; a new tower is then started manually
  (or automatically — see below).
- **Where:** `config.json` → `goalHeight`.
- **How:** config only. The goal line, progress bar and "N floors to the
  next zone" hint all follow automatically.

### Combo / battle / idle settings
- **What:** the tuning knobs for the three systems. None of these change the
  rules themselves, only the numbers.
- **Where:** all in `config.json`:
  - Combo: `comboThreshold` (gifts to arm a golden brick, default 5),
    `comboWindowSeconds` (window, default 10),
    `comboBonusFloors` (extra floors on a combo golden, default 2).
  - Battle: `battle.durationSeconds` (default 60), `battle.enabled`.
  - Auto-build (never dead air): `autoBuild.enabled` (default true),
    `autoBuild.intervalSeconds` (seconds per free floor, default 35 —
    interval edits apply via config hot-reload, no restart). Auto floors
    never touch the Top 3 board or battle scores, and pause during a
    battle or after the goal. Each auto floor fires one of six rotating
    effects from `fxPools.autoBuild` (starBurst / confettiPop /
    rainbowRain / hearts / firework / sparkleWave — never the same twice
    in a row), with 3 rotating feed wordings.
  - Winter snow: `backgrounds.snow` (default true — ~26 drifting flakes
    over the night scene; the background image, moon and city lights stay).
  - Idle (anti-dead-air): `idleTimeoutSeconds` (default 15 — how long with
    no events before the scene animates itself, about one action every
    12 s).
  - Also: `likesPerFloor` (default 200), `wreckRemovesFloors` (default 2),
    `milestoneEvery` (default 10), `autoResetSeconds` (`0` = start a new
    tower manually after the goal; set e.g. `30` to auto-restart),
    `triggers` (`follow` / `share` / `likes` / `join` — which free actions
    add a floor).
  - Price ticker (marquee): `priceTicker` (`enabled`, `speedSeconds`
    default 30, `separator` default `" · "`), plus `customTickerLines`
    (extra marquee lines, appended after the prices). Announcer schedule
    for live chat: `priceRotation` (`enabled`, `intervalSeconds` default 10,
    `maxItemsPerCard` default 6). Tips ticker: `tips` (lines),
    `tipsIntervalSeconds` (default 8).
- **How:** config only, restart the server.

---

## What genuinely needs code changes

Everything above is config, drop-in files, or one-line copy edits. These
need real code:

| Change | Where | Why |
|---|---|---|
| A new NPC **behaviour** (new entrance, new action, new pose swap) | `public/overlay.html` (JS action functions) + `config.json` `npcActions` to trigger it | Actions (`wave`, `cast`, `dance`, `flyby`, `push`, `enter`, `jump`, `heart`, `crown`, `dizzy`, `yawn`) are implemented in the overlay JS; config can only recombine the existing ones |
| A new **game mode** (new win condition, new floor rule, new event type) | `server.js` | Rules live there; `config.json` holds the numbers, not the logic |
| A new **gift effect** (a gift that does something other than +1 / +3 / −2) | `server.js` (`handleGift`) | The three tiers are the whole rule set |
| A new **free-action effect** (new like/share/chat visual) | `public/overlay.html` (fx renderers) + `config.json` `fxPools` to list it | The pools rotate through implemented variants only |
| A new **sound slot** (a sixth sound) | `public/overlay.html` (add a `playFileSound('name')` call) + `config.json` `sounds` | The five slots are the ones wired up |
| A new **asset slot** (a tenth image the overlay should load) | `public/overlay.html` (add a `data-asset` element / CSS var) + `config.json` `assets` | The overlay only loads the slots it knows |

Everything else — art, brand, colours, copy, numbers, thresholds, zones,
keywords, tiers — is a file swap or a config line.

---

## "Make it yours" checklist

- [ ] Logo replaced (`assets.brand.logo`)
- [ ] Background replaced (`assets.background`)
- [ ] Main character both poses replaced (`witch`, `witchCast`)
- [ ] Mascot three faces replaced (`catHappy`, `catScared`, `catHeart`)
- [ ] Guest NPCs replaced or kept (`fairy`, `pumpkin`, `luckyCat`, `climber`)
- [ ] Wrecking ball replaced (`wreckingBall`)
- [ ] Bricks replaced (`brickPurple`, `brickGold`; alt texture tried?)
- [ ] Colours reskinned (`:root` block in `overlay.html`)
- [ ] Title + subtitle rewritten (`overlay.html`)
- [ ] Price tables set (`prices.json` — real prices, verified against Drive;
      new games added there, never from the overlay)
- [ ] Tips ticker lines fitted to your community (`tips`)
- [ ] Brand footer set (`brand.line`, `brand.shop` — real values only in
      your private copy, never in a public fork)
- [ ] Milestone lines rewritten (`milestoneCopies`)
- [ ] Zone names rewritten (`zones`)
- [ ] Chat keywords fitted to your community (`chatKeywords`)
- [ ] Gift mapping fitted to your audience's gifts (`giftMapping`,
      `giftTiers`)
- [ ] Goal height set (`goalHeight`)
- [ ] `tiktokUsername` set, `demo` set to `false` for going live
- [ ] Sounds: kept synth, or added your own files under
      `public/assets/sounds/` + `sounds` keys
- [ ] Screenshots re-taken (the `preview/` images still show the old art)
- [ ] License chosen (`LICENSE` file added; `package.json` `license` updated
      to match)
- [ ] `config.json` in your live copy has your real brand — and your public
      fork still has the placeholders

---

# CUSTOMIZE.md — 改成你自己的遊戲

> **授權（License）尚未決定：** 這個 repo 目前沒有 `LICENSE` 檔案，擁有者
> 在公開之前仍需選擇一個。兩個常見選項：**MIT**——最寬鬆，任何人都可以
> 使用、修改、販售，只需保留原作者聲明；**Apache-2.0**——與 MIT 類似，
> 另外附帶明確的專利授權。（另請注意：`package.json` 目前寫著
> `"license": "ISC"`，那是初始 scaffold 留下的——請確認或改成你選的授權。）

> **原始生成素材不進 repo：** `assets-raw/` 資料夾（去背前的原始圖、生成
> metadata）已列入 `.gitignore`，也不會放進釋出的 zip。公開的只有
> `public/assets/` 裡完成、清理過的成品素材。

這個遊戲就是設計來給人 fork 改作的。**遊戲規則完全不用改：** 送禮蓋樓、
連擊金磚、目標、破壞、對戰、待機邏輯都在 `server.js`＋`config.json`，
不管你換上什麼美術都一樣運作。所有看得見的東西都可以用三種方式換：

| 方式 | 意思 |
|---|---|
| **直接覆蓋檔案** | 用你自己的檔案覆蓋同一路徑的檔案（同格式），不用改其他任何地方。 |
| **改設定** | 改 `config.json` 一個值（`assets` 的路徑、`brand`／`zones`／`milestoneCopies` 的文字、規則的數字），重啟伺服器。 |
| **改程式碼** | 改 `public/overlay.html`（外觀／文案）或 `server.js`（行為）。只有文末列出的項目才需要。 |

素材路徑是 **設定驅動**的：`config.json` 有一張 `assets` 對照表
（slot → 檔案路徑，以 `public/` 為根目錄）。`server.js` 經
`GET /api/config` 回傳整張表，`overlay.html` 載入時全部從這張表讀取。
如果 `config.json` 缺了某個 slot，畫面會用程式內建的預設路徑 fallback
（就是現在的檔案），所以缺 key 也不會破圖。換素材＝**換檔案或改一行設定**。

目前的素材配置：

```
public/assets/
├── brand/        logo.png
├── background/   bg-night.jpg
├── characters/   witch.png, witch-cast.png, cat-happy.png, cat-scared.png, cat-heart.png
├── npcs/         fairy.png, pumpkin-devil.png, lucky-cat.png, climber.png
├── props/        wrecking-ball.png
└── bricks/       brick-purple.png, brick-purple-alt.png, brick-gold.png
```

---

## 5 分鐘換皮（快速開始）

1. **Logo**——把 `public/assets/brand/logo.png` 換成你的方形 logo。
2. **背景**——把 `public/assets/background/bg-night.jpg` 換成你的場景
   （1080×1920，JPG）。
3. **兩個角色**——換 `public/assets/characters/witch.png`（主角待機姿勢）
   和 `cat-happy.png`（吉祥物開心臉）。
4. **顏色**——改 `public/overlay.html` 頂部的 `:root` 區塊（金、粉、紫、
   漸層都在同一個區塊，見「顏色／主題」）。
5. **品牌 footer**——在 `config.json` 設定 `brand.line`（例如
   `"@your-line"`）和 `brand.shop`（例如 `"your-shop-name"`）。
6. **標題**——在 `public/overlay.html` 改 `#title`（和 `<title>` 標籤）
   成你的遊戲名稱。
7. 重啟：`npm start`，開 `http://localhost:3000/?demo=true`，確認 footer
   顯示你的品牌、新美術都有出現。

這樣就完成了——塔、禮物、連擊、對戰、待機邏輯完全沒動。

---

## 逐項說明：換什麼、在哪、怎麼換

### Logo
- **是什麼：** 左上角標題旁邊的圓形品牌頭像。
- **在哪：** 檔案 `public/assets/brand/logo.png`，設定 key `assets.logo`。
- **尺寸／格式：** 方形 PNG，1080×1080（目前檔案）。顯示為 88px 圓形，
  外圈金色環。任何方形 PNG 都可以，透明背景也行（圓環是 CSS 畫的）。
  88px 顯示下要能看清楚——圖形簡單一點，不要放小字。
- **怎麼換：** 直接覆蓋檔案，或改 `assets.logo` 指向你的檔案。

### 背景場景
- **是什麼：** 整個畫面背後的夜空場景。
- **在哪：** 檔案 `public/assets/background/bg-night.jpg`，設定 key
  `assets.background`。
- **尺寸／格式：** JPG，**1080×1920**（舞台實際尺寸，直式）。以 `cover`
  顯示，所以同比例都行，但 1080×1920 最精準。中間區域請保持偏暗、低對比
  ——塔、面板和文字都疊在上面。
- **怎麼換：** 直接覆蓋檔案，或改 `assets.background` 指向你的檔案。

### 主角（女巫＋施法姿勢）
- **是什麼：** 坐在塔頂的主角。兩個姿勢：待機（`witch.png`，上下浮動）
  和施法（`witch-cast.png`，施法／跳舞動作時顯示，結束換回來）。
- **在哪：** 檔案 `public/assets/characters/witch.png`、
  `witch-cast.png`；設定 key `assets.witch`、`assets.witchCast`。
- **尺寸／格式：** 透明底 PNG。目前檔案為精細插畫風（2026-11-24 重繪，
  女巫是全場最精細的角色）：女巫 1536×1664、施法 1504×1680，塔頂顯示約
  200px 寬。兩個姿勢請用同比例、同畫布尺寸畫，切換時才不會跳動。角色置中，
  周圍留透明邊距。親吻特寫（`witch-kiss.png`，設定 key
  `assets.witchKiss`）：蓋塔禮物（+1／金磚，不含破壞球）時放大顯示，最多
  每 `kiss.cooldownSeconds`（預設 3 秒）一次；檔案不存在時自動改用女巫待機圖。
- **怎麼換：** 兩個檔案直接覆蓋（保持「雙姿勢」的概念），或改兩個設定。
  施法姿勢由設定觸發（`npcActions`／`giftTiers` 裡哪些事件用 `cast`
  動作），不用改程式。

### 吉祥物（白貓三種臉）
- **是什麼：** 左下角的吉祥物。三張臉，遊戲會自動切換：開心（預設）、
  嚇到（塔被拆時）、比愛心（有人告白／金磚時）。
- **在哪：** 檔案 `public/assets/characters/cat-happy.png`、
  `cat-scared.png`、`cat-heart.png`；設定 key `assets.catHappy`、
  `assets.catScared`、`assets.catHeart`。
- **尺寸／格式：** 透明底 PNG。目前檔案為精細插畫風（2026-11-24 重繪）：
  開心 1360×1520、嚇到 1328×1552、比心 1136×2080，顯示約 170px
  寬。三張臉請用同比例、同畫布尺寸畫，切換才不會跳動。
- **怎麼換：** 直接覆蓋檔案，或改三個設定。*什麼時候*出現哪張臉由遊戲
  事件決定（破壞→嚇到、告白／金磚→比心）；要改出現時機只要改
  `config.json` 的 `npcActions`（見 README「NPC 特殊動作」），不用改程式。

### 客座 NPC（精靈／南瓜／招財貓／攀爬者）
- **是什麼：** 四位客座角色，各有固定工作：
  - **精靈**（`fairy.png`）——大場面時飛越全畫面（連擊、里程碑、對戰
    獲勝、第 10 位聊天觀眾）。
  - **搗蛋南瓜**（`pumpkin-devil.png`）——塔被拆或有人聊天說「拆／壞」時，
    推著破壞球進場。
  - **招財貓**（`lucky-cat.png`）——只在大禮物時進場（單筆達到 `big`
    門檻，或連擊金磚），撒金幣，8 秒後離開。
  - **攀爬者**（`climber.png`）——塔右邊戴紅帽的小人；**他就是目前打賞榜
    第一名**（名牌跟著他走）。
- **在哪：** 檔案 `public/assets/npcs/`；設定 key `assets.fairy`、
  `assets.pumpkin`、`assets.luckyCat`、`assets.climber`。
- **尺寸／格式：** 透明底 PNG。目前檔案（2026-11-24 重繪成精細插畫風，
  招財貓除外、仍為原本像素版）：精靈 1712×1232、南瓜 1664×1536、招財貓
  1227×1480、攀爬者 1280×1920。顯示約 110–250px 寬。
  任何角色都行，只要在這個尺寸下看得清楚、有透明邊距。
- **怎麼換：** 直接覆蓋檔案，或改設定。*什麼時候*出場由 `config.json`
 （`npcActions`＋`giftTiers`）決定，不用改程式。給客座加**新行為**
  （新進場方式、新動作）才是程式改動——見文末「真正需要改程式的項目」。

### 破壞球
- **是什麼：** 塔掉層時從右上方擺進來的球。
- **在哪：** 檔案 `public/assets/props/wrecking-ball.png`；設定 key
  `assets.wreckingBall`。
- **尺寸／格式：** 透明底 PNG。目前檔案 1055×1513（高：球＋鐵鍊）。
  顯示 300px 寬，從頂部邊緣擺動。鐵鍊請畫在畫布頂部——擺動支點是圖片
  的頂部中心。
- **怎麼換：** 直接覆蓋檔案，或改設定。

### 磚塊（顏色／材質）
- **是什麼：** 塔身。普通磚用 `brick-purple.png`，再以 CSS `hue-rotate`
  讓塔長高時循環 6 種顏色；金磚（值 3 層）用 `brick-gold.png`。
- **在哪：** 檔案 `public/assets/bricks/brick-purple.png`、
  `brick-gold.png`；設定 key `assets.brickPurple`、`assets.brickGold`。
  `brick-purple-alt.png`（`assets.brickPurpleAlt`）是**備用材質，目前沒用到**
  ——把 `assets.brickPurple` 指過去就能用。
- **尺寸／格式：** PNG，800×35（很寬很扁的單塊磚）。材質會被拉伸到磚塊
  尺寸。色相循環要有效，底圖必須是飽和色（現在是紫色）；灰色／白色底圖
  轉不出顏色。金磚不套 hue 濾鏡，所以金色材質會保持金色。
- **怎麼換：** 直接覆蓋檔案，或改設定。要改顏色循環本身（幾種顏色、哪
  些色相），改 `public/overlay.html` 裡 `.block.c1`–`.c5` 的規則——小幅
  CSS 改動，不是遊戲改動。

### 音效
- **是什麼：** 五種遊戲音效：蓋樓（＋1 層）、金磚、破壞（掉層）、達標、
  里程碑（每 10 層）。**預設是 WebAudio 合成音——這個 repo 不附任何音檔。**
- **在哪：** `config.json` 的 `sounds`：
  `{"build": "", "golden": "", "wreck": "", "goal": "", "milestone": ""}`。
- **格式：** 每個值是選擇性的音檔路徑，例如
  `"assets/sounds/build.mp3"`（以 `public/` 為根目錄）。MP3 或 WAV，
  短音（2 秒內）、音量先標準化。把你的檔案放進
  `public/assets/sounds/`（這個資料夾目前不存在，請自己建）。
- **怎麼換：** 只改設定。空字串／缺 key＝該音效繼續用合成音。路徑寫錯
  時該音效會**靜音**（不會當掉，也不會有替代嗶聲）——加完請逐一測試。
  **本 repo 不附音檔，請不要加任何音檔進來。**

### 背景音樂
- **是什麼：** 直播用的輕柔 ASMR 背景音樂：慢速和聲墊、五聲音階八音盒
  音符、極輕的雨聲。**預設是 WebAudio 生成式音樂——不用音檔，永久循環
  且永不重複。**
- **在哪：** `config.json` 的 `music`：
  `{"enabled": true, "volume": 0.15, "src": ""}`。
- **怎麼換：** 只改設定。`src` 填音檔路徑（例如
  `"assets/music/ambient.mp3"`，以 `public/` 為根目錄）時，改播該檔案
  循環，**取代**生成式音樂。音量是音樂總音量（0.15＝輕柔背景音）。🔊
  按鈕同時靜音音樂＋音效；模擬面板（僅 demo 模式）另有 🎵 音樂開關。
  瀏覽器會擋自動播放——畫面會每 2 秒重試啟動音樂，點一下畫面也會恢復。

### 顏色／主題
- **是什麼：** 整個配色——頁面底色、面板底色、金／粉／紫主色、footer
  漸層、目標條漸層、連擊 pill。
- **在哪：** `public/overlay.html` 最頂部 `<style>` 內的 `:root` 區塊
  （有清楚的 `THEME` 註解）。CSS 裡的主要顏色都是指回這個區塊的
  `var(--...)`。
- **怎麼換：** 只改那一個區塊。例如改 `--gold:#ffd700`，所有用它的金色
  邊框、標籤、光暈都會跟著變。漸層也是變數（`--brand-gradient`、
  `--goal-gradient`、`--panel-gradient`、`--combo-gradient`）。少數一次性
  點綴色（彩虹側邊進度條、紙屑顏色、吊鉤）仍是 CSS／JS 裡寫死的 hex——
  只是裝飾，要全面換皮時再改。
- **注意：** 文字色是 `--text`（白）、`--text-soft`、`--text-muted`
  （淡紫）。如果你的背景是淺色，這三個要先翻過來。

### 全部 UI 文字／文案
UI 文案在**兩個地方**——`config.json` 裡的改設定就好，
`public/overlay.html`／`server.js` 裡的各改一行：

| 文案 | 在哪 |
|---|---|
| 遊戲標題＋副標、頂部標籤（目標／目前／最佳／第 N 座塔）、統計標籤（讚／分享／聊天）、TOP 3＋動態標題、玩法卡、慶祝文字、模擬面板按鈕＋提示、DEMO／LIVE 標籤、對戰 HUD、連擊 pill、白貓對話泡泡、NPC 台詞（「嘿嘿嘿！」「發大財！」）、禮物／金磚卡片模板、分區橫幅格式 | `public/overlay.html`（搜尋中文，每處一行） |
| 里程碑橫幅文案（`{m}`＝層數） | `config.json` → `milestoneCopies` |
| 價目跑馬燈（開關／跑一圈秒數／分隔符） | `config.json` → `priceTicker` |
| 跑馬燈自訂句（接在價目後面） | `config.json` → `customTickerLines` |
| 直播聊天播報器排程（間隔／每則最多品項） | `config.json` → `priceRotation` |
| 提示跑馬燈句子＋間隔 | `config.json` → `tips`／`tipsIntervalSeconds` |
| 價目跑馬燈內容（遊戲名、品項、價格） | `prices.json`——永遠不要從畫面改 |
| 對戰開戰說明（5 秒，跑在提示跑馬燈那一行） | `public/overlay.html`（`showBattleExplainer`，一行） |
| 分區名稱（中文＋英文） | `config.json` → `zones` |
| 聊天關鍵字→反應對照（哪些詞觸發加油／搗蛋／比心／打哈欠） | `config.json` → `chatKeywords` |
| 動態 feed 文案（「送出 Rose ＋1 層」「里程碑！塔來到 10 層！」、對戰開戰／結束、連擊提示） | `server.js`（`addFeed(...)`，各一行，繁體中文） |
| 瀏覽器分頁 `<title>` | `public/overlay.html` head |

文案沒有其他來源。要翻譯遊戲，就按這張表從上往下改。

### 價目表（代儲價目跑馬燈）
- **是什麼：** 畫面底部一條一直跑的跑馬燈（粉紅色條，在提示跑馬燈上方、
  footer 上方）。價目不是畫面主角，不佔中段位置——遊戲本身才是主角。
  內容由 `prices.json` 自動組成：每款遊戲全部品項由便宜到貴排，遊戲之間
  用 `｜` 分隔，最後加「詳情 LINE @809givsd」，整行無縫循環。問價品項寫
  「截圖詢問」，絕不編價。
- **在哪：** 資料在 `prices.json`（`{"currency": "TWD", "games":
  [{"name", "items": [{"name", "price"}]}]}`）；行為在 `config.json` 的
  `priceTicker`（`enabled`／`speedSeconds`／`separator`）。
  以 `GET /api/prices` 提供。
- **自訂跑馬燈內容：** `config.json` 的 `customTickerLines` 是字串陣列，
  會接在價目後面一起跑（例如活動公告、限時優惠）。想在跑馬燈放什麼就改
  這個清單，不用動程式。
- **價格格式：** 數字（台幣）或 exactly `"截圖詢問"` 字串（沒固定價——跑馬燈
  原樣顯示這個字串）。沒固定價的品項絕對不要寫 `0`、不要編一個價。
  問價品項排在最後。
- **怎麼加遊戲：** 在 `prices.json` 的 `games` 陣列加一個物件，存檔就好，
  **不用重啟、不用在 OBS 重新整理**：`prices.json` 每次請求都重讀，畫面
  跑馬燈每 60 秒重抓一次，文字變了才重建（沒變就不動，捲動不會中途重起），
  新價目 60 秒內自己出現，塔不受影響。**價目永遠不要從畫面改**——畫面沒有改價功能，只有模擬用的
  下一則播報按鈕／按鍵（P）。新價目要和 Drive 價目表
  （`01_遊戲價格資料庫`）核對，Drive 和檔案不一致時以 Drive 為準。
- **設定熱更新（不用重啟）：** `config.json` 由伺服器自動重讀（每次請求檢查
  mtime＋檔案監看，原子換檔 rename 也能跟上），改完約 2 秒內 `GET /api/config`
  就回新內容，`tips`、`customTickerLines`、`priceTicker` 都不用重啟就生效。
  JSON 寫壞時保留上一份好的、記錯誤 log，伺服器絕對不會當掉。
- **每日輪換：** `daily.json`，格式
  `{"default": {"tickerLines": [...], "tips": [...]}, "2026-11-24": {"tickerLines": [...], "tips": [...]}}`，
  日期鍵是 `YYYY-MM-DD`（台北時間，伺服器用 `Asia/Taipei` 算今天）。每天
  0 點（台北時間）自動切到當天條目，找不到當天就用 `default`，不用重啟。
  當天 `tickerLines` 接在價目和 `customTickerLines` 後面一起跑；當天 `tips`
  併進提示句輪播池，「絕不連續重複」照樣有效。`GET /api/config` 的 `daily`
  欄位回傳當天日期與解析後的句子，方便驗證。出貨的 `daily.json` 只留
  `default`（中性提醒），不要放沒說過的促銷、折扣或主推遊戲。
- **播報器（直播聊天）：** 伺服器同時以 `priceRotation` 的間隔輪播同一批價目，
  做成一行聊天訊息，見 `GET /api/announce/next`（SSE／`/api/state` 也有
  `announce` 欄位）；跑馬燈一直跑全部品項，聊天報價一次一款遊戲（前 6 名）。
  伺服器本身不發送聊天——開播時由 Muse 以主播帳號在已登入的瀏覽器發送，
  見 README「直播時把報價發進聊天室」。

### 提示跑馬燈（底部）
- **是什麼：** footer 上方的一行提示，用白話輪播互動規則（例如「送玫瑰 +1 層」），整場一直跑。
  它疊在價目跑馬燈上方——兩條上下疊著、樣式不同（提示＝金色／規則，跑馬燈＝粉紅／價目），
  都不會蓋到塔、面板或 footer。
- **在哪：** `config.json` 的 `tips`（句子清單）和 `tipsIntervalSeconds`
  （每句秒數，預設 8 秒）。輪播絕不連續重複同一句。`daily.json` 的當天
  `tips` 會併進同一個輪播池（見上方「每日輪換」）。
- **怎麼換：** 只改設定、存檔，伺服器自動重讀，不用重啟。

### 品牌 Footer（LINE／商店）
- **是什麼：** 底部漸層 pill：`💬 LINE：… · 🛒 …`。
- **在哪：** `config.json` 的 `brand`：
  `{"line": "@your-line-id", "shop": "your-shop-name"}`。畫面載入時從
  `CONFIG.brand` 渲染。
- **怎麼換：** 只改設定。附帶的預設值是**佔位符**——公開版會顯示
  `@your-line-id`／`your-shop-name`，直到擁有者填入真實資料。真的 LINE
  ID 或商店名不要放進公開 fork，只填在你自己的 `config.json`。

### 禮物對照＋分級
- **是什麼：** 哪些 TikTok 禮物蓋樓／金磚／拆塔，以及用鑽石價值分級決定
  慶祝規模。
- **在哪：** `config.json` → `giftMapping`（`block`／`golden`／`wreck`，
  TikTok 禮物英文名清單）和 `giftTiers`（`tiers`：small ≥0／mid ≥30／
  big ≥99 鑽；`actions`：每級播放的 NPC 動作）。
- **怎麼換：** 只改設定。禮物英文名要和 `tiktok-live-connector` 回報的
  完全一致（例如 `"Rose"`、`"Donut"`、`"Fireworks"`）。沒列進去的禮物會
  被計數但不蓋樓。改數字永遠不用動 `server.js`。

### 分區
- **是什麼：** 塔經過的高度分區（例如 0 起始區／10 微風區／20 高空區／
  30 雲海區／37 雲端之上），跨區時顯示橫幅＋紙屑。
- **在哪：** `config.json` → `zones`（每區：`min` 層數、`name`、`en`）。
- **怎麼換：** 只改設定。增刪改名都可以；保持按 `min` 由小到大排，第一
  筆保持 `min: 0`。

### 聊天關鍵字
- **是什麼：** 讓 NPC 有反應的聊天詞（加油／搗蛋／比心／打哈欠）。
- **在哪：** `config.json` → `chatKeywords`（`keywords` → `reaction`）。
- **怎麼換：** 只改設定。聊天永遠不加樓層——只影響畫面和 NPC。

### 目標高度
- **是什麼：** 目標層數（預設 50）。達標觸發全畫面慶祝，之後手動開新塔
  （或自動——見下方）。
- **在哪：** `config.json` → `goalHeight`。
- **怎麼換：** 只改設定。目標線、進度條、「再 N 層到下一區」提示都會自動
  跟著變。

### 連擊／對戰／待機設定
- **是什麼：** 三個系統的調校數字。改的是數字，不是規則本身。
- **在哪：** 全部在 `config.json`：
  - 連擊：`comboThreshold`（幾次禮物觸發金磚待命，預設 5）、
    `comboWindowSeconds`（幾秒內算連擊，預設 10）、
    `comboBonusFloors`（連擊金磚額外加幾層，預設 2）。
  - 對戰：`battle.durationSeconds`（預設 60）、`battle.enabled`。
  - 自動蓋塔（絕不冷場）：`autoBuild.enabled`（預設 true）、
    `autoBuild.intervalSeconds`（幾秒自己蓋一層，預設 35——改間隔走
    config 熱更新，不用重啟）。自動蓋的層不計入打賞榜和對戰分，對戰中
    和達標後暫停。每一層觸發 `fxPools.autoBuild` 6 種特效輪播
    （starBurst／confettiPop／rainbowRain／hearts／firework／
    sparkleWave，絕不連續重複），feed 文案 3 種輪播。
  - 冬季飄雪：`backgrounds.snow`（預設 true——約 26 片雪花飄在夜空上，
    背景圖、月亮、城市燈光不動）。
  - 待機（絕不冷場）：`idleTimeoutSeconds`（預設 15——多久沒事件場景就
    自己動起來，約每 12 秒一次）。
  - 其他：`likesPerFloor`（預設 200）、`wreckRemovesFloors`（預設 2）、
    `milestoneEvery`（預設 10）、`autoResetSeconds`（`0`＝達標後手動開新塔；
    設例如 `30`＝30 秒後自動開新塔）、`triggers`（`follow`／`share`／
    `likes`／`join`——哪些免費動作加一層）。
  - 價目跑馬燈：`priceTicker`（`enabled`、`speedSeconds` 預設 30、
    `separator` 預設 `" · "`），另有 `customTickerLines`（自訂句，接在
    價目後面）。直播聊天播報器排程：`priceRotation`（`enabled`、
    `intervalSeconds` 預設 10、`maxItemsPerCard` 預設 6）。提示跑馬燈：`tips`（句子）、
    `tipsIntervalSeconds`（預設 8）。
- **怎麼換：** 只改設定，重啟伺服器。

---

## 真正需要改程式的項目

上面全部都是設定、覆蓋檔案或一行文案。以下這些才需要真的改程式：

| 改動 | 在哪 | 原因 |
|---|---|---|
| NPC **新行為**（新進場方式、新動作、新姿勢切換） | `public/overlay.html`（JS 動作函式）＋`config.json` 的 `npcActions` 來觸發 | 動作（`wave`、`cast`、`dance`、`flyby`、`push`、`enter`、`jump`、`heart`、`crown`、`dizzy`、`yawn`）是在 overlay JS 裡實作的；設定只能重組現有的動作 |
| 新**遊戲模式**（新勝利條件、新蓋樓規則、新事件種類） | `server.js` | 規則在那裡；`config.json` 只有數字，沒有邏輯 |
| 新**禮物效果**（＋1／＋3／−2 以外的效果） | `server.js`（`handleGift`） | 三種 tier 就是全部規則 |
| 新**免費動作特效**（新的讚／分享／聊天視覺） | `public/overlay.html`（特效渲染）＋`config.json` 的 `fxPools` 列出它 | 特效池只會輪播已實作的變體 |
| 新**音效 slot**（第六種音效） | `public/overlay.html`（加一行 `playFileSound('name')`）＋`config.json` 的 `sounds` | 目前只有五個 slot 有接線 |
| 新**素材 slot**（第十張圖） | `public/overlay.html`（加 `data-asset` 元素／CSS 變數）＋`config.json` 的 `assets` | 畫面只會載入它認得的 slot |

其他——美術、品牌、顏色、文案、數字、門檻、分區、關鍵字、分級——
都是換檔案或改一行設定。

---

## 「改成你的」檢查清單

- [ ] Logo 已換（`assets.brand.logo`）
- [ ] 背景已換（`assets.background`）
- [ ] 主角雙姿勢已換（`witch`、`witchCast`）
- [ ] 吉祥物三張臉已換（`catHappy`、`catScared`、`catHeart`）
- [ ] 客座 NPC 已換或保留（`fairy`、`pumpkin`、`luckyCat`、`climber`）
- [ ] 破壞球已換（`wreckingBall`）
- [ ] 磚塊已換（`brickPurple`、`brickGold`；備用材質試過了嗎？）
- [ ] 顏色已換皮（`overlay.html` 的 `:root` 區塊）
- [ ] 標題＋副標已重寫（`overlay.html`）
- [ ] 價目表已設定（`prices.json`——真實價格，已和 Drive 核對；加遊戲改這裡，永遠不要從畫面改）
- [ ] 提示跑馬燈句子已配合你的社群（`tips`）
- [ ] 品牌 footer 已設定（`brand.line`、`brand.shop`——真實資料只放在你
      自己的 copy，公開 fork 保持佔位符）
- [ ] 里程碑文案已重寫（`milestoneCopies`）
- [ ] 分區名稱已重寫（`zones`）
- [ ] 聊天關鍵字已配合你的社群（`chatKeywords`）
- [ ] 禮物對照已配合你的觀眾常送的禮物（`giftMapping`、`giftTiers`）
- [ ] 目標高度已設定（`goalHeight`）
- [ ] `tiktokUsername` 已填，正式開播 `demo` 改 `false`
- [ ] 音效：保留合成音，或自備音檔放 `public/assets/sounds/`＋設定
      `sounds`
- [ ] 預覽截圖已重拍（`preview/` 的圖仍是舊美術）
- [ ] 授權已選（已加 `LICENSE` 檔；`package.json` 的 `license` 已同步）
- [ ] 正式用的 `config.json` 有你的真實品牌——公開 fork 仍是佔位符
