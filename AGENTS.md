# AGENTS.md — Cliamp Radio Card

Notas para trabajar en este repo (tarjeta Lovelace de HA con estética cliamp).
Home Assistant del usuario: `http://192.168.50.202:8123`.

## Qué es
- Una sola clase, un solo archivo: `dist/cliamp-radio-card.js` (custom element `cliamp-radio-card`).
- Estética cliamp/Winamp 2.x: `C L I A M P`, EQ/VOL, `SRC`, playlist numerada, pie de teclas.
  Paleta del tema Omarchy (NO añadir scanlines/glow):
  bg `#031222`, panel `#0a2540`, verde `#028391`, crema `#f6dcac`,
  amarillo `#e97b3c`, rojo `#f85525`, cian `#8cbfb8`, muted `#2a6b78`, accent `#faa968`.

## Estado actual (v0.5.0)
- Fuentes: Local (12 Omarchy), Search (radio-browser), Library (Music Assistant).
- **Library** navega con `media_player/browse_media` y **busca** con
  `media_player/search_media` (WS; requiere la integración Music Assistant de HA
  Core, que declara `SEARCH_MEDIA`). Query en mayúsculas: `result[]` con
  `media_class`, `media_content_id` (URI), `can_expand`, `can_play`.
- Altavoz: fila `🔊 Altavoz` (jugadores MA marcados `·MA`). El último altavoz
  elegido se guarda en `localStorage` (`cliamp-radio-out`) y se restaura al
  recargar (prioridad: guardado > `config.entity` > primer `media_player`).
  Al entrar en Library solo se autoselecciona un reproductor MA si no hay
  altavoz guardado.
- Pestañas de fuente táctiles + barra de transporte táctil (play/pausa, stop,
  prev/next, deslizador de volumen). El botón mute del transporte quedó **inerte**
  desde v0.3.1 (ver Pendientes).
- **Visualizer de espectro** de **32 barras** (`.eqbars`), estilos
  `bars|blocks|peak|mirror|dots|off` (`visualizer`); animación CSS `eqb`/`eqc`/`eqbm`
  con `--d`/`--dur` por barra; por defecto `eq_animate: always`.
- **Paletas** (`palette`): `omarchy` (sigue `theme` auto/dark/light) +
  `matte-black`, `catppuccin-mocha`, `catppuccin-latte`, `flexoki-light`,
  `ethereal`, `tokyo-night`, `nord`, `gruvbox-dark`. Se aplican como CSS vars
  inline en `.crt` (`_applyPalette`); las claras marcan `theme-light`.
- **Letras sincronizadas** (`lyrics: off|on`): panel `.lyrwrap`/`.lyrics`, busca
  en **LRCLIB** (`https://lrclib.net/api/get`, CORS `*`) por
  artist/title/album/duration; parsea LRC (`_parseLrc`), resalta la línea activa
  según `media_position`+`media_position_updated_at` y un `setInterval` de 400 ms
  (`_startLyricTimer`). Timers se limpian en `disconnectedCallback`.
- **Tema claro/oscuro**: `theme:auto` sigue `hass.themes.darkMode` → fondo negro
  de noche (`#000`) o blanco de día (`#fff`); `dark`/`light` lo fuerzan.
- **Emisoras de Omarchy en desplegable** (`stations:dropdown`, por defecto) o
  lista (`stations:list`).
- **Editor visual** (`getConfigElement`): formulario en el editor del dashboard.
- **Adaptación al tamaño**: `dense`, `hide_keys` + auto por `ResizeObserver`;
  `getGridOptions()` para Sections view (6×6 por defecto, 3×3–12×12).
- Ficheros: `dist/cliamp-radio-card.js` (todo el código), `test/`, `README.md`,
  `hacs.json`, `info.md`, `AGENTS.md`, `images/` (capturas + `preview.js`).
  Regenerar capturas: `cd test && npm run preview` (Chromium + ImageMagick).
- Versión actual en `CARD_VERSION`; últimas releases: v0.2.1, v0.2.2, v0.2.3, v0.3.0, v0.3.1, v0.4.0, v0.5.0.

## Dónde nos quedamos (última sesión → v0.5.0 publicada)
- Objetivo: acercar la tarjeta a la estética del **vídeo promocional de cliamp**
  (fuente: `github.com/user-attachments/assets/55e251f2-e13b-43d9-bb6a-7b1960e7d7d0`).
  El usuario pidió priorizar: **visualizer de espectro**, **temas/paleta** y
  **letras sincronizadas**.
