import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = "block rounded px-3 py-2 hover:bg-gray-100";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-indigo-700">
            QuickShop
          </Link>
          <button
            type="button"
            className="rounded border border-gray-300 px-3 py-1 md:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
          <nav
            aria-label="Principal"
            className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-14 flex-col gap-1 border-b bg-white p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}
          >
            <NavLink to="/" end className={linkClass}>
              Catalogo
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin/products" className={linkClass}>
                Administracion
              </NavLink>
            )}
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass}>
                  {user.full_name}
                </NavLink>
                <Button variant="secondary" onClick={logout}>
                  Salir
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Iniciar sesion
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Registrarse
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
        QuickShop
      </footer>
    </div>
  );
}
