# Cliamp Radio Card

Tarjeta de radio retro (estilo cliamp/Winamp) para Home Assistant.

- Estética CRT: fondo oscuro, verde fosforescente, scanlines, ecualizador animado.
- Emisoras desde la integración **Radio Browser** de Home Assistant (Popular,
  por categoría, idioma, país, locales y búsqueda).
- Reproduce en cualquier `media_player` (el altavoz de cada habitación).
- Transporte completo: play/pausa, parar, anterior/siguiente emisora, volumen, mute.
- Navegación con ratón o teclado.
- Una tarjeta por habitación, con autodetección del altavoz.

```yaml
type: custom:cliamp-radio-card
entity: media_player.salon
```
