import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { SiteShell } from "./components/SiteShell";
import { Spinner } from "./components/ui";
import { ADMIN_PATH } from "./lib/config";
import { DynamicPage } from "./pages/DynamicPage";
import { NotFound } from "./pages/NotFound";
import { ProductPage } from "./pages/ProductPage";
import { SearchPage } from "./pages/SearchPage";

// The admin panel is a separate chunk: visitors never download it, and there
// is no link to it anywhere on the public site.
const AdminApp = lazy(() => import("./admin/AdminApp").then((module) => ({ default: module.AdminApp })));

const site = (element: React.ReactNode) => <SiteShell>{element}</SiteShell>;

export function App() {
  return (
    <Routes>
      <Route
        path={`${ADMIN_PATH}/*`}
        element={
          <Suspense fallback={<div className="admin-boot"><Spinner size={22} /></div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="/" element={site(<DynamicPage slug="home" />)} />
      <Route path="/search" element={site(<SearchPage />)} />
      <Route path="/product/:slug" element={site(<ProductPage />)} />
      <Route path="/:slug" element={site(<DynamicPage />)} />
      <Route path="*" element={site(<NotFound />)} />
    </Routes>
  );
}
