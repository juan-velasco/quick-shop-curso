# Proposal

## Why

Un usuario que olvida su password hoy no tiene forma de recuperar el acceso: `PATCH /users/me` exige sesion y `current_password`. Hace falta un flujo de recuperacion por email con enlace de un solo uso, probable en local sin un servidor de correo real.

## What Changes

- Nuevos endpoints publicos `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password`.
- Tabla `password_reset_tokens` (token guardado solo como hash, con caducidad y un solo uso) y migracion Alembic.
- Envio de email con enlace `<FRONTEND_URL>/reset-password?token=...` por SMTP, configurado por variables de entorno.
- Mailhog en `docker-compose.yml` (SMTP 1025, UI web 8025) para probar en local.
- Frontend: pantallas `/forgot-password` y `/reset-password`, y enlace "Has olvidado tu password?" en `/login`.
- Actualizar `docs/specs-prds/autenticacion.md` (contrato) y `.env.example`.

## Capabilities

### New Capabilities

- `password-reset`: solicitud de recuperacion por email, token de un solo uso con caducidad, restablecimiento de password y pantallas asociadas.

### Modified Capabilities

(ninguna: `authentication` aun no esta en `openspec/specs/` porque el cambio `add-auth-users-products` no esta archivado; este flujo se especifica como capacidad propia)

## Impact

- Backend: `app/modules/auth` (router, schemas, service), nuevo modelo y migracion, `app/core/config.py`, nuevo modulo de envio de email (`smtplib` de la libreria estandar, sin dependencias nuevas).
- Frontend: `src/pages/auth/`, `src/api/auth.js`, `App.jsx`, `LoginPage`.
- Infra: servicio `mailhog` en docker-compose; variables `SMTP_*`, `FRONTEND_URL`, `PASSWORD_RESET_EXPIRE_MINUTES`.
- Fuera de alcance: verificacion de email en el registro, envio de emails de otro tipo, proveedor SMTP de produccion, rate limiting.
