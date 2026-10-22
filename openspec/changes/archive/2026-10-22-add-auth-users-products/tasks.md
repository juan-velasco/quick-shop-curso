# Tasks

Orden: base comun, luego autenticacion, usuarios y productos. Cada modulo cierra backend y frontend con sus tests antes de pasar al siguiente. Dentro de un modulo, backend y frontend pueden avanzar en paralelo (subagentes o worktrees) usando la spec como contrato.

## 1. Base del backend

- [x] 1.1 Crear `backend/pyproject.toml` con FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, `pydantic-settings`, `psycopg`, `bcrypt`, `email-validator>=2.1.0`, libreria JWT acordada, y dev: `pytest`, `httpx`, `ruff`; verificar con `uv sync` y que `passlib` no aparece en `uv.lock`
- [x] 1.2 Implementar `app/core/config.py` (Settings desde entorno: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `COOKIE_SECURE`, `SEED_*`) y `app/db/{base,session}.py`; verificar importando Settings con el `.env.example` y que no hay secretos en el codigo (`grep`)
- [x] 1.3 Configurar Alembic (`alembic.ini`, `env.py` leyendo `DATABASE_URL`) y `app/main.py` con CORS (solo origen configurado, credenciales), lifespan (`alembic upgrade head` y seed) y router `/api/v1`; verificar que `uv run uvicorn app.main:app` arranca contra PostgreSQL y `/docs` responde
- [x] 1.4 Crear `tests/conftest.py` con BD PostgreSQL de test, migraciones aplicadas, limpieza entre tests y cliente `httpx`; verificar con un test de humo que pasa con `uv run pytest`

## 2. Modulo autenticacion - backend

- [x] 2.1 Crear el modelo `User` y migracion de `users` (enum `user_role`, email unico en minusculas, `updated_at` automatico); verificar el SQL generado y `alembic upgrade head` / `downgrade base`
- [x] 2.2 Implementar `core/security.py` (hash y verificacion bcrypt directos, creacion y decodificacion JWT con `sub`, `role`, `exp`, `iat`); verificar con tests unitarios de hash, `exp` = emision + 2 horas, token expirado y firma manipulada
- [x] 2.3 Implementar `core/deps.py` (`get_db`, `get_current_user` con cookie y bearer, `require_role`) y `auth/{schemas,service,router}.py` con `register`, `login` (cookie HttpOnly, SameSite=Lax, Secure por entorno), `logout` y `me`; verificar con `tests/test_auth.py` cubriendo los 9 criterios de aceptacion de `autenticacion.md` (409, 401 generico, 403 inactivo, 401 expirado, 403 por rol, password nunca expuesta)
- [x] 2.4 Implementar `db/seed.py` para usuarios (admin y 2 clientes desde `SEED_*`, idempotente); verificar con tests de primer arranque y reinicio sin duplicados ni cambio de passwords

## 3. Modulo autenticacion - frontend

- [x] 3.1 Crear el proyecto Vite en `frontend/` (React 18, Tailwind con PostCSS inline en `vite.config.js`, React Router, Vitest + Testing Library, `VITE_API_URL`); verificar `pnpm install`, `pnpm build` y `pnpm test` sin `postcss.config.js`
- [x] 3.2 Implementar `api/client.js` (`credentials: "include"`, errores con `detail`, hook de 401), `api/auth.js` y `context/AuthContext.jsx` (hidratacion con `/auth/me`, sin `localStorage`/`sessionStorage`); verificar con tests de Vitest del contexto y del cliente (401 limpia sesion)
- [x] 3.3 Implementar `MainLayout` (header con login/registro o nombre y "Salir", responsive), `ProtectedRoute`, `AdminRoute` con pantalla 403, `LoginPage` y `RegisterPage` (errores inline, politica de password, redirecciones por rol); verificar con tests de componentes de cada escenario de la spec `authentication`
- [x] 3.4 Sustituir respuestas simuladas por la API real si se usaron; verificar manualmente login, registro y logout contra el backend local

## 4. Cierre del modulo autenticacion

- [x] 4.1 Crear `.dockerignore` faltantes, completar `.env.example` si hace falta y verificar `docker compose up --build` con db, backend y frontend sanos
- [x] 4.2 Escribir e2e Playwright (`frontend/e2e/auth.spec.ts` o `.js`) contra la API real en docker-compose: registro, login cliente y admin con redireccion, logout, ruta protegida, y comprobacion de que `localStorage` y `sessionStorage` no contienen el token; verificar con `pnpm exec playwright test`
- [x] 4.3 Ejecutar `uv run pytest`, `uv run ruff check .`, `pnpm test` y comprobar que todo pasa antes de continuar

