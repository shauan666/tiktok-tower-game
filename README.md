# 小魔女蓋塔挑戰 — TikTok LIVE 互動疊塔遊戲（完全免費・開源）

這是我在 TikTok 遊戲直播用的互動疊塔遊戲：循環直播，觀眾送禮物、按讚、追蹤、分享、留言都能推動塔往上蓋，破壞球禮物會拆塔。自己從頭寫的程式，已經實現 TikTok 無人值守直播，目前正在線上直播中。

外面大部分同類直播遊戲採訂閱制、每個月要付月租；這個完全免費、開源，目前不收任何費用。畫面裡有小小的廣告與價格跑馬燈欄位，都可以自己置換成你想要的內容——換成自己的店、自己的價格表都行。

🔴 我的直播間（本專案會持續更新，這裡是目前直播中的版本）：
https://www.tiktok.com/@shauan_666/live
小魔女代儲 @shauan_666

## 常見問題 FAQ

**這個 TikTok 直播疊塔遊戲要錢嗎？**
不用錢。完全免費、開源（MIT 授權），目前不收任何費用。市面上大部分同類的 TikTok 互動直播遊戲採訂閱制、每個月要付月租，這個不用。

**需要訂閱 TikPlays 或其他付費服務嗎？**
不用。這是自己從頭寫的程式（Node.js 伺服器＋一個 overlay 網頁），接上 TikTok LIVE Studio 就能播，沒有月費、沒有第三方平台抽成。

**畫面上的廣告可以換成自己的嗎？**
可以。品牌欄、價格跑馬燈、提示文字都寫在 `config.json` 裡，想換成自己的店名、自己的價格表、自己的廣告文案，改設定檔就好，不用改程式。

**它真的有在直播嗎？**
有。這套就是「小魔女代儲」每天循環的無人值守直播，正在線上：https://www.tiktok.com/@shauan_666/live 。第 2 座塔已在 2026-11-24 達成 50 層目標。

**觀眾要怎麼參與？**
送禮物、按讚、追蹤、分享、打關鍵字留言都會觸發畫面事件：小禮物加一層、大禮物變金磚、破壞球禮物拆塔，完整對照表在下面「玩法規則」。

**我想自己架一套，需要什麼？**
一台 Windows 電腦、Node.js、一個 TikTok 帳號和 TikTok LIVE Studio。安裝與自訂步驟看 `CUSTOMIZE.md` 和本文件下方說明。

## English — Free, Open-Source TikTok LIVE Tower-Building Game

**What is this?**
A free, open-source interactive tower-building game for TikTok LIVE streams. Viewers build a tower floor by floor by sending gifts, likes, follows, shares and keyword comments; wrecking-ball gifts knock floors down. It runs as an unattended (24/7 loop) TikTok live stream — no host on camera.

**Is it free, or is there a subscription?**
It is completely free and open source (MIT license). Most comparable TikTok live interactive games are subscription-based and charge a monthly fee; this one does not, and it does not require TikPlays or any paid third-party service.

**Can I put my own ads in it?**
Yes. The on-screen brand slot, price ticker and tip lines are all plain settings in `config.json` — replace them with your own shop name, your own price list, or your own ad copy without touching the code.

**Is it actually live?**
Yes — this exact code runs the 小魔女代儲 (@shauan_666) unattended TikTok live stream: https://www.tiktok.com/@shauan_666/live . Tower #2 reached the 50-floor goal on 2026-11-24. The project is updated continuously; this repo is the currently-streaming version (round 9).

**How do viewers play?**
Every viewer action does something visible: small gifts (Rose, Finger Heart) add a floor, gifts of 30+ diamonds add golden floors, 99+ diamonds summon the lucky cat, Fireworks gifts wreck floors, every 200 likes adds a floor, and chat keywords （加油 / 拆 / 愛你 / 睡） trigger character reactions. No input is ever ignored.

**What do I need to run it?**
A Windows PC, Node.js, a TikTok account and TikTok LIVE Studio. Setup and customization are documented in `CUSTOMIZE.md` and below.

---

> **版本說明 — round 9（目前正在直播的版本）**
>
> - 部署：2026-11-24，PC（TikTok LIVE Studio 連結來源）
> - 直播間：https://www.tiktok.com/@shauan_666/live（小魔女代儲 @shauan_666）
> - 這個版本是 round 9 的完整專案。程式碼與 2026-11-24 部署到 PC 的 round9-deploy.zip 逐檔比對一致（server.js、overlay.html、tts.js、edge-drm.mjs、package.json 相同）；config.json 採用直播用的正式設定（demo=false、tiktokUsername=shauan_666）。11 張角色／NPC 圖片為 round 9 版本，另補上原 zip 漏掉的 lucky-cat.png（來源：已驗證的 round 9 備份）。品牌、背景、磚塊、道具與語音檔為專案原有檔案（原 zip 未包含，這裡一併補齊）。
> - 注意：`data.json` 是執行時狀態（最佳紀錄、塔號），已列入 .gitignore，不進版本控管。

# 小魔女蓋塔挑戰 — TikTok LIVE 互動遊戲

