import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { requestContext } from "../lib/analytics.js";
import { HttpError, notFound, parseBody, parseQuery, route } from "../lib/http.js";
import { slugify, uniqueSlug } from "../lib/text.js";
import { requirePermission } from "../middleware/auth.js";
import { downloadLimiter } from "../middleware/limits.js";
import { bulkProductSchema, productPatchSchema, productQuerySchema, productSchema } from "../schemas/index.js";

export const productsRouter = express.Router();

const productInclude = {
  category: { select: { id: true, slug: true, name: true, icon: true, accent: true } },
  subcategory: { select: { id: true, slug: true, name: true } },
  images: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } }
};

export function serializeProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    categoryId: product.categoryId,
    category: product.category ?? null,
    subcategoryId: product.subcategoryId,
    subcategory: product.subcategory ?? null,
    rating: product.rating,
    reviewCount: product.reviewCount,
    downloads: product.downloads,
    views: product.views,
    version: product.version,
    fileSize: product.fileSize,
    license: product.license,
    price: product.price,
    downloadUrl: product.downloadUrl,
    officialUrl: product.officialUrl,
    thumbnail: product.thumbnail,
    featured: product.featured,
    popular: product.popular,
    verified: product.verified,
    status: product.status,
    availabilityMode: product.availabilityMode,
    countryAvailability: product.countryAvailability,
    features: product.features,
    requirements: product.requirements,
    changelog: Array.isArray(product.changelog) ? product.changelog : [],
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords,
    tags: (product.tags ?? []).map((link) => link.tag.name),
    gallery: (product.images ?? []).filter((i) => i.kind === "gallery").map(serializeImage),
    screenshots: (product.images ?? []).filter((i) => i.kind === "screenshot").map(serializeImage),
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

const serializeImage = (image) => ({ id: image.id, url: image.url, alt: image.alt, kind: image.kind });

const SORTS = {
  popular: [{ downloads: "desc" }, { rating: "desc" }],
  downloads: [{ downloads: "desc" }],
  rating: [{ rating: "desc" }, { reviewCount: "desc" }],
  latest: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  alphabetical: [{ name: "asc" }]
};

// Simple ILIKE search. Swap for a tsvector column + GIN index once the
// catalog outgrows it; the query shape here stays the same.
function buildWhere(query, { adminView }) {
  const where = {};
  if (adminView) {
    if (query.status && query.status !== "any") where.status = query.status;
  } else {
    where.status = "published";
  }
  if (query.category) {
    where.OR = [
      { category: { slug: query.category } },
      { subcategory: { slug: query.category } }
    ];
  }
  if (query.tag) where.tags = { some: { tag: { slug: query.tag } } };
  if (query.featured) where.featured = query.featured === "true";
  if (query.minRating) where.rating = { gte: query.minRating };
  if (query.price === "free") where.price = { equals: "Free", mode: "insensitive" };
  if (query.price === "premium") where.price = { not: { equals: "Free", mode: "insensitive" } };
  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" };
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { name: contains },
          { shortDescription: contains },
          { longDescription: contains },
          { tags: { some: { tag: { name: contains } } } }
        ]
      }
    ];
  }
  return where;
}

async function listProducts(req, adminView) {
  const query = parseQuery(productQuerySchema, req.query);
  const where = buildWhere(query, { adminView });
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: SORTS[query.sort],
      skip: (query.page - 1) * query.perPage,
      take: query.perPage
    })
  ]);
  return {
    items: rows.map(serializeProduct),
    total,
    page: query.page,
    perPage: query.perPage,
    pages: Math.max(1, Math.ceil(total / query.perPage))
  };
}

// --- Public reads ---------------------------------------------------------

productsRouter.get("/", route(async (req, res) => {
  res.json(await listProducts(req, Boolean(req.user)));
}));

// Lightweight autocomplete feed for the global search box.
productsRouter.get("/suggest", route(async (req, res) => {
  const term = String(req.query.q || "").trim().slice(0, 80);
  if (term.length < 2) return res.json({ items: [] });
  const contains = { contains: term, mode: "insensitive" };
  const rows = await prisma.product.findMany({
    where: { status: "published", OR: [{ name: contains }, { shortDescription: contains }] },
    select: {
      id: true, slug: true, name: true, thumbnail: true, rating: true,
      category: { select: { name: true, slug: true } }
    },
    orderBy: [{ downloads: "desc" }],
    take: 8
  });
  res.json({ items: rows });
}));

productsRouter.get("/:idOrSlug", route(async (req, res) => {
  const { idOrSlug } = req.params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
    include: productInclude
  });
  if (!product) throw notFound("Product not found");
  if (product.status !== "published" && !req.user) throw notFound("Product not found");
  res.json(serializeProduct(product));
}));

productsRouter.get("/:id/related", route(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: req.params.id }, { id: req.params.id }] },
    select: { id: true, categoryId: true }
  });
  if (!product) throw notFound("Product not found");
  const rows = await prisma.product.findMany({
    where: { status: "published", categoryId: product.categoryId, NOT: { id: product.id } },
    include: productInclude,
    orderBy: [{ downloads: "desc" }],
    take: 4
  });
  res.json({ items: rows.map(serializeProduct) });
}));

