# Proposal

## Why

La interfaz actual usa utilidades Tailwind sueltas (indigo, gray) sin sistema de diseno. `frontend/DESIGN.md` define el lenguaje visual de QuickShop (paleta, tipografia, botones pill, tarjetas, navegacion). Aplicarlo ahora, antes de carrito y pedidos, evita reescribir esas pantallas despues.

## What Changes

- Tokens de diseno de `DESIGN.md` (colores, tipografia, radios, espaciado, sombras) como tema de Tailwind, con un modulo de tokens unico en `frontend/src/theme/`.
- Solo la pista clara/transaccional del diseno (canvas `#fbfbf5` y `#ffffff`, texto negro, acentos aloe y pistachio). La pista oscura cinematografica queda fuera de alcance (decision del usuario).
- Tipografia Inter Variable autoalojada con `@fontsource-variable/inter` (nueva dependencia acordada con el usuario), con `ss03` global; Inter con eje de tamano optico como sustituto abierto de Neue Haas Grotesk Display para titulares a peso 330.
- Restyling de componentes y pantallas existentes: `Button` (solo pill), `FormField`, `ProductCard`, `Pagination`, `StateMessage`, `MainLayout` (cabecera y pie), `AdminLayout`, y las paginas de auth, perfil, catalogo, detalle y administracion.
- Ajustes del diseno donde incumple la skill `accessible-ui` (contraste, foco), documentados en `design.md`.
- Sin cambios de comportamiento, rutas, contratos de API ni textos funcionales; las pruebas existentes siguen pasando.

## Capabilities

### New Capabilities

- `visual-design-system`: lenguaje visual de la interfaz (paleta, canvas, tipografia, formas, componentes base, responsive) y sus garantias de accesibilidad visual.

### Modified Capabilities

(ninguna: no cambia ningun requisito funcional de `authentication`, `user-management`, `product-catalog` ni `password-reset`)

## Impact

- Frontend: `vite.config.js` (tema Tailwind), `src/index.css`, `src/main.jsx` (import de la fuente), `index.html`, `src/theme/`, `src/components/*`, `src/layouts/*`, `src/pages/**`, `package.json`/`pnpm-lock.yaml` (+`@fontsource-variable/inter`).
- Tests: nuevos tests de tokens (contrastes) y de componentes; los tests existentes (31+5) y los 12 e2e deben seguir en verde.
- Docs: `frontend/AGENTS.md` apunta a `DESIGN.md` como fuente de verdad visual.
- Fuera de alcance: pista oscura, fotografia a sangre, paginas de marketing/precios, modo oscuro, carrito y pedidos (heredaran el sistema cuando se implementen).
