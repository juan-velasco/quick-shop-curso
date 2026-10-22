## ADDED Requirements

### Requirement: Solicitud de recuperacion
El sistema SHALL ofrecer `POST /api/v1/auth/forgot-password` con `{ "email": EmailStr }`, sin requerir sesion. Siempre SHALL responder 202 con el mismo cuerpo generico, exista o no el email, para no revelar que cuentas existen. Si existe un usuario activo con ese email, el sistema SHALL enviarle un email con un enlace de recuperacion. Un email con formato invalido SHALL producir 422.

#### Scenario: Email existente
- **WHEN** se solicita la recuperacion de un email registrado y activo
- **THEN** el sistema responde 202 y se entrega un email con un enlace de recuperacion a esa direccion

#### Scenario: Email inexistente
- **WHEN** se solicita la recuperacion de un email no registrado
- **THEN** el sistema responde 202 con el mismo cuerpo y no se envia ningun email

#### Scenario: Usuario inactivo
- **WHEN** se solicita la recuperacion de un usuario con `is_active` falso
- **THEN** el sistema responde 202 y no se envia ningun email

#### Scenario: Formato de email invalido
- **WHEN** el email no tiene formato valido
- **THEN** el sistema responde 422

### Requirement: Token de recuperacion de un solo uso y con caducidad
El enlace SHALL contener un token aleatorio e impredecible. El sistema MUST almacenar solo un hash del token, nunca el token en claro. El token SHALL caducar a los 60 minutos (configurable por entorno) y SHALL poder usarse una sola vez. Una nueva solicitud para el mismo usuario SHALL invalidar los tokens anteriores aun no usados.

#### Scenario: Token valido
- **WHEN** se usa un token vigente y no utilizado
- **THEN** el restablecimiento se acepta

#### Scenario: Token caducado
- **WHEN** se usa un token pasado su tiempo de vida
- **THEN** el sistema responde 400

#### Scenario: Token reutilizado
- **WHEN** se usa por segunda vez un token ya consumido
- **THEN** el sistema responde 400

#### Scenario: Solicitud posterior invalida la anterior
- **WHEN** un usuario solicita la recuperacion dos veces y usa el token de la primera solicitud
- **THEN** el sistema responde 400

#### Scenario: Token no almacenado en claro
- **WHEN** se genera un token de recuperacion
- **THEN** la base de datos no contiene el valor del token, solo su hash

### Requirement: Restablecimiento de password
El sistema SHALL ofrecer `POST /api/v1/auth/reset-password` con `{ "token": str, "password": str }`, sin requerir sesion. La nueva password SHALL cumplir la politica de password del sistema (422 si no). Con un token valido SHALL cambiar la password, consumir el token y responder 204. Un token invalido, caducado o ya usado SHALL producir 400 con un mensaje generico.

#### Scenario: Restablecimiento correcto
- **WHEN** se envia un token valido y una password que cumple la politica
- **THEN** el sistema responde 204 y el usuario puede iniciar sesion con la nueva password y no con la anterior

#### Scenario: Password que no cumple la politica
- **WHEN** se envia un token valido y una password debil
- **THEN** el sistema responde 422 y el token sigue siendo utilizable

#### Scenario: Token invalido
- **WHEN** se envia un token inexistente o manipulado
- **THEN** el sistema responde 400

### Requirement: Email de recuperacion
El email SHALL estar en castellano, dirigido a la direccion del usuario y contener el enlace `<FRONTEND_URL>/reset-password?token=<token>` y el tiempo de validez. La configuracion del servidor SMTP y de la URL del frontend SHALL provenir de variables de entorno. Un fallo en el envio MUST NOT revelar al solicitante si el email existe: la respuesta sigue siendo 202.

#### Scenario: Contenido del email
- **WHEN** se envia el email de recuperacion
- **THEN** el mensaje contiene el enlace al frontend con el token y la indicacion de caducidad

#### Scenario: Fallo del servidor SMTP
- **WHEN** el servidor SMTP no esta disponible al solicitar la recuperacion de un email existente
- **THEN** el sistema responde 202 igualmente y registra el error sin incluir el token

### Requirement: Entorno local con Mailhog
El entorno de docker-compose SHALL incluir un servicio Mailhog que reciba el correo saliente del backend y exponga una interfaz web para consultarlo, de modo que el flujo completo pueda probarse en local sin enviar correo real.

#### Scenario: Correo visible en Mailhog
- **WHEN** se solicita la recuperacion de un usuario del seed con docker-compose levantado
- **THEN** el email aparece en la interfaz web de Mailhog con el enlace de recuperacion

### Requirement: Pantallas de recuperacion en el frontend
El frontend SHALL ofrecer un enlace "Has olvidado tu password?" en `/login` hacia `/forgot-password`, que muestra un formulario de email y, tras enviarlo, un mensaje generico de confirmacion (el mismo para cualquier email). `/reset-password?token=...` SHALL mostrar un formulario de nueva password con confirmacion e indicacion de la politica; tras exito SHALL redirigir a `/login` con un aviso, y ante un 400 SHALL mostrar el error inline con un enlace para solicitar un nuevo enlace. Ambas rutas SHALL ser publicas.

#### Scenario: Solicitud desde la pantalla
- **WHEN** el usuario envia su email en `/forgot-password`
- **THEN** la pantalla muestra el mensaje generico de confirmacion

#### Scenario: Restablecimiento desde el enlace
- **WHEN** el usuario abre el enlace del email, introduce una password valida y la confirma
- **THEN** la app redirige a `/login` con aviso de exito

#### Scenario: Passwords que no coinciden
- **WHEN** la confirmacion no coincide con la password
- **THEN** el formulario muestra el error y no envia la peticion

#### Scenario: Enlace caducado
- **WHEN** el backend responde 400 al restablecer
- **THEN** la pantalla muestra el error y un enlace a `/forgot-password`

#### Scenario: Enlace sin token
- **WHEN** el usuario abre `/reset-password` sin parametro `token`
- **THEN** la pantalla indica que el enlace no es valido y ofrece solicitar uno nuevo
