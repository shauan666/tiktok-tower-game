'use strict';
/**
 * Witch voice — server-side Microsoft Edge TTS (free, no API key).
 *
 * Generates speech audio whenever the witch "says" something (POST /api/say
 * and chat replies) and caches it under public/assets/speech/<hash>.mp3 so
 * the same sentence is never generated twice. The overlay plays the MP3
 * when the matching 'say'/chat fx arrives.
 *
 * Protocol (verified against edge-tts 7.3.1 source + live test 2026-11-24):
 * - wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
 * - Sec-MS-GEC is v2: "<16 hex>-<64 hex>" (custom SHA-256 + CS64 checksum,
 *   see ./edge-drm.mjs — a plain SHA-256 does NOT work) with
 *   Sec-MS-GEC-Version "2-<chromium full version>".
 * - Headers must include Cookie: muid=<32 uppercase hex>; and a major-only
 *   User-Agent (Chrome/143.0.0.0, NOT the full 143.0.3650.75 — the WAF
 *   rejects full versions). ConnectionId is a dashless UUID.
 * - This VM's egress goes through an authenticated HTTP proxy, so the
 *   WebSocket is opened over an HTTP CONNECT tunnel when https_proxy is
 *   set; on the host PC (direct internet) no proxy is used.
 * - SSML follows edge-tts mkssml exactly (no mstts:express-as — the
 *   service rejects it with "SSML is invalid"); timestamps are JS-style
 *   date strings, with a trailing Z on the SSML message only (Edge bug,
 *   per the reference lib).
 *
 * If generation fails or is unreachable, speakText returns null and the
 * caller shows the bubble with no audio — never a crash. Audio is
 * code-verified only (this VM has no speakers).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const tls = require('tls');
const net = require('net');
const { URL } = require('url');
const WebSocket = require('ws');

const ROOT = __dirname;
const SPEECH_DIR = path.join(ROOT, 'public', 'assets', 'speech');
const WSS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0';
const WS_TIMEOUT_MS = 15000;

let drmPromise = null;
function loadDrm() {
  if (!drmPromise) drmPromise = import('./edge-drm.mjs');
  return drmPromise;
}

// HTTP CONNECT tunnel agent (only used when an egress proxy is configured).
class ProxyAgent extends https.Agent {
  constructor(proxyUrl) {
    super();
    this.proxyUrl = proxyUrl;
  }
  createConnection(options, callback) {
    const targetHost = options.host;
    const targetPort = options.port || 443;
    const proxy = this.proxyUrl;
    const sock = net.connect({ host: proxy.hostname, port: Number(proxy.port || 3128) });
    sock.once('error', (e) => callback(e));
    sock.once('connect', () => {
      const auth = proxy.username
        ? Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString('base64')
        : '';
      const lines = [`CONNECT ${targetHost}:${targetPort} HTTP/1.1`, `Host: ${targetHost}:${targetPort}`];
      if (auth) lines.push(`Proxy-Authorization: Basic ${auth}`);
      lines.push('', '');
      sock.write(lines.join('\r\n'));
    });
    let buf = Buffer.alloc(0);
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx === -1) return;
      const head = buf.subarray(0, idx).toString('latin1');
      if (!/^HTTP\/\d\.\d 200/.test(head)) {
        sock.destroy();
        callback(new Error('proxy CONNECT failed: ' + head.split('\r\n')[0]));
        return;
      }
      const rest = buf.subarray(idx + 4);
      sock.removeListener('data', onData);
      if (rest.length) sock.unshift(rest);
      const tlsSock = tls.connect({ socket: sock, servername: targetHost });
      callback(null, tlsSock);
    };
    sock.on('data', onData);
  }
}

function proxyAgentOrUndefined() {
  const raw = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
  if (!raw) return undefined;
  try { return new ProxyAgent(new URL(raw)); } catch (_) { return undefined; }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');
// edge-tts date_to_string(): "Mon Nov 24 2026 00:59:00 GMT+0000 (Coordinated Universal Time)"
function jsDateString() {
  const d = new Date();
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCDate())} ${d.getUTCFullYear()} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`;
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// edge-tts mkssml exactly: no express-as, xml:lang en-US, prosody carries pitch/rate/volume.
function mkssml(voice, rate, pitch, text) {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}' volume='+0%'>${escXml(text)}</prosody></voice></speak>`;
}

function synthesizeOnce(text, voice, rate, pitch) {
  return new Promise(async (resolve, reject) => {
    let drm;
    try {
      drm = await loadDrm();
    } catch (e) {
      reject(new Error('drm load failed: ' + (e && e.message)));
      return;
    }
    const connectionId = crypto.randomUUID().replace(/-/g, '');
    const muid = drm.generateMuid();
    const gec = drm.generateSecMsGecV2();
    const url = `${WSS_URL}?TrustedClientToken=${drm.TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}&Sec-MS-GEC=${encodeURIComponent(gec)}&Sec-MS-GEC-Version=${encodeURIComponent(drm.SEC_MS_GEC_VERSION)}`;
    const ws = new WebSocket(url, {
      agent: proxyAgentOrUndefined(),
      headers: {
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': UA,
        Cookie: `muid=${muid};`,
      },
      handshakeTimeout: WS_TIMEOUT_MS,
    });
    const audioChunks = [];
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { ws.close(); } catch (_) {}
      reject(new Error('tts timeout after ' + WS_TIMEOUT_MS + 'ms'));
    }, WS_TIMEOUT_MS);
    const finish = (err, audio) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { ws.close(); } catch (_) {}
      if (err) reject(err);
      else resolve(audio);
    };
    ws.on('open', () => {
      const configMsg = `X-Timestamp:${jsDateString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`;
      ws.send(configMsg);
      const ssml = mkssml(voice, rate, pitch, text);
      const msg = `X-RequestId:${crypto.randomUUID().replace(/-/g, '')}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${jsDateString()}Z\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(msg);
    });
    ws.on('message', (data, isBinary) => {
      if (!isBinary) {
        const s = data.toString();
        if (s.includes('Path:turn.end')) {
          const audio = Buffer.concat(audioChunks);
          if (audio.length > 0) finish(null, audio);
          else finish(new Error('turn.end with no audio'));
        }
        return;
      }
      const headerLen = data.readUInt16BE(0);
      const header = data.subarray(2, 2 + headerLen).toString();
      if (header.includes('Path:audio')) audioChunks.push(data.subarray(2 + headerLen));
    });
    ws.on('error', (e) => finish(new Error('ws error: ' + (e && e.message ? e.message : e))));
    ws.on('close', (code, reason) => {
      if (!done) finish(new Error('ws closed early: ' + code + ' ' + (reason || '').toString()));
    });
  });
}

const inFlight = new Map(); // hash -> Promise<string|null>

/**
 * Generate (or reuse the cached) speech MP3 for `text`.
 * Returns the public-relative URL ("assets/speech/<hash>.mp3") or null on
 * any failure / when voice is disabled. Never throws.
 */
