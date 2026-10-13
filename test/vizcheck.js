const fs = require("fs");
const { JSDOM } = require("jsdom");
const code = fs.readFileSync(require("path").join(__dirname, "..", "dist", "cliamp-radio-card.js"), "utf8");
function mk(conf, darkMode) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
  const { window } = dom;
  global.window = window; global.document = window.document; global.HTMLElement = window.HTMLElement; global.customElements = window.customElements;
  window.eval(code);
  const hass = { themes: { darkMode: !!darkMode }, states: { "media_player.salon": { state: "playing", attributes: { friendly_name: "Salon", volume_level: 0.5, media_title: "Omarchy Radio" } } }, callWS: async () => ({ children: [] }), callService: async () => {} };
  const el = document.createElement("cliamp-radio-card");
  document.body.appendChild(el);
  el.setConfig(conf);
  el.hass = hass;
  return { el, sr: el.shadowRoot };
}
let pass = 0, fail = 0;
function eq(name, got, want) { const ok = String(got) === String(want); console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " got=" + got + " want=" + want)); ok ? pass++ : fail++; }

let a = mk({ entity: "media_player.salon" }, true);
eq("default visualizer bars", a.sr.querySelector('[data-role="eqbars"]').getAttribute("data-viz"), "bars");
eq("32 spectrum bars", a.sr.querySelectorAll(".eqbars .bar").length, 32);
eq("each bar has fill+cap", a.sr.querySelectorAll(".eqbars .bar .fill").length === 32 && a.sr.querySelectorAll(".eqbars .bar .cap").length === 32, true);
eq("bars animating when playing", a.sr.querySelector('[data-role="eqbars"]').className.includes("playing"), true);

let b = mk({ entity: "media_player.salon", visualizer: "mirror" }, true);
eq("visualizer mirror", b.sr.querySelector('[data-role="eqbars"]').getAttribute("data-viz"), "mirror");

let c = mk({ entity: "media_player.salon", visualizer: "off" }, true);
eq("visualizer off -> no-eq", c.sr.querySelector(".crt").className.includes("no-eq"), true);

let d = mk({ entity: "media_player.salon", palette: "catppuccin-latte" }, true);
eq("latte --bg", d.sr.querySelector(".crt").style.getPropertyValue("--bg"), "#eff1f5");
eq("latte is light (theme-light)", d.sr.querySelector(".crt").className.includes("theme-light"), true);

let e = mk({ entity: "media_player.salon", palette: "matte-black" }, true);
eq("matte-black --bg", e.sr.querySelector(".crt").style.getPropertyValue("--bg"), "#000000");
eq("matte-black is dark", e.sr.querySelector(".crt").className.includes("theme-dark"), true);

let f = mk({ entity: "media_player.salon" }, true);
eq("omarchy default has no inline --bg", f.sr.querySelector(".crt").style.getPropertyValue("--bg") || "", "");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
