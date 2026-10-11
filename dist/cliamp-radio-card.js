/*
 * cliamp-radio-card — retro terminal radio for Home Assistant.
 * Stations: "Radio Browser" integration media source.
 * Playback target: any media_player (auto-detected, or set `entity:`).
 */

const CARD_VERSION = "0.1.0";
const RADIO_ROOT = "media-source://radio_browser";
const RADIO_VIEWS = {
  popular: "media-source://radio_browser/popular",
  local: "media-source://radio_browser/local",
  category: "media-source://radio_browser/tag",
  language: "media-source://radio_browser/language",
};

const VIEW_LABEL = {
  popular: "Popular",
  local: "Local stations",
  category: "By Category",
  language: "By Language",
};

console.info(
  `%c CLIAMP·RADIO %c v${CARD_VERSION} `,
  "color:#04110a;background:#37f59a;font-weight:700",
  "color:#37f59a;background:#04110a"
);

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLE = `
:host { display:block; }
.crt{
  position:relative;color:#bff5d7;font-size:13px;line-height:1.35;
  font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;
  background:radial-gradient(120% 140% at 50% 0%, #0b1a12 0%, #04110a 60%, #020906 100%);
  border:1px solid #1d5b3d;border-radius:10px;padding:10px 12px;
  box-shadow:inset 0 0 60px rgba(0,255,150,.06),0 0 0 1px rgba(0,255,150,.05);
  overflow:hidden;
}
.crt::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:multiply;
  background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) 2px,rgba(0,0,0,.18) 3px);}
:host(:focus){outline:none;}
:host(:focus-visible) .crt{border-color:#37f59a;}
.titlebar{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid rgba(55,245,154,.25);margin-bottom:8px;}
.logo{color:#37f59a;font-weight:700;letter-spacing:1px;text-shadow:0 0 6px rgba(55,245,154,.55);}
.spacer{flex:1;}
.src{background:#061a10;color:#bff5d7;border:1px solid #1d5b3d;border-radius:6px;padding:3px 6px;font:inherit;max-width:48%;}
.conn{color:#37f59a;}
.conn.off{color:#ff5b5b;}
.now{display:flex;gap:10px;padding:8px 10px;border:1px solid rgba(55,245,154,.22);border-radius:8px;background:rgba(0,255,150,.03);min-height:54px;align-items:center;}
.now .art{width:42px;height:42px;flex:0 0 42px;border:1px solid rgba(55,245,154,.3);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#37f59a;font-size:20px;background:#06180f;}
.now .meta{flex:1;min-width:0;}
.now .st{color:#37f59a;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.now .sub{opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.spectrum{display:flex;align-items:flex-end;gap:2px;height:34px;margin:8px 0;}
.spectrum i{flex:1;height:6%;background:linear-gradient(to top,#0f3d27,#37f59a);border-radius:2px;opacity:.85;}
.spectrum.playing i{animation:eq var(--d) ease-in-out infinite alternate;}
@keyframes eq{from{height:6%;}to{height:var(--h);}}
.navbar{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ctl{background:#061a10;color:#bff5d7;border:1px solid #1d5b3d;border-radius:6px;padding:3px 8px;font:inherit;cursor:pointer;}
.ctl:disabled{opacity:.35;cursor:default;}
.ctl:hover:not(:disabled){background:#0a2a19;}
.search{flex:1;background:#061a10;color:#bff5d7;border:1px solid #1d5b3d;border-radius:6px;padding:4px 8px;font:inherit;min-width:60px;}
.search::placeholder{color:rgba(191,245,215,.4);}
.crumb{opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34%;}
.list{outline:none;border:1px solid rgba(55,245,154,.22);border-radius:8px;overflow-y:auto;max-height:340px;}
.row{display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;white-space:nowrap;border-bottom:1px solid rgba(55,245,154,.06);}
.row:last-child{border-bottom:none;}
.row .glyph{color:#37f59a;width:14px;flex:0 0 14px;}
.row .name{flex:1;overflow:hidden;text-overflow:ellipsis;}
.row:hover{background:rgba(55,245,154,.08);}
.row.sel{background:rgba(55,245,154,.16);box-shadow:inset 3px 0 0 #37f59a;}
.row.dir .glyph{color:#ffc24b;}
.row.playing .name{color:#37f59a;font-weight:700;}
.status{min-height:16px;margin-top:8px;opacity:.75;white-space:pre-wrap;font-size:12px;}
.status .err{color:#ff8a8a;}
.status .load{color:#ffc24b;}
.controls{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap;}
.controls .btn{min-width:34px;text-align:center;}
.controls input[type=range]{flex:1;min-width:90px;accent-color:#37f59a;}
.hint{opacity:.4;font-size:11px;margin-top:6px;}
`;

class CliampRadioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._built = false;
    this._loading = false;
    this._error = "";
    this._items = [];
    this._index = 0;
    this._stack = [];
    this._currentId = "";
    this._title = "";
    this._playingId = "";
    this._entity = "";
    this._npSig = "";
    this._volBusy = false;
  }

  static getStubConfig() {
    return { entity: "", default_view: "popular" };
  }

  setConfig(config) {
    this._config = Object.assign(
      { entity: "", default_view: "popular", show_spectrum: true },
      config || {}
    );
    if (this._config.default_view && !RADIO_VIEWS[this._config.default_view]) {
      this._config.default_view = "popular";
    }
    if (this._hass) this._init();
  }

  getCardSize() {
    return 7;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      if (!this._config) return;
      this._init();
      return;
    }
    this._renderEntityOptions();
    this._renderNowPlaying();
  }

  // --- init / entities ---------------------------------------------------

  _init() {
    this._entity = this._config.entity || this._firstPlayer();
    this._buildSkeleton();
    this._attachEvents();
    this._renderEntityOptions();
    this._renderNowPlaying();
    const view = this._config.default_view;
    this._loadView(RADIO_VIEWS[view], VIEW_LABEL[view]);
  }

  _firstPlayer() {
    const players = this._players();
    return players.length ? players[0] : "";
  }

  _players() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter((e) => e.startsWith("media_player."))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  _friendly(entityId) {
    const st = this._hass && this._hass.states[entityId];
    return (st && st.attributes && st.attributes.friendly_name) || entityId;
  }

  _state(entityId) {
    return this._hass && this._hass.states[entityId];
  }

  _isMuted() {
    const st = this._state(this._entity);
    return !!(st && st.attributes && st.attributes.is_volume_muted);
  }

  // --- data --------------------------------------------------------------

  async _loadView(contentId, title) {
    this._loading = true;
    this._error = "";
    this._currentId = contentId;
    this._setSearchValue("");
    this._renderStatus();
    try {
      const res = await this._hass.callWS({
        type: "media_source/browse_media",
        media_content_id: contentId,
      });
      this._items = res.children || [];
      this._title = title || res.title || "Radio";
      this._index = 0;
    } catch (err) {
      this._error = this._humanError(err);
      this._items = [];
    }
    this._loading = false;
    this._renderList();
    this._renderStatus();
    this._renderNav();
  }

  async _search(query) {
    if (!query) {
      const view = this._config.default_view;
      this._stack = [];
      this._loadView(RADIO_VIEWS[view], VIEW_LABEL[view]);
      return;
    }
    this._loading = true;
    this._error = "";
    this._renderStatus();
    try {
      const res = await this._hass.callWS({
        type: "media_source/search_media",
        media_content_id: RADIO_ROOT,
        search_query: query,
        media_filter_classes: ["music"],
      });
      const result = res.result;
      this._items = Array.isArray(result) ? result : (result && result.children) || [];
      this._title = "Search: " + query;
      this._stack = [];
      this._currentId = RADIO_ROOT;
      this._index = 0;
    } catch (err) {
      this._error = this._humanError(err);
      this._items = [];
    }
    this._loading = false;
    this._renderList();
    this._renderStatus();
    this._renderNav();
  }

  _humanError(err) {
    const msg = (err && (err.message || err.error || err.code)) || String(err);
    if (/unknown_media_source/i.test(msg)) {
      return "Radio Browser integration not found.\nSettings → Devices & Services → Add Integration → Radio Browser.";
    }
    if (/config_entry_not_ready/i.test(msg)) {
      return "Radio Browser is starting up. Try again shortly.";
    }
    return msg;
  }

  // --- skeleton / events -------------------------------------------------

  _buildSkeleton() {
    const bars = [];
    for (let i = 0; i < 32; i++) {
      const h = 12 + Math.round(Math.random() * 88);
      const d = (0.4 + Math.random() * 0.9).toFixed(2);
      bars.push(`<i style="--h:${h}%;--d:${d}s"></i>`);
    }
    const spectrum =
      this._config.show_spectrum !== false
        ? `<div class="spectrum" data-role="spectrum">${bars.join("")}</div>`
        : "";

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="crt">
        <div class="titlebar">
          <span class="logo">♪ CLIAMP·RADIO</span>
          <span class="spacer"></span>
          <select class="src" data-role="src"></select>
          <span class="conn" data-role="conn">●</span>
        </div>
        <div class="now" data-role="now"></div>
        ${spectrum}
        <div class="navbar">
          <button class="ctl" data-action="back" title="Back (Backspace)">◀</button>
          <button class="ctl" data-action="home" title="Popular">⌂</button>
          <input class="search" type="search" placeholder="search station…  (press /)" autocomplete="off" />
          <span class="crumb" data-role="crumb"></span>
        </div>
        <div class="list" data-role="list"></div>
        <div class="controls">
          <button class="ctl btn" data-action="prev" title="Previous station (p)">⏮</button>
          <button class="ctl btn" data-action="pp" title="Play/Pause (Space)">▶</button>
          <button class="ctl btn" data-action="stop" title="Stop (x)">⏹</button>
          <button class="ctl btn" data-action="next" title="Next station (n)">⏭</button>
          <button class="ctl btn" data-action="mute" title="Mute (m)">🔇</button>
          <input type="range" min="0" max="1" step="0.01" data-role="vol" title="Volume" />
        </div>
        <div class="status" data-role="status"></div>
        <div class="hint">↑↓ navegar · Enter reproducir · Espacio play/pausa · / buscar · ⌫ atrás</div>
      </div>
    `;
    this._built = true;
  }

  _attachEvents() {
    this.setAttribute("tabindex", "0");
    this.addEventListener("keydown", (ev) => this._onKey(ev));

    this.shadowRoot.addEventListener("click", (ev) => {
      const actionEl = ev.target.closest("[data-action]");
      if (actionEl) {
        this._onAction(actionEl.getAttribute("data-action"));
        return;
      }
      const row = ev.target.closest(".row");
      if (row && row.dataset.index != null) {
        const item = this._items[Number(row.dataset.index)];
        if (item) this._enter(item);
      }
    });

    this.shadowRoot.addEventListener("change", (ev) => {
      if (ev.target.getAttribute("data-role") === "src") {
        this._entity = ev.target.value;
        this._npSig = "";
        this._renderNowPlaying();
      }
    });

    const vol = this.shadowRoot.querySelector('[data-role="vol"]');
    vol.addEventListener("input", () => {
      this._volBusy = true;
    });
    vol.addEventListener("change", () => {
      this._volBusy = false;
      this._callService("volume_set", { volume_level: Number(vol.value) });
    });

    const search = this.shadowRoot.querySelector(".search");
    search.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const q = search.value.trim();
        search.blur();
        this._search(q);
      } else if (ev.key === "Escape") {
        search.value = "";
        search.blur();
      }
    });
  }

  _onAction(action) {
    switch (action) {
      case "back":
        this._back();
        break;
      case "home": {
        const view = this._config.default_view;
        this._stack = [];
        this._loadView(RADIO_VIEWS[view], VIEW_LABEL[view]);
        break;
      }
      case "prev":
        this._skipStation(-1);
        break;
      case "next":
        this._skipStation(1);
        break;
      case "pp":
        this._callService("media_play_pause", {});
        break;
      case "stop":
        this._callService("media_stop", {});
        break;
      case "mute":
        this._callService("volume_mute", { is_volume_muted: !this._isMuted() });
        break;
    }
  }

  _onKey(ev) {
    const tag = ev.target && ev.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    switch (ev.key) {
      case "ArrowDown":
      case "j":
        ev.preventDefault();
        this._move(1);
        break;
      case "ArrowUp":
      case "k":
        ev.preventDefault();
        this._move(-1);
        break;
      case "Enter":
        ev.preventDefault();
        if (this._items[this._index]) this._enter(this._items[this._index]);
        break;
      case " ":
        ev.preventDefault();
        this._callService("media_play_pause", {});
        break;
      case "x":
        this._callService("media_stop", {});
        break;
      case "m":
        this._callService("volume_mute", { is_volume_muted: !this._isMuted() });
        break;
      case "n":
        this._skipStation(1);
        break;
      case "p":
        this._skipStation(-1);
        break;
      case "Backspace":
        ev.preventDefault();
        this._back();
        break;
      case "/":
        ev.preventDefault();
        this.shadowRoot.querySelector(".search").focus();
        break;
    }
  }

  // --- actions -----------------------------------------------------------

  _enter(item) {
    if (item.can_expand) {
      this._stack.push({ id: this._currentId, title: this._title });
      this._loadView(item.media_content_id, item.title);
    } else if (item.can_play) {
      this._play(item);
    }
  }

  _back() {
    const prev = this._stack.pop();
    if (prev) this._loadView(prev.id, prev.title);
    else {
      const view = this._config.default_view;
      this._loadView(RADIO_VIEWS[view], VIEW_LABEL[view]);
    }
  }

  _play(item) {
    if (!this._entity) {
      this._error = "No media_player found. Set `entity:` in the card config.";
      this._renderStatus();
      return;
    }
    this._playingId = item.media_content_id;
    this._callService("play_media", {
      media_content_id: item.media_content_id,
      media_content_type: item.media_content_type || "music",
    });
    this._renderList();
  }

  _skipStation(dir) {
    if (!this._items.length) return;
    let i = this._index;
    for (let step = 0; step < this._items.length; step++) {
      i = (i + dir + this._items.length) % this._items.length;
      if (this._items[i].can_play) {
        this._index = i;
        this._renderList();
        this._play(this._items[i]);
        return;
      }
    }
  }

  _move(delta) {
    if (!this._items.length) return;
    this._index = Math.max(0, Math.min(this._items.length - 1, this._index + delta));
    this._renderList();
    const row = this.shadowRoot.querySelector(".row.sel");
    if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
  }

  _callService(service, data) {
    if (!this._entity) {
      this._error = "No media_player found. Set `entity:` in the card config.";
      this._renderStatus();
      return;
    }
    const payload = Object.assign({ entity_id: this._entity }, data);
    return this._hass.callService("media_player", service, payload);
  }

  // --- render ------------------------------------------------------------

  _renderEntityOptions() {
    const sel = this.shadowRoot.querySelector('[data-role="src"]');
    if (!sel) return;
    const players = this._players();
    if (!this._entity || !this._hass.states[this._entity]) {
      this._entity = this._config.entity || this._firstPlayer();
    }
    const sig = this._entity + "|" + players.join(",");
    if (sig === this._srcSig) return;
    this._srcSig = sig;
    const html = players
      .map(
        (e) =>
          `<option value="${esc(e)}"${e === this._entity ? " selected" : ""}>${esc(this._friendly(e))}</option>`
      )
      .join("");
    sel.innerHTML = html || `<option>no media_player</option>`;
  }

  _setSearchValue(v) {
    const s = this.shadowRoot.querySelector(".search");
    if (s) s.value = v;
  }

  _renderNav() {
    const back = this.shadowRoot.querySelector('[data-action="back"]');
    if (back) back.disabled = this._stack.length === 0;
    const crumb = this.shadowRoot.querySelector('[data-role="crumb"]');
    if (crumb) crumb.textContent = this._title || "";
  }

  _renderList() {
    const el = this.shadowRoot.querySelector('[data-role="list"]');
    if (!el) return;
    if (!this._items.length) {
      el.innerHTML = `<div class="row"><span class="glyph">·</span><span class="name">(nothing here)</span></div>`;
      return;
    }
    el.innerHTML = this._items
      .map((item, i) => {
        const dir = !!item.can_expand;
        const playing = !dir && item.media_content_id === this._playingId;
        const glyph = dir ? "▸" : playing ? "▶" : "♫";
        const cls = ["row"];
        if (i === this._index) cls.push("sel");
        if (dir) cls.push("dir");
        if (playing) cls.push("playing");
        return `<div class="${cls.join(" ")}" data-index="${i}">
          <span class="glyph">${glyph}</span>
          <span class="name">${esc(item.title || "?")}</span>
        </div>`;
      })
      .join("");
  }

  _renderStatus() {
    const el = this.shadowRoot.querySelector('[data-role="status"]');
    if (!el) return;
    if (this._error) {
      el.innerHTML = `<span class="err">${esc(this._error)}</span>`;
      return;
    }
    if (this._loading) {
      el.innerHTML = `<span class="load">▚ loading…</span>`;
      return;
    }
    el.innerHTML = `<span>${this._items.length} items</span>`;
  }

  _renderNowPlaying() {
    const now = this.shadowRoot.querySelector('[data-role="now"]');
    if (!now) return;

    const st = this._state(this._entity);
    const pp = this.shadowRoot.querySelector('[data-action="pp"]');
    const spectrum = this.shadowRoot.querySelector('[data-role="spectrum"]');
    const conn = this.shadowRoot.querySelector('[data-role="conn"]');

    if (conn) conn.classList.toggle("off", !this._hass);
    if (!st) {
      now.innerHTML = `<div class="art">♪</div><div class="meta"><div class="st">No player</div><div class="sub">select a media_player</div></div>`;
      if (pp) pp.textContent = "▶";
      if (spectrum) spectrum.classList.remove("playing");
      return;
    }

    const a = st.attributes || {};
    const title = a.media_title || this._friendly(this._entity);

    const sig = [this._entity, st.state, a.media_title, a.media_artist, a.volume_level, this._isMuted()].join("|");
    if (sig !== this._npSig) {
      this._npSig = sig;
      now.innerHTML = `
        <div class="art">${st.state === "playing" ? "♫" : "♪"}</div>
        <div class="meta">
          <div class="st">${esc(title)}</div>
          <div class="sub">${esc(this._friendly(this._entity))} · ${esc(st.state)}${this._volText(st)}</div>
        </div>`;
    }

    if (pp) pp.textContent = st.state === "playing" ? "⏸" : "▶";
    if (spectrum) spectrum.classList.toggle("playing", st.state === "playing");

    const vol = this.shadowRoot.querySelector('[data-role="vol"]');
    if (vol && !this._volBusy && st.attributes && typeof st.attributes.volume_level === "number") {
      vol.value = String(st.attributes.volume_level);
    }
  }

  _volText(st) {
    const a = st.attributes || {};
    if (typeof a.volume_level === "number") {
      const pct = Math.round(a.volume_level * 100);
      return a.is_volume_muted ? ` · vol ${pct}% (muted)` : ` · vol ${pct}%`;
    }
    return "";
  }
}

customElements.define("cliamp-radio-card", CliampRadioCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "cliamp-radio-card",
  name: "Cliamp Radio Card",
  description: "Retro terminal radio player (Radio Browser) for any media_player.",
  preview: false,
});
