import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ProductRow } from "../components/ProductCard";
import { EmptyState, ErrorState, SkeletonCards, useDebounced } from "../components/ui";
import { useCategories, useProducts } from "../lib/queries";
import { useSeo } from "../lib/seo";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [price, setPrice] = useState(params.get("price") ?? "any");
  const [minRating, setMinRating] = useState(params.get("minRating") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "popular");
  const debounced = useDebounced(term, 250);

  const { data: categories } = useCategories();
  const { data, isLoading, error, refetch } = useProducts({
    q: debounced || undefined,
    category: category || undefined,
    price: price === "any" ? undefined : price,
    minRating: minRating ? Number(minRating) : undefined,
    sort,
    perPage: 48
  });

  useSeo({
    title: debounced ? `Search: ${debounced} — ToolHub` : "Search — ToolHub",
    description: "Search the full ToolHub catalog by name, description or tag.",
    noindex: true
  });

  const update = (key: string, value: string, setter: (value: string) => void) => {
    setter(value);
    const next = new URLSearchParams(params);
    if (value && value !== "any") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="section catalog">
      <div className="container">
        <div className="page-intro left">
          <span className="eyebrow">CATALOG SEARCH</span>
          <h1>Find the right tool</h1>
          <p>Search across every category, then narrow by license, rating or popularity.</p>
        </div>

        <div className="filterbar">
          <div className="searchbox grow">
            <Search size={17} />
            <input
              value={term}
              onChange={(event) => update("q", event.target.value, setTerm)}
              placeholder="Search by name, description or tag..."
              aria-label="Search tools"
            />
          </div>
          <select value={category} onChange={(event) => update("category", event.target.value, setCategory)} aria-label="Category">
            <option value="">All categories</option>
            {(categories?.items ?? []).map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
          <select value={price} onChange={(event) => update("price", event.target.value, setPrice)} aria-label="License">
            <option value="any">Any license</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
          <select value={minRating} onChange={(event) => update("minRating", event.target.value, setMinRating)} aria-label="Minimum rating">
            <option value="">Any rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
          <select value={sort} onChange={(event) => update("sort", event.target.value, setSort)} aria-label="Sort by">
            <option value="popular">Popular</option>
            <option value="rating">Top rated</option>
            <option value="latest">Newest</option>
            <option value="alphabetical">A → Z</option>
          </select>
        </div>

        <div className="catalog-meta">
          <span>{data ? `${data.total} matching tools` : "Searching…"}</span>
          <span>{debounced ? `Query: “${debounced}”` : "Showing the full catalog"}</span>
        </div>

        {isLoading ? <SkeletonCards count={6} variant="row" /> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {data && data.items.length === 0 ? (
          <EmptyState title="No tools found" text="Try a shorter search term or clear one of the filters." />
        ) : null}

        <div className="product-list">
          {(data?.items ?? []).map((product) => <ProductRow key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
