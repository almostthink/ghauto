import express from "express";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { escapeHtml } from "../lib/text.js";
import { route } from "../lib/http.js";

export const seoRouter = express.Router();

// The admin panel is deliberately absent here: naming its address in
// robots.txt would publish the very thing that keeps it hidden. It is unlinked
// from the site and served with X-Robots-Tag: noindex instead.
seoRouter.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "",
      `Sitemap: ${env.publicSiteUrl}/sitemap.xml`,
      ""
    ].join("\n")
  );
});

seoRouter.get("/sitemap.xml", route(async (_req, res) => {
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000
    }),
    prisma.category.findMany({ where: { visible: true, parentId: null }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } })
  ]);

  const entries = [
    { loc: "/", priority: "1.0", lastmod: new Date() },
    ...pages
      .filter((page) => page.slug !== "home")
      .map((page) => ({ loc: `/${page.slug}`, priority: "0.6", lastmod: page.updatedAt })),
    ...categories.map((category) => ({ loc: `/${category.slug}`, priority: "0.8", lastmod: category.updatedAt })),
    ...products.map((product) => ({ loc: `/product/${product.slug}`, priority: "0.7", lastmod: product.updatedAt }))
  ];

  const body = entries
    .map(
      (entry) =>
        `  <url><loc>${escapeHtml(env.publicSiteUrl + entry.loc)}</loc>` +
        `<lastmod>${new Date(entry.lastmod).toISOString().slice(0, 10)}</lastmod>` +
        `<priority>${entry.priority}</priority></url>`
    )
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
}));
