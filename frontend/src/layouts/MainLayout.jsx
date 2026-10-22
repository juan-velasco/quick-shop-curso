import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import Button from "../components/Button.jsx";
import LinkButton from "../components/LinkButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `flex min-h-control items-center rounded-pill px-4 text-body-md hover:bg-canvas ${
    isActive ? "underline underline-offset-8" : ""
  }`;

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-heading-lg">
            QuickShop
          </Link>
          <button
            type="button"
            className="min-h-control rounded-pill border border-ink bg-surface px-6 text-body-md md:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
          <nav
            aria-label="Principal"
            className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-[4.5rem] z-10 flex-col gap-2 border-b border-hairline bg-surface p-6 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:p-0`}
          >
            <div className="flex flex-col gap-1 md:mx-auto md:flex-row">
              <NavLink to="/" end className={linkClass}>
                Catalogo
              </NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin/products" className={linkClass}>
                  Administracion
                </NavLink>
              )}
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
                  <LinkButton to="/login" variant="secondary">
                    Iniciar sesion
                  </LinkButton>
                  <LinkButton to="/register">Registrarse</LinkButton>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-hairline bg-surface px-6 py-8 text-center text-caption text-muted">
        QuickShop
      </footer>
    </div>
  );
}
