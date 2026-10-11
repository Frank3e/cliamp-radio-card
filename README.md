# Cliamp Radio Card

Una tarjeta de radio para Home Assistant con la estética retro de terminal de
[cliamp](https://github.com/bjarneo/cliamp)/Winamp: fondo CRT, verde fosforescente,
scanlines, ecualizador animado y navegación por teclado o ratón.

Las emisoras vienen de la integración **Radio Browser** de Home Assistant (el mismo
directorio que usa cliamp) y se reproducen en cualquier `media_player`
(altavoz de cada habitación).

## Requisitos

1. **Home Assistant** 2024.2 o superior.
2. La integración **Radio Browser** instalada:
   *Ajustes → Dispositivos y servicios → Añadir integración → Radio Browser*.
   (Es la fuente de las emisoras; la tarjeta la usa vía `media_source`.)
- Al menos un reproductor (`media_player.*`): Sonos, Chromecast, Google Home,
  Music Assistant, etc.

## Instalación con HACS

1. Sube esta carpeta a un repositorio de GitHub (por ejemplo `cliamp-radio-card`).
   El archivo de la tarjeta debe estar en `dist/cliamp-radio-card.js` (ya lo está).
2. En Home Assistant: **HACS → ⋮ → Custom repositories**.
   - URL: la URL de tu repositorio.
   - Category: **Dashboard`.
4. Busca "Cliamp Radio Card" en HACS y pulsa **Download**.
5. Recarga el navegador (Ctrl+Shift+R). HACS registra el recurso automáticamente.

### Instalación manual (sin HACS)

1. Copia `dist/cliamp-radio-card.js` a `config/www/` de tu Home Assistant.
2. Ajustes → Paneles → ... → **Recursos** → Añadir recurso:
   - URL: `/local/cliamp-radio-card.js`
   - Tipo: **Módulo JavaScript**.

## Configuración

Añade la tarjeta a cada panel de habitación. Como mínimo, indica el altavoz de esa
habitación con `entity`:

```yaml
type: custom:cliamp-radio-card
entity: media_player.salon
```

Si **no** indicas `entity`, la tarjeta autodetecta todos los `media_player` y usa el
primero; puedes cambiarlo con el desplegable de la cabecera.

### Opciones

| Opción          | Tipo    | Por defecto | Descripción                                                        |
| --------------- | ------- | ----------- | ------------------------------------------------------------------ |
| `entity`        | string  | auto        | `media_player` destino (el altavoz de la habitación).              |
| `default_view`  | string  | `popular`   | Vista inicial: `popular`, `local`, `category`, `language`.         |
| `show_spectrum` | boolean | `true`      | Muestra el ecualizador animado.                                    |

Ejemplo con varias opciones:

```yaml
type: custom:cliamp-radio-card
entity: media_player.cocina
default_view: local
show_spectrum: true
```

## Uso

- **Clic** en una emisora para reproducirla en el altavoz de la habitación.
- **▸** = carpeta (Popular, por categoría, por idioma, por país, locales…). Clic para
  entrar; **◀** o **⌫** para volver; **⌂** vuelve a Popular.
- **Buscar**: escribe en el campo de búsqueda y pulsa Enter (busca en Radio Browser).
- **Transporte**: ⏮ emisora anterior · ▶/⏸ play/pausa · ⏹ parar · ⏭ siguiente emisora · 🔇 mute · volumen.
- **Teclado**: `↑`/`↓` (o `j`/`k`) navegar · `Enter` reproducir · `Espacio` play/pausa ·
  `/` buscar · `n`/`p` siguiente/anterior · `x` parar · `m` mute · `⌫` atrás.

La reproducción usa `media_player.play_media` con
`media_content_id: media-source://radio_browser/<uuid>`, que Home Assistant resuelve
al stream real (y registra el "click" en el directorio Radio Browser).

## Requisitos de la integración Radio Browser

La tarjeta necesita que la integración **Radio Browser** esté instalada y cargada.
Si no lo está verás un aviso en la propia tarjeta indicando cómo instalarla.

## Problemas

- **"Radio Browser integration not found"** → instálala (Ajustes → Dispositivos y
  servicios → Añadir integración → Radio Browser) y recarga.
- **No suena pero la emisora se marca** → tu `media_player` no soporta ese stream
  (códec). Prueba otra emisora o revisa el reproductor.
- **Aparece "no media_player"** → no hay ningún `media_player` o pon `entity:`.

## Licencia

MIT.
