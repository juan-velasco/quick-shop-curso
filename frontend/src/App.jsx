import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import ProductFormPage from "./pages/admin/ProductFormPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import CatalogPage from "./pages/catalog/CatalogPage.jsx";
import ProductDetailPage from "./pages/catalog/ProductDetailPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
