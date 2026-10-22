import { Navigate, Outlet, useLocation } from "react-router-dom";
import StateMessage from "../components/StateMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ForbiddenPage from "../pages/ForbiddenPage.jsx";

export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <StateMessage kind="loading">Cargando...</StateMessage>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== "admin") return <ForbiddenPage />;
  return <Outlet />;
}
