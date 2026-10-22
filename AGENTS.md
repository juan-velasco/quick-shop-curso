# QuickShop

Mini plataforma de e-commerce. Objetivo: aplicacion moderna, funcional y estable.

Instrucciones especificas: `backend/AGENTS.md` y `frontend/AGENTS.md`. Leerlas al trabajar en cada parte.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router. Gestor: pnpm.
- Backend: Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic. Gestor: uv.
- Base de datos: PostgreSQL 15.
- Despliegue: Docker + docker-compose.

## Modulos

Exactamente cinco: autenticacion, usuarios, productos, carrito, pedidos.

Especificaciones (fuente de verdad, leer antes de implementar):

- `docs/specs-prds/autenticacion.md`
- `docs/specs-prds/usuarios.md`
- `docs/specs-prds/productos.md`
- `docs/specs-prds/carrito.md`
- `docs/specs-prds/pedidos.md`

Datos del seed de productos: `docs/products-images.json`.

## Orden de desarrollo

Backend y frontend se desarrollan en paralelo, modulo a modulo.

1. Orden de modulos: autenticacion, usuarios, productos, carrito, pedidos. Cada modulo se cierra completo (backend y frontend, con tests) antes de pasar al siguiente.
2. Dentro de cada modulo, backend y frontend avanzan a la vez, en paralelo (por ejemplo con subagentes o worktrees separados, uno por parte).
3. El contrato entre ambos es la spec del modulo (`docs/specs-prds/<modulo>.md`): endpoints, request, response y codigos de error. Ninguna parte cambia el contrato por su cuenta; si hace falta cambiarlo, se actualiza la spec primero y se avisa a la otra parte.
4. El frontend puede apoyarse temporalmente en respuestas simuladas segun la spec mientras el endpoint no exista, y debe pasar a la API real antes de cerrar el modulo.
5. Cierre de modulo: tests de backend, tests del frontend y flujo e2e contra la API real en docker-compose.
6. Integracion final en docker-compose y verificacion end to end.

Si una spec es ambigua o contradictoria, parar y preguntar; no inventar. Si se cambia el comportamiento, actualizar la spec en el mismo cambio.

## Estructura de carpetas

```
quick-shop-curso/
  AGENTS.md / CLAUDE.md     Instrucciones globales (CLAUDE.md solo referencia a AGENTS.md)
  docker-compose.yml        Orquestacion: db, backend, frontend
  .env.example              Variables de ejemplo (versionado). .env real fuera de git
  docs/
    products-images.json    Datos del seed de productos
    specs-prds/             Una spec por modulo
  backend/                  API FastAPI (ver backend/AGENTS.md)
  frontend/                 SPA React (ver frontend/AGENTS.md)
```

## Convenciones generales

- Idioma: documentacion (CLAUDE.md, AGENTS.md, specs, README) en castellano. Codigo (identificadores, nombres de tablas/columnas, rutas) en ingles. Sin emojis en ningun archivo del proyecto.
- API REST con prefijo `/api/v1`, JSON, paginacion `page` / `page_size`, importes decimales serializados como string.
- Errores de API: `{ "detail": "mensaje" }` con el codigo HTTP correcto (400, 401, 403, 404, 409, 422).
- Seguridad:
  - Ningun secreto, password o URL hardcodeado en el codigo fuente. Todo por variables de entorno.
  - `.env` en `.gitignore`; `.env.example` versionado con valores no sensibles de ejemplo.
  - JWT access token de 2 horas, no guardar en localStorage (cookie HttpOnly). Passwords con bcrypt.
  - CORS: el backend acepta solo el origen del frontend (variable de entorno).
- Arranque del backend: aplica migraciones Alembic automaticamente y luego el seed idempotente (solo si la BD esta vacia).
- Usuarios del seed: admin@quickshop.com / Admin1234!, cliente1@quickshop.com y cliente2@quickshop.com / Cliente1234!. Valores definidos por variables de entorno, no en codigo.
- Git: commits pequenos y descriptivos con prefijo convencional (`feat`, `fix`, `docs`, `test`, `chore`). No subir `.env`, `node_modules`, `.venv`.
- No anadir dependencias ni funcionalidades fuera de las specs sin acordarlo.

## Decisiones tecnicas vinculantes

- Backend: sin `passlib`; usar `bcrypt` directamente (`bcrypt.hashpw` / `bcrypt.checkpw`) por incompatibilidades. Anadir `email-validator>=2.1.0` explicitamente para `EmailStr` de Pydantic.
- Frontend: sin PostCSS/Autoprefixer externos; PostCSS inline en `vite.config.js` solo con `tailwindcss()` para evitar fallos de regex en Windows.
- Docker y pnpm:
  - Frontend con `node:22-alpine` (pnpm 11 requiere Node >= 22.13).
  - Copiar `pnpm-workspace.yaml` junto a lockfile y `package.json` antes de `pnpm install` en el Dockerfile.
  - Declarar `allowBuilds` en `pnpm-workspace.yaml` para builds no interactivos (agentes/CI).
  - `.dockerignore` obligatorio en cada servicio: excluir `node_modules`, `.venv` y temporales (evita errores de symlinks en Windows).

## Comandos habituales

```
docker compose up --build        Levanta db + backend + frontend
docker compose down -v           Para y borra volumenes (resetea la BD y vuelve a ejecutar el seed)
```

URLs por defecto: frontend http://localhost:5173, API http://localhost:8000, docs de la API http://localhost:8000/docs.
