# Design

## Context

Repositorio con solo andamiaje: `docker-compose.yml` (db, backend, frontend), Dockerfiles, `.env.example`, `frontend/pnpm-workspace.yaml` y specs en `docs/specs-prds/`. No hay codigo de aplicacion. Las reglas de estructura, stack y decisiones vinculantes estan en `AGENTS.md`, `backend/AGENTS.md` y `frontend/AGENTS.md`; este diseno no las repite. Motivacion en `proposal.md`; requisitos en `specs/`.

El comportamiento detallado (endpoints, campos, codigos) esta en `docs/specs-prds/{autenticacion,usuarios,productos}.md`, que siguen siendo el contrato entre backend y frontend.

## Goals / Non-Goals

**Goals:**
- Cerrar los tres modulos completos (backend + frontend + tests) en el orden autenticacion, usuarios, productos.
- Dejar una base reutilizable (config, deps de auth, cliente HTTP, layouts) para carrito y pedidos.
- Arranque con `docker compose up --build` que migra y siembra sin pasos manuales.

**Non-Goals:**
- Carrito, pedidos, refresh tokens, gestion de usuarios en el frontend, subida de imagenes (solo `image_url`).
- Rate limiting o bloqueo de cuenta por intentos fallidos.

## Decisions

1. **Un solo modelo `User` en `modules/users`, `auth` sin tablas.** Auth depende de `users.service` para buscar y crear usuarios. Alternativa: tabla de credenciales separada; descartada por la spec (sin tablas propias en auth).

2. **Token en cookie HttpOnly y en el cuerpo del login.** `get_current_user` lee primero la cookie `access_token` y, si no existe, la cabecera `Authorization: Bearer`. El frontend solo usa la cookie. Tests y clientes de API pueden usar el bearer. Alternativa: solo cookie; el bearer facilita tests de expiracion y no debilita el modelo (el token no es legible por JS en el navegador).

3. **bcrypt directo en `core/security.py`.** `hash_password` / `verify_password` con `bcrypt.hashpw` / `checkpw`; JWT con `PyJWT` HS256 (dependencia adicional acordada con el usuario). Claims `sub`, `role`, `exp`, `iat`; expiracion desde `ACCESS_TOKEN_EXPIRE_MINUTES`.

4. **Login sin enumeracion de usuarios.** Mismo 401 y mensaje para email inexistente y password erronea; se ejecuta una verificacion bcrypt contra un hash ficticio cuando el email no existe para igualar tiempos. El 403 de usuario inactivo solo se devuelve tras validar la password.

5. **Cambio de rol imposible por API publica.** Los schemas de registro y `PATCH /users/me` usan `extra="forbid"` para rechazar `role`/`is_active`/`email` con 422. El registro ignora o rechaza `role` y fija `cliente` en el servicio.

6. **Normalizacion de email en el servicio y en el schema** (lowercase + strip) con indice unico sobre `email`; unicidad sin distinguir mayusculas queda garantizada porque solo se guarda en minusculas.

7. **Productos: busqueda `ILIKE` sobre `name`** con indice en `name` e `is_active`. Paginacion comun (`page`, `page_size`, `total`) en un schema generico reutilizable por usuarios y futuros listados. Alternativa: full-text search; innecesario para 20 productos.

8. **Borrado logico y `PUT` vs `PATCH`.** `PUT` usa el schema con todos los campos obligatorios, `PATCH` uno con todos opcionales y al menos un campo. `DELETE` solo cambia `is_active`. Los visitantes y clientes nunca ven inactivos: el servicio filtra segun el rol, y el detalle devuelve 404.

8b. **Listado publico con autenticacion opcional.** Una dependencia `get_optional_user` devuelve el usuario o `None` (token ausente o invalido no produce 401 en el listado). Solo un admin autenticado puede usar `include_inactive`. En el frontend, `/` queda fuera de `ProtectedRoute` y el boton de agregar al carrito redirige a `/login` si no hay sesion. Alternativa: listado autenticado como en la spec original; descartada por decision del usuario.

9. **Seed en `db/seed.py`, invocado desde el lifespan tras `alembic upgrade head`.** Cada seed comprueba por separado si su tabla esta vacia (usuarios, productos). Lee `SEED_*` y `SEED_PRODUCTS_FILE` via `Settings`; `price` se lee como `Decimal` desde el string del JSON.

10. **Migraciones Alembic: una por modulo** (`users`, `products`) con enum `user_role` y `CheckConstraint` (`price > 0`, `stock >= 0`) definidos en el modelo y reflejados en la migracion; revisar el SQL autogenerado.

11. **Tests de backend sobre PostgreSQL real** (servicio `db` del compose o contenedor de test), con fixtures que aplican migraciones y limpian entre tests. Se prueban expiracion de token (token firmado con `exp` pasado), permisos por rol y cada criterio de aceptacion.

12. **Frontend: `fetch` envuelto en `api/client.js`** con `credentials: "include"`, `VITE_API_URL`, parseo de `{ detail }` en un error tipado, y un manejador global de 401 que limpia `AuthContext` y navega a `/login` (excepto en la propia llamada de login y en la hidratacion inicial de `/auth/me`). Sin librerias de estado o UI adicionales; Tailwind con PostCSS inline en `vite.config.js`.

13. **Rutas del frontend con `ProtectedRoute` / `AdminRoute`** y `MainLayout` con `<Outlet/>`. Mientras `AuthContext` hidrata, se muestra estado de carga para evitar parpadeo de redireccion.

14. **Estrategia de desarrollo en paralelo por modulo.** Backend y frontend avanzan a la vez con la spec como contrato; el frontend puede usar respuestas simuladas hasta que el endpoint exista y debe pasar a la API real antes de cerrar el modulo (ver `tasks.md`).

## Risks / Trade-offs

- [Cookie `SameSite=Lax` con frontend (5173) y API (8000) en distinto puerto] -> Mismo sitio (`localhost`), por lo que la cookie se envia; CORS con `allow_credentials=True` y origen exacto desde `CORS_ORIGINS`, nunca `*`. En produccion con dominios distintos habria que revisar `SameSite`/`Secure`.
- [Sin proteccion CSRF explicita] -> `SameSite=Lax` cubre POST cross-site; los endpoints que mutan no usan GET. Aceptable para el alcance; revisar si se cambia la politica de cookie.
- [Fallo del seed a mitad de arranque] -> Seed en una transaccion por tabla; al reintentar solo actua sobre tablas vacias.
- [Seed de productos depende de un fichero montado] -> Falla con error claro si `SEED_PRODUCTS_FILE` no existe; compose ya monta `./docs`.
- [Listado publico expone el catalogo a scraping] -> Datos no sensibles; paginacion con `page_size` maximo 100.
- [Boton "Agregar al carrito" sin carrito] -> Se renderiza y respeta stock, pero queda sin efecto hasta el modulo carrito.

## Open Questions

- Ninguna bloqueante. Decididas con el usuario: libreria JWT `PyJWT`; listado de productos publico.
- Supuesto: solo el listado es publico; el detalle sigue autenticado (el usuario solo pidio el listado). Si se quiere publico tambien, cambiar spec y `docs/specs-prds/productos.md`.
