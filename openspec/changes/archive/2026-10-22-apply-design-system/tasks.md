# Tasks

## 1. Tema, tokens y tipografia

- [x] 1.1 Anadir `@fontsource-variable/inter` e importar su CSS con eje `opsz` en `src/main.jsx`; verificar con `pnpm install --frozen-lockfile`, `pnpm build` y que el CSS generado en `dist/` contiene `@font-face` de Inter y ningun enlace externo de fuentes
- [x] 1.2 Crear `src/theme/tokens.js` (colores semanticos, radios, escala tipografica con peso/interlineado/tracking, sombras, espaciado) y cargarlo en `theme.extend` de `vite.config.js`; actualizar `index.css` (fondo `canvas`, `ss03` global, foco negro de 2 px con offset, `prefers-reduced-motion`) e `index.html`; verificar con `pnpm build` y que no existe `postcss.config.js`
- [x] 1.3 Test de Vitest `src/theme/tokens.test.js` que calcule el contraste de cada pareja texto/fondo y de los bordes de componentes definidas en los tokens (minimo 4.5:1 y 3:1) y falle si se usa `#a1a1aa` para texto; verificar con `pnpm test`

## 2. Componentes base

- [x] 2.1 Reescribir `Button` (variantes `primary`, `secondary`, `aloe`, `danger`; pill, `min-h` 44 px, estado pulsado y deshabilitado visible) y crear `Tag` y `Notice`; verificar con tests de Vitest de variantes, estado deshabilitado (`toBeDisabled`) y roles
- [x] 2.2 Restilar `FormField` (borde de campo con contraste 3:1, radio 8 px, altura 44 px, error con texto y borde distinto), `StateMessage` y `Pagination`; verificar con los tests existentes sin cambiar aserciones y un test nuevo de `aria-invalid`/`aria-describedby`
- [x] 2.3 Restilar `ProductCard` (tarjeta blanca, radio 12 px, sombra nivel 3, `Tag` "Agotado", precio y stock); verificar con los tests de catalogo existentes y uno nuevo de la etiqueta "Agotado" como texto

## 3. Layouts y pantallas

- [x] 3.1 Restilar `MainLayout` (cabecera blanca con logotipo, navegacion y pills de sesion; menu movil con teclado; pie) y `AdminLayout`; verificar con tests de Vitest de la cabecera con y sin sesion y del menu movil
- [x] 3.2 Aplicar el diseno a las pantallas de auth (login, registro, olvido y restablecimiento de password) y perfil: titulos `heading-xl`, tarjeta de formulario, avisos con `Notice`; verificar con las suites existentes de auth y perfil en verde
- [x] 3.3 Aplicar el diseno a catalogo, detalle y administracion de productos (titulos `display-md`, rejilla 1/2/3/4, tabla con `Tag` activo/inactivo y pills de accion, formulario de producto); verificar con las suites existentes de catalogo y admin en verde

## 4. Verificacion y documentacion

- [x] 4.1 Ejecutar `docker compose down -v && up --build`, `pnpm test`, `pnpm build` y la suite e2e completa (12 tests) sin cambiar sus aserciones de comportamiento; todo en verde
- [x] 4.2 Tomar capturas con Playwright a 1280 px y 375 px de login, registro, catalogo, detalle, perfil y administracion, comprobar sin scroll horizontal a 320 px y revisarlas contra `DESIGN.md`; verificar adjuntando la lista de capturas y las discrepancias aceptadas
- [x] 4.3 Actualizar `frontend/AGENTS.md` (DESIGN.md como fuente visual, tokens en `src/theme/tokens.js`, solo pista clara) y la seccion de UI; verificar leyendo el archivo y que `pnpm test` sigue en verde

## Workflow follow-up

- Archivar el cambio (`/opsx:archive`) tras la revision.
- Carrito y pedidos deben construirse con estos componentes y la skill `accessible-ui`.
