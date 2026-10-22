# product-catalog Specification

## Purpose

Catalogo publico paginado y filtrable, seed de productos, gestion CRUD con borrado logico por el admin y pantallas de catalogo, detalle y administracion.

## Requirements

### Requirement: Modelo de producto y validaciones
El sistema SHALL persistir productos con `id`, `name` (hasta 150 caracteres, unico), `description`, `price` (decimal con 2 decimales, mayor que 0), `stock` (entero mayor o igual que 0), `image_url` (hasta 500 caracteres), `is_active` (por defecto verdadero), `created_at` y `updated_at`. Las restricciones de precio, stock y unicidad SHALL aplicarse tambien a nivel de base de datos. En JSON, `price` SHALL serializarse como string decimal (por ejemplo `"1299.99"`).

#### Scenario: Precio invalido
- **WHEN** se crea un producto con `price` menor o igual que 0 o con mas de 2 decimales
- **THEN** el sistema responde 422

#### Scenario: Stock negativo
- **WHEN** se crea o modifica un producto con `stock` menor que 0
- **THEN** el sistema responde 422 y la base de datos tambien lo rechazaria

#### Scenario: Precio como string
- **WHEN** cualquier endpoint devuelve un producto
- **THEN** `price` es un string decimal con 2 decimales

### Requirement: Seed de productos
Al arrancar con la base de datos sin productos, el sistema SHALL crear 20 productos a partir del fichero indicado por la variable de entorno `SEED_PRODUCTS_FILE`, mapeando `producto` a `name`, `descripcion` a `description`, `precio` a `price`, `stock` a `stock` e `imagen` a `image_url`. El seed MUST NOT repetirse si ya hay productos.

#### Scenario: Primer arranque
- **WHEN** el backend arranca con la tabla de productos vacia
- **THEN** existen 20 productos coincidentes con `docs/products-images.json`

#### Scenario: Reinicio
- **WHEN** el backend se reinicia con productos existentes
- **THEN** no se crean ni modifican productos

### Requirement: Catalogo paginado y filtrable
El sistema SHALL ofrecer a cualquier visitante, con o sin sesion, `GET /api/v1/products` con `q` (busqueda por nombre), `page` (por defecto 1) y `page_size` (por defecto 12, maximo 100), y respuesta `items` (`id`, `name`, `description`, `price`, `stock`, `image_url`, `is_active`), `total`, `page` y `page_size`. Los visitantes y clientes SHALL ver solo productos activos; el admin autenticado SHALL poder incluir inactivos con `include_inactive`, y para el resto ese parametro SHALL ignorarse. `GET /api/v1/products/{id}` SHALL requerir sesion y devolver el producto, y 404 si no existe o si esta inactivo y el usuario es cliente.

#### Scenario: Listado paginado
- **WHEN** un visitante o usuario autenticado llama a `GET /api/v1/products?page=1&page_size=12`
- **THEN** recibe 200 con hasta 12 productos y el `total` de productos visibles

#### Scenario: Busqueda por nombre
- **WHEN** envia `q=mouse`
- **THEN** solo recibe productos cuyo nombre contiene "mouse", sin distinguir mayusculas

#### Scenario: Producto inactivo oculto al cliente
- **WHEN** un cliente lista o consulta por id un producto con `is_active` falso
- **THEN** no aparece en el listado y el detalle responde 404

#### Scenario: Admin con inactivos
- **WHEN** el admin llama al listado con `include_inactive=true`
- **THEN** recibe tambien los productos inactivos

#### Scenario: Listado sin sesion
- **WHEN** un visitante sin token llama a `GET /api/v1/products`
- **THEN** recibe 200 con los productos activos

#### Scenario: include_inactive de un visitante
- **WHEN** un visitante o cliente envia `include_inactive=true`
- **THEN** el parametro se ignora y solo recibe productos activos

#### Scenario: Detalle sin sesion
- **WHEN** un visitante sin token llama a `GET /api/v1/products/{id}`
- **THEN** el sistema responde 401

