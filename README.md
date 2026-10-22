# quick-shop-curso
Repositorio para el curso Desarrollo con IA: De escribir prompts al desarrollo con agentes

El repositorio no tiene codigo, el codigo se irá generando durante el curso con agentes de codigo, en especial Claude Code y OpenCode. 

La rama main solo tiene las carpetas iniciales necesarias a modo de scaffolding para poder clonar el proyecto y empezar a trabajar en el con los principales agentes de codigo.

La demo del curso se hará sobre la rama demp_curso y las PRs se haran a la rama "dev" from "demo_curso"

## Arranque

```
cp .env.example .env        # ajustar secretos y puertos si hay conflictos
docker compose up --build   # db + backend + frontend
docker compose down -v      # para y borra la BD (el seed se vuelve a ejecutar)
```

- Frontend: http://localhost:5173 (variable `FRONTEND_PORT`)
- API: http://localhost:8000, docs en http://localhost:8000/docs (variable `BACKEND_PORT`)
- Mailhog (correo de pruebas): http://localhost:8025 (variable `MAILHOG_UI_PORT`). Los emails de recuperacion de password llegan ahi; el SMTP (`mailhog:1025`) solo es accesible dentro de la red de compose.
- Si cambias `FRONTEND_PORT` o `BACKEND_PORT`, ajusta tambien `CORS_ORIGINS` y `VITE_API_URL` en `.env`; `FRONTEND_URL` debe apuntar al frontend porque forma el enlace del email.

Recuperacion de password: en `/login`, "Has olvidado tu password?", introducir el email y abrir el enlace desde Mailhog. Variables: `FRONTEND_URL`, `PASSWORD_RESET_EXPIRE_MINUTES`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_STARTTLS`.

Al arrancar el backend aplica las migraciones y, solo si la BD esta vacia, el seed: 1 admin, 2 clientes y 20 productos. Credenciales de ejemplo (definidas en `.env`): `admin@quickshop.com` / `Admin1234!`, `cliente1@quickshop.com` y `cliente2@quickshop.com` / `Cliente1234!`.

## Tests

Backend (requiere un PostgreSQL de pruebas en `TEST_DATABASE_URL`, y las variables de `.env.example` en el entorno):

```
cd backend
uv sync
uv run pytest
uv run ruff check . && uv run ruff format .
```

Frontend y e2e (los e2e usan la API real levantada con docker compose):

```
cd frontend
pnpm install
pnpm test
pnpm exec playwright install chromium
E2E_BASE_URL=http://localhost:5173 MAILHOG_URL=http://localhost:8025 pnpm exec playwright test
```
