import { useState } from "react";
import { Link } from "react-router-dom";
import { deactivateProduct, listProducts } from "../../api/products.js";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { formatPrice } from "../../format.js";
import { useFetch } from "../../useFetch.js";
import LinkButton from "../../components/LinkButton.jsx";
import Tag from "../../components/Tag.jsx";

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-md-sm md:text-display-md">Productos</h1>
        <LinkButton to="/admin/products/new">Nuevo producto</LinkButton>
      </div>

      {actionError && <StateMessage kind="error">{actionError}</StateMessage>}
      {loading && <StateMessage kind="loading">Cargando productos...</StateMessage>}
      {!loading && error && <StateMessage kind="error">{error}</StateMessage>}
      {!loading && !error && data.items.length === 0 && (
        <StateMessage kind="empty">No hay productos.</StateMessage>
      )}
      {!loading && !error && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full min-w-[40rem] border-collapse text-left text-body-md">
              <caption className="sr-only">Listado de productos</caption>
              <thead>
                <tr className="border-b border-hairline text-body-strong">
                  <th scope="col" className="p-3">Nombre</th>
                  <th scope="col" className="p-3">Precio</th>
                  <th scope="col" className="p-3">Stock</th>
                  <th scope="col" className="p-3">Estado</th>
                  <th scope="col" className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id} className="border-b border-hairline last:border-0">
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{formatPrice(product.price)}</td>
                    <td className="p-3">{product.stock}</td>
                    <td className="p-3">
                      <Tag variant={product.is_active ? "mint" : "shade"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Tag>
                    </td>
                    <td className="flex gap-2 p-3">
                      <LinkButton
                        to={`/admin/products/${product.id}/edit`}
                        variant="secondary"
                        aria-label={`Editar ${product.name}`}
                      >
                        Editar
                      </LinkButton>
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
