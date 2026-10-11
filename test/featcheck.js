const fs = require("fs");
const { JSDOM } = require("jsdom");
const code = fs.readFileSync(require("path").join(__dirname, "..", "dist", "cliamp-radio-card.js"), "utf8");
function mk(conf, darkMode) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
  const { window } = dom;
  global.window = window; global.document = window.document; global.HTMLElement = window.HTMLElement; global.customElements = window.customElements;
  window.eval(code);
  const hass = { themes: { darkMode: !!darkMode }, states: { "media_player.salon": { state: "playing", attributes: { friendly_name: "Salon", volume_level: 0.5, media_title: "Omarchy Radio", media_content_id: "https://radio.cliamp.stream/omarchy/stream" } } }, callWS: async () => ({ children: [] }), callService: async () => {} };
  const el = document.createElement("cliamp-radio-card");
  document.body.appendChild(el);
  el.setConfig(conf);
  el.hass = hass;
  return { el, sr: el.shadowRoot };
}
let pass = 0, fail = 0;
function eq(name, got, want) { const ok = String(got) === String(want); console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " got=" + got + " want=" + want)); ok ? pass++ : fail++; }

let a = mk({ entity: "media_player.salon" }, false);
eq("default pickrow visible (dropdown)", a.sr.querySelector('[data-role="pickrow"]').hidden, false);
eq("default list hidden", a.sr.querySelector('[data-role="list"]').hidden, true);
eq("pick has 12 options", a.sr.querySelectorAll('[data-role="pick"] option').length, 12);
eq("pick selected = omarchy", a.sr.querySelector('[data-role="pick"]').value, "https://radio.cliamp.stream/omarchy/stream");
eq("theme-light when darkMode=false", a.sr.querySelector(".crt").className.includes("theme-light"), true);

let b = mk({ entity: "media_player.salon", theme: "dark", stations: "list", show_eq: false }, false);
eq("stations:list -> pickrow hidden", b.sr.querySelector('[data-role="pickrow"]').hidden, true);
eq("stations:list -> list visible", b.sr.querySelector('[data-role="list"]').hidden, false);
eq("theme:dark forces dark", b.sr.querySelector(".crt").className.includes("theme-dark"), true);
eq("show_eq:false -> no-eq", b.sr.querySelector(".crt").className.includes("no-eq"), true);

let c = mk({ entity: "media_player.salon" }, true);
eq("auto dark when darkMode=true", c.sr.querySelector(".crt").className.includes("theme-dark"), true);

let d = mk({ entity: "media_player.salon", dense: true, hide_keys: true }, true);
eq("dense -> tight", d.sr.querySelector(".crt").className.includes("tight"), true);
eq("hide_keys -> hide-keys", d.sr.querySelector(".crt").className.includes("hide-keys"), true);

console.log("\n" + pass + " passed, " + fail + " failed");
