# Backend QuickShop

API FastAPI. Contexto global y orden de desarrollo en `../AGENTS.md`. Specs de cada modulo en `../docs/specs-prds/`.

## Stack y herramientas

- Python 3.11, FastAPI, SQLAlchemy 2.0 (estilo declarativo tipado, `Mapped[]`), Alembic, Pydantic v2, PostgreSQL 15 con driver `psycopg` (v3).
- Gestor: `uv` (`uv sync`, `uv add <pkg>`, `uv run <cmd>`). Dependencias en `pyproject.toml`, lock en `uv.lock` versionado.
- Tests: `pytest` + `httpx`. Lint/format: `ruff`.
- Dependencias obligatorias concretas:
  - `bcrypt` directamente; prohibido `passlib`.
  - `email-validator>=2.1.0` para `EmailStr`.
  - `pydantic-settings` para configuracion.

## Estructura

```
backend/
  pyproject.toml, uv.lock
  Dockerfile, .dockerignore
  alembic.ini
  alembic/versions/         Migraciones
  app/
    main.py                 App FastAPI, CORS, lifespan (migraciones + seed), routers
    core/
      config.py             Settings desde entorno (unica fuente de configuracion)
      security.py           Hash bcrypt, creacion/validacion JWT
      deps.py               get_db, get_current_user, require_role
    db/
      base.py               Base declarativa
      session.py            Engine y SessionLocal
      seed.py               Seed idempotente
    modules/
      auth/      router.py, schemas.py, service.py
      users/     models.py, router.py, schemas.py, service.py
      products/  models.py, router.py, schemas.py, service.py
      cart/      models.py, router.py, schemas.py, service.py
      orders/    models.py, router.py, schemas.py, service.py
  tests/
    conftest.py
    test_<modulo>.py
```

Un paquete por modulo. El router solo traduce HTTP; la logica de negocio va en `service.py`; los modelos SQLAlchemy en `models.py`.

## Convenciones

- Rutas bajo `/api/v1/<modulo>`. Codigos y formatos segun la spec del modulo.
- Importes: `Decimal` y `Numeric(10,2)`; nunca `float`. Serializar como string.
- Restricciones de dominio tambien en BD (`CheckConstraint`, `UniqueConstraint`, FKs), no solo en Pydantic.
- Operaciones de stock (crear pedido, cancelar) en una unica transaccion con `with_for_update()` sobre los productos, ordenando por id para evitar deadlocks.
- Autorizacion con dependencias `get_current_user` y `require_role`. Recursos ajenos devuelven 404, no 403.
- Token JWT en cookie `HttpOnly` y tambien en el cuerpo del login; expiracion 2 horas desde `ACCESS_TOKEN_EXPIRE_MINUTES=120`.
- Sin secretos ni URLs en el codigo: todo via `core/config.py` y variables de entorno.
- Tipado completo; funciones pequenas; sin comentarios que repitan el codigo.

## Variables de entorno

Definidas en `../.env.example`. Minimas: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `COOKIE_SECURE`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CLIENT_PASSWORD`, `SEED_PRODUCTS_FILE`.

## Migraciones y seed

- Alembic: una migracion por cambio de modelo (`uv run alembic revision --autogenerate -m "..."`). Revisar siempre el SQL generado.
- El arranque (lifespan) ejecuta `alembic upgrade head` automaticamente y despues el seed.
- Seed idempotente: solo actua si no hay usuarios ni productos. Crea 1 admin, 2 clientes y 20 productos desde `docs/products-images.json`. Reiniciar no duplica ni sobreescribe datos.
- El Dockerfile copia `docs/products-images.json` (o docker-compose lo monta) y `SEED_PRODUCTS_FILE` apunta a el.

## Docker

- Imagen base `python:3.11-slim`, instalar `uv`, `uv sync --frozen --no-dev`.
- `.dockerignore` obligatorio: `.venv`, `__pycache__`, `.pytest_cache`, `.env`.
- El contenedor espera a que PostgreSQL este sano (`depends_on` con `condition: service_healthy`).

## Tests

- Cada modulo se entrega con tests de los criterios de aceptacion de su spec.
- BD de test en PostgreSQL (no SQLite) para respetar CHECK, enums y bloqueos.
- Obligatorios: permisos por rol, limites de stock, concurrencia de pedidos, restitucion de stock, expiracion de token.

## Comandos

```
uv sync
uv run uvicorn app.main:app --reload
uv run pytest
uv run ruff check . && uv run ruff format .
uv run alembic upgrade head
```
