import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BarChart3, Download, FileText, Globe, Grid2X2, LayoutDashboard, LogOut, Menu,
  Package, Settings, Star, X
} from "lucide-react";
import type { ReactNode } from "react";
import { adminUrl } from "../lib/config";
import { useAuth, useLogout } from "./auth";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  group: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", to: "", icon: LayoutDashboard, group: "MANAGE" },
  { label: "Products", to: "/products", icon: Package, group: "MANAGE" },
  { label: "Categories", to: "/categories", icon: Grid2X2, group: "MANAGE" },
  { label: "Pages", to: "/pages", icon: FileText, group: "MANAGE" },
  { label: "Reviews", to: "/reviews", icon: Star, group: "MANAGE" },
  { label: "Downloads", to: "/downloads", icon: Download, group: "ANALYTICS" },
  { label: "Analytics", to: "/analytics", icon: BarChart3, group: "ANALYTICS" },
  { label: "Countries", to: "/countries", icon: Globe, group: "ANALYTICS" },
  { label: "Settings", to: "/settings", icon: Settings, group: "SETTINGS" }
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.name ?? "??").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const current = NAV.find((item) => location.pathname === adminUrl(item.to))
    ?? NAV.filter((item) => item.to && location.pathname.startsWith(adminUrl(item.to))).pop();

  let lastGroup = "";

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="brand admin-brand">
          <span className="brand-mark">◆</span>
          <span>Tool<span>Hub</span></span>
        </div>

        <div className="admin-profile">
          <div className="avatar profile-avatar">{initials}</div>
          <div>
            <b>{user?.name}</b>
            <small>{user?.email}</small>
          </div>
        </div>

        <nav>
          {NAV.map((item) => {
            const header = item.group !== lastGroup ? item.group : "";
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.label}>
                {header ? <span className="nav-label">{header}</span> : null}
                <NavLink
                  to={adminUrl(item.to)}
                  end={item.to === ""}
                  className={({ isActive }) => (isActive ? "sel" : "")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon /> {item.label}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="server-status">
            <i />
            <div>
              <b>All systems operational</b>
              <small>API · Database · Storage</small>
            </div>
          </div>
          <button type="button" className="back-site" onClick={() => logout.mutate()}>
            <LogOut size={13} /> Sign out
          </button>
          <Link to="/" className="back-site">← Open the website</Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <button className="mobile-menu admin-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <div className="admin-breadcrumb">
            <span>ADMIN</span>
            <b>/</b>
            <strong>{current?.label ?? "Dashboard"}</strong>
          </div>
          <div className="admin-actions">
            <div className="top-avatar">{initials}</div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
