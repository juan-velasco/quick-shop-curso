# Tasks

## 1. Infraestructura y contrato

- [x] 1.1 Actualizar `docs/specs-prds/autenticacion.md` con `forgot-password`, `reset-password` y las pantallas `/forgot-password` y `/reset-password`; verificar con `git diff docs/specs-prds/autenticacion.md`
- [x] 1.2 Anadir el servicio `mailhog` a `docker-compose.yml` y las variables `SMTP_*`, `FRONTEND_URL`, `PASSWORD_RESET_EXPIRE_MINUTES`, `MAILHOG_UI_PORT` a `.env.example` y `core/config.py`; verificar con `docker compose up -d` y `curl localhost:8025/api/v2/messages` devolviendo JSON

## 2. Backend

- [x] 2.1 Crear modelo `PasswordResetToken` y migracion `0003` (hash unico, FK con cascade, `expires_at`, `used_at`); verificar con `alembic upgrade head`, `downgrade -1` y `alembic check`
- [x] 2.2 Implementar `app/core/email.py` (`send_email` con `smtplib`) y dependencia `get_mailer`; verificar con un test unitario que construye el mensaje y con un envio real a Mailhog visible en su API
- [x] 2.3 Implementar en `auth` el servicio y los endpoints `forgot-password` (202 generico, `BackgroundTasks`, invalida tokens previos) y `reset-password` (validacion bajo `with_for_update`, politica de password, 204/400/422); verificar con `tests/test_password_reset.py` cubriendo todos los escenarios de la spec (inexistente, inactivo, caducado, reutilizado, invalidado por solicitud posterior, hash en BD, fallo SMTP, login con la nueva password)

## 3. Frontend

- [x] 3.1 Anadir `forgotPassword` y `resetPassword` a `src/api/auth.js`, `ForgotPasswordPage`, `ResetPasswordPage`, rutas publicas en `App.jsx` y enlace en `LoginPage`; verificar con tests Vitest de cada escenario de pantalla (mensaje generico, passwords distintas, enlace caducado, sin token, redireccion con aviso)

## 4. Verificacion e2e y documentacion

- [x] 4.1 Escribir e2e Playwright: solicitar recuperacion de un usuario del seed, leer el enlace desde la API de Mailhog, restablecer, iniciar sesion con la nueva password y comprobar que el enlace no sirve dos veces; verificar con `pnpm exec playwright test` contra docker-compose
- [x] 4.2 Ejecutar `docker compose down -v && up --build`, `uv run pytest`, `uv run ruff check .`, `pnpm test` y la suite e2e completa; todo en verde
- [x] 4.3 Documentar en `README.md` Mailhog (UI en http://localhost:8025) y las nuevas variables; verificar que los pasos documentados funcionan tal cual

## Workflow follow-up

- Archivar este cambio y `add-auth-users-products` (`/opsx:archive`) tras la revision.
