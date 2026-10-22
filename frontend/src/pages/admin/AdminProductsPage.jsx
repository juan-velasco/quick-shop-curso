import { useState } from "react";
import { Link } from "react-router-dom";
import { deactivateProduct, listProducts } from "../../api/products.js";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { formatPrice } from "../../format.js";
import { useFetch } from "../../useFetch.js";

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { data, loading, error, reload } = useFetch(
    () => listProducts({ include_inactive: true, page, page_size: PAGE_SIZE }),
    [page],
  );

  async function handleDeactivate(product) {
    setActionError("");
    try {
      await deactivateProduct(product.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link
          to="/admin/products/new"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nuevo producto
        </Link>
      </div>

      {actionError && <StateMessage kind="error">{actionError}</StateMessage>}
      {loading && <StateMessage kind="loading">Cargando productos...</StateMessage>}
      {!loading && error && <StateMessage kind="error">{error}</StateMessage>}
      {!loading && !error && data.items.length === 0 && (
        <StateMessage kind="empty">No hay productos.</StateMessage>
      )}
      {!loading && !error && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse bg-white text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Precio</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{formatPrice(product.price)}</td>
                    <td className="p-2">{product.stock}</td>
                    <td className="p-2">{product.is_active ? "Activo" : "Inactivo"}</td>
                    <td className="flex gap-2 p-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100"
                        aria-label={`Editar ${product.name}`}
                      >
                        Editar
                      </Link>
                      <Button
                        variant="danger"
                        disabled={!product.is_active}
                        onClick={() => handleDeactivate(product)}
                        aria-label={`Desactivar ${product.name}`}
                      >
                        Desactivar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onChange={setPage} />
        </>
      )}
    </section>
  );
}
