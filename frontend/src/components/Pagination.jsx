import Button from "./Button.jsx";

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label="Paginacion" className="mt-6 flex items-center justify-center gap-4">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="text-sm">
        Pagina {page} de {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </nav>
  );
}
