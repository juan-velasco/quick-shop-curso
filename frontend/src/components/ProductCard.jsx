import { Link } from "react-router-dom";
import { formatPrice } from "../format.js";
import Button from "./Button.jsx";

export default function ProductCard({ product, canAdd = true, onAdd }) {
  const soldOut = product.stock === 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-semibold">
          <Link to={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h2>
        <p className="text-lg font-bold">{formatPrice(product.price)}</p>
        <p className="text-sm text-gray-600">
          {soldOut ? (
            <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-800">Agotado</span>
          ) : (
            `Stock: ${product.stock}`
          )}
        </p>
        {canAdd && (
          <Button className="mt-auto" disabled={soldOut} onClick={() => onAdd?.(product)}>
            Agregar al carrito
          </Button>
        )}
      </div>
    </article>
  );
}
