## ADDED Requirements

### Requirement: Registro publico de clientes
El sistema SHALL permitir a un visitante registrarse con `POST /api/v1/auth/register` enviando `email`, `password` y `full_name`. El usuario creado SHALL tener siempre rol `cliente`. La password MUST tener al menos 8 caracteres, una mayuscula, una minuscula, un digito y un simbolo, y `full_name` entre 1 y 120 caracteres. La respuesta 201 SHALL contener `id`, `email`, `full_name` y `role`, nunca la password ni su hash.

#### Scenario: Registro valido
- **WHEN** un visitante envia email valido, password que cumple la politica y nombre valido
- **THEN** el sistema responde 201 con el usuario creado y rol `cliente`

#### Scenario: Email ya registrado
- **WHEN** se registra un email que ya existe, sin distinguir mayusculas
- **THEN** el sistema responde 409 con `{ "detail": "..." }`

#### Scenario: Datos invalidos
- **WHEN** la password no cumple la politica o el email no es valido
- **THEN** el sistema responde 422

#### Scenario: Intento de elevar el rol
- **WHEN** el cuerpo del registro incluye un campo `role` con valor `admin`
- **THEN** el usuario creado tiene rol `cliente`

### Requirement: Login con JWT en cookie HttpOnly
El sistema SHALL autenticar con `POST /api/v1/auth/login` (`email`, `password`). Si es correcto, SHALL responder 200 con `access_token`, `token_type` `bearer`, `expires_in` 7200 y `user` (`id`, `email`, `full_name`, `role`), y SHALL establecer la cookie `access_token` con `HttpOnly` y `SameSite=Lax`; `Secure` SHALL depender de la configuracion del entorno. El token SHALL ser un JWT firmado con claims `sub`, `role`, `exp` e `iat`, con `exp` igual a la emision mas 2 horas. La clave de firma y la duracion SHALL provenir de la configuracion del entorno.

#### Scenario: Login correcto
- **WHEN** el usuario envia credenciales validas
- **THEN** el sistema responde 200 con el token en el cuerpo y en la cookie `HttpOnly`, y `exp` es emision mas 2 horas

#### Scenario: Credenciales erroneas
- **WHEN** el email no existe o la password es incorrecta
- **THEN** el sistema responde 401 con un mensaje identico en ambos casos, sin revelar que campo falla

#### Scenario: Usuario inactivo
- **WHEN** las credenciales son correctas pero el usuario tiene `is_active` falso
- **THEN** el sistema responde 403

### Requirement: Consulta de sesion y logout
El sistema SHALL exponer `GET /api/v1/auth/me` que devuelve `id`, `email`, `full_name` y `role` del usuario autenticado, y `POST /api/v1/auth/logout` que, con sesion, responde 204 y borra la cookie `access_token`.

#### Scenario: Sesion valida
- **WHEN** se llama a `GET /api/v1/auth/me` con la cookie de sesion vigente
- **THEN** el sistema responde 200 con los datos del usuario

#### Scenario: Sin sesion
- **WHEN** se llama a `GET /api/v1/auth/me` o `POST /api/v1/auth/logout` sin token
- **THEN** el sistema responde 401

#### Scenario: Logout
- **WHEN** un usuario autenticado llama a `POST /api/v1/auth/logout`
- **THEN** el sistema responde 204 y la cookie queda borrada

### Requirement: Verificacion de token y control de acceso por rol
Todo endpoint protegido SHALL aceptar solo tokens validos, vigentes y de un usuario activo; un token ausente, manipulado o expirado SHALL producir 401. Los endpoints restringidos a un rol SHALL responder 403 cuando el usuario autenticado tiene otro rol.

#### Scenario: Token expirado o manipulado
- **WHEN** se llama a un endpoint protegido con un token expirado o con la firma alterada
- **THEN** el sistema responde 401

#### Scenario: Cliente en endpoint de admin
- **WHEN** un cliente autenticado llama a un endpoint exclusivo de admin
- **THEN** el sistema responde 403

#### Scenario: Visitante en endpoint de admin
- **WHEN** una peticion sin token llama a un endpoint exclusivo de admin
- **THEN** el sistema responde 401

### Requirement: Proteccion de credenciales
El sistema SHALL almacenar las passwords solo como hash bcrypt, y MUST NOT devolverlas ni escribirlas en logs. El token MUST NOT ser accesible desde JavaScript del navegador: el frontend SHALL NOT guardarlo en `localStorage` ni `sessionStorage`.

#### Scenario: Almacenamiento de password
- **WHEN** se crea un usuario
- **THEN** en base de datos solo existe el hash bcrypt de su password

#### Scenario: Token fuera del almacenamiento del navegador
- **WHEN** un usuario inicia sesion en el frontend
- **THEN** `localStorage` y `sessionStorage` no contienen el token

### Requirement: Pantallas de autenticacion y sesion en el frontend
El frontend SHALL ofrecer `/login` y `/register`. Tras login SHALL redirigir a `/` si el rol es `cliente` o a `/admin/products` si es `admin`; tras registro SHALL redirigir a `/login`. Los errores SHALL mostrarse inline y el formulario de registro SHALL indicar la politica de password. El header SHALL mostrar enlaces de login y registro sin sesion, o el nombre del usuario y un boton "Salir" con sesion. Al arrancar, la app SHALL consultar `GET /api/v1/auth/me` para hidratar la sesion. Las rutas protegidas SHALL redirigir a `/login` sin sesion, y las de admin SHALL mostrar una pantalla 403 a un cliente. Un 401 en cualquier llamada posterior SHALL limpiar la sesion y redirigir a `/login`.

#### Scenario: Login de cliente
- **WHEN** un cliente inicia sesion correctamente
- **THEN** la app redirige a `/` y el header muestra su nombre y "Salir"

#### Scenario: Login de admin
- **WHEN** el admin inicia sesion correctamente
- **THEN** la app redirige a `/admin/products`

#### Scenario: Credenciales erroneas en pantalla
- **WHEN** el backend responde 401 al login
- **THEN** el formulario muestra el error inline y permanece en `/login`

#### Scenario: Ruta protegida sin sesion
- **WHEN** un visitante abre una ruta protegida
- **THEN** la app redirige a `/login`

#### Scenario: Ruta de admin con cliente
- **WHEN** un cliente abre una ruta de admin
- **THEN** la app muestra la pantalla 403

#### Scenario: Sesion expirada
- **WHEN** una llamada a la API devuelve 401 con sesion activa en la app
- **THEN** la app limpia la sesion y redirige a `/login`
