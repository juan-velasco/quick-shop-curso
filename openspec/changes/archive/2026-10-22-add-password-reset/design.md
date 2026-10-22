# Design

## Context

Existen `auth`, `users` y `products` (cambio `add-auth-users-products`). El backend usa FastAPI + SQLAlchemy + Alembic (ultima migracion `0002`), `core/security.py` con bcrypt y PyJWT, y el frontend React con `src/api/auth.js`. docker-compose tiene db, backend y frontend. Requisitos en `specs/password-reset/spec.md`.

## Goals / Non-Goals

**Goals:** flujo completo de recuperacion por email, seguro frente a enumeracion de cuentas, probable en local con Mailhog.

**Non-Goals:** verificacion de email, plantillas HTML elaboradas, cola de correo, proveedor SMTP de produccion, rate limiting.

## Decisions

1. **Token opaco aleatorio, no JWT.** `secrets.token_urlsafe(32)`; en BD solo `sha256(token)` en `password_reset_tokens` (`id`, `user_id` FK con `ON DELETE CASCADE`, `token_hash` unico, `expires_at`, `used_at`, `created_at`). Un token opaco permite invalidacion y un solo uso con estado en BD; sha256 basta porque el token tiene alta entropia (bcrypt no aporta). Alternativa: JWT firmado con expiracion; descartada porque no se puede revocar ni marcar como usado sin estado.
2. **Un solo uso e invalidacion.** Al crear un token se marcan como usados los pendientes del usuario. Al restablecer, en una transaccion: validar (existe, no usado, no caducado), cambiar `password_hash`, marcar `used_at`. Consulta con `with_for_update()` para evitar doble uso concurrente.
3. **Anti-enumeracion.** `forgot-password` responde siempre 202 con cuerpo fijo. Para igualar tiempos el envio se hace en `BackgroundTasks` (tras responder), de modo que el SMTP no afecta la latencia. Los fallos de envio se registran en logs sin el token.
4. **Email con `smtplib` estandar** en `app/core/email.py` (`send_email(to, subject, body)`), `EmailMessage` texto plano en castellano. Sin dependencias nuevas. Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`/`SMTP_PASSWORD` y `SMTP_STARTTLS` opcionales, `FRONTEND_URL`, `PASSWORD_RESET_EXPIRE_MINUTES=60`. Mailhog no usa auth ni TLS.
5. **Mailhog en compose:** imagen `mailhog/mailhog`, puertos `1025` (SMTP, solo red interna) y `${MAILHOG_UI_PORT:-8025}:8025`. `.env.example` apunta `SMTP_HOST=mailhog`, `SMTP_PORT=1025`. El backend no depende de su salud: si falta, el fallo de envio se registra.
6. **Tests:** la funcion de envio se inyecta como dependencia de FastAPI (`get_mailer`) y los tests la sustituyen por un buzon en memoria; no se prueba SMTP real en pytest. Un e2e Playwright usa la API HTTP de Mailhog (`/api/v2/messages`) para leer el enlace.
7. **Frontend sin librerias nuevas.** Dos paginas (`ForgotPasswordPage`, `ResetPasswordPage` leyendo `token` con `useSearchParams`), funciones en `src/api/auth.js`, validacion de politica con la utilidad existente.
8. **Contrato:** se actualiza `docs/specs-prds/autenticacion.md` (nuevos endpoints y pantallas) antes de implementar.

## Risks / Trade-offs

- [Email en claro de token en logs de Mailhog/SMTP] -> Aceptable en local; en produccion, TLS hacia el proveedor.
- [BackgroundTasks se pierden si el proceso cae] -> Aceptable para el alcance; el usuario puede repetir la solicitud.
- [Sin rate limiting, se puede inundar de emails a un usuario] -> Fuera de alcance; anotado para un cambio posterior.
- [Sesiones activas siguen validas tras el reset] -> JWT sin estado de 2 horas; se asume. Mitigacion futura: campo de version de password en el token.
- [`FRONTEND_URL` mal configurada rompe el enlace] -> Variable explicita en `.env.example` y README.

## Open Questions

- Ninguna bloqueante. Supuestos: validez de 60 minutos y respuesta generica 202 siempre.
