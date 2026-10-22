# user-management Specification

## Purpose

Entidad usuario, seed de usuarios, perfil propio (consulta, edicion y cambio de password) y consulta de usuarios por el admin.

## Requirements

### Requirement: Entidad usuario y unicidad de email
El sistema SHALL persistir usuarios con `id`, `email`, `password_hash`, `full_name`, `role` (`cliente` o `admin`, por defecto `cliente`), `is_active` (por defecto verdadero), `created_at` y `updated_at`, este ultimo actualizado en cada modificacion. El `email` SHALL normalizarse a minusculas y ser unico sin distinguir mayusculas. Ninguna respuesta de la API SHALL incluir `password_hash`.

#### Scenario: Email unico sin distinguir mayusculas
- **WHEN** existe `Ana@Example.com` y se intenta registrar `ana@example.com`
- **THEN** el sistema rechaza el segundo con 409

#### Scenario: Hash nunca expuesto
- **WHEN** cualquier endpoint devuelve un usuario
- **THEN** la respuesta no contiene `password_hash`

### Requirement: Seed idempotente de usuarios
Al arrancar con la base de datos sin usuarios, el sistema SHALL crear exactamente 1 admin y 2 clientes con emails y passwords tomados de variables de entorno (`SEED_*`); estos valores MUST NOT estar hardcodeados en el codigo. Reiniciar con datos existentes MUST NOT duplicar usuarios ni modificar passwords.

#### Scenario: Primer arranque
- **WHEN** el backend arranca con la base de datos vacia
- **THEN** existen 1 usuario `admin` y 2 usuarios `cliente`, y los 3 pueden iniciar sesion con las credenciales configuradas

#### Scenario: Reinicio
- **WHEN** el backend se reinicia con usuarios ya creados
- **THEN** el numero de usuarios y sus passwords no cambian

### Requirement: Perfil propio
El sistema SHALL ofrecer, a cualquier usuario autenticado, `GET /api/v1/users/me` (`id`, `email`, `full_name`, `role`, `created_at`) y `PATCH /api/v1/users/me` para cambiar `full_name` y/o `password`. Cambiar `password` SHALL exigir `current_password` correcta y cumplir la politica de password; si no es correcta, el sistema SHALL responder 400. Los campos `role`, `is_active` y `email` MUST NOT poder modificarse por esta via y SHALL producir 422.

#### Scenario: Consulta del perfil
- **WHEN** un usuario autenticado llama a `GET /api/v1/users/me`
- **THEN** recibe 200 con sus propios datos

#### Scenario: Cambio de nombre
- **WHEN** envia `PATCH /api/v1/users/me` con un `full_name` valido
- **THEN** recibe 200 con el usuario actualizado

#### Scenario: Cambio de password correcto
- **WHEN** envia `password` nueva valida y `current_password` correcta
- **THEN** recibe 200 y puede iniciar sesion con la nueva password

#### Scenario: Cambio de password con current_password incorrecta
- **WHEN** envia `password` con `current_password` ausente o incorrecta
- **THEN** recibe 400 y la password no cambia

#### Scenario: Intento de cambiar rol
- **WHEN** envia `role` o `is_active` en el `PATCH`
- **THEN** recibe 422 y el usuario no cambia

#### Scenario: Sin sesion
- **WHEN** se llama a cualquier endpoint de `/api/v1/users` sin token
- **THEN** el sistema responde 401

### Requirement: Consulta de usuarios por el admin
El sistema SHALL ofrecer solo al rol `admin` `GET /api/v1/users` (filtro opcional `role`, `page` por defecto 1, `page_size` por defecto 20 y maximo 100) con respuesta `items` (`id`, `email`, `full_name`, `role`, `is_active`, `created_at`), `total`, `page` y `page_size`, y `GET /api/v1/users/{id}`. Un cliente SHALL recibir 403 y un id inexistente 404.

#### Scenario: Listado como admin
- **WHEN** el admin llama a `GET /api/v1/users?role=cliente`
- **THEN** recibe 200 paginado solo con clientes

#### Scenario: Listado como cliente
- **WHEN** un cliente llama a `GET /api/v1/users`
- **THEN** recibe 403

#### Scenario: Usuario inexistente
- **WHEN** el admin llama a `GET /api/v1/users/{id}` con un id que no existe
- **THEN** recibe 404

#### Scenario: page_size excesivo
- **WHEN** se solicita `page_size` mayor que 100
- **THEN** el sistema responde 422

### Requirement: Pantalla de perfil
El frontend SHALL ofrecer `/profile`, accesible a cliente y admin autenticados, con el email en solo lectura, el nombre editable y un formulario de cambio de password. El header SHALL mostrar el nombre del usuario con enlace a `/profile`. La pantalla SHALL mostrar estados de carga y error, y los errores del backend (por ejemplo 400 por `current_password` incorrecta) inline.

#### Scenario: Edicion del nombre
- **WHEN** el usuario cambia su nombre y guarda
- **THEN** la pantalla confirma el cambio y el header muestra el nuevo nombre

#### Scenario: Password actual incorrecta
- **WHEN** el usuario envia el cambio de password con la actual incorrecta
- **THEN** la pantalla muestra el error inline

#### Scenario: Acceso sin sesion
- **WHEN** un visitante abre `/profile`
- **THEN** la app redirige a `/login`
