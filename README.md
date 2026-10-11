# Cliamp Radio Card

Una tarjeta de radio para Home Assistant con el aspecto exacto de
[cliamp](https://github.com/bjarneo/cliamp), el reproductor de música de terminal
de Omarchy (inspirado en Winamp 2.x): fondo de terminal, tipografía monoespaciada,
`C L I A M P`, EQ/VOL, barra `SRC`, playlist numerada y pie de teclas.

Trae las **12 emisoras de Omarchy que vienen con cliamp**, un **buscador** de
cualquier emisora de `radio-browser.info`, y navegación de tu **biblioteca de
Music Assistant**. Reproduce en cualquier `media_player` (incluidos los de
Music Assistant).

## Fuentes (se cambian con ←/→ o clic en `SRC`)

| SRC                  | Qué muestra                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `[Radio] [Local]`    | Las 12 emisoras de Omarchy/cliamp (NCS, Lofi, Synthwave, Omarchy…). |
| `[Radio] [Search]`   | Buscador en `radio-browser.info` (cualquier emisora del mundo).     |
| `[MusicAssistant] [Library]` | Tu biblioteca de Music Assistant (radio, álbumes, artistas…).|

## Instalación con HACS

1. Sube el repo a GitHub (el JS está en `dist/cliamp-radio-card.js`).
2. **HACS → ⋮ → Custom repositories** → URL del repo, categoría **Dashboard** → Add.
3. Busca "Cliamp Radio Card" → **Download**.
4. Recarga el navegador (Ctrl+Shift+R). HACS registra el recurso solo.

### Manual

Copia `dist/cliamp-radio-card.js` a `config/www/` y añade el recurso
`/local/cliamp-radio-card.js` como **Módulo JavaScript**.

## Configuración

```yaml
type: custom:cliamp-radio-card
entity: media_player.salon   # opcional: altavoz por defecto

# Todas opcionales:
theme: auto        # auto (sigue día/noche de HA) | dark (negro) | light (blanco)
stations: dropdown # dropdown (menú desplegable de las 12 de Omarchy) | list
show_eq: true      # mostrar el ecualizador animado
hide_keys: false   # ocultar la leyenda de teclas
dense: false       # formato compacto (más pequeño)
```

Sin `entity`, autodetecta todos los `media_player`; elige el altavoz en la fila
**🔊 Altavoz** (los de Music Assistant aparecen marcados `·MA`).

### Opciones

| Opción       | Valores                | Por defecto | Qué hace                                              |
| ------------ | ---------------------- | ----------- | ----------------------------------------------------- |
| `entity`     | id de `media_player`   | autodetecta | Altavoz por defecto.                                   |
| `theme`      | `auto` / `dark` / `light` | `auto`   | Fondo **negro** de noche o **blanco** de día (sigue a HA). |
| `stations`   | `dropdown` / `list`    | `dropdown`  | Emisoras de Omarchy en un **menú desplegable** o como lista. |
| `show_eq`    | `true` / `false`       | `true`      | Muestra/oculta el ecualizador animado.                 |
| `hide_keys`  | `true` / `false`       | `false`     | Oculta la leyenda de atajos de teclado.                |
| `dense`      | `true` / `false`       | `false`     | Formato compacto (útil en huecos pequeños).            |

## Uso

- **Selector de altavoz**: fila **🔊 Altavoz** (indica dónde sonará).
- **Fuente**: pestañas **[Local] [Search] [Library]** (o `←`/`→`).
- **Clic/táctil**: toca una emisora/carpeta para reproducir o entrar.
- **Barra táctil**: `⏮` anterior · `▶/❚❚` reproducir/pausar · `⏹` parar ·
  `⏭` siguiente · `🔊/🔇` silenciar · **deslizador de volumen**.
- **Buscador**: pestaña **[Search]** → escribe y pulsa Enter.
- **Teclado**: `↑↓` mover · `↵` reproducir · `Space` pausa · `/` buscar ·
  `←→` fuente · `n`/`p` siguiente/anterior · `f` favorito · `m` silenciar ·
  `+`/`-` volumen · `x` parar · `Esc` atrás.

Los favoritos se guardan en el navegador (`localStorage`).

## Estética y tamaño

- **Tema claro/oscuro**: con `theme: auto` el fondo es **negro** de noche y
  **blanco** de día (sigue el modo día/noche de Home Assistant). Se puede forzar
  con `theme: dark` o `theme: light`.
- **Emisoras en desplegable**: con `stations: dropdown` (por defecto) las 12
  emisoras de Omarchy van en un menú desplegable más estilizado; con `list` se
  muestran como lista.
- **EQ animado**: barras que "bailan" cuando hay reproducción (planas al
  pausar/parar). Respeta `prefers-reduced-motion`; se oculta con `show_eq: false`.
- **Formas configurables**: `dense` (compacto) y `hide_keys` (sin pie de teclas)
  además de la adaptación automática al hueco.
- **Sections view**: `getGridOptions()` permite redimensionarla (por defecto 6 de
  12 columnas × 6 filas; mínimo 3×3, máximo 12×12). Ajusta el tamaño desde el
  editor del dashboard arrastrando las esquinas.

## Requisitos

- Home Assistant 2024.2+.
- Para la fuente **Library**, la integración **Music Assistant** y al menos un
  reproductor de MA. Las fuentes **Local** y **Search** funcionan con cualquier
  `media_player` (no necesitan la integración Radio Browser).

## Solución de problemas (Echo Show / Fire Tablet)

Si la tarjeta no aparece en esos dispositivos:

1. **Registra el recurso**: Ajustes → Paneles → ⋮ → Recursos →
   `/hacsfiles/cliamp-radio-card/cliamp-radio-card.js?hacstag=...` (tipo **Módulo**).
   (HACS suele añadirlo solo; si instalaste a mano, usa `/local/cliamp-radio-card.js`.)
2. **Abre esa URL en el navegador del propio dispositivo**. Si muestra el JS, el
   recurso sirve y el problema es **caché** de ese dispositivo.
3. **Borra la caché** (no basta `Ctrl+Shift+R`):
   - App HA en Fire Tablet → *Restablecer caché de la interfaz*.
   - Silk/Echo Show → borrar datos de navegación; Fully Kiosk → recargar/limpiar caché.
   - Reinicia el dispositivo.
4. Si persiste, carga el módulo globalmente en `configuration.yaml` y reinicia HA:
   ```yaml
   frontend:
     extra_module_url:
       - /hacsfiles/cliamp-radio-card/cliamp-radio-card.js
   ```
5. A partir de la v0.2.1, si hay un error de JavaScript, la tarjeta lo muestra en
   **rojo dentro de la tarjeta**; ese texto es la pista.

## Licencia

MIT.
