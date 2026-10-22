# Design

## Context

Frontend React 18 + Tailwind 3.4 con la configuracion de Tailwind inline en `vite.config.js` (no hay `postcss.config.js`, ni `tailwind.config.js`; regla vinculante del proyecto). Los estilos actuales son utilidades `indigo`/`gray`; `index.css` define solo un foco indigo. `index.html` fija `bg-gray-50`. Componentes base: `Button` (rectangular), `FormField`, `ProductCard`, `Pagination`, `StateMessage`, `MainLayout`, `AdminLayout`. Fuente visual: `frontend/DESIGN.md`. Requisitos en `specs/visual-design-system/spec.md`; accesibilidad segun la skill `accessible-ui`.

## Goals / Non-Goals

**Goals:** una unica fuente de tokens, componentes base que encarnen el diseno, y pantallas existentes migradas sin tocar comportamiento.

**Non-Goals:** pista oscura, marketing, modo oscuro, cambiar textos o rutas, nuevas librerias de UI.

## Decisions

1. **Tokens en `src/theme/tokens.js`**, importados por `vite.config.js` para alimentar `theme.extend` (colores, `borderRadius`, `fontSize` con lineHeight y letterSpacing, `boxShadow`, `fontFamily`). Una sola fuente permite un test de contraste en Vitest sobre los mismos valores que usa el CSS. Alternativa: variables CSS en `index.css`; descartada porque el test no podria leerlas sin parsear CSS.
2. **Nombres semanticos de color**: `canvas`, `surface`, `ink`, `hairline`, `muted` (shade-60), `subtle` (shade-50), `aloe`, `pistachio`, `pressed` (shade-70). No se definen los tokens de la pista oscura (no se usan).
3. **Fuente**: `@fontsource-variable/inter/opsz.css`, que incluye el eje de tamano optico, de modo que Inter a tamanos grandes actua como Inter Display, el sustituto abierto que cita el DESIGN. Peso 330 y 420/550 son validos al ser variable. `font-feature-settings: "ss03"` en `body`. Se verifica en la tarea correspondiente que el CSS emitido incluye el eje `opsz`; si no, se usa `@fontsource-variable/inter` estandar y se anota la limitacion.
4. **Conflictos del DESIGN con accesibilidad (se prioriza accesibilidad)**:
   - `shade-40` (`#a1a1aa`) como "texto terciario en claro" da 2.6:1 sobre blanco: no se usa para texto. Texto secundario minimo `shade-50` (`#71717a`, 4.8:1 sobre blanco; se comprueba sobre `#fbfbf5`).
   - El diseno no define foco: contorno negro de 2 px con offset 2 px (contraste maximo sobre crema, blanco, aloe y pistacho). Sustituye al foco indigo actual.
   - Borde de campos `#e4e4e7` (1.3:1) no cumple 3:1 para componentes: el borde de campo usa `shade-50` y el hairline queda para tarjetas y separadores no interactivos.
   - Peso 330 solo en titulares de 36 px o mas; por debajo, 400 a 500 (legibilidad en baja vision).
5. **Colores semanticos fuera del DESIGN**: el diseno no tiene color de error. Se mantiene un rojo oscuro (`#b91c1c`, 6.5:1 sobre blanco) para texto de error y para el boton destructivo (pill relleno rojo con texto blanco), siempre acompanado de texto. Es una extension minima y no un tercer canvas.
6. **Componentes**: `Button` con variantes `primary` (negro), `secondary` (blanco con borde negro), `aloe` y `danger`, todas pill y `min-h-[44px]`. Nuevos componentes pequenos: `Tag` (variantes `mint`, `shade`) para "Agotado", "Activo" e "Inactivo", y `Notice` (aloe/pistacho) para avisos de exito; `StateMessage` conserva sus roles.
7. **Sombras**: nivel 3 del diseno (pila de sombras suaves) en tarjetas de producto; nivel 4 reservado a futuros modales. Sin sombras en cabecera y campos.
8. **Titulos**: `display-md` (48 px, peso 330) escalado a 36 px en movil para los `h1` de catalogo y administracion; `heading-xl` (28 px, 500) para `h1` de formularios (login, registro, perfil, recuperacion), por ser pantallas de tarea y no hero.
9. **Cabecera**: blanca, con borde inferior hairline; logotipo izquierda, navegacion centro, sesion derecha (`secondary` para iniciar sesion y `primary` para registrarse). Se conserva el boton de menu en movil con `aria-expanded`.
10. **Paridad funcional**: no se cambian textos, roles ni nombres accesibles. El restyling se verifica con las suites existentes sin modificar aserciones y con las pruebas nuevas del tema.
11. **Verificacion visual**: capturas con Playwright (escritorio 1280 px y movil 375 px) de las pantallas principales en la tarea final, revisadas contra `DESIGN.md`; no se anaden pruebas de regresion visual para no introducir ruido.

## Risks / Trade-offs

- [Inter no es Neue Haas Grotesk] -> Sustituto abierto recomendado por el propio DESIGN; el peso 330 mantiene el caracter.
- [El peso 330 puede ser poco legible] -> Limitado a titulares grandes; el resto sube a 400 o mas.
- [Bordes de campo mas oscuros que el diseno original] -> Decision de accesibilidad documentada; los hairlines claros se conservan en tarjetas.
- [Dependencia nueva `@fontsource-variable/inter`] -> Acordada con el usuario; autoalojada, sin peticiones externas.
- [Restyling toca muchos archivos] -> Se hace por capas (tema, componentes base, layouts, paginas) con tests en cada paso.

## Open Questions

- Ninguna bloqueante. Supuestos: solo pista clara; el logotipo sigue siendo el texto "QuickShop" (no hay marca grafica); el rojo de error es una extension del diseno.
