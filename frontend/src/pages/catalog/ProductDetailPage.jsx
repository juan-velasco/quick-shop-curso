import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../../api/products.js";
import Button from "../../components/Button.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../format.js";
import { useFetch } from "../../useFetch.js";

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
      <img src={product.image_url} alt={product.name} className="w-full rounded-lg object-cover" />
      <div className="space-y-4">
        <Link to="/" className="text-sm text-indigo-700 underline">
          Volver al catalogo
        </Link>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-gray-700">{product.description}</p>
        <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
        {soldOut ? (
          <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-800">Agotado</span>
        ) : (
          <p className="text-sm text-gray-600">Stock: {product.stock}</p>
        )}
        {user?.role !== "admin" && (
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium">
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
                className="w-24 rounded border border-gray-300 px-3 py-2"
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
          <p role="status" className="text-sm text-indigo-800">
            {notice}
          </p>
        )}
      </div>
    </article>
  );
}
