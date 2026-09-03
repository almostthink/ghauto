import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { ErrorState, Skeleton } from "../components/ui";
import { adminUrl } from "../lib/config";
import { formatCompact, formatNumber } from "../lib/format";
import {
  useCountryStats, useDownloadSeries, useOverview, useTopProducts, useTrafficSources
} from "../lib/queries";
import { AdminPanel, AreaChart, BarList, DateRangePicker, PageHeading, type RangeState } from "./components";

// --- Analytics ------------------------------------------------------------

export function AnalyticsPage() {
  const [range, setRange] = useState<RangeState>({ range: "30d" });
  const overview = useOverview(range);
  const series = useDownloadSeries(range);
  const top = useTopProducts({ ...range, limit: 10 });
  const sources = useTrafficSources(range);

  if (overview.error) return <div className="dashboard"><ErrorState error={overview.error} /></div>;

  return (
    <div className="dashboard">
      <PageHeading title="Analytics" text="Traffic, downloads and catalog performance.">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeading>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-icon"><Download /></div><span>Downloads</span><strong>{formatNumber(overview.data?.downloadsInRange ?? 0)}</strong></div>
        <div className="kpi"><div className="kpi-icon"><Eye /></div><span>Views</span><strong>{formatNumber(overview.data?.viewsInRange ?? 0)}</strong></div>
        <div className="kpi"><div className="kpi-icon"><TrendingUp /></div><span>Download rate</span><strong>{overview.data?.conversionRate ?? 0}%</strong></div>
        <div className="kpi"><div className="kpi-icon"><Eye /></div><span>Unique visitors</span><strong>{formatNumber(overview.data?.totalVisitors ?? 0)}</strong></div>
      </div>

      <AdminPanel title="Downloads and views" subtitle="Trend over the selected range" className="chart-panel wide-panel">
        {series.isLoading ? <Skeleton height={220} /> : null}
        {series.data ? <AreaChart series={series.data.downloads} compare={series.data.views} height={260} /> : null}
      </AdminPanel>

      <div className="analytics-grid">
        <AdminPanel title="Downloads by category" subtitle="Lifetime totals per category">
          <BarList items={(top.data?.byCategory ?? []).map((row) => ({ label: row.name, value: row.downloads, accent: row.accent }))} />
        </AdminPanel>
        <AdminPanel title="Traffic sources" subtitle={`${formatNumber(sources.data?.total ?? 0)} views in range`}>
          <BarList items={sources.data?.sources ?? []} />
          <div className="device-split">
            {(sources.data?.devices ?? []).map((device) => (
              <div key={device.label}>
                <b>{formatCompact(device.value)}</b>
                <span>{device.label}</span>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Top products" subtitle="Ranked by downloads in the selected range" className="table-panel">
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Category</th><th>In range</th><th>Lifetime</th><th>Rating</th></tr>
          </thead>
          <tbody>
            {(top.data?.items ?? []).map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                <td>
                  <Link className="table-product" to={adminUrl(`/products/${product.id}/edit`)}>
                    {product.thumbnail ? <img src={product.thumbnail} alt="" /> : <span className="image-fallback small" />}
                    <div><b>{product.name}</b><small>/{product.slug}</small></div>
                  </Link>
                </td>
                <td>{product.category?.name}</td>
                <td>{formatNumber(product.periodDownloads)}</td>
                <td>{formatNumber(product.downloads)}</td>
                <td>★ {product.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {top.data && top.data.items.length === 0 ? <p className="chart-empty">No downloads in this range.</p> : null}
      </AdminPanel>

      <div className="analytics-grid">
        <AdminPanel title="New products" subtitle="Added in the selected range">
          <div className="big-stat">{formatNumber(top.data?.newProducts ?? 0)}</div>
        </AdminPanel>
        <AdminPanel title="Review activity" subtitle="Reviews submitted in the selected range">
          <div className="big-stat">{formatNumber(top.data?.reviewActivity ?? 0)}</div>
        </AdminPanel>
      </div>
    </div>
  );
}

// --- Downloads ------------------------------------------------------------

export function DownloadsPage() {
  const [range, setRange] = useState<RangeState>({ range: "30d" });
  const overview = useOverview(range);
  const series = useDownloadSeries(range);
  const top = useTopProducts({ ...range, limit: 20 });

  return (
    <div className="dashboard">
      <PageHeading title="Downloads" text="Every counted download, by day and by product.">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeading>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-icon"><Download /></div><span>Today</span><strong>{formatNumber(overview.data?.downloadsToday ?? 0)}</strong></div>
        <div className="kpi"><div className="kpi-icon"><Download /></div><span>Last 7 days</span><strong>{formatNumber(overview.data?.downloadsThisWeek ?? 0)}</strong></div>
        <div className="kpi"><div className="kpi-icon"><Download /></div><span>Last 30 days</span><strong>{formatNumber(overview.data?.downloadsThisMonth ?? 0)}</strong></div>
        <div className="kpi"><div className="kpi-icon"><Download /></div><span>Lifetime</span><strong>{formatNumber(overview.data?.totalDownloads ?? 0)}</strong></div>
      </div>

      <AdminPanel title="Download volume" subtitle="Counted at the download redirect" className="chart-panel wide-panel">
        {series.isLoading ? <Skeleton height={220} /> : null}
        {series.data ? <AreaChart series={series.data.downloads} height={250} /> : null}
      </AdminPanel>

      <AdminPanel title="By product" subtitle="Downloads in the selected range" className="table-panel">
        <table>
          <thead><tr><th>Product</th><th>In range</th><th>Lifetime</th></tr></thead>
          <tbody>
            {(top.data?.items ?? []).map((product) => (
              <tr key={product.id}>
                <td>
                  <Link className="table-product" to={adminUrl(`/products/${product.id}/edit`)}>
                    {product.thumbnail ? <img src={product.thumbnail} alt="" /> : <span className="image-fallback small" />}
                    <div><b>{product.name}</b><small>{product.category?.name}</small></div>
                  </Link>
                </td>
                <td>{formatNumber(product.periodDownloads)}</td>
                <td>{formatNumber(product.downloads)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminPanel>
    </div>
  );
}

// --- Countries ------------------------------------------------------------

export function CountriesPage() {
  const [range, setRange] = useState<RangeState>({ range: "30d" });
  const countries = useCountryStats({ ...range, limit: 50 });

  const byRegion = (countries.data?.items ?? []).reduce<Record<string, number>>((acc, row) => {
    const region = row.region || "Other";
    acc[region] = (acc[region] ?? 0) + row.downloads;
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <PageHeading title="Countries" text="Where downloads and views come from. Only country level data is stored.">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeading>

      <div className="analytics-grid">
        <AdminPanel title="Country breakdown" subtitle={`${formatNumber(countries.data?.total ?? 0)} downloads in range`} className="table-panel">
          <table>
            <thead>
              <tr><th>Country</th><th>Region</th><th>Downloads</th><th>Views</th><th>Share</th><th>Trend</th></tr>
            </thead>
            <tbody>
              {(countries.data?.items ?? []).map((row) => (
                <tr key={row.countryCode}>
                  <td><span className="flag-code">{row.countryCode}</span> {row.country}</td>
                  <td>{row.region || "—"}</td>
                  <td>{formatNumber(row.downloads)}</td>
                  <td>{formatNumber(row.views)}</td>
                  <td>
                    <div className="share-cell">
                      <span>{row.percentage}%</span>
                      <div className="progress"><i style={{ width: `${Math.min(100, row.percentage)}%` }} /></div>
                    </div>
                  </td>
                  <td className={row.trend >= 0 ? "trend-up" : "trend-down"}>
                    {row.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(row.trend)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {countries.data && countries.data.items.length === 0 ? <p className="chart-empty">No geo data in this range.</p> : null}
        </AdminPanel>

        <AdminPanel title="By region" subtitle="Downloads grouped by region">
          <BarList items={Object.entries(byRegion).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} />
          <p className="form-note">
            Country is read from the CDN header on each request. No IP address is stored: visitor IPs are hashed with a daily rotating salt.
          </p>
        </AdminPanel>
      </div>
    </div>
  );
}
