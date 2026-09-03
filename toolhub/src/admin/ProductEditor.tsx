import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Check, Eye, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { ErrorState, Skeleton, useToast } from "../components/ui";
import { adminUrl } from "../lib/config";
import { formatNumber, formatRelative } from "../lib/format";
import { useCategories, useProduct, useSaveProduct } from "../lib/queries";
import type { ChangelogEntry, Product, ProductImage } from "../lib/types";
import { AdminPanel, ImageField, PageHeading } from "./components";

const TABS = ["General", "Media", "SEO", "Analytics", "Links", "Changelog", "Requirements"] as const;
type Tab = (typeof TABS)[number];

interface FormValues {
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string;
  subcategoryId: string;
  version: string;
  fileSize: string;
  license: string;
  price: string;
  status: Product["status"];
  featured: boolean;
  popular: boolean;
  verified: boolean;
  downloadUrl: string;
  officialUrl: string;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  views: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  tags: string;
  availabilityMode: Product["availabilityMode"];
  countryAvailability: string;
}

const EMPTY: FormValues = {
  name: "", slug: "", shortDescription: "", longDescription: "", categoryId: "", subcategoryId: "",
  version: "1.0.0", fileSize: "", license: "Free", price: "Free", status: "draft",
  featured: false, popular: false, verified: false, downloadUrl: "", officialUrl: "", thumbnail: "",
  rating: 0, reviewCount: 0, downloads: 0, views: 0, seoTitle: "", seoDescription: "", seoKeywords: "",
  tags: "", availabilityMode: "all", countryAvailability: ""
};

const toForm = (product: Product): FormValues => ({
  name: product.name,
  slug: product.slug,
  shortDescription: product.shortDescription,
  longDescription: product.longDescription,
  categoryId: product.categoryId,
  subcategoryId: product.subcategoryId ?? "",
  version: product.version,
  fileSize: product.fileSize,
  license: product.license,
  price: product.price,
  status: product.status,
  featured: product.featured,
  popular: product.popular,
  verified: product.verified,
  downloadUrl: product.downloadUrl,
  officialUrl: product.officialUrl,
  thumbnail: product.thumbnail,
  rating: product.rating,
  reviewCount: product.reviewCount,
  downloads: product.downloads,
  views: product.views,
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  seoKeywords: product.seoKeywords.join(", "),
  tags: product.tags.join(", "),
  availabilityMode: product.availabilityMode,
  countryAvailability: product.countryAvailability.join(", ")
});

const splitList = (value: string) =>
  value.split(",").map((entry) => entry.trim()).filter(Boolean);

const DRAFT_PREFIX = "toolhub:product-draft:";

