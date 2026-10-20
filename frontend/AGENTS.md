# Frontend QuickShop

SPA React. Contexto global en `../AGENTS.md`. Specs de cada modulo (seccion "Pantallas") en `../docs/specs-prds/`. Empezar solo cuando la API del modulo esta estable.

## Stack y herramientas

- React 18, Vite, Tailwind CSS, React Router (v6+). JavaScript con ES modules.
- Gestor: `pnpm`. Lockfile `pnpm-lock.yaml` versionado.
- Tests: Vitest + Testing Library para componentes; Playwright para e2e.

## IMPORTANTE: pnpm 11 y build scripts

En pnpm 11 las aprobaciones de build scripts se guardan en `pnpm-workspace.yaml` (clave `allowBuilds`), no en el lockfile; el Dockerfile debe copiarlo antes del install o fallara con `ERR_PNPM_IGNORED_BUILDS`.

Ejemplo de `Dockerfile` (fragmento):

```
FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
```

## Reglas tecnicas

- Sin PostCSS/Autoprefixer externos. Configurar PostCSS inline en `vite.config.js` solo con `tailwindcss()` (evita fallos de regex en Windows). No crear `postcss.config.js`.
- Node 22 (`node:22-alpine`); pnpm 11 requiere Node >= 22.13.
- `.dockerignore` obligatorio: `node_modules`, `dist`, `.env`, temporales (evita errores de symlinks en Windows).
- URL de la API por variable de entorno de Vite (`VITE_API_URL`), nunca hardcodeada.
- JWT: NO guardar en `localStorage` ni `sessionStorage`. La sesion va en cookie HttpOnly; todas las llamadas `fetch` usan `credentials: "include"`. La sesion se conoce con `GET /api/v1/auth/me`.
- Importes llegan como string decimal; formatear con `Intl.NumberFormat`, no operar con `float` para totales (los totales los calcula el backend).

## Estructura

```
frontend/
  package.json, pnpm-lock.yaml, pnpm-workspace.yaml
  vite.config.js
  index.html
  Dockerfile, .dockerignore
  src/
    main.jsx, App.jsx        Router y providers
    api/                     Cliente HTTP (client.js) y funciones por modulo
    context/                 AuthContext, CartContext
    components/              Componentes reutilizables (ProductCard, Button, ...)
    layouts/                 MainLayout (Header + <Outlet/>), AdminLayout
    routes/                  ProtectedRoute, AdminRoute
    pages/
      auth/      LoginPage, RegisterPage
      catalog/   CatalogPage, ProductDetailPage
      cart/      CartPage
      orders/    OrdersPage, OrderDetailPage
      profile/   ProfilePage
      admin/     AdminProductsPage, ProductFormPage, AdminOrdersPage, AdminOrderDetailPage
  e2e/                       Tests Playwright
```

## Layout y UI

- `MainLayout`: header comun (logo, navegacion, carrito con contador, usuario/salir) y area de contenido donde se renderiza cada pagina con `<Outlet/>`. Footer sencillo.
- Responsive mobile-first con utilidades Tailwind (`sm:`, `md:`, `lg:`). Header colapsa a menu en movil. Catalogo en rejilla 1/2/3/4 columnas segun ancho.
- El admin no ve carrito ni enlace a pedidos propios; ve el menu de administracion.
- Estados obligatorios en cada pantalla con datos: cargando, vacio, error.
- Producto con stock 0: tarjeta visible, boton deshabilitado y etiqueta "Agotado".
- Accesibilidad basica: etiquetas en formularios, foco visible, `alt` en imagenes.

## Convenciones

- Componentes funcionales con hooks; un componente por archivo, nombre en PascalCase.
- Estado de servidor en funciones de `src/api/`; contextos solo para sesion y carrito.
- Tras un 401 en cualquier llamada: limpiar sesion y redirigir a `/login`.
- Texto de interfaz en castellano; identificadores en ingles. Sin emojis.
- No anadir librerias de UI o estado sin acordarlo.

## Comandos

```
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm exec playwright test
```
