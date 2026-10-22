import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProduct, updateProduct } from "../../api/products.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import StateMessage from "../../components/StateMessage.jsx";

const EMPTY = { name: "", description: "", price: "", stock: "", image_url: "", is_active: true };

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProduct(form) {
  const errors = {};
  if (!form.name.trim() || form.name.length > 150) errors.name = "El nombre es obligatorio (maximo 150 caracteres).";
  if (!form.description.trim()) errors.description = "La descripcion es obligatoria.";
  if (!/^\d+(\.\d{1,2})?$/.test(form.price) || Number(form.price) <= 0) {
    errors.price = "El precio debe ser mayor que 0 y tener como maximo 2 decimales.";
  }
  if (!/^\d+$/.test(form.stock)) errors.stock = "El stock debe ser un entero mayor o igual que 0.";
  if (!isValidUrl(form.image_url) || form.image_url.length > 500) {
    errors.image_url = "Introduce una URL de imagen valida (http o https).";
  }
  return errors;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    getProduct(id)
      .then((product) => {
        if (!active) return;
        setForm({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: String(product.stock),
          image_url: product.image_url,
          is_active: product.is_active,
        });
      })
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editing, id]);

  if (loading) return <StateMessage kind="loading">Cargando producto...</StateMessage>;
  if (loadError) return <StateMessage kind="error">{loadError}</StateMessage>;

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const found = validateProduct(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      stock: Number(form.stock),
      image_url: form.image_url,
      is_active: form.is_active,
    };
    setSubmitting(true);
    try {
      if (editing) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate("/admin/products");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-xl space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-heading-xl">{editing ? "Editar producto" : "Nuevo producto"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField id="name" label="Nombre" value={form.name} onChange={update("name")} error={errors.name} />
        <div className="space-y-1">
          <label htmlFor="description" className="block text-body-strong">
            Descripcion
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={update("description")}
            aria-invalid={errors.description ? "true" : undefined}
            aria-describedby={errors.description ? "description-error" : undefined}
            className="w-full rounded-md border border-control bg-surface px-3 py-2.5 text-body-md"
          />
          {errors.description && (
            <p id="description-error" className="text-caption font-semibold text-danger">
              {errors.description}
            </p>
          )}
        </div>
        <FormField
          id="price"
          label="Precio"
          inputMode="decimal"
          value={form.price}
          onChange={update("price")}
          error={errors.price}
        />
        <FormField
          id="stock"
          label="Stock"
          inputMode="numeric"
          value={form.stock}
          onChange={update("stock")}
          error={errors.stock}
        />
        <FormField
          id="image_url"
          label="URL de la imagen"
          value={form.image_url}
          onChange={update("image_url")}
          error={errors.image_url}
        />
        <label className="flex min-h-control items-center gap-3 text-body-md">
          <input
            type="checkbox"
            className="h-5 w-5 accent-black"
            checked={form.is_active}
            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
          />
          Producto activo
        </label>
        {formError && (
          <p role="alert" className="text-caption font-semibold text-danger">
            {formError}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            Guardar
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin/products")}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