export function ProductEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const { data: product, isLoading, error } = useProduct(isNew ? undefined : id);
  const { data: categories } = useCategories();
  const save = useSaveProduct();

  const [tab, setTab] = useState<Tab>("General");
  const [gallery, setGallery] = useState<ProductImage[]>([]);
  const [screenshots, setScreenshots] = useState<ProductImage[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);

  const form = useForm<FormValues>({ defaultValues: EMPTY });
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = form;

  const draftKey = `${DRAFT_PREFIX}${isNew ? "new" : id}`;

  useEffect(() => {
    if (hydrated.current) return;
    if (isNew) {
      hydrated.current = true;
      const stored = window.localStorage.getItem(draftKey);
      if (stored) {
        try {
          const draft = JSON.parse(stored);
          reset(draft.values);
          setGallery(draft.gallery ?? []);
          setScreenshots(draft.screenshots ?? []);
          setFeatures(draft.features ?? []);
          setRequirements(draft.requirements ?? []);
          setChangelog(draft.changelog ?? []);
          setRestored(true);
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      }
      return;
    }
    if (product) {
      hydrated.current = true;
      reset(toForm(product));
      setGallery(product.gallery);
      setScreenshots(product.screenshots);
      setFeatures(product.features);
      setRequirements(product.requirements);
      setChangelog(product.changelog);
    }
  }, [product, isNew, reset, draftKey]);

  // Autosave the in-progress draft locally so a reload never loses work.
  const values = watch();
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ values, gallery, screenshots, features, requirements, changelog })
      );
      setDraftSavedAt(new Date());
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [values, gallery, screenshots, features, requirements, changelog, draftKey]);

  const subcategories = useMemo(
    () => categories?.items.find((category) => category.id === values.categoryId)?.children ?? [],
    [categories, values.categoryId]
  );

  const onSubmit = handleSubmit(async (formValues) => {
    const payload = {
      ...formValues,
      subcategoryId: formValues.subcategoryId || null,
      rating: Number(formValues.rating),
      reviewCount: Number(formValues.reviewCount),
      downloads: Number(formValues.downloads),
      views: Number(formValues.views),
      seoKeywords: splitList(formValues.seoKeywords),
      tags: splitList(formValues.tags),
      countryAvailability: splitList(formValues.countryAvailability).map((code) => code.toUpperCase()),
      features,
      requirements,
      changelog,
      gallery,
      screenshots
    };
    try {
      const saved = await save.mutateAsync({ id: isNew ? undefined : id, values: payload as never });
      window.localStorage.removeItem(draftKey);
      toast(isNew ? "Product created" : "Changes saved");
      if (isNew) navigate(adminUrl(`/products/${saved.id}/edit`), { replace: true });
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "Save failed", "error");
    }
  });

  if (!isNew && isLoading) return <div className="dashboard"><Skeleton height={320} /></div>;
  if (!isNew && error) return <div className="dashboard"><ErrorState error={error} /></div>;

  return (
    <form className="dashboard" onSubmit={onSubmit}>
      <PageHeading
        title={isNew ? "New product" : values.name || "Edit product"}
        text={isNew ? "Create a catalog entry. Every field is editable later." : `/product/${values.slug}`}
      >
        <Link className="btn ghost" to={adminUrl("/products")}><ArrowLeft size={15} /> Back</Link>
        {!isNew ? (
          <a className="btn ghost" href={`/product/${values.slug}`} target="_blank" rel="noopener noreferrer">
            <Eye size={15} /> Preview
          </a>
        ) : null}
        <button className="btn primary" type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save
        </button>
      </PageHeading>

      {restored ? (
        <div className="notice">
          A local draft from an earlier session was restored.
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              window.localStorage.removeItem(draftKey);
              reset(EMPTY);
              setRestored(false);
            }}
          >
            Discard draft
          </button>
        </div>
      ) : null}

      <div className="editor-tabs">
        {TABS.map((name) => (
          <button type="button" key={name} className={tab === name ? "editor-tab active" : "editor-tab"} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
        <span className="autosave-note">
          {draftSavedAt ? `Draft autosaved ${formatRelative(draftSavedAt)}` : isDirty ? "Unsaved changes" : ""}
        </span>
      </div>

      {tab === "General" ? (
        <AdminPanel title="General" subtitle="Name, category and catalog copy">
          <div className="form-grid">
            <label>
              Name
              <input {...register("name", { required: "A name is required", minLength: { value: 2, message: "Too short" } })} />
              {errors.name ? <em className="field-error">{errors.name.message}</em> : null}
            </label>
            <label>
              Slug
              <input {...register("slug")} placeholder="Generated from the name" />
            </label>
            <label>
              Category
              <select {...register("categoryId", { required: "Pick a category" })}>
                <option value="">Select…</option>
                {(categories?.items ?? []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId ? <em className="field-error">{errors.categoryId.message}</em> : null}
            </label>
            <label>
              Subcategory
              <select {...register("subcategoryId")}>
                <option value="">None</option>
                {subcategories.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </label>
            <label>Version<input {...register("version")} /></label>
            <label>File size<input {...register("fileSize")} placeholder="38 MB" /></label>
            <label>License<input {...register("license")} placeholder="Free / Premium / MIT" /></label>
            <label>Price label<input {...register("price")} placeholder="Free" /></label>
            <label>
              Status
              <select {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>Tags<input {...register("tags")} placeholder="optimization, cleanup" /></label>
            <label className="wide">
              Short description
              <textarea rows={2} {...register("shortDescription")} placeholder="One line shown on cards and in search" />
            </label>
            <label className="wide">
              Long description
              <textarea rows={8} {...register("longDescription")} placeholder="Full description shown on the product page" />
            </label>
          </div>

          <div className="switch-row">
            <label className="switch"><input type="checkbox" {...register("featured")} /> Featured</label>
            <label className="switch"><input type="checkbox" {...register("popular")} /> Popular</label>
            <label className="switch"><input type="checkbox" {...register("verified")} /> Verified badge</label>
          </div>
        </AdminPanel>
      ) : null}

      {tab === "Media" ? (
        <>
          <AdminPanel title="Cover image" subtitle="Shown on cards, search results and the product hero">
            <ImageField label="Thumbnail" value={values.thumbnail} onChange={(url) => setValue("thumbnail", url, { shouldDirty: true })} />
          </AdminPanel>
          <ImageListEditor title="Gallery" images={gallery} onChange={setGallery} kind="gallery" />
          <ImageListEditor title="Screenshots" images={screenshots} onChange={setScreenshots} kind="screenshot" />
        </>
      ) : null}

      {tab === "SEO" ? (
        <AdminPanel title="SEO" subtitle="Overrides the defaults from site settings">
          <div className="form-grid">
            <label className="wide">
              Meta title
              <input {...register("seoTitle")} placeholder={values.name ? `${values.name} — ToolHub` : "Falls back to the product name"} />
            </label>
            <label className="wide">
              Meta description
              <textarea rows={3} {...register("seoDescription")} placeholder="Falls back to the short description" />
            </label>
            <label className="wide">Keywords<input {...register("seoKeywords")} placeholder="comma separated" /></label>
          </div>
          <div className="serp-preview">
            <small>Search result preview</small>
            <b>{values.seoTitle || `${values.name || "Product"} — ToolHub`}</b>
            <span>example.com/product/{values.slug || "slug"}</span>
            <p>{values.seoDescription || values.shortDescription || "No description set."}</p>
          </div>
        </AdminPanel>
      ) : null}

      {tab === "Analytics" ? (
        <AdminPanel title="Counters" subtitle="Live values. Edit only to correct an import.">
          <div className="form-grid">
            <label>Rating<input type="number" step="0.1" min="0" max="5" {...register("rating")} /></label>
            <label>Review count<input type="number" min="0" {...register("reviewCount")} /></label>
            <label>Downloads<input type="number" min="0" {...register("downloads")} /></label>
            <label>Views<input type="number" min="0" {...register("views")} /></label>
          </div>
          {product ? (
            <div className="counter-summary">
              <div><b>{formatNumber(product.downloads)}</b><span>Lifetime downloads</span></div>
              <div><b>{formatNumber(product.views)}</b><span>Lifetime views</span></div>
              <div><b>{formatNumber(product.reviewCount)}</b><span>Approved reviews</span></div>
            </div>
          ) : null}
          <p className="form-note">
            Ratings and review counts are recalculated automatically whenever a review is approved or removed.
          </p>
        </AdminPanel>
      ) : null}

      {tab === "Links" ? (
        <AdminPanel title="Links and availability" subtitle="Where the download button goes">
          <div className="form-grid">
            <label className="wide">
              Download URL
              <input {...register("downloadUrl")} placeholder="https://vendor.example/download" />
            </label>
            <label className="wide">
              Official website
              <input {...register("officialUrl")} placeholder="https://vendor.example" />
            </label>
            <label>
              Country availability
              <select {...register("availabilityMode")}>
                <option value="all">Available everywhere</option>
                <option value="allow">Only in listed countries</option>
                <option value="block">Blocked in listed countries</option>
              </select>
            </label>
            <label>
              Country codes
              <input {...register("countryAvailability")} placeholder="US, DE, BR" disabled={values.availabilityMode === "all"} />
            </label>
          </div>
          <p className="form-note">
            The download endpoint counts the download, records the analytics event and then redirects to this URL. Requests from
            a blocked region are refused before the redirect.
          </p>
        </AdminPanel>
      ) : null}

      {tab === "Changelog" ? (
        <AdminPanel
          title="Changelog"
          subtitle="Newest first"
          action={
            <button type="button" className="btn ghost small" onClick={() => setChangelog([{ version: values.version, date: new Date().toISOString().slice(0, 10), notes: "" }, ...changelog])}>
              <Plus size={13} /> Add entry
            </button>
          }
        >
          {changelog.length === 0 ? <p className="chart-empty">No changelog entries yet.</p> : null}
          {changelog.map((entry, index) => (
            <div className="repeater-row" key={index}>
              <input
                value={entry.version}
                placeholder="Version"
                onChange={(event) => setChangelog(changelog.map((item, i) => (i === index ? { ...item, version: event.target.value } : item)))}
              />
              <input
                type="date"
                value={entry.date}
                onChange={(event) => setChangelog(changelog.map((item, i) => (i === index ? { ...item, date: event.target.value } : item)))}
              />
              <input
                value={entry.notes}
                placeholder="What changed"
                onChange={(event) => setChangelog(changelog.map((item, i) => (i === index ? { ...item, notes: event.target.value } : item)))}
              />
              <button type="button" className="icon-btn danger" onClick={() => setChangelog(changelog.filter((_, i) => i !== index))} aria-label="Remove entry">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </AdminPanel>
      ) : null}

      {tab === "Requirements" ? (
        <>
          <StringListEditor title="Features" items={features} onChange={setFeatures} placeholder="One-click system cleanup" />
          <StringListEditor title="Requirements" items={requirements} onChange={setRequirements} placeholder="Windows 10 or 11 (64-bit)" />
        </>
      ) : null}

      <div className="editor-footer">
        <button className="btn primary" type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save product
        </button>
      </div>
    </form>
  );
}

function ImageListEditor({ title, images, onChange, kind }: {
  title: string;
  images: ProductImage[];
  onChange: (next: ProductImage[]) => void;
  kind: ProductImage["kind"];
}) {
  const move = (index: number, direction: -1 | 1) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <AdminPanel
      title={title}
      subtitle="Upload, reorder or remove"
      action={
        <button type="button" className="btn ghost small" onClick={() => onChange([...images, { url: "", alt: "", kind }])}>
          <Plus size={13} /> Add image
        </button>
      }
    >
      {images.length === 0 ? <p className="chart-empty">No images yet.</p> : null}
      {images.map((image, index) => (
        <div className="image-row" key={index}>
          <ImageField
            label={`${title} ${index + 1}`}
            value={image.url}
            onChange={(url) => onChange(images.map((item, i) => (i === index ? { ...item, url } : item)))}
          />
          <input
            className="alt-input"
            value={image.alt}
            placeholder="Alt text"
            onChange={(event) => onChange(images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)))}
          />
          <div className="image-row-actions">
            <button type="button" className="icon-btn" onClick={() => move(index, -1)} aria-label="Move up">↑</button>
            <button type="button" className="icon-btn" onClick={() => move(index, 1)} aria-label="Move down">↓</button>
            <button type="button" className="icon-btn danger" onClick={() => onChange(images.filter((_, i) => i !== index))} aria-label="Remove image">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </AdminPanel>
  );
}

function StringListEditor({ title, items, onChange, placeholder }: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <AdminPanel
      title={title}
      action={
        <button type="button" className="btn ghost small" onClick={() => onChange([...items, ""])}>
          <Plus size={13} /> Add
        </button>
      }
    >
      {items.length === 0 ? <p className="chart-empty">Nothing added yet.</p> : null}
      {items.map((item, index) => (
        <div className="repeater-row" key={index}>
          <input
            className="grow"
            value={item}
            placeholder={placeholder}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))}
          />
          <button type="button" className="icon-btn danger" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </AdminPanel>
  );
}