我們自己的蓋塔遊戲，從頭寫的程式碼，不用 TikPlays、不付月費、不抄別人的素材。
觀眾送禮物，畫面上的塔就一層一層往上蓋；破壞球禮物會把樓層打掉。
女巫坐在塔頂，白貓在塔底看著，全程用小魔女代儲的品牌。

## 玩法規則（我們自己的）

| 觀眾行為 | 效果 |
|---|---|
| 玫瑰 / 手指愛心（便宜禮物） | 🧱 +1 層 |
| 甜甜圈 / 蛋糕（中價位禮物） | 🌟 金磚 +3 層（一塊高三層的金磚） |
| 煙火（破壞球禮物） | 💣 −2 層，樓層掉落動畫＋白貓嚇到 |
| 追蹤 | +1 層（預設開） |
| 分享 | +1 層（預設開） |
| 按讚 | 每 200 個讚 +1 層（預設開） |
| 進場 | +1 層（預設關） |

- **目標**：預設 50 層（config.json 可改）。達標 → 全畫面慶祝＋彩帶＋音樂，之後按「開新塔」手動開下一座；最佳高度會記下來，重開伺服器也不會丟。
- **連擊（我們的規則）**：10 秒內連續送禮，連擊數一直累；到 x5 時下一層變成金磚（+3 層）再加 2 層獎勵，畫面會顯示「金磚待命」。
- **里程碑**：每 10 層一次小慶祝＋白貓說話，橫幅文案 3 種輪播（不會連續重複）。
- **排行榜**：打賞榜 TOP 3（按鑽石數，頭像＋名字＋鑽石），＋最新動態 feed（頭像圓點＋名字＋動作）。
- **代儲價目跑馬燈**：價目不是畫面主角，不佔中段位置。底部一直跑一行價目跑馬燈（粉紅色條，提示跑馬燈上方），內容由 `prices.json` 自動組成——寶可夢 GO／傳說對決，每款遊戲全部品項由便宜到貴排，沒固定價的寫「截圖詢問」（絕不編價），最後加「詳情 LINE @809givsd」，無縫循環。跑馬燈的開關／速度／分隔符在 `config.json` 的 `priceTicker`；想加自訂句子（活動、公告）寫 `customTickerLines`，會接在價目後面一起跑（見下方「代儲價目跑馬燈」）。
- **玩法全說明＋兩條跑馬燈**：0 層時玩法卡是完整規則（小禮物 +1／中禮物 ≥30 鑽金磚 +3／大禮物 ≥99 鑽招財貓／破壞球 −2／追蹤分享各 +1／每 200 讚 +1／聊天關鍵字／讚連擊 50 星星雨／分享滿 5 次白貓謝謝／衝塔 60 秒對戰）；塔開始長之後玩法卡收成左邊的「?」按鈕（點開再看）。底部有兩條跑馬燈上下疊著、樣式不同：上面金色是提示跑馬燈（`config.json` 的 `tips`，約 8 秒換一句互動規則，絕不連續重複），下面粉紅是價目跑馬燈（一直循環跑價目），兩條都不會蓋到塔、面板或 footer。
- **對戰開戰說明**：衝塔 60 秒開戰時，說明跑在提示跑馬燈那一行 5 秒：「⚔️ 衝塔 60 秒開戰！送禮蓋塔，破壞球拆塔，贏的那邊加冕」，5 秒後自動回到正常提示輪播；對戰比分和連擊都收在畫面上方一條單行對戰列裡，不另外跳橫幅。
- **女巫＋白貓**：女巫坐在塔頂，塔越高晃得越厲害；白貓在塔底，蓋樓時開心跳、被拆時嚇到。
- **音效**：全部 WebAudio 合成（蓋樓／金磚／破壞／里程碑／達標），沒有任何音檔。
- **禮物分級（鑽石價值決定特效）**：小禮物（<30 鑽）→ 女巫揮手＋特寫卡；中禮物（≥30 鑽）→ 女巫施法＋精靈飛過＋閃光＋大紙屑；大禮物（≥99 鑽）→ 招財貓進場＋金幣雨＋全畫面慶祝＋最大聲音。對照在 `config.json` 的 `giftTiers`，改門檻不用改程式。
- **客座 NPC 只在大禮物時進場**：招財貓平常不在畫面上；單一禮物 ≥100 鑽或連擊金磚時才走進來，撒金幣＋「發大財！」8 秒後離開。以後每位客座都走這個模式（進場 → 表演 → 離場）。
- **攀爬者就是目前第一名**：塔右邊的紅帽攀爬者就是打賞榜第一名，頭上掛著他的頭像＋名字；第一名換人，攀爬者就換人。目標條旁邊另有一張常駐「目前第一名」卡（頭像＋名字＋鑽石＋皇冠）。
- **衝塔 60 秒（對戰模式）**：主持人或模擬面板按 T 開始，60 秒倒數＋蓋塔派 vs 拆塔派即時比分；時間到，分數高的那派獲勝，勝方貢獻最多的觀眾加冕（皇冠＋橫幅＋動態）。結束後回到正常馬拉松模式。時間長短、開關在 `config.json` 的 `battle`。
- **絕不冷場**：15 秒沒有任何事件，場景自己動起來——女巫打哈欠、白貓伸懶腰、精靈飛一圈、攀爬者揮手、女巫揮手＋閃光，輪流出現（不會連續重複，約每 12 秒一次），目標條還會提示「再 N 層到高空區」。逾時秒數在 `config.json` 的 `idleTimeoutSeconds`。
- **自動蓋塔＋多巴胺特效**：沒人送禮時塔自己長——每 35 秒小精靈幫忙蓋一層（塔行會倒數「小精靈 N 秒後幫忙蓋一層」），每一層都觸發 6 種特效輪播（金星爆發／彩色紙屑／彩虹星雨／愛心漂浮／小煙火／星光波浪，配女巫施法／跳舞／揮手、白貓比愛心、精靈飛過、攀爬者揮手，絕不連續重複），浮字顏色＋表情符號每種不同，feed 文案 3 種輪播。自動蓋的層不計入打賞榜和對戰分，對戰中和達標後暫停。間隔和特效池在 `config.json` 的 `autoBuild` 和 `fxPools.autoBuild`；改間隔不用重啟伺服器，60 秒內生效。
- **冬季飄雪**：冬天場景飄雪（約 26 片雪花緩緩落下＋左右搖擺），開關在 `config.json` 的 `backgrounds.snow`，原夜空、月亮、城市燈光不動。

