# AGENTS.md — Cliamp Radio Card

Notas para trabajar en este repo (tarjeta Lovelace de HA con estética cliamp).
Home Assistant del usuario: `http://192.168.50.202:8123`.

## Qué es
- Una sola clase, un solo archivo: `dist/cliamp-radio-card.js` (custom element `cliamp-radio-card`).
- Estética cliamp/Winamp 2.x: `C L I A M P`, EQ/VOL, `SRC`, playlist numerada, pie de teclas.
  Paleta del tema Omarchy (NO añadir scanlines/glow):
  bg `#031222`, panel `#0a2540`, verde `#028391`, crema `#f6dcac`,
  amarillo `#e97b3c`, rojo `#f85525`, cian `#8cbfb8`, muted `#2a6b78`, accent `#faa968`.

## Estado actual (v0.3.0)
- Fuentes: Local (12 Omarchy), Search (radio-browser), Library (Music Assistant).
- Altavoz: fila `🔊 Altavoz` (jugadores MA marcados `·MA`).
- Pestañas de fuente táctiles + barra de transporte táctil (play/pausa, stop,
  prev/next, mute, deslizador de volumen).
- **EQ animado** de 10 barras (`.eqbars`), animación CSS `eqb`; por defecto
  `eq_animate: always` (opciones `playing`/`off`).
- **Tema claro/oscuro**: `theme:auto` sigue `hass.themes.darkMode` → fondo negro
  de noche (`#000`) o blanco de día (`#fff`); `dark`/`light` lo fuerzan.
- **Emisoras de Omarchy en desplegable** (`stations:dropdown`, por defecto) o
  lista (`stations:list`).
- **Editor visual** (`getConfigElement`): formulario en el editor del dashboard.
- **Adaptación al tamaño**: `dense`, `hide_keys` + auto por `ResizeObserver`;
  `getGridOptions()` para Sections view (6×6 por defecto, 3×3–12×12).
- Ficheros: `dist/cliamp-radio-card.js` (todo el código), `test/`, `README.md`,
  `hacs.json`, `info.md`, `AGENTS.md`.
- Versión actual en `CARD_VERSION`; últimas releases: v0.2.1, v0.2.2, v0.2.3, v0.3.0.

## Ideas / pendientes (por si se retoma)
- Botón "aleatorio"/shuffle real y repetir (hoy `[Shuffle]`/`[Repeat: Off]` son
  solo estéticos).
- Mostrar carátula/`entity_picture` del reproductor.
- Filtro de emisoras por país/género en `Search`.
- Recordar última emisora por altavoz.
- Página/release en HACS: añadir `image`/`homeassistant` mínimos en `hacs.json`.

## Cómo trabaja el usuario
- Usa el dashboard en PC, **Echo Show** y una **Fire Tablet** (navegadores con
  caché agresiva: recordar limpiar caché tras actualizar).
- Prefiere poder configurar "a su gusto" desde el editor visual y que se adapte a
  varias formas, con EQ animado visible.
- `Local`: las 12 emisoras de Omarchy → `https://radio.cliamp.stream/<slug>/stream`
  (slugs: lofi, synthwave, edm, omarchy, ncs, ncs-house, ncs-dubstep, ncs-dnb, ncs-trap, ncs-phonk, ncs-pop, ncs-chill).
- `Search`: `radio-browser.info` directo (CORS OK). Hosts: de1/de2/at1/nl1/fi1.api.radio-browser.info.
- `Library`: Music Assistant. Navegar con WS `media_player/browse_media`
  `{entity_id, media_content_id}`; reproducir con `music_assistant.play_media`
  `{media_id, media_type}` (tipos válidos: artist, album, audiobook, folder, playlist, podcast, track, radio).
  `music_assistant.search` NO sirve (requiere `config_entry_id`).

## Reglas de edición (IMPORTANTE)
- **No usar sintaxis JS moderna**: nada de optional chaining `?.`, nullish `??`,
  `replaceAll`, `.at()`, `structuredClone`, etc. Muchos clientes de HA son viejos
  (Silk del Echo Show, WebView de Fire Tablet) y romperían con un error de parseo.
  Mantener sintaxis tipo ES2017.
- Subir `CARD_VERSION` en cada cambio.
- Verificar antes de subir:
  - `node --check dist/cliamp-radio-card.js`
  - pruebas jsdom: `cd test && npm install && npm test` (test2 + featcheck +
    editorcheck + eqcheck). Antes vivían en `/tmp/opencode/card-test`; ahora en `test/`.
- `this._built` debe ponerse a `true` al final de `_init()`; si no, la tarjeta se
  reconstruye en cada actualización de estado y pierde el estado.
- La estética incluye un **EQ animado** (`.eqbars`, 10 barras, animación CSS
  `eqb` activada por la clase `.playing`) y **adaptación al tamaño** vía
  `ResizeObserver` en `_watchSize()`/`_applySize()` que aplica `.hide-keys`,
  `.tight`, `.roomy`. `getGridOptions()` define el tamaño en Sections view.
- **Config (`setConfig`)**: `entity`, `theme` (auto|dark|light), `stations`
  (dropdown|list, fuente Local), `eq_animate` (always|playing|off), `show_eq`,
  `hide_keys`, `dense`.
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