async function speakText(text, voiceCfg) {
  const cfg = voiceCfg || {};
  if (cfg.enabled === false) return null;
  const clean = String(text || '').trim();
  if (!clean) return null;
  const voice = cfg.voice || 'zh-TW-HsiaoChenNeural';
  const rate = cfg.rate || '-5%';
  const pitch = cfg.pitch || '-2Hz';
  const hash = crypto.createHash('sha256').update(`${voice}\n${rate}\n${pitch}\n${clean}`).digest('hex');
  const relUrl = `assets/speech/${hash}.mp3`;
  const file = path.join(SPEECH_DIR, `${hash}.mp3`);
  try {
    if (fs.existsSync(file)) return relUrl;
  } catch (_) {}
  if (inFlight.has(hash)) return inFlight.get(hash);
  const p = (async () => {
    try {
      const audio = await synthesizeOnce(clean, voice, rate, pitch);
      fs.mkdirSync(SPEECH_DIR, { recursive: true });
      fs.writeFileSync(file, audio);
      return relUrl;
    } catch (e) {
      console.error('[tts] generation failed for "' + clean.slice(0, 20) + '":', e && e.message ? e.message : e);
      return null;
    } finally {
      inFlight.delete(hash);
    }
  })();
  inFlight.set(hash, p);
  return p;
}

module.exports = { speakText };
