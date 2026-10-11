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

const CARD_VERSION = "0.2.0";

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

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const STYLE = `
:host { display:block; }
* { box-sizing:border-box; }
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
}
.screen { display:flex; flex-direction:column; gap:2px; min-height:0; }
.top { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.brand { color:var(--green); font-weight:700; letter-spacing:.28em; }
.out {
  background:transparent; color:var(--muted); border:0; font:inherit;
  text-align:right; max-width:55%; cursor:pointer; outline:none;
  -webkit-appearance:none; appearance:none; padding:0;
}
.out option { background:var(--panel); color:var(--cream); }
.out:hover { color:var(--cyan); }
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
.list { overflow:auto; min-height:140px; max-height:42vh; padding:2px 0; outline:none; }
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
    this._title = "Playlist";
    this._error = "";
    this._loading = false;
    this._lastStation = "";
    this._playingId = "";
    this._massStack = [];
    this._volBusy = false;
    this._favs = this._loadFavs();
  }

  static getStubConfig() {
    return { entity: "" };
  }

  setConfig(config) {
    this._config = Object.assign({ entity: "" }, config || {});
    if (this._hass) this._init();
  }

  getCardSize() {
    return 9;
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
    this._entity = this._config.entity || this._firstPlayer();
    this._source = 0;
    this._index = 0;
    this._buildSkeleton();
    this._attachEvents();
    this._renderOut();
    this._setSource(0);
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
            <select class="out" data-role="out" title="Playback target"></select>
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
          <div class="srcrow">
            <button class="src" data-role="src" data-act="src"></button>
            <span class="volbtns">
              <button data-act="voldn" title="Bajar volumen">−</button>
              <button data-act="volup" title="Subir volumen">+</button>
              <button data-act="mute" title="Silenciar">mute</button>
            </div>
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
          <div class="sep" data-role="sep2"></div>
          <div class="keys">
            <span><kbd>↑↓</kbd> <span class="txt">Move</span></span>
            <span><kbd>↵</kbd> <span class="txt">Play</span></span>
            <span><kbd>Space</kbd> <span class="txt">Pause</span></span>
            <span><kbd>/</kbd> <span class="txt">Search</span></span>
            <span><kbd>←→</kbd> <span class="txt">Source</span></span>
            <span><kbd>n/p</kbd> <span class="txt">Next/Prev</span></span>
            <span><kbd>f</kbd> <span class="txt">★/♥︎</span></span>
            <span><kbd>m</kbd> <span class="txt">Mute</span></span>
            <span><kbd>x</kbd> <span class="txt">Stop</span></span>
          </div>
          <div class="spd"><span class="lbl">SPD</span> <span class="val">[1x]</span></div>
        </div>
      </div>`;
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
      }
    });

    this.shadowRoot.addEventListener("change", (ev) => {
      if (ev.target.getAttribute("data-role") === "out") {
        this._entity = ev.target.value;
        this._renderStatus();
      }
    });

    const search = this.shadowRoot.querySelector('[data-role="search"]');
    search.addEventListener("input", () => {
      this._query = search.value;
    });
    search.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        this._runSearch();
        root.focus();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        this._setSource(0);
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
    searchwrap.hidden = src.key !== "search";

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
      if (masse.length && !this._isMass(this._entity)) this._entity = masse[0];
      if (!this._entity) {
        this._error = "No media_player available.";
        this._render();
      } else {
        this._massStack = [null];
        this._loadMass(null);
      }
    }
    this._renderSrc();
    this._renderOut();
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
      this._items = (res.children || []).map((c) => ({
        title: c.title,
        subtitle: (c.media_class || "").toString(),
        media_id: c.media_content_id,
        media_type: c.media_content_type || "music",
        isDir: !!c.can_expand,
        navId: c.media_content_id,
        thumb: c.thumbnail,
        favId: "mass:" + c.media_content_id,
      }));
      this._title = res.title || "Music Assistant";
      this._index = 0;
    } catch (err) {
      this._error = "Music Assistant browse failed: " + this._humanError(err);
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
      this._setSource(SOURCES.findIndex((s) => s.key === "search"));
      const input = this.shadowRoot.querySelector('[data-role="search"]');
      input.focus();
    } else if (k === "n") {
      this._next(1);
    } else if (k === "p") {
      this._next(-1);
    } else if (k === "x") {
      this._stop();
    } else if (k === "m") {
      this._mute();
    } else if (k === "f") {
      this._toggleFav();
    } else if (k === "+" || k === "=") {
      this._vol(0.05);
    } else if (k === "-" || k === "_") {
      this._vol(-0.05);
    } else if (k === "Escape" || k === "Backspace") {
      ev.preventDefault();
      this._back();
    }
  }

  _onAction(act) {
    if (act === "src") this._setSource(this._source + 1);
    else if (act === "voldn") this._vol(-0.05);
    else if (act === "volup") this._vol(0.05);
    else if (act === "mute") this._mute();
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
    this._renderStatus();
    this._renderList();
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
      this._entity = this._config.entity || this._firstPlayer();
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

    const eq = this.shadowRoot.querySelector('[data-role="eq"]');
    if (eq) {
      eq.innerHTML =
        `<span class="lbl">EQ</span> <span class="preset">[Custom]</span> ` +
        `<span class="${playing ? "playing" : ""}">70 180 320 600 1k 3k 6k 12k 14k 16k</span>`;
    }

    this._renderVol();
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
  }

  _renderPlayhead() {
    const now = this.shadowRoot.querySelector('[data-role="time"]');
    if (now) now.textContent = "00:00 / LIVE";
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

if (!customElements.get("cliamp-radio-card")) {
  customElements.define("cliamp-radio-card", CliampRadioCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "cliamp-radio-card",
  name: "Cliamp Radio Card",
  description: "A cliamp/Winamp-style radio player for Home Assistant",
  preview: false,
});
