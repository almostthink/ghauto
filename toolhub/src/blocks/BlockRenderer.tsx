import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, ChevronDown, Check, Download, Mail, Package,
  RefreshCw, Search, ShieldCheck, Sparkles, Star, Users
} from "lucide-react";
import { EthereumMark, GamepadMark, RobloxMark, WindowsMark } from "../components/BrandIcons";
import { CategoryIcon } from "../components/icons";
import { ProductCard, ProductRow } from "../components/ProductCard";
import { EmptyState, ErrorState, SkeletonCards, useDebounced } from "../components/ui";
import { formatCompact } from "../lib/format";
import { sanitizeHtml } from "../lib/sanitize";
import { useCategories, useProducts, useSettings } from "../lib/queries";
import type { PageBlock } from "../lib/types";

type Data = Record<string, unknown>;
const str = (data: Data, key: string, fallback = "") => (typeof data[key] === "string" ? (data[key] as string) : fallback);
const num = (data: Data, key: string, fallback: number) => (typeof data[key] === "number" ? (data[key] as number) : fallback);
const list = <T,>(data: Data, key: string): T[] => (Array.isArray(data[key]) ? (data[key] as T[]) : []);

// --- hero -----------------------------------------------------------------

function HeroBlock({ data }: { data: Data }) {
  const variant = str(data, "variant", "full");
  const eyebrow = str(data, "eyebrow");
  const title = str(data, "title");
  const accent = str(data, "titleAccent");

  if (variant !== "full") {
    return (
      <section className={variant === "narrow" ? "section hero-compact narrow-hero" : "section hero-compact"}>
        <div className="container">
          <div className="page-intro">
            {eyebrow ? <span className="eyebrow"><Sparkles size={13} /> {eyebrow}</span> : null}
            <h1>{title} {accent ? <em>{accent}</em> : null}</h1>
            <p>{str(data, "subtitle")}</p>
          </div>
        </div>
      </section>
    );
  }

  // Trust badges under the buttons. Editable from the CMS, with sensible
  // defaults so the row is never empty.
  const trust = list<{ label: string; icon?: string }>(data, "trust");
  const trustIcons: Record<string, typeof ShieldCheck> = {
    shield: ShieldCheck,
    refresh: RefreshCw,
    verified: BadgeCheck
  };
  const image = str(data, "image");

  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          {eyebrow ? <span className="hero-badge"><Sparkles size={12} /> {eyebrow}</span> : null}
          <h1>{title}<br /><em>{accent}</em></h1>
          <p>{str(data, "subtitle")}</p>
          <div className="hero-actions">
            {str(data, "primaryLabel") ? (
              <Link className="btn primary" to={str(data, "primaryHref", "/")}>
                {str(data, "primaryLabel")} <ArrowRight size={17} />
              </Link>
            ) : null}
            {str(data, "secondaryLabel") ? (
              <Link className="btn ghost" to={str(data, "secondaryHref", "/")}>{str(data, "secondaryLabel")}</Link>
            ) : null}
          </div>

          {trust.length ? (
            <div className="trust-row">
              {trust.map((item) => {
                const Icon = trustIcons[item.icon ?? "shield"] ?? ShieldCheck;
                return (
                  <span key={item.label}><Icon size={14} /> {item.label}</span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="hero-art">
          <div className="orb o1" />
          <div className="orb o2" />
          {image ? (
            <img className="hero-image" src={image} alt="" />
          ) : (
            // The four platforms the catalog covers, on the faces of the cube.
            <div className="cube">
              <span className="cube-face windows"><WindowsMark size={34} /></span>
              <span className="cube-face game"><GamepadMark size={34} /></span>
              <span className="cube-face crypto"><EthereumMark size={34} /></span>
              <span className="cube-face roblox"><RobloxMark size={34} /></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- text -----------------------------------------------------------------

function TextBlock({ data }: { data: Data }) {
  const bullets = list<string>(data, "bullets");
  return (
    <section className="section">
      <div className="container">
        <div className={num(data, "columns", 1) === 2 ? "about-grid" : ""}>
          <div className="panel">
            {str(data, "title") ? <h2>{str(data, "title")}</h2> : null}
            {str(data, "body").split("\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {bullets.length ? (
            <div className="panel">
              <h2>{str(data, "bulletsTitle", "Highlights")}</h2>
              {bullets.map((item) => (
                <div className="check-line" key={item}><Check size={16} />{item}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// --- stats ----------------------------------------------------------------

interface StatItem { label: string; source?: string; value?: string; icon?: string }

function StatsBlock({ data }: { data: Data }) {
  const { data: products } = useProducts({ perPage: 1 });
  const { data: categories } = useCategories();
  const { data: all } = useProducts({ perPage: 100 });

  const totals = useMemo(() => {
    const items = all?.items ?? [];
    const downloads = items.reduce((sum, product) => sum + product.downloads, 0);
    const rated = items.filter((product) => product.reviewCount > 0);
    const rating = rated.length ? rated.reduce((sum, product) => sum + product.rating, 0) / rated.length : 0;
    return { downloads, rating };
  }, [all]);

  const resolve = (item: StatItem) => {
    switch (item.source) {
      case "products": return formatCompact(products?.total ?? 0);
      case "categories": return String(categories?.items.length ?? 0);
      case "downloads": return formatCompact(totals.downloads);
      case "rating": return totals.rating ? totals.rating.toFixed(1) : "—";
      default: return item.value ?? "—";
    }
  };

  const icons: Record<string, typeof Package> = {
    products: Package,
    categories: Package,
    downloads: Download,
    rating: Star,
    users: Users,
    safe: ShieldCheck
  };

  return (
    <section className="section stats-section">
      <div className="container stats-grid">
        {list<StatItem>(data, "items").map((item) => {
          const Icon = icons[item.icon ?? item.source ?? "products"] ?? Package;
          return (
            <div className="stat-tile" key={item.label}>
              <span className="stat-icon"><Icon size={17} /></span>
              <div>
                <b>{resolve(item)}</b>
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- categories -----------------------------------------------------------

function CategoriesBlock({ data }: { data: Data }) {
  const { data: categories, isLoading, error, refetch } = useCategories();

  return (
    <section className="section">
      <div className="container">
        <SectionHead title={str(data, "title", "Browse by Categories")} text={str(data, "text")} />
        {isLoading ? <SkeletonCards count={4} /> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        <div className="category-grid">
          {(categories?.items ?? []).map((category) => (
            <Link className="category-card" to={`/${category.slug}`} key={category.id}>
              <div className="cat-icon" style={{ color: category.accent, background: `${category.accent}1a` }}>
                <CategoryIcon name={category.icon} size={26} />
              </div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <div className="category-foot">
                <b style={{ color: category.accent }}>{category.productCount} Tools</b>
                <span className="round-arrow"><ArrowRight size={13} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ title, text, actionLabel, actionHref }: { title: string; text?: string; actionLabel?: string; actionHref?: string }) {
  if (!title) return null;
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {actionLabel && actionHref ? <Link to={actionHref}>{actionLabel} <ArrowRight size={15} /></Link> : null}
    </div>
  );
}

// --- featuredProducts -----------------------------------------------------

function FeaturedBlock({ data }: { data: Data }) {
  const limit = num(data, "limit", 4);
  const { data: products, isLoading, error, refetch } = useProducts({ featured: "true", perPage: limit });
  const { data: settings } = useSettings();

  return (
    <section className="section alt">
      <div className="container">
        <SectionHead
          title={str(data, "title", "Featured Tools")}
          text={str(data, "text")}
          actionLabel={str(data, "actionLabel")}
          actionHref={str(data, "actionHref")}
        />
        {isLoading ? <SkeletonCards count={limit} /> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {products && products.items.length === 0 ? (
          <EmptyState title="No featured tools yet" text="Mark a product as featured in the admin panel to fill this row." />
        ) : null}
        <div className="product-grid">
          {(products?.items ?? []).map((product) => (
            <ProductCard key={product.id} product={product} showDownloads={settings?.features.showDownloadCounts !== false} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- productGrid ----------------------------------------------------------

function ProductGridBlock({ data }: { data: Data }) {
  const layout = str(data, "layout", "grid");
  const showFilters = data.showFilters === true;
  const parentSlug = str(data, "category");

  const [term, setTerm] = useState("");
  const [sort, setSort] = useState(str(data, "sort", "popular"));
  // Catalog pages filter by subcategory (Drivers, Security, ...) rather than
  // by price: the licence is already on every card.
  const [subcategory, setSubcategory] = useState("");
  const debounced = useDebounced(term, 250);

  const { data: settings } = useSettings();
  const { data: categories } = useCategories();
  const children = categories?.items.find((category) => category.slug === parentSlug)?.children ?? [];

  const { data: products, isLoading, error, refetch } = useProducts({
    category: subcategory || parentSlug || undefined,
    tag: str(data, "tag") || undefined,
    q: debounced || undefined,
    sort,
    perPage: num(data, "limit", showFilters ? 48 : 8)
  });

  const showDownloads = settings?.features.showDownloadCounts !== false;

  return (
    <section className="section catalog">
      <div className="container">
        <SectionHead
          title={str(data, "title")}
          text={str(data, "text")}
          actionLabel={str(data, "actionLabel")}
          actionHref={str(data, "actionHref")}
        />

        {showFilters ? (
          <>
            <div className="filterbar">
              <div className="searchbox">
                <Search size={17} />
                <input
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search tools..."
                  aria-label="Filter tools"
                />
              </div>
              {children.length ? (
                <div className="chips">
                  <button
                    type="button"
                    className={subcategory === "" ? "chip active" : "chip"}
                    onClick={() => setSubcategory("")}
                  >
                    All
                  </button>
                  {children.map((child) => (
                    <button
                      type="button"
                      key={child.id}
                      className={subcategory === child.slug ? "chip active" : "chip"}
                      onClick={() => setSubcategory(child.slug)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort by">
                <option value="popular">Popular</option>
                <option value="rating">Top rated</option>
                <option value="latest">Newest</option>
                <option value="alphabetical">A → Z</option>
              </select>
            </div>
            <div className="catalog-meta">
              <span>{products ? `${products.total} tools available` : "Loading catalog…"}</span>
              <span>Updated regularly</span>
            </div>
          </>
        ) : null}

        {isLoading ? <SkeletonCards count={6} variant={layout === "list" ? "row" : "card"} /> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {products && products.items.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            text="Try a different search term, or pick another section of the catalog."
          />
        ) : null}

        <div className={layout === "list" ? "product-list" : "product-grid"}>
          {(products?.items ?? []).map((product) =>
            layout === "list" ? (
              <ProductRow key={product.id} product={product} showDownloads={showDownloads} />
            ) : (
              <ProductCard key={product.id} product={product} showDownloads={showDownloads} />
            )
          )}
        </div>
      </div>
    </section>
  );
}

// --- faq ------------------------------------------------------------------

interface FaqItem { question: string; answer: string }

function FaqBlock({ data }: { data: Data }) {
  const [open, setOpen] = useState(0);
  const items = list<FaqItem>(data, "items");
  return (
    <section className="section">
      <div className="narrow">
        <SectionHead title={str(data, "title")} text={str(data, "text")} />
        <div className="faq">
          {items.map((item, index) => (
            <div className={open === index ? "faq-item open" : "faq-item"} key={item.question}>
              <button type="button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
                <span>{item.question}</span>
                <ChevronDown />
              </button>
              {open === index ? <p>{item.answer}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- cta / newsletter / customHtml ---------------------------------------

function CtaBlock({ data }: { data: Data }) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-panel">
          <div>
            <h2>{str(data, "title")}</h2>
            <p>{str(data, "text")}</p>
          </div>
          {str(data, "buttonLabel") ? (
            <Link className="btn primary" to={str(data, "buttonHref", "/")}>
              {str(data, "buttonLabel")} <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function NewsletterBlock({ data }: { data: Data }) {
  const [done, setDone] = useState(false);
  return (
    <section className="section">
      <div className="container">
        <div className="newsletter-panel">
          <span className="newsletter-icon"><Mail size={20} /></span>
          <div>
            <h2>{str(data, "title", "Stay updated")}</h2>
            <p>{str(data, "text", "New tools and version updates, delivered to your inbox.")}</p>
          </div>
          <form
            className="newsletter wide-newsletter"
            onSubmit={(event) => {
              event.preventDefault();
              setDone(true);
            }}
          >
            <input type="email" required placeholder={str(data, "placeholder", "Enter your email address")} aria-label="Email address" />
            <button type="submit">{done ? "Subscribed" : "Subscribe"}</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function CustomHtmlBlock({ data }: { data: Data }) {
  const html = useMemo(() => sanitizeHtml(str(data, "html")), [data]);
  return (
    <section className="section">
      <div className="container">
        <div className="panel custom-html" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

const RENDERERS = {
  hero: HeroBlock,
  text: TextBlock,
  stats: StatsBlock,
  categories: CategoriesBlock,
  featuredProducts: FeaturedBlock,
  productGrid: ProductGridBlock,
  faq: FaqBlock,
  cta: CtaBlock,
  newsletter: NewsletterBlock,
  customHtml: CustomHtmlBlock
} as const;

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks
        .filter((block) => block.visible !== false)
        .map((block, index) => {
          const Renderer = RENDERERS[block.type];
          if (!Renderer) return null;
          return <Renderer key={block.id ?? `${block.type}-${index}`} data={block.data} />;
        })}
    </>
  );
}
