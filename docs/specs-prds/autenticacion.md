# Modulo: autenticacion

## Descripcion

Registro de clientes, login y emision de JWT. Verificacion del token en cada peticion protegida y control de acceso por rol (`cliente`, `admin`).

Reglas:

- Access token JWT firmado (HS256) con expiracion de 2 horas. No hay refresh token.
- El token NO se guarda en `localStorage` ni `sessionStorage`. Se entrega en una cookie `HttpOnly`, `SameSite=Lax`, `Secure` segun entorno (`COOKIE_SECURE`). El frontend no lee el token; usa `GET /api/v1/auth/me` para conocer la sesion.
- Passwords hasheadas con `bcrypt` directamente (`bcrypt.hashpw` / `bcrypt.checkpw`). Prohibido `passlib`.
- El registro publico solo crea usuarios con rol `cliente`. El admin se crea por seed.
- Claims del JWT: `sub` (id de usuario), `role`, `exp`, `iat`.

El modelo de datos de usuarios vive en [usuarios.md](usuarios.md). Este modulo no define tablas propias.

## Modelo de datos

Sin tablas propias. Usa `users` (ver usuarios.md): `email`, `password_hash`, `role`, `is_active`.

## Endpoints

Prefijo: `/api/v1/auth`.

### POST /register

- Request: `{ "email": "EmailStr", "password": "str (min 8, 1 mayuscula, 1 minuscula, 1 digito, 1 simbolo)", "full_name": "str (1-120)" }`
- Response 201: `{ "id": int, "email": str, "full_name": str, "role": "cliente" }`
- Errores: 409 email ya registrado; 422 validacion.

### POST /login

- Request: `{ "email": "EmailStr", "password": "str" }`
- Response 200: `{ "access_token": str, "token_type": "bearer", "expires_in": 7200, "user": { id, email, full_name, role } }`. Ademas establece la cookie `access_token` (`HttpOnly`).
- Errores: 401 credenciales invalidas (mensaje generico, sin distinguir email/password); 403 usuario inactivo; 422 validacion.

### POST /logout

- Request: sin cuerpo. Requiere sesion.
- Response 204. Borra la cookie.
- Errores: 401 sin sesion.

### GET /me

- Response 200: `{ "id": int, "email": str, "full_name": str, "role": "cliente" | "admin" }`
- Errores: 401 token ausente, invalido o expirado.

### POST /forgot-password

- Publico. Request: `{ "email": "EmailStr" }`
- Response 202: `{ "detail": "Si el email existe, recibiras un enlace de recuperacion" }`, siempre igual exista o no el email (y sea o no usuario activo).
- Si existe un usuario activo, se envia un email con el enlace `<FRONTEND_URL>/reset-password?token=<token>`. El token es aleatorio, de un solo uso y caduca a los `PASSWORD_RESET_EXPIRE_MINUTES` (60 por defecto). En BD solo se guarda su hash. Una nueva solicitud invalida los tokens anteriores del usuario.
- Errores: 422 validacion.

### POST /reset-password

- Publico. Request: `{ "token": "str", "password": "str (misma politica que register)" }`
- Response 204. Cambia la password y consume el token.
- Errores: 400 token invalido, caducado o ya usado (mensaje generico); 422 validacion (el token sigue siendo utilizable).

### Dependencias reutilizables (backend)

- `get_current_user`: valida token y devuelve usuario activo; 401 si falla.
- `require_role("admin")` / `require_role("cliente")`: 403 si el rol no coincide.

## Criterios de aceptacion

1. Un visitante puede registrarse con email valido y password que cumple la politica; recibe rol `cliente`.
2. Registrar un email existente devuelve 409.
3. Login correcto devuelve token con `exp` = emision + 2 horas y establece cookie `HttpOnly`.
4. Login con credenciales erroneas devuelve 401 sin revelar cual campo falla.
5. Un token expirado o manipulado devuelve 401 en cualquier endpoint protegido.
6. Un cliente que llama a un endpoint de admin recibe 403; sin token recibe 401.
7. La password nunca se devuelve ni se registra en logs; en BD solo existe el hash bcrypt.
8. El token no aparece en `localStorage` ni `sessionStorage` (verificable en e2e).
9. `SECRET_KEY` y duracion del token salen de variables de entorno.
10. `forgot-password` responde 202 con el mismo cuerpo para cualquier email y no revela que cuentas existen.
11. El token de recuperacion caduca, solo sirve una vez y no se almacena en claro; tras el reset se puede iniciar sesion con la nueva password y no con la anterior.
12. En local el email se consulta en Mailhog (http://localhost:8025).

## Pantallas en el frontend

- `/login`: formulario email + password, errores inline, enlace a registro. Tras login redirige a `/` (cliente) o `/admin/products` (admin).
- `/register`: formulario email, nombre, password con indicacion de politica. Tras registro redirige a `/login`.
- `/forgot-password`: formulario de email; tras enviar muestra un mensaje generico. Enlace "Has olvidado tu password?" desde `/login`. Publica.
- `/reset-password?token=...`: nueva password con confirmacion e indicacion de politica; exito redirige a `/login` con aviso; 400 muestra el error con enlace a `/forgot-password`; sin `token` indica enlace no valido. Publica.
- Header: muestra enlaces login/registro si no hay sesion; nombre de usuario y boton "Salir" si la hay.
- Rutas protegidas (`ProtectedRoute`, `AdminRoute`): redirigen a `/login` (401) o muestran pantalla 403.
- Al arrancar la app se llama a `/auth/me` para hidratar el contexto de sesion; un 401 posterior en cualquier llamada limpia la sesion y redirige a `/login`.