// --- Download endpoint ----------------------------------------------------
// Counts the download, records the analytics event, then redirects.
productsRouter.get("/:id/download", downloadLimiter, route(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: req.params.id }, { id: req.params.id }] }
  });
  if (!product || product.status !== "published") throw notFound("Product not found");
  if (!product.downloadUrl) throw new HttpError(409, "This product has no download link configured");

  const context = requestContext(req);
  if (!isAvailableIn(product, context.countryCode)) {
    throw new HttpError(451, "This product is not available in your region");
  }

  await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { downloads: { increment: 1 } } }),
    prisma.downloadEvent.create({ data: { productId: product.id, ...context } }),
    ...(context.countryCode
      ? [prisma.country.updateMany({ where: { code: context.countryCode }, data: { downloads: { increment: 1 } } })]
      : [])
  ]);

  if (String(req.query.format) === "json") {
    return res.json({ url: product.downloadUrl });
  }
  res.redirect(302, product.downloadUrl);
}));

export function isAvailableIn(product, countryCode) {
  if (product.availabilityMode === "all" || !countryCode) return true;
  const listed = product.countryAvailability.includes(countryCode);
  return product.availabilityMode === "allow" ? listed : !listed;
}

// --- Admin writes ---------------------------------------------------------

async function syncRelations(productId, { tags, gallery, screenshots }) {
  if (tags) {
    await prisma.productTag.deleteMany({ where: { productId } });
    for (const name of tags) {
      const slug = slugify(name, "tag");
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { slug, name },
        update: { name }
      });
      await prisma.productTag.create({ data: { productId, tagId: tag.id } });
    }
  }
  for (const [kind, list] of [["gallery", gallery], ["screenshot", screenshots]]) {
    if (!list) continue;
    await prisma.productImage.deleteMany({ where: { productId, kind } });
    await prisma.productImage.createMany({
      data: list.map((image, index) => ({
        productId,
        url: image.url,
        alt: image.alt ?? "",
        kind,
        position: index
      }))
    });
  }
}

productsRouter.post("/", requirePermission("content.write"), route(async (req, res) => {
  const input = parseBody(productSchema, req.body);
  const slug = await uniqueSlug(prisma.product, slugify(input.slug || input.name, "product"));
  const { tags, gallery, screenshots, ...fields } = input;

  const product = await prisma.product.create({
    data: {
      ...fields,
      slug,
      publishedAt: fields.status === "published" ? new Date() : null
    }
  });
  await syncRelations(product.id, { tags, gallery, screenshots });
  await audit(req, "product.create", "product", product.id, { name: product.name });

  const created = await prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
  res.status(201).json(serializeProduct(created));
}));

productsRouter.put("/:id", requirePermission("content.write"), route(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("Product not found");

  const input = parseBody(productPatchSchema, req.body);
  const { tags, gallery, screenshots, slug: slugInput, ...fields } = input;
  const data = { ...fields };

  if (slugInput !== undefined || fields.name !== undefined) {
    const base = slugify(slugInput || fields.name || existing.name, "product");
    data.slug = await uniqueSlug(prisma.product, base, existing.id);
  }
  if (fields.status === "published" && !existing.publishedAt) data.publishedAt = new Date();

  await prisma.product.update({ where: { id: existing.id }, data });
  await syncRelations(existing.id, { tags, gallery, screenshots });
  await audit(req, "product.update", "product", existing.id, { fields: Object.keys(data) });

  const updated = await prisma.product.findUnique({ where: { id: existing.id }, include: productInclude });
  res.json(serializeProduct(updated));
}));

productsRouter.delete("/:id", requirePermission("content.write"), route(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("Product not found");
  await prisma.product.delete({ where: { id: existing.id } });
  await audit(req, "product.delete", "product", existing.id, { name: existing.name });
  res.status(204).end();
}));

productsRouter.post("/bulk", requirePermission("content.write"), route(async (req, res) => {
  const { ids, action } = parseBody(bulkProductSchema, req.body);
  const updates = {
    publish: { status: "published", publishedAt: new Date() },
    unpublish: { status: "draft" },
    archive: { status: "archived" },
    feature: { featured: true },
    unfeature: { featured: false }
  };

  if (action === "delete") {
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await audit(req, "product.bulk_delete", "product", "", { count: result.count });
    return res.json({ affected: result.count });
  }

  const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: updates[action] });
  await audit(req, `product.bulk_${action}`, "product", "", { count: result.count });
  res.json({ affected: result.count });
}));

// CSV export of the current admin filter selection.
productsRouter.get("/export/csv", requirePermission("content.read"), route(async (req, res) => {
  const query = parseQuery(productQuerySchema, { ...req.query, perPage: 100 });
  const rows = await prisma.product.findMany({
    where: buildWhere(query, { adminView: true }),
    include: productInclude,
    orderBy: SORTS[query.sort]
  });
  const columns = ["id", "slug", "name", "category", "status", "price", "rating", "reviewCount", "downloads", "views", "version", "updatedAt"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push([
      row.id, row.slug, row.name, row.category?.name ?? "", row.status, row.price,
      row.rating, row.reviewCount, row.downloads, row.views, row.version,
      row.updatedAt.toISOString()
    ].map(escape).join(","));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="toolhub-products.csv"');
  res.send(lines.join("\n"));
}));
