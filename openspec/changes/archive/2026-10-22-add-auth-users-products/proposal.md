# Proposal

## Why

QuickShop solo tiene el andamiaje (Dockerfiles, docker-compose, specs en `docs/specs-prds/`); no existe codigo de backend ni de frontend. Autenticacion, usuarios y productos son los tres primeros modulos del orden de desarrollo y la base de carrito y pedidos: sin sesion, roles y catalogo no se puede construir el resto.

## What Changes

- Backend FastAPI: base del proyecto (config, seguridad, deps, sesion de BD, Alembic, lifespan con migraciones y seed idempotente) y los modulos `auth`, `users` y `products` bajo `/api/v1`.
- Registro de clientes, login con JWT (HS256, 2 horas) en cookie `HttpOnly` y en el cuerpo, logout, `GET /auth/me`, dependencias `get_current_user` y `require_role`.
- Tabla `users` con perfil propio (`GET/PATCH /users/me`) y listado/detalle de usuarios solo para admin.
- Tabla `products` con catalogo paginado y filtrable, CRUD admin y borrado logico.
- Seed: 1 admin, 2 clientes (credenciales por variables `SEED_*`) y 20 productos desde `docs/products-images.json`.
- Frontend React: base (Vite, Tailwind con PostCSS inline, Router, cliente HTTP con `credentials: "include"`, `AuthContext`, `MainLayout`, `ProtectedRoute`, `AdminRoute`) y pantallas `/login`, `/register`, `/profile`, `/` (catalogo), `/products/:id`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`.
- Tests: pytest contra PostgreSQL por modulo, Vitest + Testing Library, y e2e Playwright contra la API real en docker-compose.
- **Cambio de contrato**: `GET /api/v1/products` pasa a ser publico (sin sesion); el detalle `GET /api/v1/products/{id}` sigue requiriendo sesion. Se actualiza `docs/specs-prds/productos.md` antes de implementar.

## Capabilities

### New Capabilities

- `authentication`: registro de clientes, login/logout, emision y verificacion de JWT en cookie HttpOnly, control de acceso por rol y flujo de sesion en el frontend.
- `user-management`: entidad usuario, seed de usuarios, perfil propio (consulta, edicion, cambio de password) y consulta de usuarios por el admin.
- `product-catalog`: catalogo paginado con busqueda, CRUD admin con borrado logico, seed de 20 productos y pantallas de catalogo, detalle y administracion.

### Modified Capabilities

(ninguna: `openspec/specs/` esta vacio)

## Impact

- Codigo nuevo en `backend/app/` (`core`, `db`, `modules/auth|users|products`), `backend/alembic/`, `backend/tests/`, `backend/pyproject.toml`.
- Codigo nuevo en `frontend/src/` (`api`, `context`, `components`, `layouts`, `routes`, `pages/auth|catalog|profile|admin`), `frontend/e2e/`, `package.json`, `vite.config.js`.
- Ajustes en `.env.example` si faltan variables y en el montaje de `docs/` del backend en docker-compose.
- Dependencias dentro de las permitidas por `AGENTS.md`: `bcrypt`, `email-validator>=2.1.0`, `pydantic-settings`, `psycopg`; sin `passlib`, sin librerias de UI o estado adicionales.
- Fuera de alcance: carrito, pedidos, refresh token, gestion de usuarios desde el frontend, detalle de producto publico.