## 設計鐵律：免費動作也是事件，不是裝飾

讚、分享、聊天和禮物平起平坐——每一種觸發都要有**看得見的效果**和**有名字的事件**
（進動態 feed 和／或改變 NPC 動作）。沒有任何一種輸入可以是「什麼都沒發生」。

| 觸發 | 效果（看得見） | 事件（進 feed／NPC 動作） |
|---|---|---|
| 讚 | 愛心上升／星星爆發／星星雨／小煙火／浮字「讚」，5 種輪播；畫面有讚數計數＋連擊表 | 50 讚連擊 → 星星雨事件＋女巫閃亮；200 讚 → +1 層＋大爆發＋「讚數衝破 200，塔長高 1 層」 |
| 分享 | 紙飛機飛過／彩帶掃過／紙屑＋白貓道謝，3 種輪播；畫面有分享計數 | 每次分享都進動態（帶分享者名字）；每 5 次分享 → 白貓感謝事件（揮手＋「感謝分享」＋小紙屑） |
| 聊天 | 頭像＋名字＋文字的漂浮泡泡（最多 3 個，約 4 秒消失）；畫面有聊天計數 | 每則聊天都是 NPC 回應事件：加油／衝 → 女巫打氣；拆／壞 → 南瓜搗蛋＋破壞球晃動；愛你／喜歡 → 白貓比愛心；睡／累 → 女巫打哈欠；第 10 位聊天觀眾 → 精靈飛越事件 |
| 禮物 | 特寫卡（頭像＋名字＋禮物＋層數），依鑽石分級放大特效；破壞球有震屏＋衝擊波＋落磚 | 本來就是事件（蓋樓／金磚／破壞＋排行榜＋動態） |

- 效果池輪播：每個池子輪流出招，隨機起點、絕不連續重複；里程碑文案、待機動作也一樣輪播。
- 節流：免費動作每種每 0.5 秒最多一個特效（讚爆時不會把畫面淹沒）；**禮物永遠不節流**，每一個禮物 1 秒內一定有特寫卡＋聲音＋可見效果。
- 聊天不加樓層（免費參與只影響畫面和 NPC，不影響塔高），關鍵字對照在 `config.json` 的 `chatKeywords`。

## 安裝（Windows 電腦也一樣）

