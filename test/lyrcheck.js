const fs = require("fs");
const { JSDOM } = require("jsdom");
const code = fs.readFileSync(require("path").join(__dirname, "..", "dist", "cliamp-radio-card.js"), "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
global.window = window; global.document = window.document; global.HTMLElement = window.HTMLElement; global.customElements = window.customElements;

const LRC = ["[00:00.00]line one", "[00:05.00]line two", "[00:10.00]line three"].join("\n");
let fetchCalls = [];
window.fetch = async (u) => {
  fetchCalls.push(String(u));
  return { ok: true, json: async () => ({ syncedLyrics: LRC, plainLyrics: "line one\nline two\nline three" }) };
};
window.eval(code);

const tick = () => new Promise((r) => setTimeout(r, 25));
let pass = 0, fail = 0;
function eq(name, got, want) { const ok = String(got) === String(want); console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " got=" + got + " want=" + want)); ok ? pass++ : fail++; }

const nowIso = new Date().toISOString();
const hass = {
  states: {
    "media_player.salon": {
      state: "playing",
      attributes: {
        friendly_name: "Salon", volume_level: 0.5,
        media_title: "Yellow", media_artist: "Coldplay", media_album_name: "Parachutes",
        media_duration: 267, media_position: 6, media_position_updated_at: nowIso,
      },
    },
  },
  callWS: async () => ({ children: [] }),
  callService: async () => {},
};

(async () => {
  const el = document.createElement("cliamp-radio-card");
  document.body.appendChild(el);
  el.setConfig({ entity: "media_player.salon", lyrics: "on" });
  el.hass = hass;
  await tick(); await tick();

  const sr = el.shadowRoot;
  eq("lyrics panel visible", sr.querySelector('[data-role="lyrwrap"]').hidden, false);
  eq("lyrics fetched from LRCLIB", fetchCalls.some((u) => u.includes("lrclib.net") && u.includes("track_name=Yellow") && u.includes("artist_name=Coldplay")), true);
  eq("3 lyric lines rendered", sr.querySelectorAll(".lyrline").length, 3);
  eq("active line highlighted (pos 6s -> line two)", sr.querySelector(".lyrline.on").textContent.trim(), "line two");
  eq("source label says sync", sr.querySelector('[data-role="lyrsrc"]').textContent.includes("sync"), true);

  // plain (unsynced) fallback still renders lines
  window.fetch = async () => ({ ok: true, json: async () => ({ plainLyrics: "a\nb" }) });
  el._lyrKey = "";
  el.hass = hass;
  await tick(); await tick();
  eq("plain lyrics render without sync highlight", sr.querySelectorAll(".lyrline").length, 2);

  // off hides panel
  el.setConfig({ entity: "media_player.salon", lyrics: "off" });
  el.hass = hass;
  await tick();
  eq("lyrics off -> panel hidden", sr.querySelector('[data-role="lyrwrap"]').hidden, true);

  el.disconnectedCallback();
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
