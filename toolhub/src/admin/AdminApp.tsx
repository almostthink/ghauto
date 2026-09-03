import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "../components/ui";
import { AdminLayout } from "./AdminLayout";
import { AnalyticsPage, CountriesPage, DownloadsPage } from "./AnalyticsPages";
import { AuthContext, can, useSession } from "./auth";
import { CategoriesAdmin } from "./CategoriesAdmin";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { PagesAdmin } from "./PagesAdmin";
import { ProductEditor } from "./ProductEditor";
import { ProductsList } from "./ProductsList";
import { ReviewsAdmin } from "./ReviewsAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { UsersAdmin } from "./UsersAdmin";
import type { Role } from "../lib/types";

// Client-side guard for a nicer message. The server enforces the same rule on
// every request, so a hand-typed URL gains nothing.
function Guard({ role, permission, children }: { role: Role | undefined; permission: string; children: React.ReactNode }) {
  if (!can(role, permission)) {
    return (
      <div className="dashboard">
        <div className="state-panel">
          <h3>Not available for your role</h3>
          <p>Ask a super admin if you need access to this section.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

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
          <Route
            path="products/new"
            element={<Guard role={user.role} permission="content.write"><ProductEditor /></Guard>}
          />
          <Route path="products/:id/edit" element={<ProductEditor />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="pages" element={<PagesAdmin />} />
          <Route path="reviews" element={<Guard role={user.role} permission="reviews.read"><ReviewsAdmin /></Guard>} />
          <Route path="users" element={<Guard role={user.role} permission="*"><UsersAdmin /></Guard>} />
          <Route path="downloads" element={<Guard role={user.role} permission="analytics.read"><DownloadsPage /></Guard>} />
          <Route path="analytics" element={<Guard role={user.role} permission="analytics.read"><AnalyticsPage /></Guard>} />
          <Route path="countries" element={<Guard role={user.role} permission="analytics.read"><CountriesPage /></Guard>} />
          <Route path="settings" element={<Guard role={user.role} permission="content.write"><SettingsAdmin /></Guard>} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </AdminLayout>
    </AuthContext.Provider>
  );
}
