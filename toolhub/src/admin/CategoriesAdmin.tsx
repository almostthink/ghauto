import { useState } from "react";
import { ArrowDown, ArrowUp, Edit3, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog, ErrorState, Skeleton, useToast } from "../components/ui";
import { CategoryIcon, ICON_NAMES } from "../components/icons";
import { api } from "../lib/api";
import { useCategories, useDeleteCategory, useInvalidate, useSaveCategory } from "../lib/queries";
import type { Category } from "../lib/types";
import { AdminPanel, PageHeading } from "./components";

type Draft = Partial<Category> & { name: string };

export function CategoriesAdmin() {
  const toast = useToast();
  const invalidate = useInvalidate();

  const { data, isLoading, error, refetch } = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);

  const categories = data?.items ?? [];

  const reorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const ids = categories.map((category) => category.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await api("/categories/reorder", { method: "POST", body: { ids } });
      invalidate(["categories"]);
    } catch (reorderError) {
      toast(reorderError instanceof Error ? reorderError.message : "Could not reorder", "error");
    }
  };

  const submit = async (draft: Draft) => {
    try {
      await save.mutateAsync({ id: draft.id, values: draft });
      toast(draft.id ? "Category updated" : "Category created");
      setEditing(null);
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "Save failed", "error");
    }
  };

  return (
    <div className="dashboard">
      <PageHeading title="Categories" text="The navigation, category pages and product grouping all read from this list.">
        <button type="button" className="btn primary" onClick={() => setEditing({ name: "", icon: "package", accent: "#8b5cf6", visible: true })}>
          <Plus size={16} /> New category
        </button>
      </PageHeading>

      {isLoading ? <Skeleton height={200} /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      <div className="category-admin-grid">
        {categories.map((category, index) => (
          <AdminPanel key={category.id} className="category-admin-card">
            <div className="category-admin-head">
              <div className="cat-icon" style={{ color: category.accent, background: `${category.accent}18` }}>
                <CategoryIcon name={category.icon} />
              </div>
              <div>
                <b>{category.name}</b>
                <small>/{category.slug} · {category.productCount} products</small>
              </div>
              {!category.visible ? <span className="status-pill status-draft">Hidden</span> : null}
            </div>
            <p>{category.description || "No description yet."}</p>

            {category.children.length ? (
              <div className="subcat-row">
                {category.children.map((child) => (
                  <span className="tag" key={child.id}>{child.name} · {child.productCount}</span>
                ))}
              </div>
            ) : null}

            <div className="category-admin-actions">
                <button type="button" className="edit-btn" onClick={() => setEditing(category)}><Edit3 size={13} /> Edit</button>
                <button type="button" className="icon-btn" onClick={() => reorder(index, -1)} aria-label="Move up"><ArrowUp size={13} /></button>
                <button type="button" className="icon-btn" onClick={() => reorder(index, 1)} aria-label="Move down"><ArrowDown size={13} /></button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => setConfirm(category)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setEditing({ name: "", parentId: category.id, icon: "package", accent: category.accent, visible: true })}
                >
                + Subcategory
              </button>
            </div>
          </AdminPanel>
        ))}
      </div>

      {editing ? (
        <CategoryModal
          draft={editing}
          categories={categories}
          busy={save.isPending}
          onCancel={() => setEditing(null)}
          onSave={submit}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={`Delete “${confirm.name}”?`}
          message={
            confirm.productCount > 0
              ? "This category still has products. Move them first, or the delete will be refused."
              : "Subcategories are detached and products are untouched. This cannot be undone."
          }
          confirmLabel="Delete"
          tone="danger"
          busy={remove.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            try {
              await remove.mutateAsync(confirm.id);
              toast("Category deleted");
            } catch (deleteError) {
              toast(deleteError instanceof Error ? deleteError.message : "Delete failed", "error");
            } finally {
              setConfirm(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function CategoryModal({ draft, categories, busy, onCancel, onSave }: {
  draft: Draft;
  categories: Category[];
  busy: boolean;
  onCancel: () => void;
  onSave: (values: Draft) => void;
}) {
  const [values, setValues] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <span className="eyebrow">CATEGORY</span>
            <h2>{draft.id ? "Edit category" : "New category"}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close"><X /></button>
        </div>

        <div className="form-grid">
          <label>Name<input value={values.name} onChange={(event) => set("name", event.target.value)} /></label>
          <label>Slug<input value={values.slug ?? ""} onChange={(event) => set("slug", event.target.value)} placeholder="Generated from the name" /></label>
          <label>
            Parent
            <select value={values.parentId ?? ""} onChange={(event) => set("parentId", event.target.value || null)}>
              <option value="">Top level</option>
              {categories.filter((category) => category.id !== values.id).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            Icon
            <select value={values.icon ?? "package"} onChange={(event) => set("icon", event.target.value)}>
              {ICON_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>Accent colour<input type="color" value={values.accent ?? "#8b5cf6"} onChange={(event) => set("accent", event.target.value)} /></label>
          <label className="switch-field">
            <input type="checkbox" checked={values.visible ?? true} onChange={(event) => set("visible", event.target.checked)} />
            Visible on the site
          </label>
          <label className="wide">
            Description
            <textarea rows={3} value={values.description ?? ""} onChange={(event) => set("description", event.target.value)} />
          </label>
          <label className="wide">SEO title<input value={values.seoTitle ?? ""} onChange={(event) => set("seoTitle", event.target.value)} /></label>
          <label className="wide">
            SEO description
            <textarea rows={2} value={values.seoDescription ?? ""} onChange={(event) => set("seoDescription", event.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn primary" onClick={() => onSave(values)} disabled={busy || !values.name.trim()}>
            Save category
          </button>
        </div>
      </div>
    </div>
  );
}
