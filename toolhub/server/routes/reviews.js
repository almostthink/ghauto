import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { requestContext } from "../lib/analytics.js";
import { notFound, parseBody, route } from "../lib/http.js";
import { requirePermission } from "../middleware/auth.js";
import { reviewLimiter } from "../middleware/limits.js";
import { reviewPatchSchema, reviewSchema } from "../schemas/index.js";

export const reviewsRouter = express.Router();

const serialize = (review) => ({
  id: review.id,
  productId: review.productId,
  product: review.product ? { id: review.product.id, name: review.product.name, slug: review.product.slug } : null,
  authorName: review.authorName,
  rating: review.rating,
  title: review.title,
  body: review.body,
  status: review.status,
  country: review.country,
  createdAt: review.createdAt
});

// Recomputes the denormalised rating/reviewCount from approved reviews only.
async function refreshProductRating(productId) {
  const stats = await prisma.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { _all: true }
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Number((stats._avg.rating ?? 0).toFixed(2)),
      reviewCount: stats._count._all
    }
  });
}

reviewsRouter.get("/", route(async (req, res) => {
  const isAdmin = Boolean(req.user);
  const status = String(req.query.status || "");
  const where = {};
  if (req.query.productId) where.productId = String(req.query.productId);
  if (isAdmin && ["pending", "approved", "rejected"].includes(status)) where.status = status;
  if (!isAdmin) where.status = "approved";

  const take = Math.min(Number(req.query.limit) || 20, 100);
  const rows = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: isAdmin ? { product: { select: { id: true, name: true, slug: true } } } : undefined
  });
  const counts = isAdmin
    ? await prisma.review.groupBy({ by: ["status"], _count: { _all: true } })
    : [];
  res.json({
    items: rows.map(serialize),
    counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all]))
  });
}));

// Anonymous submission: the public site has no accounts, so reviews land in
// moderation and only become visible once an admin approves them.
reviewsRouter.post("/", reviewLimiter, route(async (req, res) => {
  const input = parseBody(reviewSchema, req.body);
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || product.status !== "published") throw notFound("Product not found");

  const context = requestContext(req);
  const review = await prisma.review.create({
    data: { ...input, status: "pending", country: context.country, ipHash: context.ipHash }
  });
  res.status(201).json({ id: review.id, status: review.status });
}));

reviewsRouter.put("/:id", requirePermission("reviews.write"), route(async (req, res) => {
  const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("Review not found");
  const input = parseBody(reviewPatchSchema, req.body);
  const review = await prisma.review.update({ where: { id: existing.id }, data: input });
  await refreshProductRating(review.productId);
  await audit(req, "review.update", "review", review.id, input);
  res.json(serialize(review));
}));

reviewsRouter.delete("/:id", requirePermission("reviews.write"), route(async (req, res) => {
  const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("Review not found");
  await prisma.review.delete({ where: { id: existing.id } });
  await refreshProductRating(existing.productId);
  await audit(req, "review.delete", "review", existing.id, {});
  res.status(204).end();
}));
