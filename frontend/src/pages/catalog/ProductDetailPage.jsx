import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../../api/products.js";
import Button from "../../components/Button.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../format.js";
import { useFetch } from "../../useFetch.js";
import Notice from "../../components/Notice.jsx";
import Tag from "../../components/Tag.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: product, loading, error } = useFetch(() => getProduct(id), [id]);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  if (loading) return <StateMessage kind="loading">Cargando producto...</StateMessage>;
  if (error) return <StateMessage kind="error">{error}</StateMessage>;

  const soldOut = product.stock === 0;

  function handleQuantity(event) {
    const value = Math.floor(Number(event.target.value));
    if (Number.isNaN(value)) return;
    setQuantity(Math.min(Math.max(value, 1), product.stock));
  }

  return (
    <article className="grid gap-6 md:grid-cols-2">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full rounded-lg border border-hairline object-cover"
      />
      <div className="space-y-4">
        <Link to="/" className="text-caption text-ink underline underline-offset-4">
          Volver al catalogo
        </Link>
        <h1 className="text-display-md-sm md:text-display-md">{product.name}</h1>
        <p className="text-body-lg text-muted">{product.description}</p>
        <p className="text-heading-xl">{formatPrice(product.price)}</p>
        {soldOut ? (
          <Tag variant="shade">Agotado</Tag>
        ) : (
          <p className="text-caption text-muted">Stock: {product.stock}</p>
        )}
        {user?.role !== "admin" && (
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor="quantity" className="block text-body-strong">
                Cantidad
              </label>
              <input
                id="quantity"
                type="number"
                min={soldOut ? 0 : 1}
                max={product.stock}
                value={soldOut ? 0 : quantity}
                disabled={soldOut}
                onChange={handleQuantity}
                className="min-h-control w-24 rounded-md border border-control bg-surface px-3 py-2.5 disabled:bg-canvas disabled:text-muted"
              />
            </div>
            <Button
              disabled={soldOut}
              onClick={() => setNotice("El carrito estara disponible proximamente.")}
            >
              Agregar al carrito
            </Button>
          </div>
        )}
        {notice && (
          <Notice variant="info">{notice}</Notice>
        )}
      </div>
    </article>
  );
}
