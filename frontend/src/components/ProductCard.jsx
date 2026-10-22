import { Link } from "react-router-dom";
import { formatPrice } from "../format.js";
import Button from "./Button.jsx";
import Tag from "./Tag.jsx";

export default function ProductCard({ product, canAdd = true, onAdd }) {
  const soldOut = product.stock === 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-card">
      <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h2 className="text-heading-md">
          <Link to={`/products/${product.id}`} className="underline-offset-4 hover:underline">
            {product.name}
          </Link>
        </h2>
        <p className="text-heading-lg">{formatPrice(product.price)}</p>
        <p className="text-caption text-muted">
          {soldOut ? <Tag variant="shade">Agotado</Tag> : `Stock: ${product.stock}`}
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
