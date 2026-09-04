import express from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { buildSeries, granularityFor, resolveRange } from "../lib/analytics.js";
import { COUNTRY_REGIONS } from "../lib/countries.js";
import { badRequest, parseQuery, route } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { analyticsQuerySchema } from "../schemas/index.js";

export const analyticsRouter = express.Router();

analyticsRouter.use(requireAuth);

function range(req) {
  const query = parseQuery(analyticsQuerySchema, req.query);
  try {
    return { ...resolveRange(query), limit: query.limit };
  } catch (error) {
    throw badRequest(error.message);
  }
}

// Day/month buckets are computed in SQL: pulling every event into Node would
// not survive a real traffic volume.
async function bucketed(table, start, end, granularity) {
  const unit = granularity === "month" ? "month" : "day";
  const format = granularity === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT to_char(date_trunc(${unit}, "createdAt"), ${format}) AS bucket, count(*)::int AS total
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE "createdAt" BETWEEN ${start} AND ${end}
    GROUP BY 1
    ORDER BY 1
  `);
  return buildSeries(rows, start, end, granularity);
}

analyticsRouter.get("/overview", route(async (req, res) => {
  const { start, end } = range(req);
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30);

  const [
    totalProducts, publishedProducts, totalDownloads, totalViews, ratingAgg,
    downloadsToday, downloadsWeek, downloadsMonth, downloadsRange, viewsRange,
    uniqueVisitors, pendingReviews, totalReviews, categories
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "published" } }),
    prisma.downloadEvent.count(),
    prisma.viewEvent.count(),
    // From the reviews themselves, not from the rating typed on the product.
    prisma.review.aggregate({ where: { status: "approved" }, _avg: { rating: true } }),
    prisma.downloadEvent.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.downloadEvent.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.downloadEvent.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.downloadEvent.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.viewEvent.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.viewEvent.findMany({
      where: { createdAt: { gte: start, lte: end } },
      distinct: ["ipHash"],
      select: { ipHash: true }
    }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.review.count(),
    // Only top-level categories: this is the number visitors see in the nav.
    prisma.category.count({ where: { parentId: null } })
  ]);

  res.json({
    totalProducts,
    publishedProducts,
    totalCategories: categories,
    totalDownloads,
    totalViews,
    totalVisitors: uniqueVisitors.length,
    averageRating: Number((ratingAgg._avg.rating ?? 0).toFixed(2)),
    downloadsToday,
    downloadsThisWeek: downloadsWeek,
    downloadsThisMonth: downloadsMonth,
    downloadsInRange: downloadsRange,
    viewsInRange: viewsRange,
    // Share of catalog views that turned into a download.
    conversionRate: viewsRange ? Number(((downloadsRange / viewsRange) * 100).toFixed(1)) : 0,
    pendingReviews,
    totalReviews,
    range: { from: start, to: end }
  });
}));

analyticsRouter.get("/downloads", route(async (req, res) => {
  const { start, end } = range(req);
  const granularity = granularityFor(start, end);
  const [downloads, views] = await Promise.all([
    bucketed("DownloadEvent", start, end, granularity),
    bucketed("ViewEvent", start, end, granularity)
  ]);
  res.json({ granularity, downloads, views });
}));

analyticsRouter.get("/countries", route(async (req, res) => {
  const { start, end, limit } = range(req);
  const midpoint = new Date((start.getTime() + end.getTime()) / 2);

  const [downloads, views, previous, overall] = await Promise.all([
    prisma.downloadEvent.groupBy({
      by: ["countryCode", "country"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
      orderBy: { _count: { countryCode: "desc" } },
      take: limit
    }),
    prisma.viewEvent.groupBy({
      by: ["countryCode"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true }
    }),
    prisma.downloadEvent.groupBy({
      by: ["countryCode"],
      where: { createdAt: { gte: start, lt: midpoint } },
      _count: { _all: true }
    }),
    prisma.downloadEvent.count({ where: { createdAt: { gte: start, lte: end } } })
  ]);

  const viewsBy = Object.fromEntries(views.map((row) => [row.countryCode, row._count._all]));
  const firstHalf = Object.fromEntries(previous.map((row) => [row.countryCode, row._count._all]));
  // Percentages are shares of every download in the range, not just the top rows.
  const total = overall || 1;

  res.json({
    total,
    items: downloads.map((row) => {
      const value = row._count._all;
      const before = firstHalf[row.countryCode] ?? 0;
      const after = value - before;
      return {
        countryCode: row.countryCode || "??",
        country: row.country || "Unknown",
        region: COUNTRY_REGIONS[row.countryCode] ?? "",
        downloads: value,
        views: viewsBy[row.countryCode] ?? 0,
        percentage: Number(((value / total) * 100).toFixed(1)),
        trend: before === 0 ? (after > 0 ? 100 : 0) : Number((((after - before) / before) * 100).toFixed(1))
      };
    })
  });
}));

analyticsRouter.get("/products", route(async (req, res) => {
  const { start, end, limit } = range(req);
  const grouped = await prisma.downloadEvent.groupBy({
    by: ["productId"],
    where: { createdAt: { gte: start, lte: end } },
    _count: { _all: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit
  });
  const [products, lifetime] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: grouped.map((row) => row.productId) } },
      select: {
        id: true, name: true, slug: true, thumbnail: true, rating: true,
        category: { select: { name: true, slug: true } }
      }
    }),
    // Every recorded download for these products, not the catalog figure.
    prisma.downloadEvent.groupBy({
      by: ["productId"],
      where: { productId: { in: grouped.map((row) => row.productId) } },
      _count: { _all: true }
    })
  ]);
  const lifetimeById = new Map(lifetime.map((row) => [row.productId, row._count._all]));
  const byId = new Map(
    products.map((product) => [product.id, { ...product, downloads: lifetimeById.get(product.id) ?? 0 }])
  );

  const [byCategory, newProducts, reviewActivity] = await Promise.all([
    // Counted from download events joined to their product's category, so an
    // edited catalog figure cannot inflate the chart.
    prisma.$queryRaw(Prisma.sql`
      SELECT p."categoryId" AS "categoryId", count(*)::int AS downloads
      FROM "DownloadEvent" e
      JOIN "Product" p ON p.id = e."productId"
      GROUP BY p."categoryId"
    `),
    prisma.product.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.review.count({ where: { createdAt: { gte: start, lte: end } } })
  ]);
  const categories = await prisma.category.findMany({ select: { id: true, name: true, accent: true } });
  const categoryName = new Map(categories.map((category) => [category.id, category]));

  res.json({
    items: grouped
      .filter((row) => byId.has(row.productId))
      .map((row) => ({ ...byId.get(row.productId), periodDownloads: row._count._all })),
    byCategory: byCategory
      .map((row) => ({
        categoryId: row.categoryId,
        name: categoryName.get(row.categoryId)?.name ?? "Unknown",
        accent: categoryName.get(row.categoryId)?.accent ?? "#8b5cf6",
        downloads: Number(row.downloads)
      }))
      .sort((a, b) => b.downloads - a.downloads),
    newProducts,
    reviewActivity
  });
}));

// Where the traffic came from, grouped into readable buckets.
analyticsRouter.get("/sources", route(async (req, res) => {
  const { start, end } = range(req);
  const rows = await prisma.viewEvent.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { referrer: true, device: true }
  });
  const sources = new Map();
  const devices = new Map();
  for (const row of rows) {
    let label = "Direct";
    if (row.referrer) {
      try {
        const host = new URL(row.referrer).hostname.replace(/^www\./, "");
        label = /google|bing|duckduckgo|yandex/.test(host) ? "Organic search" : host;
      } catch {
        label = "Other";
      }
    }
    sources.set(label, (sources.get(label) ?? 0) + 1);
    devices.set(row.device, (devices.get(row.device) ?? 0) + 1);
  }
  const toList = (map) =>
    [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  res.json({ total: rows.length, sources: toList(sources), devices: toList(devices) });
}));
