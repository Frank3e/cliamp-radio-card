# AGENTS.md — Cliamp Radio Card

Notas para trabajar en este repo (tarjeta Lovelace de HA con estética cliamp).
Home Assistant del usuario: `http://192.168.50.202:8123`.

## Qué es
- Una sola clase, un solo archivo: `dist/cliamp-radio-card.js` (custom element `cliamp-radio-card`).
- Estética cliamp/Winamp 2.x: `C L I A M P`, EQ/VOL, `SRC`, playlist numerada, pie de teclas.
  Paleta del tema Omarchy (NO añadir scanlines/glow):
  bg `#031222`, panel `#0a2540`, verde `#028391`, crema `#f6dcac`,
  amarillo `#e97b3c`, rojo `#f85525`, cian `#8cbfb8`, muted `#2a6b78`, accent `#faa968`.

## Fuentes
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
  - pruebas jsdom en `/tmp/opencode/card-test/test2.js` (25/25).
- `this._built` debe ponerse a `true` al final de `_init()`; si no, la tarjeta se
  reconstruye en cada actualización de estado y pierde el estado.
- La estética incluye un **EQ animado** (`.eqbars`, 10 barras, animación CSS
  `eqb` activada por la clase `.playing`) y **adaptación al tamaño** vía
  `ResizeObserver` en `_watchSize()`/`_applySize()` que aplica `.hide-keys`,
  `.tight`, `.roomy`. `getGridOptions()` define el tamaño en Sections view.
- **Config (`setConfig`)**: `entity`, `theme` (auto|dark|light), `stations`
  (dropdown|list, fuente Local), `show_eq`, `hide_keys`, `dense`.
  El tema se resuelve en `_isDark()`/`_applyTheme()` (usa `hass.themes.darkMode`
  con `theme:auto`). Las emisoras de Omarchy en desplegable se pintan en
  `_renderPick()`; con `stations:list` se oculta el `select` y se ve la lista.

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
