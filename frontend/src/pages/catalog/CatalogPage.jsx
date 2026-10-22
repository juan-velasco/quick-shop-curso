import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProducts } from "../../api/products.js";
import Pagination from "../../components/Pagination.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFetch } from "../../useFetch.js";
import Notice from "../../components/Notice.jsx";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data, loading, error } = useFetch(
    () => listProducts({ q: query, page, page_size: PAGE_SIZE }),
    [query, page],
  );

  function handleAdd() {
    if (!user) {
      navigate("/login");
      return;
    }
    setNotice("El carrito estara disponible proximamente.");
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-display-md-sm md:text-display-md">Catalogo</h1>
        <div>
          <label htmlFor="search" className="sr-only">
            Buscar productos
          </label>
          <input
            id="search"
            type="search"
            placeholder="Buscar productos"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-control w-full rounded-md border border-control bg-surface px-3 py-2.5 placeholder:text-muted sm:w-72"
          />
        </div>
      </div>

      {notice && (
        <Notice variant="info">{notice}</Notice>
      )}

      {loading && <StateMessage kind="loading">Cargando productos...</StateMessage>}
      {!loading && error && <StateMessage kind="error">{error}</StateMessage>}
      {!loading && !error && data.items.length === 0 && (
        <StateMessage kind="empty">No se encontraron productos.</StateMessage>
      )}
      {!loading && !error && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canAdd={user?.role !== "admin"}
                onAdd={handleAdd}
              />
            ))}
          </div>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onChange={setPage} />
        </>
      )}
    </section>
  );
}
