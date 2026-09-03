import fs from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { prisma } from "./db.js";
import { escapeHtml } from "./lib/text.js";
import { attachUser, csrfGuard } from "./middleware/auth.js";
import { apiLimiter } from "./middleware/limits.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { eventsRouter } from "./routes/events.js";
import { pagesRouter } from "./routes/pages.js";
import { productsRouter } from "./routes/products.js";
import { reviewsRouter } from "./routes/reviews.js";
import { seoRouter } from "./routes/seo.js";
import { readSettings, settingsRouter } from "./routes/settings.js";
import { uploadsRouter } from "./routes/uploads.js";
import { usersRouter } from "./routes/users.js";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Inline styles are used for chart bars and accent colours.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

// The SPA is served from this same origin in production, so a request whose
// Origin matches the host it was sent to is always allowed. Everything else
// must be listed in CORS_ORIGINS. A disallowed origin simply gets no CORS
// headers, which the browser blocks, rather than a server error.
app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    const sameOrigin = `${req.protocol}://${req.headers.host}`;
    const allowed =
      !origin ||
      origin === sameOrigin ||
      origin === env.publicSiteUrl ||
      env.corsOrigins.includes(origin);
    callback(null, { origin: allowed, credentials: true });
  })
);

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use(attachUser);
app.use(csrfGuard);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up", time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/events", eventsRouter);

app.use("/", seoRouter);

if (env.storage.driver === "local") {
  app.use(
    "/uploads",
    express.static(env.storage.localDir, {
      maxAge: "7d",
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff")
    })
  );
}

app.use("/api", (_req, res) => res.status(404).json({ error: "Unknown API endpoint" }));

// --- SPA + server-rendered SEO tags ---------------------------------------

const clientDist = path.resolve(env.rootDir, "dist");
const indexFile = path.join(clientDist, "index.html");

function metaTags({ title, description, canonical, image, jsonLd }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  ];
  if (image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  }
  if (jsonLd) {
    // JSON is escaped so a product field can never break out of the script tag.
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
    );
  }
  return tags.join("\n    ");
}

// Crawlers get real metadata even though the catalog is a single-page app:
// the tags are injected into index.html before it is sent.
async function renderIndex(req, res) {
  if (!fs.existsSync(indexFile)) {
    return res.status(503).send("Client bundle missing. Run `npm run build` first.");
  }
  let html = fs.readFileSync(indexFile, "utf8");
  const canonical = `${env.publicSiteUrl}${req.path}`;

  try {
    const settings = await readSettings(["seo", "site"]);
    let meta = {
      title: settings.seo.defaultTitle,
      description: settings.seo.defaultDescription,
      canonical,
      image: settings.seo.ogImage
    };

    const productMatch = req.path.match(/^\/product\/([a-z0-9-]+)$/i);
    if (productMatch) {
      const product = await prisma.product.findFirst({
        where: { slug: productMatch[1], status: "published" },
        include: { category: { select: { name: true } } }
      });
      if (product) {
        meta = {
          title: product.seoTitle || settings.seo.titleTemplate.replace("%s", product.name),
          description: product.seoDescription || product.shortDescription,
          canonical,
          image: product.thumbnail,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: product.name,
            description: product.shortDescription,
            applicationCategory: product.category?.name,
            softwareVersion: product.version,
            fileSize: product.fileSize,
            operatingSystem: product.requirements[0] ?? "Windows",
            image: product.thumbnail || undefined,
            offers: {
              "@type": "Offer",
              price: /free/i.test(product.price) ? "0" : undefined,
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            aggregateRating: product.reviewCount
              ? {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount
                }
              : undefined
          }
        };
      }
    } else {
      const page = await prisma.page.findFirst({
        where: { slug: req.path === "/" ? "home" : req.path.slice(1), status: "published" }
      });
      if (page) {
        meta.title = page.seoTitle || settings.seo.titleTemplate.replace("%s", page.title);
        meta.description = page.seoDescription || meta.description;
      }
    }

    html = html.replace(/<title>.*?<\/title>/i, "").replace("</head>", `    ${metaTags(meta)}\n  </head>`);
  } catch (error) {
    console.error("SEO render failed:", error.message);
  }

  // The admin panel is unlinked and must never be indexed.
  if (req.path === env.adminPath || req.path.startsWith(`${env.adminPath}/`)) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  res.type("html").send(html);
}

app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
app.get("*splat", renderIndex);

// --- Errors ---------------------------------------------------------------

app.use((error, _req, res, _next) => {
  const status = error.status ?? 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : error.message,
    ...(error.details ? { details: error.details } : {})
  });
});

const server = app.listen(env.port, () => {
  console.log(`ToolHub API listening on http://localhost:${env.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
