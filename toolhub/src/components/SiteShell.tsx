import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Search, Star, X } from "lucide-react";
import { DiscordMark, LogoMark, TelegramMark, XMark, YoutubeMark } from "./BrandIcons";
import type { ReactNode } from "react";
import { api, queryString } from "../lib/api";
import { useCategories, useSettings } from "../lib/queries";
import { useDebounced } from "./ui";

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  thumbnail: string;
  rating: number;
  category: { name: string; slug: string } | null;
}

// Global search with autocomplete. Cmd/Ctrl+K opens it from anywhere.
function GlobalSearch({ placeholder }: { placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(term, 220);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api<{ items: Suggestion[] }>(`/products/suggest${queryString({ q: debounced })}`, { signal: controller.signal })
      .then((data) => setItems(data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debounced]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!term.trim()) return;
    setOpen(false);
    navigate(`/search${queryString({ q: term.trim() })}`);
  };

  return (
    <>
      <button type="button" className="search-mini" onClick={() => setOpen(true)}>
        <Search size={15} />
        <span>{placeholder}</span>
        <kbd>⌘ K</kbd>
      </button>

      {open ? (
        <div className="search-overlay" onClick={() => setOpen(false)} role="presentation">
          <div className="search-panel" onClick={(event) => event.stopPropagation()}>
            <form className="search-panel-head" onSubmit={submit}>
              <Search size={17} />
              <input
                ref={inputRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search every tool in the catalog..."
                aria-label="Search tools"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search"><X size={16} /></button>
            </form>
            <div className="search-results">
              {loading ? <p className="search-hint">Searching…</p> : null}
              {!loading && debounced.trim().length >= 2 && items.length === 0 ? (
                <p className="search-hint">No tools match “{debounced}”.</p>
              ) : null}
              {items.map((item) => (
                <Link
                  className="search-result"
                  key={item.id}
                  to={`/product/${item.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {item.thumbnail ? <img src={item.thumbnail} alt="" /> : <span className="image-fallback small" />}
                  <div>
                    <b>{item.name}</b>
                    <small>{item.category?.name}</small>
                  </div>
                  <span className="search-rating"><Star size={11} fill="currentColor" />{item.rating.toFixed(1)}</span>
                </Link>
              ))}
              {term.trim() ? (
                <button type="button" className="search-all" onClick={submit as never}>
                  See all results for “{term.trim()}” <ArrowRight size={13} />
                </button>
              ) : (
                <p className="search-hint">Type at least two characters to search.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: settings } = useSettings();
  const { data: categories } = useCategories();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const siteName = settings?.site.name ?? "ToolHub";
  const links = (categories?.items ?? []).map((category) => ({ label: category.name.replace(/ Tools$/, ""), to: `/${category.slug}` }));

  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" to="/">
          <span className="brand-mark"><LogoMark size={19} /></span>
          <span>{siteName.slice(0, 4)}<span>{siteName.slice(4) || "Hub"}</span></span>
        </Link>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <NavLink to="/" end>Home</NavLink>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
          ))}
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <GlobalSearch placeholder={settings?.site.searchPlaceholder ?? "Search tools..."} />
      </div>
    </header>
  );
}

function Footer() {
  const { data: settings } = useSettings();
  const footer = settings?.footer;
  const siteName = settings?.site.name ?? "ToolHub";

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="brand">
            <span className="brand-mark"><LogoMark size={19} /></span>
            <span>{siteName.slice(0, 4)}<span>{siteName.slice(4) || "Hub"}</span></span>
          </div>
          <p>{footer?.about}</p>
          <div className="social-row">
            {[
              { label: "Discord", Icon: DiscordMark },
              { label: "X", Icon: XMark },
              { label: "YouTube", Icon: YoutubeMark },
              { label: "Telegram", Icon: TelegramMark }
            ].map(({ label, Icon }) => (
              <span className="social-chip" key={label} title={label} aria-label={label}>
                <Icon size={15} />
              </span>
            ))}
          </div>
        </div>
        {(footer?.columns ?? []).map((column) => (
          <div key={column.title}>
            <b>{column.title}</b>
            {column.links.map((link) => (
              <Link key={link.href + link.label} to={link.href}>{link.label}</Link>
            ))}
          </div>
        ))}
        <div className="status-card">
          <b>Server status</b>
          <div className="status-line"><i /> All systems operational</div>
          <div className="status-line"><i /> API operational</div>
          <div className="status-line"><i /> Downloads operational</div>
        </div>
      </div>
      <div className="container copyright">{footer?.copyright}</div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
