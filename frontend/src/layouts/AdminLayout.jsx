import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="space-y-6">
      <nav aria-label="Administracion" className="flex gap-4 border-b border-hairline pb-3">
        <NavLink
          to="/admin/products"
          className={({ isActive }) =>
            `flex min-h-control items-center rounded-pill px-4 text-body-strong ${
              isActive ? "bg-aloe" : "hover:bg-surface"
            }`
          }
        >
          Productos
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
