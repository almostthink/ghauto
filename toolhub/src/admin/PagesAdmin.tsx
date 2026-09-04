import { useEffect, useState } from "react";
import {
  ArrowDown, ArrowUp, Copy, Eye, EyeOff, FileText, Loader2, Plus, Save, Trash2
} from "lucide-react";
import { ErrorState, Skeleton, useToast } from "../components/ui";
import { formatRelative } from "../lib/format";
import { usePages, useSavePage } from "../lib/queries";
import type { BlockType, Page, PageBlock } from "../lib/types";
import { AdminPanel, ImageField, PageHeading } from "./components";

// Every block type the renderer understands, with the fields the CMS exposes
// for it. Adding a type here is all it takes to offer it in the builder.
const BLOCK_FIELDS: Record<BlockType, { key: string; label: string; type: "text" | "textarea" | "number" | "image" | "list" | "faq" | "stats" | "select"; options?: string[] }[]> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "titleAccent", label: "Accent title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "primaryLabel", label: "Primary button", type: "text" },
    { key: "primaryHref", label: "Primary link", type: "text" },
    { key: "secondaryLabel", label: "Secondary button", type: "text" },
    { key: "secondaryHref", label: "Secondary link", type: "text" },
    { key: "variant", label: "Variant", type: "select", options: ["full", "compact", "narrow"] }
  ],
  text: [
    { key: "title", label: "Title", type: "text" },
    { key: "body", label: "Body", type: "textarea" },
    { key: "bulletsTitle", label: "Bullets title", type: "text" },
    { key: "bullets", label: "Bullets", type: "list" },
    { key: "columns", label: "Columns", type: "number" }
  ],
  stats: [{ key: "items", label: "Stat tiles", type: "stats" }],
  categories: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Subtitle", type: "text" }
  ],
  featuredProducts: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Subtitle", type: "text" },
    { key: "limit", label: "How many", type: "number" },
    { key: "actionLabel", label: "Link label", type: "text" },
    { key: "actionHref", label: "Link target", type: "text" }
  ],
  productGrid: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Subtitle", type: "text" },
    { key: "category", label: "Category slug", type: "text" },
    { key: "tag", label: "Tag slug", type: "text" },
    { key: "sort", label: "Sort", type: "select", options: ["popular", "rating", "latest", "alphabetical"] },
    { key: "layout", label: "Layout", type: "select", options: ["grid", "list"] },
    { key: "limit", label: "How many", type: "number" },
    { key: "showFilters", label: "Show filters", type: "select", options: ["true", "false"] }
  ],
  faq: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Subtitle", type: "text" },
    { key: "items", label: "Questions", type: "faq" }
  ],
  cta: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Text", type: "textarea" },
    { key: "buttonLabel", label: "Button label", type: "text" },
    { key: "buttonHref", label: "Button link", type: "text" }
  ],
  newsletter: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Text", type: "text" },
    { key: "placeholder", label: "Input placeholder", type: "text" }
  ],
  customHtml: [{ key: "html", label: "HTML (sanitized on render)", type: "textarea" }]
};

const BLOCK_TYPES = Object.keys(BLOCK_FIELDS) as BlockType[];

