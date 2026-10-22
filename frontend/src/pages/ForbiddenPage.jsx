import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold">403</h1>
      <p className="mt-2 text-gray-700">No tienes permisos para ver esta pagina.</p>
      <Link to="/" className="mt-4 inline-block text-indigo-700 underline">
        Volver al catalogo
      </Link>
    </section>
  );
}
