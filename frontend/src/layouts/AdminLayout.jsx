import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="space-y-4">
      <nav aria-label="Administracion" className="flex gap-4 border-b border-gray-200 pb-2">
        <NavLink to="/admin/products" className="font-medium text-indigo-700">
          Productos
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
