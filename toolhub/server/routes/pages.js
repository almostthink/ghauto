import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { notFound, parseBody, route } from "../lib/http.js";
import { slugify } from "../lib/text.js";
import { requirePermission } from "../middleware/auth.js";
import { pageSchema } from "../schemas/index.js";

export const pagesRouter = express.Router();

const serialize = (page) => ({
  id: page.id,
  slug: page.slug,
  title: page.title,
  status: page.status,
  seoTitle: page.seoTitle,
  seoDescription: page.seoDescription,
  seoKeywords: page.seoKeywords,
  updatedAt: page.updatedAt,
  blocks: (page.blocks ?? []).map((block) => ({
    id: block.id,
    type: block.type,
    position: block.position,
    visible: block.visible,
    data: block.data
  }))
});

pagesRouter.get("/", requirePermission("content.read"), route(async (_req, res) => {
  const rows = await prisma.page.findMany({
    orderBy: { slug: "asc" },
    include: { blocks: { orderBy: { position: "asc" } } }
  });
  res.json({ items: rows.map(serialize) });
}));

pagesRouter.get("/:slug", route(async (req, res) => {
  const page = await prisma.page.findUnique({
    where: { slug: req.params.slug },
    include: { blocks: { orderBy: { position: "asc" } } }
  });
  if (!page) throw notFound("Page not found");
  if (page.status !== "published" && !req.user) throw notFound("Page not found");
  const payload = serialize(page);
  // Hidden blocks never reach anonymous visitors.
  if (!req.user) payload.blocks = payload.blocks.filter((block) => block.visible);
  res.json(payload);
}));

// Full replace: the page builder always sends the complete block list, which
// keeps reorder / duplicate / delete a single atomic write.
pagesRouter.put("/:slug", requirePermission("content.write"), route(async (req, res) => {
  const slug = slugify(req.params.slug, "page");
  const input = parseBody(pageSchema, req.body);
  const { blocks, ...fields } = input;

  const page = await prisma.$transaction(async (tx) => {
    const saved = await tx.page.upsert({
      where: { slug },
      create: { ...fields, slug },
      update: fields
    });
    await tx.pageBlock.deleteMany({ where: { pageId: saved.id } });
    if (blocks.length) {
      await tx.pageBlock.createMany({
        data: blocks.map((block, index) => ({
          pageId: saved.id,
          type: block.type,
          position: index,
          visible: block.visible,
          data: block.data
        }))
      });
    }
    return tx.page.findUnique({
      where: { id: saved.id },
      include: { blocks: { orderBy: { position: "asc" } } }
    });
  });

  await audit(req, "page.update", "page", page.id, { slug, blocks: blocks.length });
  res.json(serialize(page));
}));

pagesRouter.delete("/:slug", requirePermission("content.write"), route(async (req, res) => {
  const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
  if (!page) throw notFound("Page not found");
  await prisma.page.delete({ where: { id: page.id } });
  await audit(req, "page.delete", "page", page.id, { slug: page.slug });
  res.status(204).end();
}));
