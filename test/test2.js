const fs = require("fs");
const { JSDOM } = require("jsdom");

const CARD = require("path").join(__dirname, "..", "dist", "cliamp-radio-card.js");
const code = fs.readFileSync(CARD, "utf8");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  runScripts: "outside-only",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;
global.KeyboardEvent = window.KeyboardEvent;
global.Event = window.Event;

let fetchCalls = [];
const _fetch = async (u) => {
  fetchCalls.push(String(u));
  return {
    ok: true,
    json: async () => [
      { name: "Jazz FM", country: "United Kingdom", codec: "MP3", bitrate: 128, url_resolved: "http://jazz.fm/live", stationuuid: "uuid-1" },
      { name: "Radio Jazz", country: "France", codec: "AAC", bitrate: 96, url_resolved: "http://rj.fr/live", stationuuid: "uuid-2" },
    ],
  };
};

window.fetch = _fetch;
window.eval(code);

const tick = () => new Promise((r) => setTimeout(r, 25));
const results = [];
const check = (n, c) => {
  results.push([n, c]);
  console.log(`${c ? "PASS" : "FAIL"}  ${n}`);
};

let wsCalls = [];
let svcCalls = [];

const hass = {
  states: {
    "media_player.living_room": {
      state: "playing",
      attributes: { friendly_name: "Living Room", volume_level: 0.4, media_title: "Omarchy Radio" },
    },
    "media_player.kitchen": {
      state: "idle",
      attributes: { friendly_name: "Kitchen (MA)", volume_level: 0.5, mass_player_id: "ma-1" },
    },
  },
  callWS: async (msg) => {
    wsCalls.push(msg);
    if (msg.type === "media_player/browse_media") {
      if (!msg.media_content_id) {
        return {
          title: "Music Assistant",
          children: [
            { title: "Radio", media_content_id: "library://radio", media_content_type: "radio", can_expand: true, can_play: false },
            { title: "Albums", media_content_id: "library://albums", media_content_type: "album", can_expand: true, can_play: false },
          ],
        };
      }
      if (msg.media_content_id === "library://radio") {
        return {
          title: "Radio",
          children: [
            { title: "Radio Paradise", media_content_id: "library://radio/1", media_content_type: "radio", can_expand: false, can_play: true },
          ],
        };
      }
      return { title: "x", children: [] };
    }
    return {};
  },
  callService: async (domain, service, data, target) => {
    svcCalls.push({ domain, service, data, target });
  },
};

(async () => {
  const el = document.createElement("cliamp-radio-card");
  document.body.appendChild(el);
  el.setConfig({ entity: "media_player.living_room" });
  el.hass = hass;
  await tick();
  const sr = el.shadowRoot;
  const crt = sr.querySelector(".crt");
  const key = (k) => crt.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true }));

  // 1. layout / brand / local playlist
  check("brand rendered", sr.querySelector(".brand").textContent.trim() === "C L I A M P");
  check("SRC shows Local 1/3", sr.querySelector('[data-role="src"]').textContent.includes("1/3") && sr.querySelector('[data-role="src"]').textContent.includes("Local"));
  check("12 omarchy stations", sr.querySelectorAll(".row").length === 12);
  check("omarchy list has NCS Drum & Bass", sr.querySelector(".list").textContent.includes("NCS Drum & Bass"));
  check("now-playing shows media_title", sr.querySelector('[data-role="np"]').textContent.includes("Omarchy Radio"));
  check("volume bar rendered", sr.querySelector('[data-role="volbar"]').textContent.includes("█"));

  // 2. target dropdown includes MA marker
  const outHTML = sr.querySelector('[data-role="out"]').innerHTML;
  check("target dropdown lists players + MA", outHTML.includes("Living Room") && outHTML.includes("Kitchen (MA)") && outHTML.includes("·MA"));

  // 3. play first omarchy station
  key("Enter");
  await tick();
  const p1 = svcCalls.find((c) => c.service === "play_media");
  check("Enter plays omarchy stream", !!p1 && p1.domain === "media_player" && p1.data.media_content_id === "https://radio.cliamp.stream/lofi/stream" && p1.target.entity_id === "media_player.living_room");
  check("playing row marked", sr.querySelector(".list").innerHTML.includes("playing"));

  // 4. source -> search
  key("ArrowRight");
  await tick();
  check("search input visible", !sr.querySelector('[data-role="searchwrap"]').hidden);
  check("SRC shows 2/3 Search", sr.querySelector('[data-role="src"]').textContent.includes("2/3") && sr.querySelector('[data-role="src"]').textContent.includes("Search"));

  // 5. run search
  const input = sr.querySelector('[data-role="search"]');
  input.value = "jazz";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await tick(); await tick();
  check("radio-browser queried", fetchCalls.some((u) => u.includes("radio-browser") && u.includes("name=jazz")));
  check("search results rendered", sr.querySelector(".list").textContent.includes("Jazz FM"));

  // 6. play a search result
  svcCalls = [];
  key("Enter");
  await tick();
  const p2 = svcCalls.find((c) => c.service === "play_media");
  check("plays search result url", !!p2 && p2.data.media_content_id === "http://jazz.fm/live");

  // 7. switch to Music Assistant
  key("ArrowRight");
  await tick(); await tick();
  check("MA browse called", wsCalls.some((c) => c.type === "media_player/browse_media" && c.entity_id === "media_player.kitchen" && !c.media_content_id));
  check("MA root rendered", sr.querySelector(".list").textContent.includes("Radio") && sr.querySelector(".list").textContent.includes("Albums"));
  check("MA auto-selected MA player", sr.querySelector('[data-role="out"]').value === "media_player.kitchen");

  // 8. navigate into folder then play item
  key("Enter"); // Radio (dir)
  await tick();
  check("navigated into Radio", sr.querySelector(".list").textContent.includes("Radio Paradise"));
  svcCalls = [];
  key("Enter"); // Radio Paradise
  await tick();
  const p3 = svcCalls.find((c) => c.service === "play_media");
  check("MA plays via music_assistant", !!p3 && p3.domain === "music_assistant" && p3.data.media_id === "library://radio/1" && p3.data.media_type === "radio" && p3.target.entity_id === "media_player.kitchen");

  // 9. back
  key("Escape");
  await tick();
  check("back returns to MA root", sr.querySelector(".list").textContent.includes("Albums"));

  // 10. volume + / mute
  svcCalls = [];
  key("+");
  await tick();
  const vol = svcCalls.find((c) => c.service === "volume_set");
  check("volume + sets 0.55", !!vol && Math.abs(vol.data.volume_level - 0.55) < 0.001);
  key("m");
  await tick();
  const mute = svcCalls.find((c) => c.service === "volume_mute");
  check("mute toggles true", !!mute && mute.data.is_volume_muted === true);

  // 11. favourite toggle persists
  const favBefore = sr.querySelector('[data-role="favcount"]').textContent;
  key("f");
  await tick();
  check("favourite count increments", sr.querySelector('[data-role="favcount"]').textContent !== favBefore || sr.querySelector('[data-role="favcount"]').textContent.includes("1"));
  check("favourite persisted to localStorage", !!window.localStorage.getItem("cliamp-radio-favs"));

  // 12. keyboard nav
  const before = sr.querySelector(".row.selected").getAttribute("data-idx");
  key("ArrowDown");
  const after = sr.querySelector(".row.selected").getAttribute("data-idx");
  check("ArrowDown moves cursor", before !== after);

  const failed = results.filter(([, ok]) => !ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
