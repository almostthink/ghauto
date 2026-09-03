import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { HttpError, notFound, parseBody, route } from "../lib/http.js";
import { slugify, uniqueSlug } from "../lib/text.js";
import { requireAuth } from "../middleware/auth.js";
import { categoryPatchSchema, categorySchema } from "../schemas/index.js";

export const categoriesRouter = express.Router();

const serialize = (category) => ({
  id: category.id,
  slug: category.slug,
  name: category.name,
  description: category.description,
  icon: category.icon,
  accent: category.accent,
  position: category.position,
  visible: category.visible,
  parentId: category.parentId,
  seoTitle: category.seoTitle,
  seoDescription: category.seoDescription,
  productCount: category._count?.products ?? 0,
  children: (category.children ?? []).map((child) => ({
    id: child.id,
    slug: child.slug,
    name: child.name,
    productCount: child._count?.products ?? 0
  }))
});

categoriesRouter.get("/", route(async (req, res) => {
  const includeHidden = Boolean(req.user);
  const rows = await prisma.category.findMany({
    where: { parentId: null, ...(includeHidden ? {} : { visible: true }) },
    include: {
      _count: { select: { products: true } },
      children: {
        where: includeHidden ? {} : { visible: true },
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } }
      }
    },
    orderBy: { position: "asc" }
  });
  res.json({ items: rows.map(serialize) });
}));

categoriesRouter.get("/:idOrSlug", route(async (req, res) => {
  const category = await prisma.category.findFirst({
    where: { OR: [{ slug: req.params.idOrSlug }, { id: req.params.idOrSlug }] },
    include: {
      _count: { select: { products: true } },
      children: { orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } }
    }
  });
  if (!category) throw notFound("Category not found");
  res.json(serialize(category));
}));

categoriesRouter.post("/", requireAuth, route(async (req, res) => {
  const input = parseBody(categorySchema, req.body);
  const slug = await uniqueSlug(prisma.category, slugify(input.slug || input.name, "category"));
  const category = await prisma.category.create({ data: { ...input, slug } });
  await audit(req, "category.create", "category", category.id, { name: category.name });
  res.status(201).json(serialize(category));
}));

categoriesRouter.put("/:id", requireAuth, route(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("Category not found");
  const input = parseBody(categoryPatchSchema, req.body);
  if (input.parentId === existing.id) throw new HttpError(400, "A category cannot be its own parent");

  const data = { ...input };
  if (input.slug !== undefined || input.name !== undefined) {
    data.slug = await uniqueSlug(
      prisma.category,
      slugify(input.slug || input.name || existing.name, "category"),
      existing.id
    );
  }
  const category = await prisma.category.update({ where: { id: existing.id }, data });
  await audit(req, "category.update", "category", category.id, { fields: Object.keys(data) });
  res.json(serialize(category));
}));

categoriesRouter.delete("/:id", requireAuth, route(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true, children: true } } }
  });
  if (!category) throw notFound("Category not found");
  if (category._count.products > 0) {
    throw new HttpError(409, "Move or delete the products in this category first");
  }
  await prisma.category.delete({ where: { id: category.id } });
  await audit(req, "category.delete", "category", category.id, { name: category.name });
  res.status(204).end();
}));

categoriesRouter.post("/reorder", requireAuth, route(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === "string") : [];
  if (!ids.length) throw new HttpError(400, "`ids` must be a non-empty array");
  await prisma.$transaction(
    ids.map((id, index) => prisma.category.update({ where: { id }, data: { position: index } }))
  );
  await audit(req, "category.reorder", "category", "", { count: ids.length });
  res.json({ affected: ids.length });
}));
