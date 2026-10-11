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
```

Sin `entity`, autodetecta todos los `media_player`; elige el altavoz con el
desplegable de arriba a la derecha (los de Music Assistant aparecen marcados `·MA`).

## Uso

- **Clic** en una emisora/carpeta para reproducir o entrar.
- **Buscador**: `SRC [Radio] 1/3 [Search]` → escribe y pulsa Enter.
- **Teclado**: `↑↓` mover · `↵` reproducir · `Space` pausa · `/` buscar ·
  `←→` cambiar de fuente · `n`/`p` siguiente/anterior · `f` favorito ·
  `m` silenciar · `+`/`-` volumen · `x` parar · `Esc` atrás.

Los favoritos se guardan en el navegador (`localStorage`).

## Requisitos

- Home Assistant 2024.2+.
- Para la fuente **Library**, la integración **Music Assistant** y al menos un
  reproductor de MA. Las fuentes **Local** y **Search** funcionan con cualquier
  `media_player` (no necesitan la integración Radio Browser).

## Licencia

MIT.
