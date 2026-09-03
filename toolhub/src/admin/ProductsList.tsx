import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Edit3, FileDown, Plus, Search, Trash2 } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorState, Skeleton, useDebounced, useToast } from "../components/ui";
import { adminUrl } from "../lib/config";
import { formatCompact, formatDate } from "../lib/format";
import { queryString } from "../lib/api";
import { useBulkProducts, useCategories, useDeleteProduct, useProducts } from "../lib/queries";
import { AdminPanel, PageHeading } from "./components";
import { can, useAuth } from "./auth";

const STATUS_LABELS: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived"
};

export function ProductsList() {
  const { user } = useAuth();
  const toast = useToast();
  const writable = can(user?.role, "content.write");

  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("any");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ ids: string[]; single?: string } | null>(null);
  const debounced = useDebounced(term, 250);

  const filters = {
    q: debounced || undefined,
    category: category || undefined,
    status,
    sort,
    page,
    perPage: 20
  };

  const { data, isLoading, error, refetch } = useProducts(filters);
  const { data: categories } = useCategories();
  const bulk = useBulkProducts();
  const remove = useDeleteProduct();

  const allSelected = Boolean(data?.items.length) && selected.length === data?.items.length;

  const runBulk = async (action: string) => {
    if (!selected.length) return;
    try {
      const result = await bulk.mutateAsync({ ids: selected, action });
      toast(`${result.affected} product${result.affected === 1 ? "" : "s"} updated`);
      setSelected([]);
    } catch (bulkError) {
      toast(bulkError instanceof Error ? bulkError.message : "Bulk action failed", "error");
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.single) await remove.mutateAsync(confirm.single);
      else await bulk.mutateAsync({ ids: confirm.ids, action: "delete" });
      toast("Deleted");
      setSelected([]);
    } catch (deleteError) {
      toast(deleteError instanceof Error ? deleteError.message : "Delete failed", "error");
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="dashboard">
      <PageHeading title="Products" text="Every field on every catalog entry, editable without touching code.">
        <a className="btn ghost" href={`/api/products/export/csv${queryString({ ...filters, page: undefined })}`}>
          <FileDown size={15} /> Export CSV
        </a>
        {writable ? (
          <Link className="btn primary" to={adminUrl("/products/new")}><Plus size={16} /> Add new tool</Link>
        ) : null}
      </PageHeading>

      <AdminPanel className="table-panel">
        <div className="table-toolbar">
          <div className="searchbox">
            <Search size={15} />
            <input
              value={term}
              onChange={(event) => { setTerm(event.target.value); setPage(1); }}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Category">
            <option value="">All categories</option>
            {(categories?.items ?? []).map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Status">
            <option value="any">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort">
            <option value="latest">Newest</option>
            <option value="popular">Most downloaded</option>
            <option value="rating">Top rated</option>
            <option value="alphabetical">A → Z</option>
          </select>
        </div>

        {selected.length && writable ? (
          <div className="bulk-bar">
            <b>{selected.length} selected</b>
            <button type="button" className="btn ghost small" onClick={() => runBulk("publish")}>Publish</button>
            <button type="button" className="btn ghost small" onClick={() => runBulk("unpublish")}>Unpublish</button>
            <button type="button" className="btn ghost small" onClick={() => runBulk("feature")}>Feature</button>
            <button type="button" className="btn ghost small" onClick={() => runBulk("unfeature")}>Unfeature</button>
            <button type="button" className="btn ghost small" onClick={() => runBulk("archive")}>Archive</button>
            <button type="button" className="btn danger small" onClick={() => setConfirm({ ids: selected })}>
              <Trash2 size={13} /> Delete
            </button>
            <button type="button" className="link-btn" onClick={() => setSelected([])}>Clear</button>
          </div>
        ) : null}

        {isLoading ? <div className="table-loading"><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></div> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {data && data.items.length === 0 ? (
          <EmptyState
            title="No products match"
            text="Adjust the filters, or create the first entry for this category."
            action={writable ? <Link className="btn primary" to={adminUrl("/products/new")}><Plus size={15} /> Add product</Link> : undefined}
          />
        ) : null}

        {data && data.items.length ? (
          <table>
            <thead>
              <tr>
                {writable ? (
                  <th className="check-col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => setSelected(event.target.checked ? data.items.map((item) => item.id) : [])}
                      aria-label="Select all"
                    />
                  </th>
                ) : null}
                <th>Product</th>
                <th>Category</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Downloads</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((product) => (
                <tr key={product.id} className={selected.includes(product.id) ? "row-selected" : ""}>
                  {writable ? (
                    <td className="check-col">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id)
                          )
                        }
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                  ) : null}
                  <td>
                    <div className="table-product">
                      {product.thumbnail ? <img src={product.thumbnail} alt="" /> : <span className="image-fallback small" />}
                      <div>
                        <b>{product.name}</b>
                        <small>v{product.version} · /{product.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className="status-pill">{product.category?.name ?? "—"}</span></td>
                  <td><span className={`status-pill status-${product.status}`}>{STATUS_LABELS[product.status]}</span></td>
                  <td><span className="stars">★ {product.rating ? product.rating.toFixed(1) : "—"}</span></td>
                  <td><Download size={12} /> {formatCompact(product.downloads)}</td>
                  <td>{formatDate(product.updatedAt)}</td>
                  <td className="row-actions">
                    <Link className="edit-btn" to={adminUrl(`/products/${product.id}/edit`)}><Edit3 size={14} /> Edit</Link>
                    {writable ? (
                      <button type="button" className="icon-btn danger" onClick={() => setConfirm({ ids: [product.id], single: product.id })} aria-label={`Delete ${product.name}`}>
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {data && data.pages > 1 ? (
          <div className="pagination">
            <button type="button" className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {data.page} of {data.pages}</span>
            <button type="button" className="btn ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        ) : null}
      </AdminPanel>

      {confirm ? (
        <ConfirmDialog
          title={confirm.single ? "Delete this product?" : `Delete ${confirm.ids.length} products?`}
          message="This removes the entry, its images, reviews and analytics events. It cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          busy={remove.isPending || bulk.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
