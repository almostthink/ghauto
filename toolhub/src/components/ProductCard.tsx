import { Link } from "react-router-dom";
import { BadgeCheck, Download, Star } from "lucide-react";
import { formatCompact, isFree } from "../lib/format";
import type { Product } from "../lib/types";

export function ProductCard({ product, showDownloads = true }: { product: Product; showDownloads?: boolean }) {
  return (
    <Link className="product-card" to={`/product/${product.slug}`}>
      <div className="product-image">
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-fallback">{product.name.slice(0, 2).toUpperCase()}</div>
        )}
        {product.tags[0] ? <span className="pill">{product.tags[0]}</span> : null}
        {product.verified ? (
          <span className="pill verified-pill" title="Verified entry"><BadgeCheck size={11} /> Verified</span>
        ) : null}
      </div>
      <div className="product-body">
        <div className="product-title">
          <h3>{product.name}</h3>
          <span className={isFree(product.price) ? "price free" : "price premium"}>{product.price}</span>
        </div>
        <p>{product.shortDescription}</p>
        <div className="rating">
          <Star size={13} fill="currentColor" />
          <b>{product.rating ? product.rating.toFixed(1) : "New"}</b>
          <span>({formatCompact(product.reviewCount)})</span>
          {showDownloads ? (
            <span className="downloads"><Download size={12} />{formatCompact(product.downloads)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductRow({ product, showDownloads = true }: { product: Product; showDownloads?: boolean }) {
  return (
    <Link className="product-row" to={`/product/${product.slug}`}>
      {product.thumbnail ? (
        <img src={product.thumbnail} alt={product.name} loading="lazy" />
      ) : (
        <div className="image-fallback small">{product.name.slice(0, 2).toUpperCase()}</div>
      )}
      <div className="row-main">
        <h3>
          {product.name}
          {product.verified ? <BadgeCheck size={13} className="verified-mark" aria-label="Verified" /> : null}
        </h3>
        <p>{product.shortDescription}</p>
        <span className="tag">{product.tags[0] ?? product.category?.name ?? "Tool"}</span>
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