- Cambios de esta sesión (todo en `dist/cliamp-radio-card.js`, `CARD_VERSION = "0.5.0"`):
  - **Visualizer**: `.eqbars` pasa de 10 a **32 barras** construidas en
    `_buildViz()` con `--d`/`--dur` deterministas (`rnd()`), cada barra con
    `<i class="cap">` + `<i class="fill">`. Estilos por `data-viz` (`_applyViz`):
    `bars` por defecto, `blocks` (gradiente segmentado), `peak` (cap que cae),
    `mirror` (centrado), `dots`, `off`. Colores por `--c` (nth-child odd/4n).
  - **Paletas**: `PALETTES`/`PALETTE_NAMES`/`PALETTE_VARS`; `_applyPalette()` en
    `_applyTheme()`. `omarchy` = sin vars inline (manda `.theme-dark/.theme-light`);
    el resto aplica vars inline. `_isDark()` usa `palette.light` si no es omarchy.
  - **Letras**: `lyrics` en config; `_applyLyrics()` (desde `_renderStatus`),
    `_fetchLyrics()`/`_parseLrc()`/`_setLyrics()`/`_renderLyrics()`/`_tickLyrics()`,
    `_currentPos()` (usa posición + `_isPlaying`), timer 400 ms. Panel `.lyrwrap`
    antes del separador de teclas. `LRCLIB` con CORS `*` (verificado).
  - **Editor**: nuevos `select` `palette`, `visualizer`, `lyrics` + `getStubConfig`
    y `EDITOR_DEFAULTS` actualizados.
  - **Fix `[hidden]`**: añadida `.crt [hidden] { display:none !important; }`; el
    `display:flex` de `.searchwrap`/`.outrow` pisaba `hidden`, así que el buscador
    se veía en `Local` y el desplegable "Emisora" en modo `list`.
  - Docs: `README.md` (tabla de opciones + sección Estética), `info.md`, este AGENTS.
  - Tests: nuevos `test/vizcheck.js` (11) y `test/lyrcheck.js` (7, mock de fetch
    LRCLIB) + `package.json` los ejecuta. Todo verde: test2 **30/30**, featcheck
    **12**, editorcheck **8**, vizcheck **11**, lyrcheck **7**.
  - **Capturas regeneradas** con Chromium headless: `test/preview.js` + `npm run
    preview` (requiere `chromium` y `magick`). Genera `images/preview.png`,
    `preview-light.png`, `preview-lyrics.png`, y los montajes `preview-themes.png`
    (9 paletas) y `preview-visualizers.png` (6 estilos). README muestra estas
    nuevas imágenes.
- **Publicado v0.5.0** el 2026-10-13. Commit `91566be` en `main`, tag `v0.5.0`,
  release: https://github.com/Frank3e/cliamp-radio-card/releases/tag/v0.5.0
  CI (Validate/HACS) en verde en los runs del push a `main` y del tag.
- En HA el usuario actualiza por **HACS → Cliamp Radio Card → Update / Redownload**.

## Dónde nos quedamos (sesión anterior → v0.4.0)
- **Publicado v0.4.0** el 2026-10-13. Commit `954a5b2` en `main`, tag `v0.4.0`,
  release: https://github.com/Frank3e/cliamp-radio-card/releases/tag/v0.4.0
  CI (HACS + validate) en verde en los runs del push y del tag.
