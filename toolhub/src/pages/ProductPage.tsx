import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  BadgeCheck, Check, Download, ExternalLink, Flag, Globe, History, Monitor, Star
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ErrorState, Skeleton, StarRating, useToast } from "../components/ui";
import { api, trackView } from "../lib/api";
import { formatBytes, formatCompact, formatDate, formatNumber } from "../lib/format";
import { useProduct, useRelatedProducts, useReviews, useSettings } from "../lib/queries";
import { useSeo } from "../lib/seo";
import type { Product } from "../lib/types";
import { NotFound } from "./NotFound";

interface ReviewForm {
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

function ReviewSection({ product }: { product: Product }) {
  const { data, isLoading, refetch } = useReviews({ productId: product.id, limit: 20 });
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting }
  } = useForm<ReviewForm>({ defaultValues: { authorName: "", rating: 5, title: "", body: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api("/reviews", {
        method: "POST",
        body: { ...values, rating: Number(values.rating), productId: product.id }
      });
      setSubmitted(true);
      reset();
      toast("Thanks. Your review is queued for moderation.");
      refetch();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not submit the review", "error");
    }
  });

  return (
    <div className="panel" id="reviews">
      <h2>Reviews</h2>
      {isLoading ? <Skeleton height={60} /> : null}
      {data && data.items.length === 0 ? (
        <p>No approved reviews yet. Be the first to share how this tool worked for you.</p>
      ) : null}

      <div className="review-list">
        {(data?.items ?? []).map((review) => (
          <div className="review-item" key={review.id}>
            <div className="avatar tiny">{review.authorName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="review-head">
                <b>{review.authorName}</b>
                <StarRating value={review.rating} />
                <small>{formatDate(review.createdAt)}</small>
              </div>
              {review.title ? <strong>{review.title}</strong> : null}
              <p>{review.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form className="review-form" onSubmit={onSubmit}>
        <h3>Write a review</h3>
        <p className="form-note">No account needed. Reviews appear once a moderator approves them.</p>
        <div className="form-grid">
          <label>
            Your name
            <input {...register("authorName", { required: "Tell us who you are", minLength: { value: 2, message: "Too short" } })} />
            {errors.authorName ? <em className="field-error">{errors.authorName.message}</em> : null}
          </label>
          <label>
            Rating
            <select {...register("rating", { required: true })}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
            </select>
          </label>
          <label className="wide">
            Title
            <input {...register("title")} placeholder="Optional summary" />
          </label>
          <label className="wide">
            Review
            <textarea
              rows={4}
              {...register("body", { required: "A review needs some text", minLength: { value: 10, message: "At least 10 characters" } })}
              placeholder="What worked, what did not?"
            />
            {errors.body ? <em className="field-error">{errors.body.message}</em> : null}
          </label>
        </div>
        <button className="btn primary" type="submit" disabled={isSubmitting || submitted}>
          {submitted ? "Submitted for review" : isSubmitting ? "Sending…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug);
  const { data: related } = useRelatedProducts(slug);
  const { data: settings } = useSettings();
  const [activeImage, setActiveImage] = useState(0);
  const [reported, setReported] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (product) trackView(`/product/${product.slug}`, product.id);
  }, [product]);

  useSeo({
    title: product?.seoTitle || (product ? `${product.name} — ToolHub` : "ToolHub"),
    description: product?.seoDescription || product?.shortDescription,
    keywords: product?.seoKeywords,
    image: product?.thumbnail,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: product.name,
          description: product.shortDescription,
          applicationCategory: product.category?.name,
          softwareVersion: product.version,
          fileSize: product.fileSize,
          operatingSystem: product.requirements[0] ?? "Windows",
          image: product.thumbnail || undefined,
          offers: {
            "@type": "Offer",
            price: /free/i.test(product.price) ? "0" : undefined,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock"
          },
          ...(product.reviewCount
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount
                }
              }
            : {})
        }
      : undefined
  });

  if (isLoading) {
    return (
      <section className="section container">
        <Skeleton height={340} radius={16} />
      </section>
    );
  }
  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) return <NotFound />;
    return <section className="section container"><ErrorState error={error} /></section>;
  }
  if (!product) return <NotFound />;

  const shots = product.screenshots.length ? product.screenshots : product.gallery;
  const cover = shots[activeImage]?.url || product.thumbnail;
  const showDownloads = settings?.features.showDownloadCounts !== false;

  return (
    <section className="section product-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          {product.category ? <Link to={`/${product.category.slug}`}>{product.category.name}</Link> : null}
          <span>/</span>
          <b>{product.name}</b>
        </nav>

        <div className="product-hero-card">
          <div>
            <div className="product-cover">
              {cover ? <img src={cover} alt={product.name} /> : <div className="image-fallback large">{product.name.slice(0, 2)}</div>}
              <span className="cover-glow" />
            </div>
            {shots.length > 1 ? (
              <div className="thumb-strip">
                {shots.map((image, index) => (
                  <button
                    type="button"
                    key={image.url + index}
                    className={index === activeImage ? "thumb active" : "thumb"}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Screenshot ${index + 1}`}
                  >
                    <img src={image.url} alt={image.alt} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="product-info">
            <span className="eyebrow">
              {product.category?.name?.toUpperCase()}
              {product.subcategory ? ` · ${product.subcategory.name.toUpperCase()}` : ""}
            </span>
            <h1>
              {product.name}
              {product.verified ? <BadgeCheck className="verified-mark big" aria-label="Verified" /> : null}
            </h1>
            <p>{product.shortDescription}</p>

            <div className="big-rating">
              <span><Star size={18} fill="currentColor" />{product.rating ? product.rating.toFixed(1) : "New"}</span>
              <small>
                {product.reviewCount
                  ? `${formatNumber(product.reviewCount)} review${product.reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
                {showDownloads ? ` · ${formatNumber(product.downloads)} downloads` : ""}
              </small>
            </div>

            <div className="hero-actions">
              <a className="btn primary" href={`/api/products/${product.id}/download`} rel="nofollow noopener">
                <Download size={17} /> {product.hasFile ? `Download${product.fileBytes ? ` (${formatBytes(product.fileBytes)})` : ""}` : "Download"}
              </a>
              {product.officialUrl ? (
                <a className="btn ghost" href={product.officialUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} /> Official website
                </a>
              ) : null}
            </div>

            <div className="detail-stats">
              <div><b>{showDownloads ? formatCompact(product.downloads) : "—"}</b><span>Downloads</span></div>
              <div><b>{product.version}</b><span>Version</span></div>
              <div><b>{product.fileSize || "—"}</b><span>Size</span></div>
              <div><b>{formatDate(product.updatedAt)}</b><span>Updated</span></div>
            </div>
          </div>
        </div>

        <div className="content-two">
          <div>
            <div className="panel">
              <h2>About {product.name}</h2>
              {(product.longDescription || product.shortDescription).split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {product.features.length ? (
              <div className="panel">
                <h2>Features</h2>
                <div className="feature-grid">
                  {product.features.map((feature) => (
                    <div key={feature}><Check size={15} />{feature}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.requirements.length ? (
              <div className="panel">
                <h2><Monitor size={16} /> Requirements</h2>
                <div className="feature-grid">
                  {product.requirements.map((requirement) => (
                    <div key={requirement}><Check size={15} />{requirement}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.changelog.length ? (
              <div className="panel">
                <h2><History size={16} /> Changelog</h2>
                <div className="changelog">
                  {product.changelog.map((entry) => (
                    <div className="changelog-entry" key={`${entry.version}-${entry.date}`}>
                      <div className="changelog-head">
                        <b>v{entry.version}</b>
                        <small>{entry.date}</small>
                      </div>
                      <p>{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {settings?.features.reviewsEnabled !== false ? <ReviewSection product={product} /> : null}
          </div>

          <aside className="panel side-panel">
            <h3>Product information</h3>
            {[
              ["Category", product.category?.name ?? "—"],
              ["License", product.license || product.price],
              ["Version", product.version],
              ["File size", product.fileSize || (product.fileBytes ? formatBytes(product.fileBytes) : "—")],
              ["Last update", formatDate(product.updatedAt)],
              ["Views", showDownloads ? formatCompact(product.views) : "—"]
            ].map(([label, value]) => (
              <div className="info-line" key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}

            {product.tags.length ? (
              <div className="tag-row">
                {product.tags.map((tag) => (
                  <Link className="tag" key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Link>
                ))}
              </div>
            ) : null}

            {product.availabilityMode !== "all" ? (
              <p className="availability-note">
                <Globe size={13} /> Availability is restricted in some regions.
              </p>
            ) : null}

            <a className="btn primary full" href={`/api/products/${product.id}/download`} rel="nofollow noopener">
              <Download size={16} /> Download now
            </a>
            <button
              type="button"
              className="report-btn"
              onClick={() => {
                setReported(true);
                toast("Thanks, this entry has been flagged for review.", "info");
              }}
              disabled={reported}
            >
              <Flag size={13} /> {reported ? "Reported" : "Report this listing"}
            </button>
          </aside>
        </div>

        {related?.items.length ? (
          <div className="related">
            <div className="section-head"><div><h2>Related tools</h2><p>More from {product.category?.name}</p></div></div>
            <div className="product-grid">
              {related.items.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
