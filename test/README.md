# Pruebas (jsdom)

Pruebas de la tarjeta `dist/cliamp-radio-card.js` ejecutadas en jsdom (sin navegador).

```bash
cd test
npm install      # instala jsdom
npm test         # test2 + featcheck + editorcheck + eqcheck
npm run snap     # imprime el layout de la tarjeta como texto
```

- `test2.js` — comportamiento base (25 checks): fuentes, búsqueda radio-browser,
  navegación de Music Assistant, reproducción, volumen, mute, favoritos, teclado.
- `featcheck.js` — desplegable de emisoras, tema auto/dark/light, `show_eq`,
  `dense`, `hide_keys` (12 checks).
- `editorcheck.js` — editor visual: `getConfigElement`, campos y `config-changed`.
- `eqcheck.js` — barras del EQ (10), clase `.playing`, `getGridOptions()`.
- `snap.js` — snapshot de texto del layout para comparar con cliamp.

Las pruebas cargan el archivo real vía `__dirname/../dist/cliamp-radio-card.js`.
