# Modulo: usuarios

## Descripcion

Gestion de la entidad usuario y su perfil. Dos roles: `cliente` y `admin`. El admin se crea exclusivamente por seed y no tiene carrito. Los clientes consultan y editan su propio perfil; el admin puede listar clientes (solo lectura) para la gestion de pedidos.

La autenticacion (registro, login, token) esta en [autenticacion.md](autenticacion.md).

## Modelo de datos

Tabla `users`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK, autoincremental |
| email | varchar(255) | NOT NULL, UNIQUE, normalizado a minusculas |
| password_hash | varchar(255) | NOT NULL (bcrypt) |
| full_name | varchar(120) | NOT NULL |
| role | enum(`cliente`, `admin`) | NOT NULL, default `cliente` |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now(), actualizado en cada UPDATE |

Indices: unico sobre `email`.

Seed (solo si la BD esta vacia, idempotente):

- `admin@quickshop.com` / `Admin1234!` rol `admin`
- `cliente1@quickshop.com` / `Cliente1234!` rol `cliente`
- `cliente2@quickshop.com` / `Cliente1234!` rol `cliente`

Las credenciales del seed se leen de variables de entorno (`SEED_*`) con valores de ejemplo en `.env.example`; no se hardcodean en el codigo.

## Endpoints

Prefijo: `/api/v1/users`. Todos requieren sesion.

### GET /me

- Response 200: `{ id, email, full_name, role, created_at }`
- Errores: 401.

### PATCH /me

- Request: `{ "full_name"?: str, "password"?: str, "current_password"?: str }`. Para cambiar `password` se exige `current_password`.
- Response 200: usuario actualizado.
- Errores: 400 `current_password` incorrecta; 401; 422.

### GET / (solo admin)

- Query: `role?`, `page` (default 1), `page_size` (default 20, max 100).
- Response 200: `{ items: [{ id, email, full_name, role, is_active, created_at }], total, page, page_size }`
- Errores: 401; 403.

### GET /{id} (solo admin)

- Response 200: usuario.
- Errores: 401; 403; 404.

## Criterios de aceptacion

1. Tras arrancar con BD vacia existen exactamente 1 admin y 2 clientes del seed.
2. Reiniciar el backend con datos presentes no duplica usuarios ni modifica passwords.
3. `email` es unico sin distinguir mayusculas.
4. Un cliente solo puede ver y editar su propio perfil.
5. Cambiar password sin `current_password` correcta devuelve 400.
6. Un cliente no puede cambiar su rol ni `is_active` (campos ignorados/rechazados con 422).
7. Las respuestas nunca incluyen `password_hash`.
8. El listado de usuarios devuelve 403 a clientes.

## Pantallas en el frontend

- `/profile`: datos del usuario (email solo lectura, nombre editable) y formulario de cambio de password. Solo cliente y admin autenticados.
- Header: nombre del usuario y enlace a `/profile`.
- No hay pantalla de gestion de usuarios en el alcance inicial; el admin ve el email/nombre del cliente dentro del detalle de pedido.
