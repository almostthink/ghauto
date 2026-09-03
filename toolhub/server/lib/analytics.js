import crypto from "node:crypto";
import { env } from "../env.js";
import { COUNTRY_NAMES } from "./countries.js";

// Visitor IPs are never stored. They are hashed with a daily rotating salt so
// abuse limits still work while the stored value cannot be reversed.
let saltDay = "";
let dailySalt = "";

function currentSalt() {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== saltDay) {
    saltDay = day;
    dailySalt = crypto.createHash("sha256").update(`${env.jwtSecret}:${day}`).digest("hex");
  }
  return dailySalt;
}

export function hashIp(ip) {
  if (!ip) return "";
  return crypto.createHash("sha256").update(`${currentSalt()}:${ip}`).digest("hex").slice(0, 32);
}

// The address rate limits and unique-visitor counts are keyed on.
// Behind Cloudflare, CF-Connecting-IP is the only header the edge sets itself
// and cannot be influenced by the visitor, so it wins when TRUST_CLOUDFLARE is
// on. Without that flag the header is ignored: at an origin reachable from the
// open internet, anyone could send it.
export function clientIp(req) {
  if (env.trustCloudflare) {
    const edge = req.headers["cf-connecting-ip"];
    if (typeof edge === "string" && edge.trim()) return edge.trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}

export function deviceCategory(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
  if (/bot|crawler|spider|crawling/.test(ua)) return "bot";
  return "desktop";
}

// Country comes from the CDN/proxy header when present. City is only recorded
// when the proxy already resolved it, and never derived from the raw IP here.
export function geoFromRequest(req) {
  const header = (name) => {
    const value = req.headers[name];
    return typeof value === "string" ? value.trim() : "";
  };
  const code = (
    header("cf-ipcountry") ||
    header("x-vercel-ip-country") ||
    header("x-country-code") ||
    header("x-geo-country")
  ).toUpperCase();
  const region = header("cf-region") || header("x-vercel-ip-country-region") || header("x-geo-region");
  const city = header("cf-ipcity") || header("x-vercel-ip-city") || header("x-geo-city");
  const normalized = code && code !== "XX" && code.length === 2 ? code : "";
  return {
    countryCode: normalized,
    country: normalized ? COUNTRY_NAMES[normalized] || normalized : "Unknown",
    region: region.slice(0, 80),
    city: decodeURIComponent(city || "").slice(0, 80)
  };
}

export function requestContext(req) {
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 300);
  return {
    ...geoFromRequest(req),
    referrer: String(req.headers.referer || req.headers.referrer || "").slice(0, 300),
    userAgent,
    device: deviceCategory(userAgent),
    ipHash: hashIp(clientIp(req))
  };
}

// Supported dashboard ranges. `custom` is driven by explicit from/to params.
export const RANGES = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365
};

export function resolveRange({ range = "30d", from, to }) {
  const end = to ? new Date(to) : new Date();
  if (Number.isNaN(end.getTime())) throw new Error("Invalid `to` date");
  if (range === "custom" && from) {
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) throw new Error("Invalid `from` date");
    return { start, end, range };
  }
  const days = RANGES[range] ?? RANGES["30d"];
  const start = new Date(end);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else start.setDate(start.getDate() - days);
  return { start, end, range };
}

// Buckets events into day or month slots and returns a gap-free series.
export function buildSeries(rows, start, end, granularity) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.bucket, Number(row.total));
  }
  const series = [];
  const cursor = new Date(start);
  if (granularity === "month") cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key =
      granularity === "month"
        ? cursor.toISOString().slice(0, 7)
        : cursor.toISOString().slice(0, 10);
    series.push({ date: key, value: counts.get(key) || 0 });
    if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export function granularityFor(start, end) {
  const days = (end - start) / 86400000;
  return days > 120 ? "month" : "day";
}