### Requirement: Gestion de productos por el admin
El sistema SHALL permitir solo al rol `admin` crear (`POST /api/v1/products`, 201), reemplazar (`PUT /api/v1/products/{id}`, todos los campos obligatorios), modificar parcialmente (`PATCH /api/v1/products/{id}`) y eliminar (`DELETE /api/v1/products/{id}`, 204) productos. La eliminacion SHALL ser logica, poniendo `is_active` en falso y conservando el registro. Un nombre duplicado SHALL producir 409, un id inexistente 404, y un cliente 403.

#### Scenario: Creacion
- **WHEN** el admin envia un producto valido
- **THEN** el sistema responde 201 con el producto creado

#### Scenario: Nombre duplicado
- **WHEN** el admin crea o renombra un producto con un nombre ya existente
- **THEN** el sistema responde 409

#### Scenario: PATCH parcial
- **WHEN** el admin envia solo `stock`
- **THEN** solo ese campo cambia y el sistema responde 200

#### Scenario: Borrado logico
- **WHEN** el admin llama a `DELETE /api/v1/products/{id}`
- **THEN** el sistema responde 204, el producto queda con `is_active` falso y sigue existiendo en base de datos

#### Scenario: Cliente intenta modificar
- **WHEN** un cliente llama a POST, PUT, PATCH o DELETE de productos
- **THEN** el sistema responde 403

### Requirement: Catalogo y detalle en el frontend
El frontend SHALL mostrar en `/`, accesible sin sesion, una rejilla responsive de tarjetas (imagen, nombre, precio, stock y boton "Agregar al carrito"), con buscador y paginacion. Un producto con stock 0 SHALL mostrarse con la etiqueta "Agotado" y el boton deshabilitado. `/products/:id` SHALL mostrar la descripcion, un selector de cantidad con maximo igual al stock y el boton de agregar. Los precios SHALL formatearse con `Intl.NumberFormat`. Cada pantalla SHALL tener estados de carga, vacio y error. Mientras no exista el modulo de carrito, el boton de agregar no SHALL persistir nada en el backend.

#### Scenario: Producto agotado
- **WHEN** un producto tiene stock 0
- **THEN** su tarjeta muestra "Agotado" y el boton esta deshabilitado

#### Scenario: Busqueda y paginacion
- **WHEN** el usuario escribe en el buscador o cambia de pagina
- **THEN** el catalogo se actualiza con los resultados correspondientes

#### Scenario: Cantidad limitada por stock
- **WHEN** el usuario abre el detalle de un producto con stock 5
- **THEN** el selector no permite una cantidad mayor que 5

#### Scenario: Catalogo sin sesion
- **WHEN** un visitante abre `/`
- **THEN** ve el catalogo sin ser redirigido a `/login`

#### Scenario: Detalle sin sesion
- **WHEN** un visitante abre `/products/:id`
- **THEN** la app redirige a `/login`

#### Scenario: Catalogo vacio
- **WHEN** la busqueda no produce resultados
- **THEN** la pantalla muestra el estado vacio

### Requirement: Administracion de productos en el frontend
El frontend SHALL ofrecer solo al admin `/admin/products` (tabla con todos los productos incluidos los inactivos, acciones editar y desactivar, y boton "Nuevo producto"), `/admin/products/new` y `/admin/products/:id/edit` (formulario con validacion de precio, stock y URL de imagen). Un cliente SHALL ver la pantalla 403. Los errores del backend (por ejemplo 409 por nombre duplicado) SHALL mostrarse en el formulario.

#### Scenario: Crear producto
- **WHEN** el admin completa el formulario con datos validos y guarda
- **THEN** el producto se crea y la app vuelve a la tabla mostrandolo

#### Scenario: Validacion de formulario
- **WHEN** el admin introduce un precio menor o igual que 0 o un stock negativo
- **THEN** el formulario muestra el error y no envia la peticion

#### Scenario: Desactivar producto
- **WHEN** el admin pulsa desactivar en un producto
- **THEN** la tabla lo muestra como inactivo y deja de aparecer en el catalogo de clientes

#### Scenario: Cliente en pantalla de admin
- **WHEN** un cliente abre `/admin/products`
- **THEN** la app muestra la pantalla 403