- Cambios de esta sesión (todo en `dist/cliamp-radio-card.js`, `CARD_VERSION = "0.4.0"`):
  - **Búsqueda en Library (MA)**: caja de búsqueda visible en la fuente `mass`
    (placeholder "search your Music Assistant library"); `Enter` llama al WS
    `media_player/search_media`. Los resultados se mapean con `_massItem()` y se
    navegan/reproducen igual que `browse_media`. `Esc` desde resultados vuelve a
    la raíz (`_back()` detecta el título `Music · …`). Error amable si el backend
    no soporta `SEARCH_MEDIA`. Query propia en `this._massQuery` (separada de la
    de radio, `this._query`). `/` enfoca el buscador de la fuente actual.
  - **Último altavoz recordado**: `_loadOut()`/`_saveOut()` en `localStorage`
    clave `cliamp-radio-out`. Se guarda al cambiar el desplegable `[data-role=out]`;
    se restaura en `_init()` y en el fallback de `_renderOut()`. Prioridad:
    guardado > `config.entity` > primer `media_player`. La autoselección de
    reproductor MA al entrar en Library solo ocurre si `!this._savedOut`.
  - `_massItem()` sustituye el mapeo inline que había en `_loadMass()`; deriva
    `media_type` de `media_class` (o `media_content_type` como fallback) usando
    `MASS_TYPES`.
  - Docs: `README.md` (secciones Fuentes/Uso/Requisitos), `info.md`, este AGENTS.
  - Tests: `test/test2.js` con 4 checks nuevos de MA search + 2 de persistencia
    del altavoz → **30/30**. `featcheck` 12, `editorcheck` 8, `eqcheck` OK.
- **Antes (v0.3.1, ya en remoto)**: EQ más grande (`.eqbars` 34px; `tight` 22,
  `roomy` 40), quitados números de frecuencia del EQ, quitados botones mute/−/+
  de la fila `.volbtns`, ocultada la leyenda de teclas (`.keys` → `display:none`)
  y quitados los atajos `m`/`+`/`-`; capturas `images/preview*.png` regeneradas.
- **Cómo verificar esta versión**: con un reproductor de la integración Music
  Assistant **de HA Core**. Si el altavoz MA viene del componente viejo de HACS,
  la búsqueda mostrará el aviso (no es un bug de la tarjeta).

## Ideas / pendientes (por si se retoma)
- **Botón de mute del transporte**: en v0.3.1 se quitó la acción `mute` de
  `_onAction()` y el atajo `m`, pero el botón `[data-act="mute"]` (icono
  `mbtn`) sigue en la barra de transporte y ya NO hace nada. Decidir si
  reponerlo (volver a llamar a `_mute()`, que aún existe) o quitarlo del todo.
- Botón "aleatorio"/shuffle real y repetir (hoy `[Shuffle]`/`[Repeat: Off]` son
  solo estéticos).
- Mostrar carátula/`entity_picture` del reproductor.
- Filtro de emisoras por país/género en `Search`.
- Recordar última emisora por altavoz.
- Página/release en HACS: añadir `image`/`homeassistant` mínimos en `hacs.json`.
- **Más paletas**: cliamp trae ~22; hoy hay 9. Añadir el resto a `PALETTES`.
- **Visualizer dirigido por audio real**: hoy es CSS determinista; con streams
  remotos no hay Web Audio (CORS). Alternativa: leer un `sensor`/atributo de nivel
  si existe, o mantener el fake.
- **Letras**: control de offset manual, indicador "buscando…", y fallback a otra
  fuente si LRCLIB no tiene la pista.
- Barra de progreso con **scrubbing** cuando la pista tiene duración (hoy `LIVE`
  en radio; en Library podría arrastrarse).
- Selector de **color de acento** independiente de la paleta.

## Cómo trabaja el usuario
- Usa el dashboard en PC, **Echo Show** y una **Fire Tablet** (navegadores con
  caché agresiva: recordar limpiar caché tras actualizar).
- Prefiere poder configurar "a su gusto" desde el editor visual y que se adapte a
  varias formas, con EQ animado visible.
- `Local`: las 12 emisoras de Omarchy → `https://radio.cliamp.stream/<slug>/stream`
  (slugs: lofi, synthwave, edm, omarchy, ncs, ncs-house, ncs-dubstep, ncs-dnb, ncs-trap, ncs-phonk, ncs-pop, ncs-chill).
- `Search`: `radio-browser.info` directo (CORS OK). Hosts: de1/de2/at1/nl1/fi1.api.radio-browser.info.
- `Library`: Music Assistant. Navegar con WS `media_player/browse_media`
  `{entity_id, media_content_id}`; buscar con WS `media_player/search_media`
  `{entity_id, search_query}` → `{result:[...]}`. Reproducir con
  `music_assistant.play_media` `{media_id, media_type}` (tipos válidos: artist, album, audiobook, folder, playlist, podcast, track, radio).
  La búsqueda SOLO funciona con la integración de HA Core (`music_assistant`),
  no con el componente antiguo de HACS (domain `mass`) ni con
  `music_assistant.search` (ese requiere `config_entry_id`).