需求：Node.js 18 以上（[nodejs.org](https://nodejs.org) 下載 LTS 版安裝即可）。

```bat
cd tiktok-tower-game
npm install
```

只需要裝一個套件：`tiktok-live-connector`（讀 TikTok 直播事件用，免費開源）。

## 設定

編輯 `config.json`：

| 欄位 | 說明 |
|---|---|
| `tiktokUsername` | 你的 TikTok 帳號名稱（例如 `"shauan_666"`）。留空＝不上直播，只用模擬模式 |
| `goalHeight` | 目標層數，預設 50 |
| `giftMapping` | 禮物對照：`block`（+1）、`golden`（+3）、`wreck`（−2）。用 TikTok 禮物的英文名，例如 `"Rose"`、`"Donut"`、`"Fireworks"`。一開始 3–6 個就好 |
| `triggers` | `follow` / `share` / `likes` / `join` 四個開關 |
| `likesPerFloor` | 幾個讚換一層，預設 200 |
| `comboThreshold` / `comboWindowSeconds` | 連擊幾次觸發金磚／幾秒內算連擊，預設 5 次／10 秒 |
| `comboBonusFloors` | 連擊金磚額外加幾層，預設 2 |
| `autoResetSeconds` | 達標後幾秒自動開新塔；`0`＝手動（預設） |
| `port` | 伺服器 port，預設 3000 |
| `demo` | `true`＝模擬面板顯示在所有網址（含正式開播用的 `/`）；**正式開播前務必改 `false`，否則觀眾會看到測試按鈕**。網址參數優先於設定：`?demo=false` 可強制關掉模擬面板（預覽截圖就這樣拍），`?demo=true` 強制開啟；沒加參數時用 config 的值 |
| `zones` | 分區名單：塔到指定層數換區域名稱＋橫幅＋小紙屑（預設 0 起始區／10 微風區／20 高空區／30 雲海區／37 雲端之上） |
| `npcActions` | NPC 特殊動作對照表：事件 → NPC → 動作＋持續毫秒（見下方「NPC 特殊動作」） |
| `giftTiers` | 禮物分級：`tiers`（鑽石門檻：small ≥0／mid ≥30／big ≥99）＋`actions`（每級觸發的 NPC 動作）。小禮物→女巫揮手；中禮物→女巫施法＋精靈飛過；大禮物→招財貓進場＋女巫跳舞＋精靈飛過 |
| `fxPools` | 免費動作特效池：`like`（5 種：hearts／starburst／sparkleRain／firework／zan）、`share`（3 種：plane／ribbon／confettiCat）、`autoBuild`（6 種：starBurst／confettiPop／rainbowRain／hearts／firework／sparkleWave）。輪播，絕不連續重複 |
| `chatKeywords` | 聊天關鍵字 → NPC 反應：`cheer`（加油／衝／go）、`tease`（拆／壞／倒／砸）、`heart`（愛你／喜歡／可愛／愛）、`yawn`（睡／累／睏／晚安） |
| `milestoneCopies` | 里程碑橫幅文案，`{m}` 會換成層數，3 種輪播 |
| `battle` | 對戰模式：`durationSeconds`（預設 60）、`enabled`（開關） |
| `autoBuild` | 自動蓋塔：`enabled`（預設 true）、`intervalSeconds`（幾秒自己蓋一層，預設 35；改了不用重啟，熱更新 60 秒內生效）。對戰中和達標後暫停；自動蓋的層不計入打賞榜和對戰分 |
| `backgrounds` | 背景開關：`snow`（飄雪，預設 true） |
| `idleTimeoutSeconds` | 多久沒事件算冷場，預設 15 秒（待機動作約每 12 秒輪一次） |
| `priceTicker` | 價目跑馬燈：`enabled`（預設 true）、`speedSeconds`（跑一圈秒數，預設 30）、`separator`（品項分隔符，預設 `" · "`） |
| `customTickerLines` | 跑馬燈自訂句：字串陣列，接在價目後面一起跑（預設 `[]`） |
| `priceRotation` | 報價播報器（聊天用）的排程：`enabled`（預設 true）、`intervalSeconds`（換款秒數，預設 10）、`maxItemsPerCard`（每則最多品項，預設 6）——只決定聊天報價的節奏，不影響畫面跑馬燈 |
| `tips` / `tipsIntervalSeconds` | 底部提示跑馬燈的句子清單／換句秒數（預設 8 秒，絕不連續重複） |

## 代儲價目跑馬燈（第 9 層：把熱度導回代儲）

價目不在畫面中段佔位置——遊戲本身才是主角。價目改成畫面底部一條一直跑的
**跑馬燈**（粉紅色條，在提示跑馬燈上方、footer 上方），內容由 `prices.json`
自動組成：每款遊戲全部品項由便宜到貴排，沒固定價的品項（`price` 是
`"截圖詢問"` 字串，不是數字）寫「截圖詢問」、絕不編價；每款遊戲之間用
`｜` 分隔，最後加「詳情 LINE @809givsd」，整行無縫循環。
例如：`傳說對決 40點券30元 · 67點券50元 · 135點券100元 … ｜ 寶可夢GO 1400寶可幣150元 … ｜ 詳情 LINE @809givsd`。

- **跑馬燈設定**：`config.json` 的 `priceTicker`——`enabled`（開關，預設 true）、
  `speedSeconds`（跑一圈秒數，預設 30）、`separator`（品項分隔符，預設 `" · "`）。
  關掉（`enabled: false`）跑馬燈就不顯示。
- **自訂句子**：`config.json` 的 `customTickerLines` 是字串陣列，會接在價目後面
  一起跑（例如活動公告、限時優惠）。GitHub 使用者改這裡就能放自己的跑馬燈內容，
  不用動程式。
- **價目來源**：`prices.json`，數字已和 Drive `01_遊戲價格資料庫` 的
  `最新價格表.csv` 核對過（2026-11-23）。Drive 和檔案不一致時以 Drive 為準。
- **加一款遊戲**：在 `prices.json` 的 `games` 加一個物件
  `{"name": "遊戲名", "items": [{"name": "品項", "price": 數字或 "截圖詢問"}, ...]}`，
  存檔就好，**不用重啟、不用在 OBS 重新整理**——畫面跑馬燈每 60 秒重抓一次，
  新價目會自己出現在畫面（見下方「熱更新」）。
  **絕對不要從畫面改價目，也不要自己編數字**——沒固定價
  的品項就寫 `"截圖詢問"`，不要寫 0、不要編一個價。
- **模擬測試**：模擬面板的「💰 下一價目 (P)」按鈕或按鍵盤 P，立刻切到下一款
  播報器報價（畫面跑馬燈不受影響——它一直跑全部價目）；也可以打 API
  `POST /api/sim {"action":"price"}`。
- **定期發布（跑馬燈＋聊天同步）**：畫面跑馬燈本身就是一直跑的價目發布。
  伺服器同時維護一個**報價播報器（announcer）**：每
  `priceRotation.intervalSeconds` 秒切到下一款遊戲，準備好一行報價訊息，
  給直播時發到聊天室用：
  ```
  GET /api/announce/next
  → {"index": 1, "total": 2, "game": "傳說對決",
     "text": "傳說對決代儲：680點券490元、1370點券980元、2045點券1460元、2750點券1960元、3450點券2450元、4130點券2950元，詳情 LINE @809givsd",
     "intervalSeconds": 10, "at": "2026-11-23T10:30:00.000Z"}
  ```
  同樣的報價也包含在 SSE（`/events`）和 `GET /api/state` 的 `announce` 欄位裡；
  報價內容和畫面跑馬燈是同一批價目（同一份 `prices.json`），只是呈現方式不同：
  跑馬燈一直跑全部品項，聊天報價每 10 秒換一款遊戲、只發前 6 名。
  訊息格式：一行，品項由便宜到貴排（同一批前 6 名），太長時留便宜的、
  後面用 … 截掉，再加「詳情 LINE …」。

## 熱更新（改內容不用重啟，塔不會歸零）

直播 24 小時不關播，重啟伺服器會把塔歸零重蓋（塔高、磚塊、動態牆都在
伺服器記憶體，只有最佳紀錄和塔號存在 `data.json`），所以內容更新全部
走熱更新，**不用重啟、不用在 OBS 重新整理瀏覽器來源**：

- **價目**：`prices.json` 每次請求都重讀，改完存檔，`GET /api/prices`
  立即回新內容；畫面跑馬燈每 60 秒重抓 `/api/prices`＋`/api/config`，
  文字變了才重建跑馬燈（沒變就不動，捲動不會中途重起），60 秒內出現在畫面。
- **設定**：`config.json` 由伺服器自動重讀（每次請求檢查 mtime＋檔案監看，
  原子換檔 rename 也能跟上），改完約 2 秒內 `GET /api/config` 就回新內容；
  提示句 `tips`、自訂跑馬燈 `customTickerLines`、`priceTicker` 都不用重啟
  就生效。播報器的計時間隔（`priceRotation.intervalSeconds`）下次重啟才換，
  但播報文字用的 `maxItemsPerCard` 下次播報就吃新值。
- **壞檔保護**：`config.json`／`prices.json`／`daily.json` 寫壞（JSON 解析失敗）
  時，伺服器保留上一份好的內容、記一條錯誤 log，**絕對不會當掉**，塔也
  不受影響。修好檔案存檔就自動恢復。
- **每日輪換**：`daily.json`，格式
  `{"default": {"tickerLines": [...], "tips": [...]}, "2026-11-24": {"tickerLines": [...], "tips": [...]}}`，
  日期鍵是 `YYYY-MM-DD`（台北時間，今天由伺服器用 `Asia/Taipei` 算出，
  主機是 UTC 也沒關係）。每天 0 點（台北時間）自動切到當天條目，找不到
  當天就用 `default`，不用重啟。當天 `tickerLines` 接在價目和
  `customTickerLines` 後面一起跑；當天 `tips` 併進提示句輪播池，
  「絕不連續重複」照樣有效。`GET /api/config` 的 `daily` 欄位會回傳
  當天日期與解析後的句子，方便驗證。
  出貨的 `daily.json` 只留 `default`（一兩句中性提醒，例如私訊問價），
  不要放沒說過的促銷、折扣或主推遊戲。
- **編輯 `config.json` 的規定**：它是單行 minified、key 已排序的 JSON，
  只能用 `python3 -c "import json; json.dump(json.load(open('config.json')), open('config.json','w'), ensure_ascii=False, sort_keys=True, separators=(',',':'))"`
  這類 Python json.dump 寫入，**絕對不要用文字編輯器改它**。

## 價目同步流程（使用者口述新價 → 上線）

1. 使用者口述新價（或新遊戲／新品項）。
2. 先寫進 Drive 價目表（`01_遊戲價格資料庫`），以 Drive 為準。
3. 同步到本專案的 `prices.json`（數字照 Drive 抄，不要自己編；沒固定價
   寫 `"截圖詢問"`）。
4. 存檔後 60 秒內，畫面底部跑馬燈自己出現新價目；`curl
   http://localhost:3000/api/prices` 可以立即核對。**全程不用重啟伺服器、
   不用在 OBS 重新整理，塔不受影響。**

### 直播時把報價發進聊天室（live-operation 步驟，不是伺服器功能）

伺服器**不發送聊天**——TikTok 沒有官方的發送聊天 API，發送需要帳號的登入
session，所以伺服器裡沒有任何發送 hack（不接非官方發送 API、不抓
session cookie）。定時報價發進聊天室的流程是：

1. 開播時，主播帳號（**@shauan_666**，就是開播的那個帳號）在瀏覽器登入 TikTok、
   打開直播間聊天室。
2. 每 `priceRotation.intervalSeconds` 秒（預設 10 秒），Muse 讀
   `GET /api/announce/next` 拿到當下那款遊戲的一行報價。
3. Muse 用**主播帳號已登入的瀏覽器**把那行字發進直播聊天室。
4. 畫面跑馬燈和聊天發送是同一批價目：跑馬燈一直跑全部品項，聊天室每 10 秒收到一款遊戲的報價。

- **誠實的限制**：聊天發送只有在**真的開播、而且主播帳號有登入瀏覽器**時才
  能做；它是直播當下的操作步驟，不是伺服器自動化的功能。沒開播／沒登入時
  什麼都不會發。
- **關播／模擬模式測不了發送**：只能測播報器佇列本身——
  `curl http://localhost:3000/api/announce/next` 看得到當下那行報價、
  每 10 秒會換一款，就代表佇列正常；實際發送要等真的開播才能做。

## 即時聊天監看（給 Muse／主播）

伺服器本來就即時收 TikTok 聊天（`chat` 事件）。監看用的唯讀端點：

```
GET /api/chat?limit=50
→ {"chat": [{"time": "2026-11-23T10:23:08.521Z", "user": "測試小明",
             "avatar": "", "text": "加油！", "kind": "cheer"}],
    "events": [{"kind": "chatCheer", "at": 1795429388512, "user": "測試小明",
                "gift": "加油！", "milestone": 0, "diamonds": 0}]}
```

- `chat` 是最近的聊天（最新在前，最多 100 則，`limit` 上限 100）；
  `kind` 是關鍵字反應（`cheer`／`tease`／`heart`／`yawn`，沒有關鍵字就是 `chat`）。
  聊天紀錄只存在伺服器記憶體裡，**伺服器重啟後會清空**（不寫檔案）。
- `events` 是最近的遊戲事件（和 `/api/state` 的 `events` 相同）。
- 同樣的聊天陣列也包含在 SSE（`/events`）和 `GET /api/state` 的 `chat` 欄位裡。
- **怎麼連**：遊戲跑在你的 Windows 電腦上時，Muse 從 VM 經 Tailscale 連
  `http://<你的電腦 Tailscale IP>:3000/api/chat?limit=50` 輪詢即可
  （部署見「部署層」；Tailscale 還沒裝在你的電腦上，裝好之後就能用）。
- **沒有發送聊天功能**：TikTok 沒有官方的發送聊天 API，發送需要帳號的
  登入 session，所以伺服器**不做**聊天發送，只做監看。定時報價要發進聊天室
  的話，走報價播報器（`GET /api/announce/next`）＋直播時由 Muse 以主播帳號
  在已登入的瀏覽器發送，見「代儲價目跑馬燈」的直播發送流程。

## 啟動

```bat
npm start
```

看到 `running at http://localhost:3000/` 就好了。

## 加到 OBS

1. OBS → 新增來源 → **瀏覽器 (Browser Source)**
2. 網址填：`http://localhost:3000/?demo=true`（測試時）或 `http://localhost:3000/`（正式開播）
3. 寬 `1080`、高 `1920`
4. 勾選「透過 OBS 控制音訊 (Control audio via OBS)」才會有音效
5. 擺到場景裡，拉到你要的位置（直式畫面，建議放一側或全畫面）

## 正式開播流程

1. `config.json` 把 `tiktokUsername` 填上你的帳號，`demo` 改 `false`（正式開播一定要改，否則觀眾畫面會出現模擬測試按鈕）
2. `npm start` 啟動伺服器
3. 開 TikTok 直播（TikTok LIVE Studio 或 OBS 推流）
4. 伺服器會自動連上你的直播間（只要帳號名稱，不用密碼）；畫面出現 `🔴 LIVE` 就是連上了
5. 觀眾送禮 → 塔立刻長高。不用再按任何東西

## 模擬測試（不用開播）

開 `http://localhost:3000/?demo=true`，畫面下方有模擬面板：

| 按鈕／按鍵 | 效果 |
|---|---|
| 🧱 玫瑰 +1（R） | 送玫瑰，+1 層 |
| 🌟 金磚 +3（G） | 送甜甜圈，金磚 +3 層 |
| 💣 破壞球 −2（B） | 送煙火，打掉 2 層 |
| ➕ 追蹤（F）／🔗 分享（S） | 各 +1 層 |
| ❤️ 讚 +200（L） | 讚數達標，+1 層 |
| 🚪 進場（J） | 進場 +1 層（預設關，config 開了才有效） |
| ⚔️ 衝塔 60 秒（T） | 開始一場 60 秒蓋塔 vs 拆塔對戰（再按一次或等時間到結束） |
| 💬 送出聊天（C） | 送一則模擬聊天（輸入框可自打文字；關鍵字會觸發 NPC 反應，例如「加油」「拆塔」「愛你」「好睏」） |
| 💰 下一價目（P） | 立刻切到下一款播報器報價（聊天用；畫面跑馬燈不受影響） |
| 🔄 新塔（X） | 手動開新塔 |
| ▶ 自動演示 | 每 1.4 秒隨機送一個事件（禮物／追蹤／分享／讚／聊天／對戰），一直蓋給你看 |

也可以直接打 API：`POST /api/sim`（body：`{"action":"gift","gift":"Rose"}`；聊天：`{"action":"chat","text":"加油！"}`；對戰：`{"action":"battle"}`／`{"action":"battle","stop":true}`；下一則播報器報價：`{"action":"price"}`），
`POST /api/reset` 開新塔，`GET /api/state` 看目前狀態，`GET /api/prices` 看價目表，`GET /api/chat?limit=50` 看最近聊天＋事件。

## NPC 特殊動作（config 驅動）

事件發生時，NPC 會做特殊動作（不只是換表情）。對照表在 `config.json` 的 `npcActions`，
格式是 `事件: [{npc, action, durationMs}]`，改設定、換動作、加客串都不用改程式：

| 事件 | NPC | 動作 |
|---|---|---|
| `gift`（小禮物蓋樓） | 女巫 | 揮一下魔杖，杖尖閃星星（分級：見 `giftTiers`，中／大禮物動作更重） |
| `golden`（金磚） | 女巫＋白貓 | 女巫舉杖施法＋金色星星雨；白貓比愛心＋粉紅愛心飄起來 |
| `combo`（連擊 x5 達標） | 星星精靈＋招財貓（客座） | 精靈從左邊飛進來繞塔灑星星；招財貓走進來撒金幣＋「發大財！」8 秒後離開 |
| `milestone`（每 10 層） | 女巫＋白貓 | 女巫跳舞＋白貓跳高，配橫幅（文案 3 種輪播） |
| `goal`（達標） | 女巫＋精靈＋白貓 | 女巫跳舞、精靈飛舞、白貓戴皇冠，一起慶祝 |
| `wreck`（破壞球） | 搗蛋南瓜（客座）＋女巫 | 南瓜推著球進場大笑「嘿嘿嘿！」；女巫頭暈、頭頂轉星星；白貓嚇到臉；全畫面震屏＋衝擊波＋落磚動畫 |
| `follow`（追蹤） | 白貓 | 小爪子揮一下招手 |
| `zero`（塔被拆到 0 層） | 女巫 | 頭暈＋頭頂轉星星 |
| `likeStreak`（讚數 60 秒內連擊 50） | 女巫 | 舉杖施法＋星星雨 |
| `shareThanks`（分享滿 5 次） | 白貓 | 揮手＋「感謝分享！」＋小紙屑 |
| `chat`（一般聊天） | 白貓 | 小爪子揮一下（每則聊天的存在感回應） |
| `chatCheer`（加油／衝） | 女巫 | 跳舞打氣 |
| `chatTease`（拆／壞） | 搗蛋南瓜 | 推著破壞球進場搗蛋＋球晃動 |
| `chatHeart`（愛你／喜歡） | 白貓 | 比愛心＋粉紅愛心飄起來 |
| `chatYawn`（睡／累） | 女巫 | 打哈欠＋💤 |
| `chatParty`（第 10 位聊天觀眾） | 星星精靈 | 飛越全畫面 |
| `battleStart`（衝塔 60 秒開戰） | 女巫＋攀爬者 | 女巫施法＋攀爬者揮手 |
| `battleWin`（對戰結束加冕） | 女巫＋精靈 | 女巫跳舞＋精靈飛舞 |

另外塔右邊常駐一名戴紅帽的攀爬者小人，會跟著塔長高往上爬。分區名單在 `config.json` 的 `zones`
（層數門檻＋中英文區域名），跨區時顯示 `☁️ 雲端之上！ZONE REACHED` 橫幅＋小紙屑。

## 檔案說明

```
tiktok-tower-game/
├── server.js          # 伺服器：接 TikTok 事件、算樓層、推狀態給畫面
├── config.json        # 全部設定都在這裡（規則、對照、分區、NPC 動作、價目跑馬燈、提示句）——改了不用重啟，約 2 秒生效
├── prices.json        # 真實代儲價目表（寶可夢 GO／傳說對決，Drive 核對過；加遊戲改這裡）——改了立即生效，跑馬燈 60 秒內更新
├── daily.json         # 每日輪換（default＋YYYY-MM-DD 當天條目，台北時間 0 點自動切換，不用重啟）
├── data.json          # 自動產生：最佳高度、第幾座塔（重開也不會丟）
├── package.json
├── 層級拆解.md        # 參考站拆解＋十層架構＋建造順序
├── preview/           # 預覽截圖（00-empty／10-floors／25-floors／wreck／50-goal／battle／battle-high／free-effects／price-ticker／tips-ticker）＋ tower-demo.mp4
├── public/
│   ├── overlay.html   # 畫面本體（1080x1920，OBS 瀏覽器來源）
│   ├── logo.png       # 小魔女代儲 logo
│   └── assets/        # 素材：夜空、女巫、白貓、精靈、南瓜、攀爬者、破壞球、磚塊、招財貓（角色為精細插畫風；破壞球／磚塊仍為像素風）
└── README.md
```

## 角色重繪・親吻・背景音樂（2026-11-24）

- **角色全部重繪成精細插畫風**（女巫優先最精細）：女巫兩姿勢、白貓三表情、精靈、南瓜、攀爬者皆為透明底 PNG，最短邊 ≥1136px（女巫 1536×1664、施法 1504×1680），在 576×1024 來源放大到 720×1280 仍清晰；舊像素版備份在 `public/assets-prev/`。招財貓尚未重繪（仍為像素版）。
- **女巫親吻**：觀眾送出蓋塔禮物（+1／+3，不含破壞球）時，女巫放大貼近螢幕親一下（💋＋「啾～」），最多 3 秒一次。設定在 `config.json` 的 `kiss`（`enabled`／`cooldownSeconds`／`durationMs`）；親吻特寫圖為 `assets.witchKiss`（`public/assets/characters/witch-kiss.png`，尚未有檔案時自動改用女巫待機圖）。
- **背景音樂**：WebAudio 生成式 ASMR 輕音樂（慢速和聲墊＋五聲音階八音盒＋極輕雨聲），預設音量 0.15，永不重複。設定在 `config.json` 的 `music`（`enabled`／`volume`／`src`）；`src` 填音檔路徑時改播該檔案循環。模擬面板有 🎵 音樂開關；右上角 🔊 同時控制音效＋音樂。
- **HYPE 模式＋三套服裝**：任何禮物都會觸發 HYPE（音樂變快變亮、加節拍、音效變大、畫面發光脈衝），20 秒無禮物自動回到平靜 ASMR；遊戲規則（樓層／Top 3／衝塔／連擊）完全不受影響。蓋塔禮物 → 女巫換上夏日洋裝在塔頂跳舞＋親吻；破壞球禮物 → 換上亮片派對洋裝跳舞（不親）；最新禮物決定服裝，HYPE 結束回到平常衣服。設定在 `config.json` 的 `hype`（`enabled`／`durationSeconds`／`maxSeconds`）。⚠️ 兩套舞衣目前是節慶替代版：圖片工具拒絕了比基尼／性感造型，改用夏日花洋裝（`assets.witchBikini`）與亮片派對洋裝（`assets.witchSexy`）代替，臉和髮型與女巫一致。
- **哼歌待機＋聊天回覆**：平靜時女巫會坐在塔上哼歌（♪ 音符飄起，HYPE 時不哼、改跳舞）；觀眾聊天關鍵字（加油／拆／愛你／睡）女巫會用輪換的回覆接話，每組 3–4 句短回覆，設定在 `config.json` 的 `chatKeywords[].replies`。
- **Muse 主持掛鉤 POST /api/say**：`{"text":"...","who":"..."}` → 女巫在畫面上說話（語音泡泡＋動態消息＋語音）。僅限畫面呈現，不會發進 TikTok 聊天室。模擬：`POST /api/sim {"action":"say","text":"...","user":"..."}`。
- **女巫語音（Edge TTS，免費免 key）**：女巫說話時（/api/say、聊天回覆）伺服器用 Microsoft Edge TTS 生成語音，預設 `zh-TW-HsiaoChenNeural`（柔和女聲，語速 -5%、音調 -2Hz），MP3 快取在 `public/assets/speech/<hash>.mp3`，同一句話只生成一次。設定在 `config.json` 的 `voice`（`enabled`／`voice`／`rate`／`pitch`），換聲音改一行即可；TTS 失敗時泡泡照常顯示、只沒有聲音。部署注意：需要 `ws` 套件（`npm install`；已寫進 `package.json`）。

## 疑難排解

- **畫面是空的／塔沒反應**：先確認伺服器有跑（`npm start` 沒報錯），瀏覽器開 `http://localhost:3000/?demo=true` 按幾個模擬按鈕。
- **直播連不上**：TikTok 帳號要正在直播才連得上；沒開播時伺服器會每 10 秒重試一次。帳號名稱不要加 `@`。
- **沒聲音**：OBS 瀏覽器來源要勾「透過 OBS 控制音訊」；網頁版要先點一下畫面（瀏覽器擋自動播放），右上角有 🔊 開關。
- **某個禮物沒反應**：那個禮物沒寫進 `config.json` 的 `giftMapping`。TikTok 禮物名以 `tiktok-live-connector` 回傳的英文名為準，對照不到就先用模擬面板測。

## Make it your own — 改成你自己的遊戲

This project is built to be forked and reskinned. All artwork, brand, sounds,
colours and UI copy are swappable without touching the game rules — see
**[CUSTOMIZE.md](CUSTOMIZE.md)** for the full guide (English first, then
Traditional Chinese), including the 5-minute reskin quickstart.

Quick version: replace the files in `public/assets/`, set your brand in
`config.json` (`brand.line` / `brand.shop`), and edit the colour block at the
top of `public/overlay.html`. Run it the same way:

```bat
npm install
npm start
```

then open `http://localhost:3000/?demo=true`.

> **License — still to choose:** this repo has no LICENSE file yet. The owner
> still needs to pick one before publishing. Two common options: MIT — the
> most permissive, anyone can use/modify/sell with attribution; Apache-2.0 —
> like MIT, plus an explicit patent grant. (Also note: `package.json`
> currently says `"license": "ISC"` from the initial scaffold — confirm or
> change it to match the license you choose.)
