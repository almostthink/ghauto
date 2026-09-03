import { useMemo, useRef, useState } from "react";
import { Calendar, ImagePlus, Trash2, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Spinner, useToast } from "../components/ui";
import { formatCompact } from "../lib/format";
import { useUploadImage } from "../lib/queries";
import type { DateRange, SeriesPoint } from "../lib/types";

// --- Date range -----------------------------------------------------------

export interface RangeState {
  range: DateRange;
  from?: string;
  to?: string;
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
  custom: "Custom"
};

export function DateRangePicker({ value, onChange }: { value: RangeState; onChange: (next: RangeState) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="range-picker">
      <div className="range-tabs">
        {(Object.keys(RANGE_LABELS) as DateRange[])
          .filter((key) => key !== "custom")
          .map((key) => (
            <button
              type="button"
              key={key}
              className={value.range === key ? "range-tab active" : "range-tab"}
              onClick={() => onChange({ range: key })}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        <button
          type="button"
          className={value.range === "custom" ? "range-tab active" : "range-tab"}
          onClick={() => setOpen(!open)}
        >
          <Calendar size={12} /> Custom
        </button>
      </div>
      {open ? (
        <div className="range-custom">
          <label>
            From
            <input
              type="date"
              value={value.from ?? ""}
              onChange={(event) => onChange({ range: "custom", from: event.target.value, to: value.to })}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={value.to ?? ""}
              onChange={(event) => onChange({ range: "custom", from: value.from, to: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

// --- Charts (plain SVG, no chart dependency) -----------------------------

export function AreaChart({ series, compare, height = 220, label = "Downloads", compareLabel = "Views" }: {
  series: SeriesPoint[];
  compare?: SeriesPoint[];
  height?: number;
  label?: string;
  compareLabel?: string;
}) {
  const width = 760;
  const padding = { top: 14, right: 8, bottom: 22, left: 34 };

  const { linePath, areaPath, comparePath, ticks, max } = useMemo(() => {
    const values = [...series.map((point) => point.value), ...(compare ?? []).map((point) => point.value)];
    const peak = Math.max(1, ...values);
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const stepX = series.length > 1 ? innerWidth / (series.length - 1) : innerWidth;

    const toPoint = (point: SeriesPoint, index: number) => [
      padding.left + index * stepX,
      padding.top + innerHeight - (point.value / peak) * innerHeight
    ];

    const line = series.map((point, index) => {
      const [x, y] = toPoint(point, index);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    const area = series.length
      ? `${line} L${(padding.left + (series.length - 1) * stepX).toFixed(1)},${(height - padding.bottom).toFixed(1)} L${padding.left},${(height - padding.bottom).toFixed(1)} Z`
      : "";

    const comparison = (compare ?? []).map((point, index) => {
      const [x, y] = toPoint(point, index);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    return {
      linePath: line,
      areaPath: area,
      comparePath: comparison,
      max: peak,
      ticks: [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
        y: padding.top + innerHeight - fraction * innerHeight,
        value: Math.round(peak * fraction)
      }))
    };
  }, [series, compare, height]);

  if (!series.length) return <p className="chart-empty">No activity in this period.</p>;

  const labelEvery = Math.ceil(series.length / 8);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="area-chart" role="img" aria-label={`${label} over time`}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} className="grid-line" />
            <text x={4} y={tick.y + 3} className="axis-label">{formatCompact(tick.value)}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaFill)" />
        {comparePath ? <path d={comparePath} className="chart-line compare" /> : null}
        <path d={linePath} className="chart-line" />
        {series.map((point, index) =>
          index % labelEvery === 0 ? (
            <text
              key={point.date}
              x={padding.left + index * ((width - padding.left - padding.right) / Math.max(1, series.length - 1))}
              y={height - 6}
              className="axis-label"
              textAnchor="middle"
            >
              {point.date.length > 7 ? point.date.slice(5) : point.date}
            </text>
          ) : null
        )}
      </svg>
      <div className="chart-legend">
        <i /> {label}
        {compare ? <><i className="compare-dot" /> {compareLabel}</> : null}
        <span>Peak {formatCompact(max)}</span>
      </div>
    </div>
  );
}

export function BarList({ items, accent = "#8b5cf6" }: { items: { label: string; value: number; accent?: string }[]; accent?: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (!items.length) return <p className="chart-empty">Nothing recorded yet.</p>;
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-list-row" key={item.label}>
          <div>
            <b>{item.label}</b>
            <em>{formatCompact(item.value)}</em>
          </div>
          <div className="progress">
            <i style={{ width: `${(item.value / max) * 100}%`, background: item.accent ?? accent }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Layout helpers -------------------------------------------------------

export function AdminPanel({ title, subtitle, action, children, className = "" }: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`admin-panel ${className}`}>
      {title ? (
        <div className="panel-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <small>{subtitle}</small> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function PageHeading({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="dash-heading">
      <div>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {children ? <div className="dashboard-tools">{children}</div> : null}
    </div>
  );
}

// --- Media picker ---------------------------------------------------------

export function ImageField({ value, onChange, label, prefix = "products" }: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  prefix?: string;
}) {
  const upload = useUploadImage();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await upload.mutateAsync({ file, prefix });
      onChange(result.url);
      toast("Image uploaded");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed", "error");
    }
  };

  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      <div className="image-field-body">
        <div className="image-preview">
          {value ? <img src={value} alt="" /> : <ImagePlus size={18} />}
        </div>
        <div className="image-field-controls">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://… or upload a file"
            aria-label={`${label} URL`}
          />
          <div className="image-field-buttons">
            <button type="button" className="btn ghost small" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Spinner size={13} /> : <Upload size={13} />} Upload
            </button>
            {value ? (
              <button type="button" className="btn ghost small" onClick={() => onChange("")}>
                <Trash2 size={13} /> Clear
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            hidden
            onChange={(event) => pick(event.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}