export function PagesAdmin() {
  const toast = useToast();

  const { data, isLoading, error, refetch } = usePages();
  const savePage = useSavePage();

  const [activeSlug, setActiveSlug] = useState<string>("");
  const [draft, setDraft] = useState<Page | null>(null);

  useEffect(() => {
    if (!data?.items.length) return;
    const slug = activeSlug || data.items[0].slug;
    if (!activeSlug) setActiveSlug(slug);
    const page = data.items.find((item) => item.slug === slug);
    if (page) setDraft(structuredClone(page));
  }, [data, activeSlug]);

  if (isLoading) return <div className="dashboard"><Skeleton height={300} /></div>;
  if (error) return <div className="dashboard"><ErrorState error={error} onRetry={() => refetch()} /></div>;
  if (!draft) return <div className="dashboard"><ErrorState title="No pages yet" /></div>;

  const updateBlock = (index: number, changes: Partial<PageBlock>) =>
    setDraft({ ...draft, blocks: draft.blocks.map((block, i) => (i === index ? { ...block, ...changes } : block)) });

  const setField = (index: number, key: string, value: unknown) =>
    updateBlock(index, { data: { ...draft.blocks[index].data, [key]: value } });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = [...draft.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setDraft({ ...draft, blocks });
  };

  const submit = async () => {
    try {
      await savePage.mutateAsync({
        slug: draft.slug,
        values: {
          title: draft.title,
          status: draft.status,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          seoKeywords: draft.seoKeywords,
          blocks: draft.blocks.map((block) => ({ type: block.type, visible: block.visible, data: block.data }))
        }
      });
      toast("Page saved");
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "Save failed", "error");
    }
  };

  return (
    <div className="dashboard">
      <PageHeading title="Pages" text="Every public page is a list of blocks. Reorder, duplicate or hide them without a deploy.">
        <a className="btn ghost" href={`/${draft.slug === "home" ? "" : draft.slug}`} target="_blank" rel="noopener noreferrer">
          <Eye size={15} /> Preview
        </a>
        <button type="button" className="btn primary" onClick={submit} disabled={savePage.isPending}>
          {savePage.isPending ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save page
        </button>
      </PageHeading>

      <div className="page-builder">
        <AdminPanel title="Pages" subtitle="Pick one to edit" className="page-list">
          {(data?.items ?? []).map((page) => (
            <button
              type="button"
              key={page.slug}
              className={page.slug === draft.slug ? "page-item active" : "page-item"}
              onClick={() => setActiveSlug(page.slug)}
            >
              <FileText size={14} />
              <div>
                <b>{page.title}</b>
                <small>/{page.slug} · {page.blocks.length} blocks · {formatRelative(page.updatedAt)}</small>
              </div>
              <span className={`status-pill status-${page.status}`}>{page.status}</span>
            </button>
          ))}
        </AdminPanel>

        <div className="page-editor">
          <AdminPanel title="Page settings">
            <div className="form-grid">
              <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Page["status"] })}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
              <label className="wide">
                SEO title — the text shown in the browser tab and in search results
                <input
                  value={draft.seoTitle}
                  placeholder="Leave empty to use the default from Settings → SEO"
                  onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })}
                />
              </label>
              <label className="wide">
                SEO description
                <textarea rows={2} value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} />
              </label>
            </div>
          </AdminPanel>

          {draft.blocks.map((block, index) => (
            <AdminPanel
              key={index}
              title={block.type}
              subtitle={`Block ${index + 1} of ${draft.blocks.length}`}
              className={block.visible ? "block-card" : "block-card hidden-block"}
              action={
                <div className="block-actions">
                    <button type="button" className="icon-btn" onClick={() => move(index, -1)} aria-label="Move up"><ArrowUp size={13} /></button>
                    <button type="button" className="icon-btn" onClick={() => move(index, 1)} aria-label="Move down"><ArrowDown size={13} /></button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => updateBlock(index, { visible: !block.visible })}
                      aria-label={block.visible ? "Hide block" : "Show block"}
                    >
                      {block.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => {
                        const blocks = [...draft.blocks];
                        blocks.splice(index + 1, 0, structuredClone({ ...block, id: undefined }));
                        setDraft({ ...draft, blocks });
                      }}
                      aria-label="Duplicate block"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => setDraft({ ...draft, blocks: draft.blocks.filter((_, i) => i !== index) })}
                      aria-label="Delete block"
                    >
                    <Trash2 size={13} />
                  </button>
                </div>
              }
            >
              <BlockFields block={block} onChange={(key, value) => setField(index, key, value)} />
            </AdminPanel>
          ))}

          <AdminPanel title="Add a block" subtitle="Appended at the end of the page">
              <div className="block-picker">
                {BLOCK_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className="block-chip"
                    onClick={() => setDraft({ ...draft, blocks: [...draft.blocks, { type, visible: true, data: {} }] })}
                  >
                    <Plus size={12} /> {type}
                  </button>
                ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: PageBlock; onChange: (key: string, value: unknown) => void }) {
  const fields = BLOCK_FIELDS[block.type] ?? [];
  const data = block.data as Record<string, unknown>;

  return (
    <div className="form-grid">
      {fields.map((field) => {
        const value = data[field.key];

        if (field.type === "list") {
          const items = Array.isArray(value) ? (value as string[]) : [];
          return (
            <label className="wide" key={field.key}>
              {field.label}
              <textarea
                rows={3}
                value={items.join("\n")}
                placeholder="One per line"
                onChange={(event) => onChange(field.key, event.target.value.split("\n").filter(Boolean))}
              />
            </label>
          );
        }

        if (field.type === "faq") {
          const items = Array.isArray(value) ? (value as { question: string; answer: string }[]) : [];
          return (
            <div className="wide repeater" key={field.key}>
              <span className="field-label">{field.label}</span>
              {items.map((item, index) => (
                <div className="repeater-row column" key={index}>
                  <input
                    value={item.question}
                    placeholder="Question"
                    onChange={(event) =>
                      onChange(field.key, items.map((entry, i) => (i === index ? { ...entry, question: event.target.value } : entry)))
                    }
                  />
                  <textarea
                    rows={2}
                    value={item.answer}
                    placeholder="Answer"
                    onChange={(event) =>
                      onChange(field.key, items.map((entry, i) => (i === index ? { ...entry, answer: event.target.value } : entry)))
                    }
                  />
                  <button type="button" className="icon-btn danger" onClick={() => onChange(field.key, items.filter((_, i) => i !== index))} aria-label="Remove question">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn ghost small" onClick={() => onChange(field.key, [...items, { question: "", answer: "" }])}>
                <Plus size={13} /> Add question
              </button>
            </div>
          );
        }

        if (field.type === "stats") {
          const items = Array.isArray(value) ? (value as { label: string; source?: string; value?: string }[]) : [];
          return (
            <div className="wide repeater" key={field.key}>
              <span className="field-label">{field.label}</span>
              {items.map((item, index) => (
                <div className="repeater-row" key={index}>
                  <input
                    value={item.label}
                    placeholder="Label"
                    onChange={(event) => onChange(field.key, items.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)))}
                  />
                  <select
                    value={item.source ?? "custom"}
                    onChange={(event) => onChange(field.key, items.map((entry, i) => (i === index ? { ...entry, source: event.target.value } : entry)))}
                  >
                    <option value="products">Total products</option>
                    <option value="categories">Categories</option>
                    <option value="downloads">Downloads</option>
                    <option value="rating">Average rating</option>
                    <option value="custom">Custom value</option>
                  </select>
                  <input
                    value={item.value ?? ""}
                    placeholder="Custom value"
                    onChange={(event) => onChange(field.key, items.map((entry, i) => (i === index ? { ...entry, value: event.target.value } : entry)))}
                  />
                  <button type="button" className="icon-btn danger" onClick={() => onChange(field.key, items.filter((_, i) => i !== index))} aria-label="Remove tile">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn ghost small" onClick={() => onChange(field.key, [...items, { label: "", source: "products" }])}>
                <Plus size={13} /> Add tile
              </button>
            </div>
          );
        }

        if (field.type === "image") {
          return (
            <div className="wide" key={field.key}>
              <ImageField label={field.label} value={typeof value === "string" ? value : ""} onChange={(url) => onChange(field.key, url)} prefix="pages" />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <label key={field.key}>
              {field.label}
              <select
                value={String(value ?? field.options?.[0] ?? "")}
                onChange={(event) => {
                  const next = event.target.value;
                  onChange(field.key, next === "true" ? true : next === "false" ? false : next);
                }}
              >
                {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          );
        }

        if (field.type === "number") {
          return (
            <label key={field.key}>
              {field.label}
              <input
                type="number"
                value={typeof value === "number" ? value : ""}
                onChange={(event) => onChange(field.key, event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </label>
          );
        }

        if (field.type === "textarea") {
          return (
            <label className="wide" key={field.key}>
              {field.label}
              <textarea rows={4} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(field.key, event.target.value)} />
            </label>
          );
        }

        return (
          <label key={field.key}>
            {field.label}
            <input value={typeof value === "string" ? value : ""} onChange={(event) => onChange(field.key, event.target.value)} />
          </label>
        );
      })}
    </div>
  );
}
