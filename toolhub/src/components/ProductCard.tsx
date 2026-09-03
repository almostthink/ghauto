import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Download, Star } from "lucide-react";
import { formatCompact } from "../lib/format";
import type { Product } from "../lib/types";

// Products are software, so the card leads with a logo tile rather than a wide
// screenshot. Without an uploaded logo it falls back to a monogram, which
// still looks deliberate instead of showing a broken image.
function Logo({ product, size = "card" }: { product: Product; size?: "card" | "row" }) {
  // A dead image URL must not leave a broken-image icon on the card, so a
  // failed load falls back to the monogram just like a missing one.
  const [broken, setBroken] = useState(false);

  if (product.thumbnail && !broken) {
    return (
      <img
        className={`product-logo ${size}`}
        src={product.thumbnail}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className={`product-logo ${size} monogram`} aria-hidden="true">
      {product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ProductCard({ product, showDownloads = true }: { product: Product; showDownloads?: boolean }) {
  return (
    <Link className="product-card" to={`/product/${product.slug}`}>
      <div className="product-card-top">
        <Logo product={product} />
        {product.verified ? (
          <span className="verified-dot" title="Verified entry"><BadgeCheck size={13} /></span>
        ) : null}
      </div>

      <h3>{product.name}</h3>
      <span className="category-chip">{product.subcategory?.name ?? product.category?.name ?? "Tool"}</span>

      <div className="rating">
        <Star size={12} fill="currentColor" />
        <b>{product.rating ? product.rating.toFixed(1) : "New"}</b>
        <span>({formatCompact(product.reviewCount)})</span>
      </div>

      <div className="product-card-foot">
        <span className="price">{product.price}</span>
        <span className="download-chip" aria-hidden="true"><Download size={13} /></span>
      </div>
      {showDownloads ? <small className="card-downloads">{formatCompact(product.downloads)} downloads</small> : null}
    </Link>
  );
}

export function ProductRow({ product, showDownloads = true }: { product: Product; showDownloads?: boolean }) {
  return (
    <Link className="product-row" to={`/product/${product.slug}`}>
      <Logo product={product} size="row" />
      <div className="row-main">
        <h3>
          {product.name}
          {product.verified ? <BadgeCheck size={13} className="verified-mark" aria-label="Verified" /> : null}
        </h3>
        <p>{product.shortDescription}</p>
        <span className="tag">{product.subcategory?.name ?? product.tags[0] ?? product.category?.name ?? "Tool"}</span>
      </div>
      <div className="row-rating">
        <Star size={13} fill="currentColor" />
        <b>{product.rating ? product.rating.toFixed(1) : "New"}</b>
        <span>({formatCompact(product.reviewCount)})</span>
      </div>
      {showDownloads ? (
        <div className="row-downloads"><Download size={13} />{formatCompact(product.downloads)}</div>
      ) : <div />}
      <span className="small-btn">Details</span>
    </Link>
  );
}
