# Modulo: carrito

## Descripcion

Carrito de compra persistente en BD, uno por cliente. Operaciones: agregar item, modificar cantidad, eliminar item, vaciar. El admin no tiene carrito: todos los endpoints devuelven 403 para el rol `admin`.

Reglas:

- No se puede tener en el carrito mas cantidad que el stock disponible del producto (se valida al agregar y al modificar).
- No se pueden agregar productos inactivos ni con stock 0.
- Agregar un producto ya presente suma cantidad (sujeto al limite de stock).
- El carrito se crea de forma perezosa al primer uso.
- El carrito no reserva stock; el stock se descuenta al crear el pedido (ver [pedidos.md](pedidos.md)).

## Modelo de datos

Tabla `carts`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK |
| user_id | integer | NOT NULL, UNIQUE, FK users(id) ON DELETE CASCADE |
| updated_at | timestamptz | NOT NULL, default now() |

Tabla `cart_items`:

| Columna | Tipo | Restricciones |
|---|---|---|
| id | integer | PK |
| cart_id | integer | NOT NULL, FK carts(id) ON DELETE CASCADE |
| product_id | integer | NOT NULL, FK products(id) |
| quantity | integer | NOT NULL, CHECK (quantity > 0) |

Restriccion unica: (`cart_id`, `product_id`).

## Endpoints

Prefijo: `/api/v1/cart`. Auth requerida, rol `cliente`.

Forma de respuesta comun (`CartOut`): `{ items: [{ id, product_id, name, image_url, unit_price, quantity, stock, subtotal }], total_items, total_amount }`. Importes como string decimal.

### GET /

- Response 200: `CartOut` (vacio si no hay items).
- Errores: 401; 403 (admin).

### POST /items

- Request: `{ "product_id": int, "quantity": int (>= 1) }`
- Response 201: `CartOut`.
- Errores: 401; 403; 404 producto no existe o inactivo; 409 cantidad total superaria el stock o stock 0; 422.

### PATCH /items/{item_id}

- Request: `{ "quantity": int (>= 1) }`
- Response 200: `CartOut`.
- Errores: 401; 403; 404 item no pertenece al carrito del usuario; 409 supera stock; 422.

### DELETE /items/{item_id}

- Response 200: `CartOut`.
- Errores: 401; 403; 404.

### DELETE /

- Vacia el carrito.
- Response 200: `CartOut` vacio.
- Errores: 401; 403.

## Criterios de aceptacion

1. Un cliente puede agregar, modificar, eliminar items y vaciar su carrito.
2. Agregar mas unidades que el stock devuelve 409 y no modifica el carrito.
3. Agregar el mismo producto dos veces suma cantidades respetando el stock.
4. Un cliente no puede ver ni modificar items del carrito de otro (404).
5. El admin recibe 403 en todos los endpoints del carrito.
6. Producto con stock 0 o inactivo no se puede agregar.
7. Los totales se calculan en backend con `Decimal`, 2 decimales.
8. El carrito persiste entre sesiones.

## Pantallas en el frontend

- `/cart`: lista de items (imagen, nombre, precio unitario, selector de cantidad limitado por stock, subtotal, boton eliminar), boton "Vaciar carrito", resumen con total y boton "Realizar pedido". Estado vacio con enlace al catalogo.
- Header: icono de carrito con contador de unidades. Oculto para el admin.
- Mensajes de error visibles cuando se supera el stock.
