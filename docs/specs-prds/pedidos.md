# Modulo: pedidos

## Descripcion

Creacion de pedidos a partir del carrito, historial del cliente y gestion de estados por el admin.

Estados: `pendiente`, `confirmado`, `enviado`, `entregado`, `cancelado`.

Transiciones permitidas:

| Desde | Hacia | Quien |
|---|---|---|
| pendiente | confirmado | admin |
| confirmado | enviado | admin |
| enviado | entregado | admin |
| pendiente, confirmado, enviado | cancelado | admin |
| pendiente | cancelado | cliente propietario (unica excepcion) |

`entregado` y `cancelado` son estados finales.

Reglas de stock (todas dentro de una transaccion, con bloqueo de filas de producto `SELECT ... FOR UPDATE`):

- Crear pedido desde el carrito: valida stock, descuenta stock de cada producto, vacia el carrito y deja el pedido en `pendiente`. Si algun producto no tiene stock suficiente, se aborta todo (409) y no cambia nada.
- Confirmar: el stock ya esta descontado desde la creacion; la confirmacion no vuelve a descontar (evita doble descuento). 
- Cancelar un pedido `confirmado` o `enviado`: restituye el stock.
- Cancelar un pedido `pendiente`: restituye el stock, porque se descuenta al crear.
- Cancelar nunca restituye dos veces (estado final).

DECISION A VALIDAR: el enunciado original dice a la vez que crear descuenta stock y que confirmar descuenta stock, y solo menciona restitucion para confirmado/enviado. Para que el inventario sea consistente se asume descuento unico en la creacion y restitucion en cualquier cancelacion. Si se prefiere descuento en confirmacion, cambiar este bloque y los criterios 2, 3 y 6.

El precio unitario se copia al pedido (`unit_price`) para conservar el historico aunque el producto cambie.

## Modelo de datos

Tabla `orders`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK |
| user_id | integer | NOT NULL, FK users(id) |
| status | enum(`pendiente`, `confirmado`, `enviado`, `entregado`, `cancelado`) | NOT NULL, default `pendiente` |
| total_amount | numeric(12,2) | NOT NULL, CHECK (total_amount >= 0) |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

Indices: `user_id`, `status`, `created_at`.

Tabla `order_items`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK |
| order_id | integer | NOT NULL, FK orders(id) ON DELETE CASCADE |
| product_id | integer | NOT NULL, FK products(id) |
| product_name | varchar(150) | NOT NULL (copia historica) |
| unit_price | numeric(10,2) | NOT NULL, CHECK (unit_price > 0) |
| quantity | integer | NOT NULL, CHECK (quantity > 0) |

## Endpoints

Prefijo: `/api/v1/orders`. Auth requerida.

Forma comun (`OrderOut`): `{ id, status, total_amount, created_at, user: { id, email, full_name }, items: [{ product_id, product_name, unit_price, quantity, subtotal }] }`.

### POST / (cliente)

- Request: sin cuerpo (usa el carrito del usuario).
- Response 201: `OrderOut` con estado `pendiente`.
- Errores: 401; 403 admin; 400 carrito vacio; 409 stock insuficiente (detalle del producto afectado).

### GET /me (cliente)

- Query: `status?`, `page`, `page_size`.
- Response 200: `{ items: [OrderOut], total, page, page_size }` ordenado por fecha descendente.
- Errores: 401; 403 admin.

### GET /{id}

- Cliente: solo sus pedidos. Admin: cualquiera.
- Response 200: `OrderOut`.
- Errores: 401; 404 (pedido ajeno para un cliente se trata como inexistente).

### POST /{id}/cancel (cliente)

- Request: sin cuerpo.
- Response 200: `OrderOut` en `cancelado`.
- Errores: 401; 403 admin; 404 no es suyo; 409 el pedido no esta `pendiente`.

### GET / (admin)

- Query: `status?`, `user_id?`, `page`, `page_size`.
- Response 200: lista paginada de `OrderOut`.
- Errores: 401; 403.

### PATCH /{id}/status (admin)

- Request: `{ "status": "confirmado" | "enviado" | "entregado" | "cancelado" }`
- Response 200: `OrderOut`.
- Errores: 401; 403; 404; 409 transicion no permitida; 422 estado invalido.

## Criterios de aceptacion

1. Crear pedido con carrito valido: pedido `pendiente`, stock descontado, carrito vacio, `total_amount` igual a la suma de subtotales.
2. Crear pedido con carrito vacio devuelve 400; con stock insuficiente devuelve 409 sin efectos parciales.
3. Dos pedidos concurrentes sobre el ultimo stock: uno tiene exito, el otro recibe 409 (bloqueo de filas).
4. El cliente solo ve y cancela sus pedidos, y solo en estado `pendiente`; en otro estado recibe 409.
5. Solo el admin cambia estados; un cliente que llama a `PATCH /{id}/status` recibe 403.
6. Cancelar (cliente o admin) restituye el stock exactamente una vez.
7. Transiciones fuera de la tabla devuelven 409 (por ejemplo `enviado` a `pendiente`, o salir de `cancelado`).
8. El historial conserva nombre y precio del producto aunque este se edite o desactive.
9. El admin lista pedidos de todos los clientes con filtros.

## Pantallas en el frontend

- `/orders`: historial del cliente (numero, fecha, estado con badge, total). Enlace al detalle.
- `/orders/:id`: detalle con items y total. Boton "Cancelar pedido" visible solo si el estado es `pendiente`, con confirmacion.
- `/admin/orders`: tabla de todos los pedidos con filtro por estado y cliente.
- `/admin/orders/:id`: detalle con selector de nuevo estado limitado a transiciones validas.
- Confirmacion de pedido tras "Realizar pedido" en el carrito: redirige a `/orders/:id`.