## 5. Modulo usuarios - backend

- [x] 5.1 Implementar `users/{schemas,service,router}.py`: `GET /users/me`, `PATCH /users/me` (`extra="forbid"`, `current_password` obligatoria para cambiar password, politica de password), `GET /users` (filtro `role`, paginacion, solo admin) y `GET /users/{id}`; verificar con `tests/test_users.py` cubriendo los 8 criterios de `usuarios.md` (400 password actual, 422 rol, 403 listado, sin `password_hash`)
- [x] 5.2 Anadir el schema generico de paginacion reutilizable y verificar `page_size` > 100 devuelve 422

## 6. Modulo usuarios - frontend

- [x] 6.1 Implementar `api/users.js` y `ProfilePage` (email solo lectura, nombre editable, cambio de password, estados cargando/error, enlace desde el header); verificar con tests de Vitest de edicion de nombre y error de password actual
- [x] 6.2 Verificar que `/profile` redirige a `/login` sin sesion y funciona para cliente y admin contra la API real

## 7. Cierre del modulo usuarios

- [x] 7.1 Escribir e2e de perfil (cambiar nombre, cambiar password y reingresar con la nueva) contra docker-compose; verificar con `pnpm exec playwright test`
- [x] 7.2 Ejecutar `uv run pytest`, `uv run ruff check .` y `pnpm test`; todo en verde

## 8. Modulo productos - backend

- [x] 8.0 Actualizar primero `docs/specs-prds/productos.md` (listado `GET /products` publico, `include_inactive` ignorado salvo admin, detalle autenticado, ruta `/` publica) y avisar a ambas partes; verificar con `git diff docs/specs-prds/productos.md`
- [x] 8.1 Crear modelo `Product`, migracion con `CheckConstraint` (`price > 0`, `stock >= 0`), unicos e indices (`is_active`, `name`); verificar insertando valores invalidos directamente en BD en un test
- [x] 8.2 Implementar `products/{schemas,service,router}.py`: listado publico con `get_optional_user` (`q` ILIKE, paginacion, `include_inactive` solo admin), detalle autenticado (404 para inactivo a cliente), `POST`, `PUT`, `PATCH`, `DELETE` logico, con `price` como `Decimal` serializado a string y validacion de 2 decimales; verificar con `tests/test_products.py` cubriendo los 8 criterios de `productos.md` (permisos por rol, 409, 422, borrado logico)
- [x] 8.3 Anadir el seed de 20 productos desde `SEED_PRODUCTS_FILE` (idempotente) y verificar con tests que coinciden con `docs/products-images.json` y que no se repite al reiniciar

## 9. Modulo productos - frontend

- [x] 9.1 Implementar `api/products.js`, `ProductCard` y `CatalogPage` (rejilla 1/2/3/4 columnas, buscador, paginacion, "Agotado", estados cargando/vacio/error, `Intl.NumberFormat`); `/` fuera de `ProtectedRoute` y boton de agregar que redirige a `/login` sin sesion; verificar con tests de Vitest de stock 0, estado vacio y acceso sin sesion
- [x] 9.2 Implementar `ProductDetailPage` (selector de cantidad limitado al stock, boton agregar sin efecto hasta el modulo carrito); verificar con test del limite de cantidad
- [x] 9.3 Implementar `AdminLayout`, `AdminProductsPage` (incluye inactivos, editar, desactivar, "Nuevo producto") y `ProductFormPage` (validacion de precio, stock y URL, error 409 en formulario); verificar con tests de validacion y de desactivacion

## 10. Cierre del modulo productos y verificacion final

- [x] 10.1 Escribir e2e de productos contra docker-compose: catalogo con 20 productos sembrados visible sin sesion, detalle que redirige a `/login` sin sesion, busqueda y paginacion, admin crea, edita y desactiva, el producto desactivado desaparece para el cliente, cliente recibe 403 en `/admin/products`; verificar con `pnpm exec playwright test`
- [x] 10.2 Ejecutar `docker compose down -v && docker compose up --build` desde cero y verificar el arranque (migraciones y seed: 3 usuarios, 20 productos), `uv run pytest`, `uv run ruff check .`, `pnpm test` y la suite e2e completa
- [x] 10.3 Actualizar `README.md` con arranque, usuarios del seed y comandos de test, y actualizar las specs en `docs/specs-prds/` si el comportamiento implementado difiere; verificar que los comandos documentados funcionan tal cual

## Workflow follow-up

- Archivar el cambio (`/opsx:archive`) cuando se hayan cumplido los requisitos de revision del proyecto.
- Siguientes cambios previstos: carrito y pedidos.
