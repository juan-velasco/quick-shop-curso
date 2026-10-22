import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-display-md-sm md:text-display-md">403</h1>
      <p className="mt-2 text-muted">No tienes permisos para ver esta pagina.</p>
      <Link to="/" className="mt-4 inline-block text-ink underline underline-offset-4">
        Volver al catalogo
      </Link>
    </section>
  );
}
