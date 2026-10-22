# Modulo: productos

## Descripcion

Catalogo de productos con listado publico (visible sin sesion), detalle para usuarios autenticados y CRUD completo para el admin. Un producto con stock 0 es visible pero no se puede agregar al carrito. Un producto con `is_active = false` no aparece en el catalogo de clientes (el admin lo ve igualmente).

Seed: 20 productos generados desde `docs/products-images.json`, con mapeo `producto -> name`, `descripcion -> description`, `precio -> price`, `stock -> stock`, `imagen -> image_url`. La ruta del fichero se configura por variable de entorno (`SEED_PRODUCTS_FILE`) y el fichero se monta/copia en la imagen del backend.

## Modelo de datos

Tabla `products`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK, autoincremental |
| name | varchar(150) | NOT NULL, UNIQUE |
| description | text | NOT NULL |
| price | numeric(10,2) | NOT NULL, CHECK (price > 0) |
| stock | integer | NOT NULL, CHECK (stock >= 0) |
| image_url | varchar(500) | NOT NULL |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

Indices: `is_active`, `name`.

En Python `price` es `Decimal` con 2 decimales; en JSON se serializa como string (`"1299.99"`) para no perder precision.

## Endpoints

Prefijo: `/api/v1/products`.

### GET /

- Auth: publico (no requiere sesion). Un token ausente o invalido se trata como visitante.
- Query: `q?` (busqueda por nombre), `page` (default 1), `page_size` (default 12, max 100), `include_inactive?` (solo lo respeta un admin autenticado; para el resto se ignora).
- Response 200: `{ items: [{ id, name, description, price, stock, image_url, is_active }], total, page, page_size }`
- Errores: 422.

### GET /{id}

- Auth: cualquier usuario autenticado.
- Response 200: producto.
- Errores: 401; 404 (tambien si esta inactivo y el usuario es cliente).

### POST / (solo admin)

- Request: `{ name, description, price, stock, image_url, is_active? }`
- Response 201: producto creado.
- Errores: 401; 403; 409 nombre duplicado; 422 (precio <= 0, stock < 0, mas de 2 decimales).

### PUT /{id} (solo admin)

- Request: mismos campos que POST (todos obligatorios).
- Response 200: producto actualizado.
- Errores: 401; 403; 404; 409; 422.

### PATCH /{id} (solo admin)

- Request: cualquier subconjunto de campos.
- Response 200: producto actualizado.
- Errores: 401; 403; 404; 409; 422.

### DELETE /{id} (solo admin)

- Borrado logico: pone `is_active = false` (conserva integridad con pedidos historicos).
- Response 204.
- Errores: 401; 403; 404.

## Criterios de aceptacion

1. Tras el primer arranque existen 20 productos coincidentes con `docs/products-images.json`.
2. El seed no se repite si la BD ya tiene datos.
3. `price` rechaza valores <= 0 y mas de 2 decimales; `stock` rechaza negativos (tambien a nivel BD con CHECK).
4. Un producto con stock 0 aparece en el catalogo con el boton de agregar deshabilitado y etiqueta "Agotado".
5. Un producto inactivo no es visible ni accesible para clientes.
6. Solo el admin crea, edita o elimina productos; un cliente recibe 403.
7. Eliminar un producto que figura en pedidos no rompe esos pedidos (borrado logico).
8. El catalogo es paginado y filtrable por texto.

## Pantallas en el frontend

- `/` (catalogo, publico): rejilla responsive de tarjetas (imagen, nombre, precio, stock, boton "Agregar al carrito"), buscador y paginacion. Boton deshabilitado y etiqueta "Agotado" con stock 0.
- `/products/:id` (requiere sesion): detalle con descripcion, selector de cantidad (maximo = stock) y boton agregar.
- `/admin/products`: tabla con todos los productos (incluye inactivos), acciones editar y desactivar, boton "Nuevo producto". Solo admin.
- `/admin/products/new` y `/admin/products/:id/edit`: formulario con validacion de precio, stock y URL de imagen.
