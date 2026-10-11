const fs = require("fs");
const { JSDOM } = require("jsdom");
const code = fs.readFileSync(require("path").join(__dirname, "..", "dist", "cliamp-radio-card.js"), "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
global.window = window; global.document = window.document; global.HTMLElement = window.HTMLElement; global.customElements = window.customElements;
window.eval(code);
let pass = 0, fail = 0;
function eq(name, got, want) { const ok = String(got) === String(want); console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " got=" + got + " want=" + want)); ok ? pass++ : fail++; }

const card = document.createElement("cliamp-radio-card");
eq("card has getConfigElement", typeof card.constructor.getConfigElement, "function");

const ed = card.constructor.getConfigElement();
eq("editor is custom element", ed.tagName.toLowerCase(), "cliamp-radio-card-editor");
const hass = { states: { "media_player.salon": { attributes: { friendly_name: "Salon" } }, "media_player.cocina": { attributes: { friendly_name: "Cocina" } } } };
ed.hass = hass;
ed.setConfig({ entity: "media_player.salon", theme: "dark" });
eq("entity select options", ed.shadowRoot.querySelectorAll('[data-k="entity"] option').length, 3);
eq("entity selected", ed.shadowRoot.querySelector('[data-k="entity"]').value, "media_player.salon");
eq("theme selected", ed.shadowRoot.querySelector('[data-k="theme"]').value, "dark");
eq("has 3 checkboxes", ed.shadowRoot.querySelectorAll('input[type=checkbox]').length, 3);

let last = null;
ed.addEventListener("config-changed", (ev) => { last = ev.detail.config; });
ed._set("theme", "light");
eq("config-changed config.theme", last.theme, "light");

const chk = ed.shadowRoot.querySelector('[data-k="show_eq"]');
chk.checked = false;
chk.dispatchEvent(new window.Event("change", { bubbles: true }));
eq("show_eq set false", ed._config.show_eq, false);

console.log("\n" + pass + " passed, " + fail + " failed");
