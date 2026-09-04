import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Clock, Download, Eye, Grid2X2, Package, Plus, Settings, Star
} from "lucide-react";
import { ErrorState, Skeleton, StarRating } from "../components/ui";
import { formatCompact, formatNumber, formatRelative } from "../lib/format";
import { adminUrl } from "../lib/config";
import {
  useAuditLog, useCountryStats, useDownloadSeries, useOverview, useReviews, useTopProducts
} from "../lib/queries";
import { AdminPanel, AreaChart, DateRangePicker, PageHeading, type RangeState } from "./components";
import { useAuth } from "./auth";

function Kpi({ label, value, hint, icon: Icon, to }: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Package;
  to?: string;
}) {
  const content = (
    <>
      <div className="kpi-icon"><Icon /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </>
  );
  // Dashboard cards are clickable: each one leads to the screen behind it.
  return to ? <Link className="kpi kpi-link" to={to}>{content}</Link> : <div className="kpi">{content}</div>;
}

export function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<RangeState>({ range: "30d" });

  const overview = useOverview(range);
  const series = useDownloadSeries(range);
  const countries = useCountryStats({ ...range, limit: 7 });
  const top = useTopProducts({ ...range, limit: 5 });
  const reviews = useReviews({ limit: 5 });
  const audit = useAuditLog(6);

  if (overview.error) {
    return <div className="dashboard"><ErrorState error={overview.error} onRetry={() => overview.refetch()} /></div>;
  }

  const data = overview.data;

  return (
    <div className="dashboard">
      <PageHeading title={`Welcome back, ${user?.name ?? "there"}`} text="Catalog, traffic and moderation at a glance.">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeading>

      <div className="kpi-grid">
        {overview.isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <div className="kpi" key={index}><Skeleton height={54} /></div>)
        ) : (
          <>
            <Kpi label="Total tools" value={formatNumber(data.totalProducts)} hint={`${data.publishedProducts} published`} icon={Package} to={adminUrl("/products")} />
            <Kpi label="Downloads in range" value={formatNumber(data.downloadsInRange)} hint={`${formatNumber(data.downloadsToday)} today`} icon={Download} to={adminUrl("/downloads")} />
            <Kpi label="Views in range" value={formatNumber(data.viewsInRange)} hint={`${formatNumber(data.totalVisitors)} unique visitors`} icon={Eye} to={adminUrl("/analytics")} />
            <Kpi label="Average rating" value={data.averageRating ? data.averageRating.toFixed(2) : "—"} hint={`${formatNumber(data.totalReviews)} reviews`} icon={Star} to={adminUrl("/reviews")} />
          </>
        )}
      </div>

      <div className="kpi-grid secondary">
        <Kpi label="Downloads this week" value={formatNumber(data?.downloadsThisWeek ?? 0)} icon={Download} />
        <Kpi label="Downloads this month" value={formatNumber(data?.downloadsThisMonth ?? 0)} icon={Download} />
        <Kpi label="Download rate" value={`${data?.conversionRate ?? 0}%`} hint="Views that became downloads" icon={ArrowUpRight} />
        <Kpi label="Pending reviews" value={formatNumber(data?.pendingReviews ?? 0)} hint="Waiting for moderation" icon={Star} to={adminUrl("/reviews")} />
      </div>

      <div className="analytics-grid">
        <AdminPanel title="Downloads overview" subtitle="Downloads and views over the selected range" className="chart-panel">
          {series.isLoading ? <Skeleton height={220} /> : null}
          {series.data ? <AreaChart series={series.data.downloads} compare={series.data.views} /> : null}
        </AdminPanel>

        <AdminPanel
          title="Top countries"
          subtitle="Downloads by location"
          action={<Link className="panel-link" to={adminUrl("/countries")}>View all</Link>}
          className="countries-panel"
        >
          {countries.isLoading ? <Skeleton height={200} /> : null}
          {(countries.data?.items ?? []).map((row) => (
            <div className="country" key={row.countryCode}>
              <div>
                <span className="flag-code">{row.countryCode}</span>
                <b>{row.country}</b>
                <em>{row.percentage}%</em>
              </div>
              <div className="progress"><i style={{ width: `${Math.min(100, row.percentage)}%` }} /></div>
            </div>
          ))}
          {countries.data && countries.data.items.length === 0 ? <p className="chart-empty">No downloads in this range.</p> : null}
        </AdminPanel>
      </div>

      <div className="bottom-grid admin-three">
        <AdminPanel
          title="Top tools"
          subtitle="Most downloaded in range"
          action={<Link className="panel-link" to={adminUrl("/products")}>View all</Link>}
        >
          {(top.data?.items ?? []).map((product, index) => (
            <Link className="mini-row" key={product.id} to={adminUrl(`/products/${product.id}/edit`)}>
              <span className="rank">{index + 1}</span>
              {product.thumbnail ? <img src={product.thumbnail} alt="" /> : <span className="image-fallback small" />}
              <div>
                <b>{product.name}</b>
                <small>{product.category?.name}</small>
              </div>
              <strong>{formatCompact(product.periodDownloads)}</strong>
            </Link>
          ))}
          {top.data && top.data.items.length === 0 ? <p className="chart-empty">No downloads recorded yet.</p> : null}
        </AdminPanel>

        <AdminPanel
          title="Recent reviews"
          subtitle="Latest community activity"
          action={<Link className="panel-link" to={adminUrl("/reviews")}>Moderate</Link>}
        >
          {(reviews.data?.items ?? []).map((review) => (
            <div className="review-row" key={review.id}>
              <div className="avatar tiny">{review.authorName.slice(0, 2).toUpperCase()}</div>
              <div>
                <b>{review.authorName}</b>
                <p>{review.body.slice(0, 70)}…</p>
              </div>
              <StarRating value={review.rating} size={10} />
            </div>
          ))}
          {reviews.data && reviews.data.items.length === 0 ? <p className="chart-empty">No reviews yet.</p> : null}
        </AdminPanel>

        <AdminPanel title="Quick actions" subtitle="Common management tasks">
          <div className="quick-actions">
            <Link to={adminUrl("/products/new")} className="quick-action">
              <span><Plus /></span>
              <div><b>Add new tool</b><small>Create a catalog entry</small></div>
            </Link>
            <Link to={adminUrl("/categories")} className="quick-action">
              <span><Grid2X2 /></span>
              <div><b>Manage categories</b><small>Organize the catalog</small></div>
            </Link>
            <Link to={adminUrl("/reviews")} className="quick-action">
              <span><Star /></span>
              <div><b>Moderate reviews</b><small>{data?.pendingReviews ?? 0} waiting</small></div>
            </Link>
            <Link to={adminUrl("/settings")} className="quick-action">
              <span><Settings /></span>
              <div><b>Site settings</b><small>Branding, footer, SEO</small></div>
            </Link>
          </div>
        </AdminPanel>
      </div>

      <div className="activity-grid">
        <AdminPanel title="Activity log" subtitle="Latest administrative events">
          {(audit.data?.items ?? []).map((entry) => (
            <div className="activity-row" key={entry.id}>
              <span className="activity-dot" />
              <div>
                <b>{entry.action.replace(/[._]/g, " ")} · {entry.entity}</b>
                <small>{entry.actorName} · {formatRelative(entry.createdAt)}</small>
              </div>
            </div>
          ))}
          {audit.data && audit.data.items.length === 0 ? <p className="chart-empty">No admin activity recorded yet.</p> : null}
        </AdminPanel>

        <AdminPanel title="Catalog summary" subtitle="Platform health" className="system-info">
          {[
            ["Total tools", formatNumber(data?.totalProducts ?? 0)],
            ["Published", formatNumber(data?.publishedProducts ?? 0)],
            ["Categories", formatNumber(data?.totalCategories ?? 0)],
            ["Lifetime downloads", formatNumber(data?.totalDownloads ?? 0)],
            ["Lifetime views", formatNumber(data?.totalViews ?? 0)],
            ["Pending reviews", formatNumber(data?.pendingReviews ?? 0)]
          ].map(([label, value]) => (
            <div className="info-line" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
          <div className="info-line">
            <span><Clock size={11} /> Range</span>
            <b>{data ? `${new Date(data.range.from).toLocaleDateString()} → ${new Date(data.range.to).toLocaleDateString()}` : "—"}</b>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
