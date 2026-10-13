/* Cliamp Radio Card
 * A Home Assistant Lovelace card that looks and feels like cliamp
 * (the Omarchy terminal music player, inspired by Winamp 2.x).
 *
 * Sources:  [Local] = the 12 built-in Omarchy/cliamp stations
 *           [Radio] = radio-browser.info search (direct, CORS enabled)
 *           [Music Assistant] = browse your Music Assistant library
 *
 * Playback targets any media_player (including Music Assistant players).
 */

const CARD_VERSION = "0.5.0";

console.info(
  `%c CLIAMP·RADIO %c v${CARD_VERSION} `,
  "background:#028391;color:#031222;font-weight:bold;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#faa968;color:#031222;font-weight:bold;border-radius:0 3px 3px 0;padding:2px 4px"
);

const OMARCHY_STATIONS = [
  { title: "Lofi Stream", slug: "lofi" },
  { title: "Synthwave Stream", slug: "synthwave" },
  { title: "EDM Stream", slug: "edm" },
  { title: "Omarchy Radio", slug: "omarchy" },
  { title: "NCS Stream", slug: "ncs" },
  { title: "NCS House Stream", slug: "ncs-house" },
  { title: "NCS Dubstep Stream", slug: "ncs-dubstep" },
  { title: "NCS Drum & Bass Stream", slug: "ncs-dnb" },
  { title: "NCS Trap Stream", slug: "ncs-trap" },
  { title: "NCS Phonk Stream", slug: "ncs-phonk" },
  { title: "NCS Pop Stream", slug: "ncs-pop" },
  { title: "NCS Chill Stream", slug: "ncs-chill" },
].map((s) => ({
  title: s.title,
  media_id: `https://radio.cliamp.stream/${s.slug}/stream`,
  media_type: "music",
}));

const RB_HOSTS = [
  "de1.api.radio-browser.info",
  "de2.api.radio-browser.info",
  "at1.api.radio-browser.info",
  "nl1.api.radio-browser.info",
  "fi1.api.radio-browser.info",
];
const RB_LIMIT = 80;

const SOURCES = [
  { key: "local", provider: "Radio", label: "Local" },
  { key: "search", provider: "Radio", label: "Search" },
  { key: "mass", provider: "MusicAssistant", label: "Library" },
];

const MASS_TYPES = ["artist", "album", "audiobook", "folder", "playlist", "podcast", "track", "radio"];

/* cliamp-style themes (palettes). "omarchy" follows HA light/dark. */
const PALETTES = {
  omarchy: {
    light: false,
    bg: "#031222", panel: "#05182e", panel2: "#0a2540", green: "#028391",
    cream: "#f6dcac", yellow: "#e97b3c", red: "#f85525", cyan: "#8cbfb8",
    muted: "#2a6b78", sel: "#134e5a", accent: "#faa968",
  },
  "matte-black": {
    light: false,
    bg: "#000000", panel: "#0c0c0c", panel2: "#161616", green: "#00c2a8",
    cream: "#e8e6e3", yellow: "#e0a458", red: "#ff5a5f", cyan: "#8ecae6",
    muted: "#555555", sel: "#1e1e1e", accent: "#f2b880",
  },
  "catppuccin-mocha": {
    light: false,
    bg: "#1e1e2e", panel: "#181825", panel2: "#313244", green: "#a6e3a1",
    cream: "#cdd6f4", yellow: "#f9e2af", red: "#f38ba8", cyan: "#89dceb",
    muted: "#6c7086", sel: "#45475a", accent: "#cba6f7",
  },
  "catppuccin-latte": {
    light: true,
    bg: "#eff1f5", panel: "#e6e9ef", panel2: "#dce0e8", green: "#40a02b",
    cream: "#4c4f69", yellow: "#df8e1d", red: "#d20f39", cyan: "#04a5e5",
    muted: "#9ca0b0", sel: "#ccd0da", accent: "#8839ef",
  },
  "flexoki-light": {
    light: true,
    bg: "#fffcf0", panel: "#f2f0e5", panel2: "#e6e4d9", green: "#879a39",
    cream: "#100f0f", yellow: "#d0a215", red: "#d14d41", cyan: "#24837b",
    muted: "#b7b5ac", sel: "#dad8ce", accent: "#da702c",
  },
  ethereal: {
    light: false,
    bg: "#060b1e", panel: "#0b1026", panel2: "#131a3a", green: "#7fd5ea",
    cream: "#ffcead", yellow: "#f5c26b", red: "#f06a8b", cyan: "#8ba3f0",
    muted: "#4a4f7a", sel: "#20264d", accent: "#c9a0ff",
  },
  "tokyo-night": {
    light: false,
    bg: "#1a1b26", panel: "#16161e", panel2: "#292e42", green: "#9ece6a",
    cream: "#c0caf5", yellow: "#e0af68", red: "#f7768e", cyan: "#7dcfff",
    muted: "#565f89", sel: "#33467c", accent: "#bb9af7",
  },
  nord: {
    light: false,
    bg: "#2e3440", panel: "#292e39", panel2: "#3b4252", green: "#a3be8c",
    cream: "#d8dee9", yellow: "#ebcb8b", red: "#bf616a", cyan: "#88c0d0",
    muted: "#4c566a", sel: "#434c5e", accent: "#81a1c1",
  },
  "gruvbox-dark": {
    light: false,
    bg: "#282828", panel: "#1d2021", panel2: "#3c3836", green: "#b8bb26",
    cream: "#ebdbb2", yellow: "#fabd2f", red: "#fb4934", cyan: "#8ec07c",
    muted: "#928374", sel: "#504945", accent: "#d79921",
  },
};
const PALETTE_NAMES = Object.keys(PALETTES);
const PALETTE_VARS = ["bg", "panel", "panel2", "green", "cream", "yellow", "red", "cyan", "muted", "sel", "accent"];

const VISUALIZERS = ["bars", "blocks", "peak", "mirror", "dots", "off"];

const rnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const STYLE = `
:host { display:block; height:100%; }
* { box-sizing:border-box; }
.crt [hidden] { display:none !important; }
.crt {
  --bg:#031222; --panel:#05182e; --panel2:#0a2540;
  --green:#028391; --cream:#f6dcac; --yellow:#e97b3c; --red:#f85525;
  --cyan:#8cbfb8; --muted:#2a6b78; --sel:#134e5a; --accent:#faa968;
  font-family:"JetBrainsMono Nerd Font","JetBrains Mono","Cascadia Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--bg);
  color:var(--cream);
  border:1px solid var(--muted);
  border-radius:4px;
  padding:10px 12px 8px;
  font-size:13px;
  line-height:1.5;
  letter-spacing:0.01em;
  font-variant-ligatures:none;
  box-shadow:0 1px 3px rgba(0,0,0,.4);
  user-select:none;
  height:100%;
  display:flex;
  flex-direction:column;
  min-height:0;
}
.screen { display:flex; flex-direction:column; gap:2px; min-height:0; flex:1 1 auto; }
.top { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.brand { color:var(--green); font-weight:700; letter-spacing:.28em; }
.tag { color:var(--muted); font-weight:700; }
.crt.theme-dark { --bg:#000000; --panel:#0d0d0d; --panel2:#141414; --cream:#e9e6dd; --muted:#4a5b60; --sel:#1b2c2e; }
.crt.theme-light {
  --bg:#ffffff; --panel:#f1f2ef; --panel2:#e5e7e3; --cream:#14181c;
  --muted:#98a5a3; --green:#027d78; --yellow:#c26a1f; --red:#c93a12;
  --cyan:#3d8f89; --accent:#b8651f; --sel:#cfe3e0;
  box-shadow:0 1px 3px rgba(0,0,0,.15);
}
.crt.no-eq .eqbars { display:none; }
.outrow { display:flex; align-items:center; gap:8px; margin:2px 0; }
.outrow .outlbl { color:var(--green); font-weight:700; white-space:nowrap; }
.out {
  flex:1; min-width:0; background:var(--panel); color:var(--cream);
  border:1px solid var(--muted); font:inherit; padding:7px 8px; border-radius:4px;
  cursor:pointer; outline:none; -webkit-appearance:none; appearance:none;
}
.out option { background:var(--panel); color:var(--cream); }
.out:hover { border-color:var(--green); color:var(--cyan); }
.nowline { display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
.np { color:var(--yellow); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.np .art { color:var(--green); }
.state { color:var(--cream); white-space:nowrap; font-size:12px; }
.state.playing { color:var(--green); }
.time { color:var(--cream); font-size:12px; }
.sep { color:var(--muted); overflow:hidden; white-space:nowrap; height:14px; line-height:14px; }
.eqrow { display:flex; justify-content:space-between; gap:10px; align-items:baseline; flex-wrap:wrap; }
.eq { color:var(--cream); white-space:nowrap; overflow:hidden; }
.eq .lbl { font-weight:700; }
.eq .preset { color:var(--yellow); }
.eq .playing { color:var(--green); }
  /* spectrum visualizer (cliamp styles) */
  .eqbars { display:flex; align-items:flex-end; gap:2px; height:34px; margin:3px 0 1px; }
  .eqbars .bar { flex:1 1 0; min-width:0; height:100%; display:flex; align-items:flex-end; position:relative; --c:var(--green); }
  .eqbars .fill {
    display:block; width:100%; height:100%; background:var(--c); border-radius:1px;
    transform:scaleY(.24); transform-origin:bottom center; opacity:.92;
  }
  .eqbars .cap { display:none; position:absolute; left:0; right:0; height:2px; background:var(--accent); border-radius:1px; bottom:8%; opacity:.85; }
  .eqbars.playing .bar > .fill { animation:eqb var(--dur,900ms) ease-in-out infinite; animation-delay:var(--d,0ms); }
  .eqbars.playing .bar > .cap { animation:eqc var(--dur,900ms) ease-in-out infinite; animation-delay:var(--d,0ms); }
  @keyframes eqb { 0%,100% { transform:scaleY(.12); } 50% { transform:scaleY(1); } }
  @keyframes eqc { 0%,100% { bottom:12%; } 55% { bottom:96%; } 78% { bottom:66%; } }
  .eqbars .bar:nth-child(odd) { --c:var(--yellow); }
  .eqbars .bar:nth-child(4n) { --c:var(--cyan); }
  .eqbars[data-viz="peak"] .cap { display:block; }
  .eqbars[data-viz="mirror"] { align-items:center; }
  .eqbars[data-viz="mirror"] .bar { align-items:center; }
  .eqbars[data-viz="mirror"] .fill { transform-origin:center; transform:scaleY(-.24); }
  .eqbars[data-viz="mirror"].playing .bar > .fill { animation-name:eqbm; }
  @keyframes eqbm { 0%,100% { transform:scaleY(.12); } 50% { transform:scaleY(1); } }
  .eqbars[data-viz="blocks"] .fill { background:repeating-linear-gradient(to top,var(--c) 0 4px,rgba(0,0,0,0) 4px 6px); }
  .eqbars[data-viz="dots"] { gap:3px; }
  .eqbars[data-viz="dots"] .fill { background:repeating-linear-gradient(to top,var(--c) 0 3px,rgba(0,0,0,0) 3px 7px); border-radius:2px; }
@media (prefers-reduced-motion:reduce) { .eqbars.playing .bar > .fill { animation:none; transform:scaleY(.5); } }
.volwrap { display:flex; align-items:center; gap:6px; white-space:nowrap; }
.volwrap .lbl { font-weight:700; }
.volbar { color:var(--green); letter-spacing:-1px; }
.volbar .off { color:var(--muted); }
.db { color:var(--muted); font-size:12px; }
.srcrow { display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
.src { background:transparent; border:0; color:var(--cream); font:inherit; cursor:pointer; padding:0; text-align:left; }
.src:hover { color:var(--cyan); }
.src .lbl { font-weight:700; }
.src .prov { color:var(--yellow); }
.src .cur { color:var(--yellow); font-weight:700; }
.volbtns { color:var(--muted); font-size:12px; white-space:nowrap; }
.volbtns button {
  background:transparent; border:0; color:var(--cream); font:inherit; cursor:pointer; padding:0 4px;
}
.volbtns button:hover { color:var(--accent); }
.tabs { display:flex; gap:6px; flex-wrap:wrap; margin:2px 0; }
.tabs button {
  background:transparent; border:1px solid var(--muted); color:var(--cream);
  font:inherit; padding:7px 10px; border-radius:4px; cursor:pointer; flex:1 1 auto;
}
.tabs button.on { border-color:var(--green); color:var(--green); font-weight:700; }
.tabs button:hover { border-color:var(--cyan); color:var(--cyan); }
.transport { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:2px 0; }
.transport button {
  background:transparent; border:1px solid var(--muted); color:var(--cream);
  font:inherit; font-size:15px; min-width:44px; padding:8px 6px; border-radius:4px;
  cursor:pointer; line-height:1;
}
.transport button.big { font-size:18px; min-width:56px; }
.transport button:hover { border-color:var(--green); color:var(--accent); }
.transport button:active { background:var(--sel); }
.vslide { flex:1 1 80px; min-width:70px; accent-color:var(--green); height:24px; }
.plhead { display:flex; justify-content:space-between; gap:8px; align-items:baseline; color:var(--yellow); font-weight:700; margin-top:2px; }
.plhead .tags { color:var(--muted); font-weight:400; }
.plhead .tags b { color:var(--yellow); font-weight:700; }
.plhead .fav { color:var(--red); font-weight:700; }
.plhead .cur { color:var(--yellow); font-weight:700; }
.searchwrap { display:flex; align-items:center; gap:6px; color:var(--muted); }
.searchwrap .prompt { color:var(--yellow); font-weight:700; }
.search {
  flex:1; background:transparent; border:0; border-bottom:1px solid var(--muted);
  color:var(--cream); font:inherit; outline:none; padding:2px 0;
}
.search::placeholder { color:var(--muted); }
.list { flex:1 1 auto; overflow:auto; min-height:70px; padding:2px 0; outline:none; }
.list::-webkit-scrollbar { width:8px; }
.list::-webkit-scrollbar-thumb { background:var(--muted); border-radius:4px; }
.row { display:flex; gap:6px; white-space:nowrap; cursor:pointer; padding:0 2px; border-radius:2px; }
.row .cur { color:var(--green); }
.row .num { color:var(--muted); }
.row .fav { color:var(--red); }
.row .name { color:var(--cream); overflow:hidden; text-overflow:ellipsis; }
.row .hint { color:var(--muted); }
.row.selected { background:var(--sel); }
.row.selected .name { color:var(--yellow); }
.row.playing .name { color:var(--green); }
.empty { color:var(--muted); padding:6px 2px; }
.status { min-height:16px; color:var(--red); font-size:12px; }
.sep2 { margin-top:4px; }
.keys { color:var(--muted); display:flex; flex-wrap:wrap; gap:2px 8px; font-size:12px; }
kbd {
  background:var(--muted); color:var(--cream); border-radius:3px; padding:1px 5px;
  font-family:inherit; font-weight:700; font-size:11px;
}
.keys .txt { color:var(--cream); }
.spd { color:var(--muted); font-size:12px; margin-top:2px; }
.spd .lbl { color:var(--cream); font-weight:700; }
.spd .val { color:var(--yellow); }
.hint { color:var(--muted); }
.lyrwrap { margin:2px 0; border-top:1px dashed var(--muted); padding-top:3px; }
.lyrhead { display:flex; justify-content:space-between; gap:8px; color:var(--yellow); font-weight:700; font-size:12px; }
.lyrhead .tag2 { color:var(--muted); font-weight:400; }
.lyrics { max-height:76px; overflow:auto; padding:2px 0; }
.lyrics::-webkit-scrollbar { width:8px; }
.lyrics::-webkit-scrollbar-thumb { background:var(--muted); border-radius:4px; }
.lyrline { color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 2px; }
.lyrline.on { color:var(--accent); font-weight:700; }
.crt.tight .lyrics { max-height:48px; }
.crt.roomy .lyrics { max-height:120px; }

/* --- responsive / adaptable to the card size ----------------------------- */
  .crt.hide-keys .keys { display:none; }
  .crt.hide-keys .spd { display:none; }
  .keys[style*="display:none"] { display:none !important; }
.crt.tight { font-size:12px; padding:8px 10px 6px; }
.crt.tight .list { min-height:52px; }
  .crt.tight .eqbars { height:22px; }
  .crt.tight .transport button { min-width:38px; padding:7px 4px; font-size:14px; }
  .crt.tight .tabs button { padding:6px 8px; }
  .crt.roomy { font-size:13px; }
  .crt.roomy .eqbars { height:40px; }
  .crt.roomy .list { min-height:120px; }
.crt.roomy .eqbars { height:34px; }
`;


class CliampRadioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._built = false;
    this._entity = "";
    this._source = 0;
    this._items = [];
    this._index = 0;
    this._query = "";
    this._massQuery = "";
    this._title = "Playlist";
    this._error = "";
    this._loading = false;
    this._lastStation = "";
    this._playingId = "";
    this._massStack = [];
    this._volBusy = false;
    this._favs = this._loadFavs();
    this._savedOut = this._loadOut();
    this._lyrics = null;
    this._lyrKey = "";
    this._lyrTimer = null;
    this._lyrActive = -1;
    this._lyrSig = "";
  }

  connectedCallback() {
    if (this._config && this._config.lyrics === "on" && this._built) this._applyLyrics();
  }

  disconnectedCallback() {
    this._stopLyricTimer();
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "auto",
      palette: "omarchy",
      stations: "dropdown",
      visualizer: "bars",
      show_eq: true,
      eq_animate: "always",
      lyrics: "off",
      hide_keys: false,
      dense: false,
    };
  }

  static getConfigElement() {
    return document.createElement("cliamp-radio-card-editor");
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        entity: "",
        theme: "auto", // auto | dark | light (solo paleta "omarchy")
        palette: "omarchy", // omarchy | matte-black | catppuccin-mocha | ...
        stations: "dropdown", // dropdown | list  (fuente Local)
        visualizer: "bars", // bars | blocks | peak | mirror | dots | off
        show_eq: true, // mostrar el visualizer/espectro
        eq_animate: "always", // always | playing | off
        lyrics: "off", // off | on  (letras sincronizadas vía LRCLIB)
        hide_keys: false, // ocultar la leyenda de teclas
        dense: false, // forzar formato compacto
      },
      config || {}
    );
    if (this._hass) this._init();
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return {
      columns: 6,
      rows: 6,
      min_columns: 3,
      min_rows: 3,
      max_columns: 12,
      max_rows: 12,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      if (!this._config || !this._hass) return;
      this._init();
      return;
    }
    this._renderOut();
    this._renderStatus();
    this._applyTheme();
  }

  _paletteName() {
    const name = this._config && this._config.palette;
    return PALETTES[name] ? name : "omarchy";
  }

  _isDark() {
    const name = this._paletteName();
    if (name !== "omarchy") return !PALETTES[name].light;
    const mode = this._config.theme;
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return !!(this._hass && this._hass.themes && this._hass.themes.darkMode);
  }

  _applyTheme() {
    const crt = this.shadowRoot.querySelector(".crt");
    if (!crt) return;
    const dark = this._isDark();
    crt.classList.toggle("theme-dark", dark);
    crt.classList.toggle("theme-light", !dark);
    this._applyPalette(crt);
  }

  _applyPalette(crt) {
    crt = crt || this.shadowRoot.querySelector(".crt");
    if (!crt) return;
    const name = this._paletteName();
    if (name === "omarchy") {
      /* default palette -> let the theme-dark/theme-light classes drive it */
      for (let i = 0; i < PALETTE_VARS.length; i++) crt.style.removeProperty("--" + PALETTE_VARS[i]);
      return;
    }
    const p = PALETTES[name];
    for (let i = 0; i < PALETTE_VARS.length; i++) {
      const k = PALETTE_VARS[i];
      if (p[k]) crt.style.setProperty("--" + k, p[k]);
    }
  }

  // --- setup ---------------------------------------------------------------

  _players() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter((e) => e.startsWith("media_player."))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  _massPlayers() {
    return this._players().filter((e) => this._isMass(e));
  }

  _isMass(id) {
    const st = this._state(id);
    const a = st && st.attributes ? st.attributes : {};
    return !!(a.mass_player_id || a.mass_player_type || a.mass_queue_id || a.player_id);
  }

  _friendly(id) {
    const st = this._state(id);
    return (st && st.attributes && st.attributes.friendly_name) || id || "—";
  }

  _state(id) {
    return this._hass && this._hass.states ? this._hass.states[id] : null;
  }

  _init() {
    try {
      this._entity =
        this._savedOut && this._state(this._savedOut)
          ? this._savedOut
          : this._config.entity || this._firstPlayer();
      this._source = 0;
      this._index = 0;
      this._buildSkeleton();
      this._attachEvents();
      this._renderOut();
      this._setSource(0);
      this._applyTheme();
      this._applyViz();
      this._applyLyrics();
      this._built = true;
      this._watchSize();
    } catch (err) {
      this._fail(err);
    }
  }

  _watchSize() {
    const apply = () => this._applySize();
    apply();
    if (typeof ResizeObserver !== "undefined") {
      if (this._ro) this._ro.disconnect();
      this._ro = new ResizeObserver(apply);
      this._ro.observe(this);
    } else if (window.addEventListener) {
      window.addEventListener("resize", apply);
    }
  }

  _applySize() {
    const crt = this.shadowRoot.querySelector(".crt");
    if (!crt) return;
    const w = this.clientWidth || 0;
    const h = this.clientHeight || 0;
    const cfg = this._config || {};
    const autoNarrow = w > 0 && w < 300;
    const autoTight = (w > 0 && w < 300) || (h > 0 && h < 230);
    crt.classList.toggle("hide-keys", true);
    crt.classList.toggle("tight", cfg.dense === true || autoTight);
    crt.classList.toggle("roomy", !cfg.dense && w >= 520 && h >= 320);
    this._applyViz();
    const pick = this.shadowRoot.querySelector('[data-role="pickrow"]');
    if (pick) this._renderPick();
  }

  _fail(err) {
    if (window.console && console.error) console.error("cliamp-radio-card:", err);
    this._built = true;
    try {
      const msg = err && err.message ? err.message : String(err);
      this.shadowRoot.innerHTML =
        `<div style="padding:12px;background:#031222;color:#f85525;` +
        `font:13px/1.5 monospace;border:1px solid #2a6b78;border-radius:4px">` +
        `<b style="color:#028391">C L I A M P</b> — error en la tarjeta<br>` +
        `<span style="color:#f6dcac">${esc(msg)}</span></div>`;
    } catch (e) {
      /* ignore */
    }
  }

  _firstPlayer() {
    const p = this._players();
    return p.length ? p[0] : "";
  }

  _buildSkeleton() {
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="crt" tabindex="0">
        <div class="screen">
          <div class="top">
            <div class="brand">C L I A M P</div>
            <div class="tag" data-role="srtag">[Radio]</div>
          </div>
          <div class="nowline">
            <span class="np" data-role="np"><span class="art">♫</span> —</span>
            <span class="state" data-role="state">■ Stopped</span>
          </div>
          <div class="time"><span data-role="time">00:00 / LIVE</span></div>
          <div class="sep" data-role="sep"></div>
          <div class="eqrow">
            <div class="eq" data-role="eq"></div>
            <div class="volwrap">
              <span class="lbl">VOL</span>
              <span class="volbar" data-role="volbar"></span>
              <span class="db" data-role="db">+0dB</span>
            </div>
          </div>
          <div class="eqbars" data-role="eqbars"></div>
          <div class="outrow">
            <span class="outlbl">🔊 Altavoz</span>
            <select class="out" data-role="out" title="Elige dónde sonar"></select>
          </div>
          <div class="srcrow">
            <button class="src" data-role="src" data-act="src"></button>
            <span class="volbtns"></span>
          </div>
          <div class="tabs" data-role="tabs"></div>
          <div class="outrow pickrow" data-role="pickrow" hidden>
            <span class="outlbl">Emisora</span>
            <select class="out" data-role="pick" title="Elige emisora de Omarchy"></select>
          </div>
          <div class="plhead">
            <span class="head" data-role="plhead">▸─ Playlist ──</span>
            <span class="tags">
              <span>[Shuffle]</span> <span>[Repeat: Off]</span>
              <span class="fav" data-role="favcount">[♥ 0]</span>
              <span class="cur" data-role="count">[0/0]</span>
            </span>
          </div>
          <div class="searchwrap" data-role="searchwrap" hidden>
            <span class="prompt">/</span>
            <input class="search" data-role="search" type="text" spellcheck="false"
                   placeholder="search stations on radio-browser.info &  ↵" />
          </div>
          <div class="list" data-role="list" tabindex="-1"></div>
          <div class="status" data-role="status"></div>
          <div class="lyrwrap" data-role="lyrwrap" hidden>
            <div class="lyrhead"><span class="lbl">♪ Lyrics</span> <span class="tag2" data-role="lyrsrc">LRCLIB</span></div>
            <div class="lyrics" data-role="lyrics"></div>
          </div>
          <div class="sep" data-role="sep2"></div>
          <div class="transport">
            <button data-act="prev" title="Anterior">⏮</button>
            <button class="big" data-act="pp" data-role="pp" title="Reproducir / Pausar">▶</button>
            <button data-act="stop" title="Parar">⏹</button>
            <button data-act="next" title="Siguiente">⏭</button>
            <button data-act="mute" data-role="mbtn" title="Silenciar">🔊</button>
            <input class="vslide" data-role="vol" type="range" min="0" max="1" step="0.01"
                   title="Volumen" aria-label="Volumen" />
          </div>
          <div class="keys" style="display:none"></div>
          <div class="spd"><span class="lbl">SPD</span> <span class="val">[1x]</span></div>
        </div>
      </div>`;

    this._buildViz();
  }

  _buildViz() {
    const eqbars = this.shadowRoot.querySelector('[data-role="eqbars"]');
    if (!eqbars || eqbars.childNodes.length) return;
    let bars = "";
    for (let i = 0; i < 32; i++) {
      const d = -Math.round(rnd(i + 1) * 900);
      const dur = 700 + Math.round(rnd(i + 5) * 540);
      bars +=
        '<span class="bar" style="--d:' + d + "ms;--dur:" + dur + 'ms">' +
        '<i class="cap"></i><i class="fill"></i></span>';
    }
    eqbars.innerHTML = bars;
  }

  _applyViz() {
    const bars = this.shadowRoot.querySelector('[data-role="eqbars"]');
    const crt = this.shadowRoot.querySelector(".crt");
    if (!bars || !crt) return;
    const cfg = this._config || {};
    const viz = VISUALIZERS.indexOf(cfg.visualizer) >= 0 ? cfg.visualizer : "bars";
    bars.setAttribute("data-viz", viz);
    crt.classList.toggle("no-eq", cfg.show_eq === false || viz === "off");
  }

  _attachEvents() {
    const root = this.shadowRoot.querySelector(".crt");

    root.addEventListener("keydown", (ev) => this._onKey(ev));

    this.shadowRoot.addEventListener("click", (ev) => {
      const actEl = ev.target.closest("[data-act]");
      if (actEl) {
        ev.stopPropagation();
        const act = actEl.getAttribute("data-act");
        if (act === "fav") {
          const row = actEl.closest(".row");
          if (row) this._index = Number(row.getAttribute("data-idx"));
        }
        this._onAction(act);
        return;
      }
      const row = ev.target.closest(".row");
      if (row) {
        const i = Number(row.getAttribute("data-idx"));
        if (!Number.isNaN(i)) this._select(i, true);
        return;
      }
      const tab = ev.target.closest("[data-tab]");
      if (tab) this._setSource(Number(tab.getAttribute("data-tab")));
    });

    this.shadowRoot.addEventListener("input", (ev) => {
      if (ev.target.getAttribute("data-role") === "vol") {
        this._volSet(parseFloat(ev.target.value));
      }
    });

    this.shadowRoot.addEventListener("change", (ev) => {
      const role = ev.target.getAttribute("data-role");
      if (role === "out") {
        this._entity = ev.target.value;
        this._saveOut();
        this._renderStatus();
        this._renderPick();
      } else if (role === "pick") {
        const id = ev.target.value;
        const idx = this._items.findIndex((it) => it.media_id === id);
        if (idx >= 0) this._select(idx, true);
      }
    });

    const search = this.shadowRoot.querySelector('[data-role="search"]');
    search.addEventListener("input", () => {
      if (SOURCES[this._source].key === "mass") this._massQuery = search.value;
      else this._query = search.value;
    });
    search.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        if (SOURCES[this._source].key === "mass") this._runMassSearch();
        else this._runSearch();
        root.focus();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        this._back();
        root.focus();
      } else {
        ev.stopPropagation();
      }
    });
  }

  // --- sources -------------------------------------------------------------

  _setSource(idx) {
    this._source = ((idx % SOURCES.length) + SOURCES.length) % SOURCES.length;
    const src = SOURCES[this._source];
    this._items = [];
    this._index = 0;
    this._error = "";
    this._title = src.label;
    const searchwrap = this.shadowRoot.querySelector('[data-role="searchwrap"]');
    const searchInput = this.shadowRoot.querySelector('[data-role="search"]');
    const canSearch = src.key === "search" || src.key === "mass";
    searchwrap.hidden = !canSearch;
    if (canSearch) {
      searchInput.placeholder =
        src.key === "mass"
          ? "search your Music Assistant library &  ↵"
          : "search stations on radio-browser.info &  ↵";
      searchInput.value = src.key === "mass" ? this._massQuery || "" : this._query || "";
    }

    if (src.key === "local") {
      this._items = OMARCHY_STATIONS.map((s) => ({
        title: s.title,
        media_id: s.media_id,
        media_type: "music",
        favId: "local:" + s.media_id,
      }));
      this._title = "Playlist";
      this._render();
    } else if (src.key === "search") {
      this._render();
      if (this._query) this._runSearch();
      else {
        const input = this.shadowRoot.querySelector('[data-role="search"]');
        input.focus();
      }
    } else if (src.key === "mass") {
      const masse = this._massPlayers();
      if (masse.length && !this._isMass(this._entity) && !this._savedOut) this._entity = masse[0];
      if (!this._entity) {
        this._error = "No media_player available.";
        this._render();
      } else {
        this._massStack = [null];
        if (this._massQuery) this._runMassSearch();
        else this._loadMass(null);
      }
    }
    this._renderTabs();
    this._renderOut();
  }

  _massItem(c) {
    const raw = ((c && (c.media_class || c.media_content_type)) || "").toString().toLowerCase();
    const mt = MASS_TYPES.indexOf(raw) >= 0 ? raw : "music";
    return {
      title: c.title,
      subtitle: raw,
      media_id: c.media_content_id,
      media_type: mt,
      isDir: !!c.can_expand,
      navId: c.media_content_id,
      thumb: c.thumbnail,
      favId: "mass:" + c.media_content_id,
    };
  }

  async _loadMass(mediaId) {
    this._loading = true;
    this._error = "";
    this._render();
    try {
      const res = await this._hass.callWS({
        type: "media_player/browse_media",
        entity_id: this._entity,
        media_content_id: mediaId || null,
      });
      this._items = (res.children || []).map((c) => this._massItem(c));
      this._title = res.title || "Music Assistant";
      this._index = 0;
    } catch (err) {
      this._error = "Music Assistant browse failed: " + this._humanError(err);
      this._items = [];
    }
    this._loading = false;
    this._render();
  }

  async _runMassSearch() {
    const q = (this._massQuery || "").trim();
    if (!q) {
      this._loadMass(null);
      return;
    }
    if (!this._entity) {
      this._error = "No media_player selected.";
      this._render();
      return;
    }
    this._loading = true;
    this._error = "";
    this._render();
    try {
      const res = await this._hass.callWS({
        type: "media_player/search_media",
        entity_id: this._entity,
        search_query: q,
      });
      const list = (res && res.result) || [];
      this._items = list.map((c) => this._massItem(c));
      this._title = "Music · " + q;
      this._index = 0;
      this._massStack = [null];
      if (!this._items.length) this._error = "No results for “" + q + "”.";
    } catch (err) {
      this._error =
        "Search unavailable: " + this._humanError(err) +
        " — needs the Music Assistant HA Core integration.";
      this._items = [];
    }
    this._loading = false;
    this._render();
  }

  async _runSearch() {
    const q = (this._query || "").trim();
    if (!q) return;
    this._loading = true;
    this._error = "";
    this._render();
    try {
      const data = await this._rb("/json/stations/search", {
        name: q,
        limit: RB_LIMIT,
        hidebroken: "true",
        order: "clickcount",
        reverse: "true",
      });
      this._items = (Array.isArray(data) ? data : [])
        .map((s) => ({
          title: s.name,
          subtitle: [s.country, s.codec, s.bitrate ? s.bitrate + "kbps" : ""]
            .filter(Boolean)
            .join(" · "),
          media_id: s.url_resolved || s.url,
          media_type: "music",
          favId: "rb:" + s.stationuuid,
        }))
        .filter((s) => s.media_id);
      this._title = "Radio · " + q;
      this._index = 0;
      if (!this._items.length) this._error = "No stations found for “" + q + "”.";
    } catch (err) {
      this._error = "Search failed: " + this._humanError(err);
      this._items = [];
    }
    this._loading = false;
    this._render();
  }

  async _rb(path, params) {
    let lastErr = null;
    for (const host of RB_HOSTS) {
      try {
        const url = new URL("https://" + host + path);
        Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
        const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("unreachable");
  }

  _humanError(err) {
    if (!err) return "unknown";
    return err.message || String(err);
  }

  // --- navigation ----------------------------------------------------------

  _select(idx, play) {
    if (!this._items.length) return;
    this._index = Math.max(0, Math.min(this._items.length - 1, idx));
    this._renderList();
    if (play) this._enter();
  }

  _move(delta) {
    if (!this._items.length) return;
    this._index = (this._index + delta + this._items.length) % this._items.length;
    this._renderList();
    this._scrollTo();
  }

  _scrollTo() {
    const row = this.shadowRoot.querySelector(`.row[data-idx="${this._index}"]`);
    if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
  }

  _enter() {
    const item = this._items[this._index];
    if (!item) return;
    if (item.isDir) {
      this._massStack.push(item.navId);
      this._loadMass(item.navId);
      return;
    }
    this._play(item);
  }

  _back() {
    const isMass = SOURCES[this._source].key === "mass";
    if (isMass && this._title && this._title.indexOf("Music · ") === 0) {
      this._massQuery = "";
      const input = this.shadowRoot.querySelector('[data-role="search"]');
      if (input) input.value = "";
      this._massStack = [null];
      this._loadMass(null);
      return;
    }
    if (isMass && this._massStack.length > 1) {
      this._massStack.pop();
      this._loadMass(this._massStack[this._massStack.length - 1]);
    } else {
      this._setSource(0);
    }
  }

  // --- playback ------------------------------------------------------------

  _play(item) {
    if (!this._entity) {
      this._error = "No media_player selected.";
      this._renderStatus();
      return;
    }
    this._error = "";
    this._lastStation = item.title;
    this._playingId = item.media_id;

    if (SOURCES[this._source].key === "mass") {
      const data = { media_id: item.media_id };
      const mt = (item.media_type || "").toLowerCase();
      if (MASS_TYPES.includes(mt)) data.media_type = mt;
      this._hass.callService("music_assistant", "play_media", data, { entity_id: this._entity });
    } else {
      this._hass.callService(
        "media_player",
        "play_media",
        { media_content_id: item.media_id, media_content_type: "music" },
        { entity_id: this._entity }
      );
    }
    this._renderList();
    this._renderStatus();
  }

  _togglePlay() {
    if (!this._entity) return;
    this._hass.callService("media_player", "media_play_pause", {}, { entity_id: this._entity });
  }

  _stop() {
    if (!this._entity) return;
    this._hass.callService("media_player", "media_stop", {}, { entity_id: this._entity });
  }

  _mute() {
    const st = this._state(this._entity);
    const cur = !!(st && st.attributes && st.attributes.is_volume_muted);
    this._hass.callService(
      "media_player",
      "volume_mute",
      { is_volume_muted: !cur },
      { entity_id: this._entity }
    );
  }

  _vol(delta) {
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    let v = typeof a.volume_level === "number" ? a.volume_level : 0.3;
    v = Math.max(0, Math.min(1, v + delta));
    this._hass.callService(
      "media_player",
      "volume_set",
      { volume_level: Math.round(v * 100) / 100 },
      { entity_id: this._entity }
    );
  }

  _next(dir) {
    if (!this._items.length) return;
    const n = this._items.length;
    this._index = (this._index + dir + n) % n;
    this._renderList();
    this._scrollTo();
    this._enter();
  }

  // --- favourites ----------------------------------------------------------

  _loadFavs() {
    try {
      const raw = window.localStorage.getItem("cliamp-radio-favs");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  }

  _saveFavs() {
    try {
      window.localStorage.setItem("cliamp-radio-favs", JSON.stringify(Array.from(this._favs)));
    } catch (e) {
      /* ignore */
    }
  }

  _loadOut() {
    try {
      return window.localStorage.getItem("cliamp-radio-out") || "";
    } catch (e) {
      return "";
    }
  }

  _saveOut() {
    try {
      if (this._entity) {
        window.localStorage.setItem("cliamp-radio-out", this._entity);
        this._savedOut = this._entity;
      }
    } catch (e) {
      /* ignore */
    }
  }

  _toggleFav() {
    const item = this._items[this._index];
    if (!item || !item.favId) return;
    if (this._favs.has(item.favId)) this._favs.delete(item.favId);
    else this._favs.add(item.favId);
    this._saveFavs();
    this._renderList();
  }

  // --- input ---------------------------------------------------------------

  _onKey(ev) {
    // when focus is in the search input, it handles its own keys
    if (ev.target && ev.target.tagName === "INPUT") return;
    const k = ev.key;
    if (k === "ArrowDown" || k === "j") {
      ev.preventDefault();
      this._move(1);
    } else if (k === "ArrowUp" || k === "k") {
      ev.preventDefault();
      this._move(-1);
    } else if (k === "Enter") {
      ev.preventDefault();
      this._enter();
    } else if (k === " ") {
      ev.preventDefault();
      this._togglePlay();
    } else if (k === "ArrowRight" || k === "]") {
      ev.preventDefault();
      this._setSource(this._source + 1);
    } else if (k === "ArrowLeft" || k === "[") {
      ev.preventDefault();
      this._setSource(this._source - 1);
    } else if (k === "/") {
      ev.preventDefault();
      const wrap = this.shadowRoot.querySelector('[data-role="searchwrap"]');
      const input = this.shadowRoot.querySelector('[data-role="search"]');
      if (wrap && !wrap.hidden && input) {
        input.focus();
      } else {
        this._setSource(SOURCES.findIndex((s) => s.key === "search"));
        const si = this.shadowRoot.querySelector('[data-role="search"]');
        if (si) si.focus();
      }
    } else if (k === "n") {
      this._next(1);
    } else if (k === "p") {
      this._next(-1);
    } else if (k === "x") {
      this._stop();
    } else if (k === "f") {
      this._toggleFav();
    } else if (k === "Escape" || k === "Backspace") {
      ev.preventDefault();
      this._back();
    }
  }

  _onAction(act) {
    if (act === "src") this._setSource(this._source + 1);
    else if (act === "pp") this._togglePlay();
    else if (act === "stop") this._stop();
    else if (act === "next") this._next(1);
    else if (act === "prev") this._next(-1);
    else if (act === "fav") this._toggleFav();
    else if (act === "back") this._back();
  }

  // --- rendering -----------------------------------------------------------

  _render() {
    this._renderSrc();
    this._renderTabs();
    this._renderStatus();
    this._renderPick();
    this._renderList();
  }

  _isPick() {
    return SOURCES[this._source].key === "local" && this._config.stations !== "list";
  }

  _renderPick() {
    const row = this.shadowRoot.querySelector('[data-role="pickrow"]');
    const sel = this.shadowRoot.querySelector('[data-role="pick"]');
    const list = this.shadowRoot.querySelector('[data-role="list"]');
    const head = this.shadowRoot.querySelector(".plhead");
    const show = this._isPick();
    if (row) row.hidden = !show;
    if (list) list.hidden = show;
    if (head) head.hidden = show;
    if (!sel) return;
    sel.disabled = !this._entity;
    if (!show) return;
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    const cur = a.media_content_id || a.media_title || this._title || "";
    sel.innerHTML = this._items
      .map((it) => {
        const on = it.media_id === cur || it.title === cur || it.title === a.media_title;
        return `<option value="${esc(it.media_id)}"${on ? " selected" : ""}>${esc(it.title)}</option>`;
      })
      .join("");
  }

  _renderTabs() {
    const wrap = this.shadowRoot.querySelector('[data-role="tabs"]');
    if (wrap) {
      wrap.innerHTML = SOURCES.map(
        (s, i) =>
          `<button data-tab="${i}" class="${i === this._source ? "on" : ""}">` +
          `${esc(s.tabName || s.label)}</button>`
      ).join("");
    }
    const tag = this.shadowRoot.querySelector('[data-role="srtag"]');
    if (tag) tag.textContent = `[${SOURCES[this._source].label}]`;
  }

  _renderSrc() {
    const src = SOURCES[this._source];
    const el = this.shadowRoot.querySelector('[data-role="src"]');
    if (el) {
      el.innerHTML =
        `<span class="lbl">SRC</span> ` +
        `<span class="prov">[${esc(src.provider)}]</span> ` +
        `${this._source + 1}/${SOURCES.length} ` +
        `<span class="cur">[${esc(src.label)}]</span>`;
    }
  }

  _renderOut() {
    const sel = this.shadowRoot.querySelector('[data-role="out"]');
    if (!sel) return;
    const players = this._players();
    if (!this._entity || !this._state(this._entity)) {
      this._entity =
        this._savedOut && this._state(this._savedOut)
          ? this._savedOut
          : this._config.entity || this._firstPlayer();
    }
    const sig = this._entity + "|" + players.join(",");
    if (sig === this._outSig) return;
    this._outSig = sig;
    sel.innerHTML = players.length
      ? players
          .map(
            (e) =>
              `<option value="${esc(e)}"${e === this._entity ? " selected" : ""}>${esc(
                this._friendly(e)
              )}${this._isMass(e) ? " ·MA" : ""}</option>`
          )
          .join("")
      : `<option>no media_player</option>`;
  }

  _renderStatus() {
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    const s = (st && st.state) || "off";
    const playing = s === "playing";

    const np = this.shadowRoot.querySelector('[data-role="np"]');
    if (np) {
      const art = playing ? "♫" : "♪";
      const t = a.media_title || this._lastStation || (this._entity ? this._friendly(this._entity) : "—");
      const html = `<span class="art">${art}</span> ${esc(t)}`;
      if (this._npHTML !== html) {
        this._npHTML = html;
        np.innerHTML = html;
      }
    }

    const stEl = this.shadowRoot.querySelector('[data-role="state"]');
    if (stEl) {
      const label = playing ? "▶ Playing" : s === "paused" ? "▮▮ Paused" : "■ Stopped";
      stEl.textContent = label;
      stEl.classList.toggle("playing", playing);
    }

    const pp = this.shadowRoot.querySelector('[data-role="pp"]');
    if (pp) pp.textContent = playing ? "❚❚" : "▶";
    const mbtn = this.shadowRoot.querySelector('[data-role="mbtn"]');
    if (mbtn) mbtn.textContent = a.is_volume_muted ? "🔇" : "🔊";
    this._applyViz();
    const eqbars = this.shadowRoot.querySelector('[data-role="eqbars"]');
    if (eqbars) {
      const mode = this._config.eq_animate;
      const animate = mode === "always" || (mode !== "off" && playing);
      eqbars.classList.toggle("playing", animate);
    }

    this._renderPick();

    const eq = this.shadowRoot.querySelector('[data-role="eq"]');
    if (eq) {
      eq.innerHTML =
        `<span class="lbl">EQ</span> <span class="${playing ? "playing" : ""}"></span>`;
    }

    this._renderVol();
    this._applyLyrics();
  }

  _renderVol() {
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    const vol = typeof a.volume_level === "number" ? a.volume_level : 0;
    const segs = 40;
    const filled = Math.round(vol * segs);
    const bar = this.shadowRoot.querySelector('[data-role="volbar"]');
    if (bar) {
      bar.innerHTML =
        `<span class="on">${"█".repeat(filled)}</span><span class="off">${"░".repeat(
          Math.max(0, segs - filled)
        )}</span>`;
    }
    const db = this.shadowRoot.querySelector('[data-role="db"]');
    if (db) {
      const dbf = vol > 0 ? (20 * Math.log10(vol)).toFixed(0) : "-∞";
      const muted = a.is_volume_muted ? " (muted)" : "";
      db.textContent = `${dbf > 0 ? "+" : ""}${dbf}dB${muted}`;
    }
    const slide = this.shadowRoot.querySelector('[data-role="vol"]');
    if (slide && this.shadowRoot.activeElement !== slide) {
      slide.value = String(vol);
    }
  }

  _volSet(v) {
    if (!this._entity || typeof v !== "number" || Number.isNaN(v)) return;
    const val = Math.max(0, Math.min(1, v));
    this._hass.callService(
      "media_player",
      "volume_set",
      { volume_level: val },
      { entity_id: this._entity }
    );
    if (this._volTimer) clearTimeout(this._volTimer);
    this._volTimer = setTimeout(() => this._renderVol(), 500);
  }

  _renderPlayhead() {
    const now = this.shadowRoot.querySelector('[data-role="time"]');
    if (now) now.textContent = "00:00 / LIVE";
  }

  // --- synced lyrics (LRCLIB) ----------------------------------------------

  _isPlaying() {
    const st = this._state(this._entity);
    return !!(st && st.state === "playing");
  }

  _currentPos() {
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    const base = typeof a.media_position === "number" ? a.media_position : 0;
    if (this._isPlaying() && a.media_position_updated_at) {
      const upd = Date.parse(a.media_position_updated_at);
      if (!isNaN(upd)) return base + (Date.now() - upd) / 1000;
    }
    return base;
  }

  _applyLyrics() {
    const wrap = this.shadowRoot.querySelector('[data-role="lyrwrap"]');
    const on = this._config && this._config.lyrics === "on";
    if (wrap) wrap.hidden = !on;
    if (!on) {
      this._stopLyricTimer();
      this._lyrics = null;
      this._lyrKey = "";
      this._lyrSig = "";
      return;
    }
    const st = this._state(this._entity);
    const a = (st && st.attributes) || {};
    const key = [a.media_artist || "", a.media_title || "", a.media_album_name || ""].join("|");
    if (key !== this._lyrKey) {
      this._lyrKey = key;
      this._lyrics = null;
      this._lyrActive = -1;
      if (a.media_title) this._fetchLyrics(a, key);
      else this._renderLyrics();
    }
    if (this._isPlaying()) this._startLyricTimer();
    else this._stopLyricTimer();
    this._renderLyrics();
  }

  _fetchLyrics(a, key) {
    const artist = a.media_artist || "";
    const title = a.media_title || "";
    const album = a.media_album_name || "";
    let url =
      "https://lrclib.net/api/get?artist_name=" +
      encodeURIComponent(artist) +
      "&track_name=" +
      encodeURIComponent(title) +
      "&album_name=" +
      encodeURIComponent(album);
    if (a.media_duration) url += "&duration=" + encodeURIComponent(String(Math.round(a.media_duration)));
    const self = this;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        if (key !== self._lyrKey) return;
        self._setLyrics(d && (d.syncedLyrics || d.plainLyrics), d && !!d.syncedLyrics);
      })
      .catch(function () {
        if (key !== self._lyrKey) return;
        self._setLyrics(null, false);
      });
  }

  _parseLrc(text) {
    const lines = [];
    let hasSync = false;
    const parts = String(text || "").split("\n");
    const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    for (let i = 0; i < parts.length; i++) {
      const raw = parts[i];
      re.lastIndex = 0;
      let m;
      let last = 0;
      const stamps = [];
      while ((m = re.exec(raw)) !== null) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        let frac = 0;
        if (m[3]) frac = parseInt(m[3], 10) / Math.pow(10, m[3].length);
        stamps.push(min * 60 + sec + frac);
        last = re.lastIndex;
        hasSync = true;
      }
      const txt = raw.slice(last).trim();
      for (let j = 0; j < stamps.length; j++) lines.push({ t: stamps[j], text: txt });
    }
    lines.sort((x, y) => x.t - y.t);
    return { lines: lines, hasSync: hasSync };
  }

  _setLyrics(text, synced) {
    if (!text) {
      this._lyrics = { lines: [], synced: false, empty: true };
      this._lyrActive = -1;
      this._renderLyrics();
      return;
    }
    const parsed = this._parseLrc(text);
    if (synced && parsed.hasSync && parsed.lines.length) {
      this._lyrics = { lines: parsed.lines, synced: true };
    } else {
      const raw = String(text)
        .split("\n")
        .map((s) => s.replace(/\[[^\]]*\]/g, "").trim())
        .filter(Boolean);
      this._lyrics = { lines: raw.map((s) => ({ t: 0, text: s })), synced: false };
    }
    this._lyrActive = -1;
    this._renderLyrics();
  }

  _activeLine(pos) {
    if (!this._lyrics || !this._lyrics.synced) return -1;
    const L = this._lyrics.lines;
    let idx = -1;
    for (let i = 0; i < L.length; i++) {
      if (L[i].t <= pos + 0.15) idx = i;
      else break;
    }
    return idx;
  }

  _renderLyrics() {
    const wrap = this.shadowRoot.querySelector('[data-role="lyrwrap"]');
    const box = this.shadowRoot.querySelector('[data-role="lyrics"]');
    if (!wrap || !box) return;
    if (wrap.hidden) return;
    const L = this._lyrics;
    const sig = (L ? (L.synced ? "s" : "p") + L.lines.length : "none") + "|" + this._lyrKey;
    if (sig === this._lyrSig && box.childNodes.length) {
      this._tickLyrics();
      return;
    }
    this._lyrSig = sig;
    const src = this.shadowRoot.querySelector('[data-role="lyrsrc"]');
    let html;
    if (!L) {
      html = '<div class="lyrline">buscando letra…</div>';
    } else if (!L.lines.length) {
      html = '<div class="lyrline">sin letra para esta pista</div>';
    } else {
      const active = L.synced ? this._activeLine(this._currentPos()) : -1;
      this._lyrActive = active;
      html = L.lines
        .map(
          (ln, i) =>
            '<div class="lyrline' + (i === active ? " on" : "") + '" data-i="' + i + '">' +
            esc(ln.text || "♪") +
            "</div>"
        )
        .join("");
    }
    if (src) src.textContent = L && L.synced ? "LRCLIB · sync" : "LRCLIB";
    box.innerHTML = html;
    this._scrollLyric();
  }

  _scrollLyric() {
    const box = this.shadowRoot.querySelector('[data-role="lyrics"]');
    if (!box) return;
    const on = box.querySelector(".lyrline.on");
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "center" });
  }

  _tickLyrics() {
    if (!this._lyrics || !this._lyrics.synced) return;
    const box = this.shadowRoot.querySelector('[data-role="lyrics"]');
    if (!box) return;
    const active = this._activeLine(this._currentPos());
    if (active === this._lyrActive) return;
    this._lyrActive = active;
    const nodes = box.querySelectorAll(".lyrline");
    for (let i = 0; i < nodes.length; i++) nodes[i].classList.toggle("on", i === active);
    this._scrollLyric();
  }

  _startLyricTimer() {
    if (this._lyrTimer) return;
    this._lyrTimer = setInterval(() => this._tickLyrics(), 400);
  }

  _stopLyricTimer() {
    if (this._lyrTimer) {
      clearInterval(this._lyrTimer);
      this._lyrTimer = null;
    }
  }

  _renderList() {
    const list = this.shadowRoot.querySelector('[data-role="list"]');
    if (!list) return;
    const src = SOURCES[this._source];

    const head = this.shadowRoot.querySelector('[data-role="plhead"]');
    if (head) {
      const title = src.key === "local" ? "Playlist" : this._title || "Playlist";
      head.innerHTML = `▸─ ${esc(title)} ──`;
    }

    const count = this.shadowRoot.querySelector('[data-role="count"]');
    if (count) {
      const i = this._items.length ? this._index + 1 : 0;
      count.textContent = `[${i}/${this._items.length}]`;
    }
    const favcount = this.shadowRoot.querySelector('[data-role="favcount"]');
    if (favcount) favcount.textContent = `[♥ ${this._favs.size}]`;

    if (!this._items.length) {
      list.innerHTML = `<div class="hint">${
        this._loading ? "Loading…" : src.key === "search" ? "Type a query and press ↵" : "Empty"
      }</div>`;
    } else {
      list.innerHTML = this._items
        .map((it, i) => {
          const cur = i === this._index ? ">" : " ";
          const fav = it.favId && this._favs.has(it.favId) ? "♥︎" : " ";
          const playing = this._playingId && it.media_id === this._playingId;
          const cls = ["row", i === this._index ? "selected" : "", playing ? "playing" : ""]
            .filter(Boolean)
            .join(" ");
          const icon = it.isDir ? "▸ " : "";
          const sub = it.subtitle ? ` <span class="hint">· ${esc(it.subtitle)}</span>` : "";
          return (
            `<div class="${cls}" data-idx="${i}">` +
            `<span class="cur">${esc(cur)}</span>` +
            `<span class="num">${String(i + 1).padStart(2)}.</span>` +
            `<span class="fav" data-act="fav">${esc(fav)}</span> ` +
            `<span class="name">${esc(icon + it.title)}${sub}</span>` +
            `</div>`
          );
        })
        .join("");
    }
  }
}

/* ------------------------------------------------------------------------- */
/* Visual (GUI) editor                                                       */
/* ------------------------------------------------------------------------- */

const EDITOR_DEFAULTS = {
  entity: "",
  theme: "auto",
  palette: "omarchy",
  stations: "dropdown",
  visualizer: "bars",
  show_eq: true,
  eq_animate: "always",
  lyrics: "off",
  hide_keys: false,
  dense: false,
};

class CliampRadioCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = Object.assign({}, EDITOR_DEFAULTS);
    this._hass = null;
    this._sig = "";
  }

  setConfig(config) {
    this._config = Object.assign({}, EDITOR_DEFAULTS, config || {});
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._players().join(",");
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  _players() {
    if (!this._hass || !this._hass.states) return [];
    return Object.keys(this._hass.states)
      .filter((e) => e.startsWith("media_player."))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  _friendly(id) {
    const st = this._hass && this._hass.states ? this._hass.states[id] : null;
    return (st && st.attributes && st.attributes.friendly_name) || id;
  }

  _set(key, value) {
    const config = Object.assign({}, this._config);
    config[key] = value;
    this._config = config;
    const ev = new Event("config-changed", { bubbles: true, composed: true });
    ev.detail = { config: config };
    this.dispatchEvent(ev);
  }

  _sel(val, list) {
    return list
      .map((o) => `<option value="${o}"${o === val ? " selected" : ""}>${o}</option>`)
      .join("");
  }

  _render() {
    const c = this._config;
    const players = this._players();
    const playerOpts =
      `<option value=""${c.entity ? "" : " selected"}>Auto (el primero)</option>` +
      players
        .map(
          (e) =>
            `<option value="${esc(e)}"${e === c.entity ? " selected" : ""}>${esc(
              this._friendly(e)
            )}</option>`
        )
        .join("");
    this.shadowRoot.innerHTML = `
      <style>
        .form { display:flex; flex-direction:column; gap:12px; padding:4px 2px; }
        .field { display:flex; flex-direction:column; gap:4px; font-size:13px; }
        .field > span { color:var(--secondary-text-color,#888); }
        select {
          padding:8px; border-radius:6px; font:inherit;
          background:var(--card-background-color,#fff); color:var(--primary-text-color,#000);
          border:1px solid var(--divider-color,#ccc);
        }
        .chk { flex-direction:row; align-items:center; gap:8px; }
        .chk input { width:18px; height:18px; }
      </style>
      <div class="form">
        <label class="field"><span>Altavoz</span>
          <select data-k="entity">${playerOpts}</select>
        </label>
        <label class="field"><span>Tema (fondo negro/blanco · paleta omarchy)</span>
          <select data-k="theme">${this._sel(c.theme, ["auto", "dark", "light"])}</select>
        </label>
        <label class="field"><span>Paleta (temas tipo cliamp)</span>
          <select data-k="palette">${this._sel(c.palette, PALETTE_NAMES)}</select>
        </label>
        <label class="field"><span>Visualizer de espectro</span>
          <select data-k="visualizer">${this._sel(c.visualizer, VISUALIZERS)}</select>
        </label>
        <label class="field"><span>Emisoras de Omarchy</span>
          <select data-k="stations">${this._sel(c.stations, ["dropdown", "list"])}</select>
        </label>
        <label class="field"><span>Animación del EQ</span>
          <select data-k="eq_animate">${this._sel(c.eq_animate, ["always", "playing", "off"])}</select>
        </label>
        <label class="field"><span>Letras sincronizadas (LRCLIB)</span>
          <select data-k="lyrics">${this._sel(c.lyrics, ["off", "on"])}</select>
        </label>
        <label class="field chk"><input type="checkbox" data-k="show_eq" ${
          c.show_eq ? "checked" : ""
        }/><span>Mostrar visualizer/espectro</span></label>
        <label class="field chk"><input type="checkbox" data-k="hide_keys" ${
          c.hide_keys ? "checked" : ""
        }/><span>Ocultar leyenda de teclas</span></label>
        <label class="field chk"><input type="checkbox" data-k="dense" ${
          c.dense ? "checked" : ""
        }/><span>Formato compacto</span></label>
      </div>`;
    this.shadowRoot.querySelectorAll("[data-k]").forEach((el) => {
      el.addEventListener("change", () => {
        const k = el.getAttribute("data-k");
        this._set(k, el.type === "checkbox" ? el.checked : el.value);
      });
    });
  }
}

if (!customElements.get("cliamp-radio-card-editor")) {
  customElements.define("cliamp-radio-card-editor", CliampRadioCardEditor);
}

if (!customElements.get("cliamp-radio-card")) {
  customElements.define("cliamp-radio-card", CliampRadioCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "cliamp-radio-card",
  name: "Cliamp Radio Card",
  description: "A cliamp/Winamp-style radio player for Home Assistant",
  preview: true,
});
