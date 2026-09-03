import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "../components/ui";
import { AdminLayout } from "./AdminLayout";
import { AnalyticsPage, CountriesPage, DownloadsPage } from "./AnalyticsPages";
import { AuthContext, useSession } from "./auth";
import { CategoriesAdmin } from "./CategoriesAdmin";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { PagesAdmin } from "./PagesAdmin";
import { ProductEditor } from "./ProductEditor";
import { ProductsList } from "./ProductsList";
import { ReviewsAdmin } from "./ReviewsAdmin";
import { SettingsAdmin } from "./SettingsAdmin";

export function AdminApp() {
  const { user, loading } = useSession();

  // Search engines must never index the panel, even if the path leaks.
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  if (loading) {
    return <div className="admin-boot"><Spinner size={22} /></div>;
  }
  if (!user) return <Login />;

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <AdminLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id/edit" element={<ProductEditor />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="pages" element={<PagesAdmin />} />
          <Route path="reviews" element={<ReviewsAdmin />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="countries" element={<CountriesPage />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </AdminLayout>
    </AuthContext.Provider>
  );
}