## Reglas de edición (IMPORTANTE)
- **No usar sintaxis JS moderna**: nada de optional chaining `?.`, nullish `??`,
  `replaceAll`, `.at()`, `structuredClone`, etc. Muchos clientes de HA son viejos
  (Silk del Echo Show, WebView de Fire Tablet) y romperían con un error de parseo.
  Mantener sintaxis tipo ES2017.
- Subir `CARD_VERSION` en cada cambio.
- Verificar antes de subir:
  - `node --check dist/cliamp-radio-card.js`
  - pruebas jsdom: `cd test && npm install && npm test` (test2 + featcheck +
    editorcheck + eqcheck + vizcheck + lyrcheck). Antes vivían en
    `/tmp/opencode/card-test`; ahora en `test/`.
- `this._built` debe ponerse a `true` al final de `_init()`; si no, la tarjeta se
  reconstruye en cada actualización de estado y pierde el estado.
- La estética incluye un **visualizer de espectro** (`.eqbars`, **32 barras**,
  estilos por `data-viz`, animación CSS `eqb`/`eqc`/`eqbm` activada por la clase
  `.playing`; `no-eq` lo oculta) y **adaptación al tamaño** vía `ResizeObserver`
  en `_watchSize()`/`_applySize()` que aplica `.hide-keys`, `.tight`, `.roomy`.
  `getGridOptions()` define el tamaño en Sections view.
- Regla CSS `.crt [hidden] { display:none !important; }`: necesaria porque
  `.searchwrap`/`.outrow` usan `display:flex`, que si no pisa el atributo `hidden`.
- **Config (`setConfig`)**: `entity`, `theme` (auto|dark|light), `palette`
  (omarchy|matte-black|catppuccin-mocha|catppuccin-latte|flexoki-light|ethereal|
  tokyo-night|nord|gruvbox-dark), `visualizer` (bars|blocks|peak|mirror|dots|off),
  `stations` (dropdown|list, fuente Local), `eq_animate` (always|playing|off),
  `show_eq`, `lyrics` (off|on), `hide_keys`, `dense`.
  El tema se resuelve en `_isDark()`/`_applyTheme()` (usa `hass.themes.darkMode`
  con `theme:auto`). Las emisoras de Omarchy en desplegable se pintan en
  `_renderPick()`; con `stations:list` se oculta el `select` y se ve la lista.
- **Editor visual**: `static getConfigElement()` devuelve `<cliamp-radio-card-editor>`
  (`CliampRadioCardEditor`), un formulario con `select`s/`checkbox` que emite
  `config-changed` (`{bubbles,composed}`). Registrada al final del archivo.
  `window.customCards` con `preview:true`.

## Publicar
- El remoto usa **HTTPS** (`https://github.com/Frank3e/cliamp-radio-card.git`) porque
  SSH no está disponible en la shell; `gh` ya autentica. No cambiar a SSH.
- Flujo:
  ```bash
  cd /home/fja/Work/cliamp-radio-card
  git add -A && git commit -m "vX.Y.Z: ..."
  git push origin main
  git tag vX.Y.Z && git push origin vX.Y.Z
  gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."
  ```
- En HA el usuario actualiza por **HACS → Cliamp Radio Card → Update / Redownload**.

## Problema conocido: "Custom element doesn't exist" (Echo Show / Fire Tablet)
- NO es un bug de la tarjeta: ese dispositivo no cargó/registró el módulo (caché agresiva
  o navegador viejo). En PC sí se ve.
- Solución (confirmada por el usuario):
  1. Comprobar en HA: Ajustes → Paneles → ⋮ → Recursos →
     `/hacsfiles/cliamp-radio-card/cliamp-radio-card.js?hacstag=...` (tipo Module).
  2. Abrir esa URL en el navegador del dispositivo; si muestra el JS, es caché.
  3. Borrar caché: app HA Fire Tablet → "Restablecer caché de la interfaz";
     Silk/Echo Show → borrar datos; Fully Kiosk → recargar/limpiar caché. Reiniciar.
  4. Si persiste, cargar el módulo globalmente en `configuration.yaml`:
     ```yaml
     frontend:
       extra_module_url:
         - /hacsfiles/cliamp-radio-card/cliamp-radio-card.js
     ```
