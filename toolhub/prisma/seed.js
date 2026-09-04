import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../server/env.js";
import { COUNTRIES } from "../server/lib/countries.js";
import { CATALOG, attachLogos } from "./catalog.js";

// Entries from the first placeholder catalog. They were never real products,
// so a seed run clears them out rather than leaving them beside the real ones.
const PLACEHOLDER_SLUGS = [
  "winoptimizer-26", "malwarebytes", "driver-booster-pro", "fps-overlay-studio",
  "clipforge-recorder", "roblox-studio-companion", "asset-pack-manager",
  "exodus-wallet", "chainwatch-analytics", "ledger-live"
];

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: "windows",
    name: "Windows Tools",
    icon: "windows",
    accent: "#4da3ff",
    position: 0,
    description: "System utilities, optimization and productivity software for Windows.",
    children: ["Optimization", "Security", "Drivers", "Utilities"]
  },

  {
    slug: "game",
    name: "Game Tools",
    icon: "gamepad",
    accent: "#b98cff",
    position: 1,
    description: "Utilities that improve how you play, record and tune your games.",
    children: ["Trainers", "Overlays", "Recording", "Mods", "Utilities"]
  },

  {
    slug: "roblox",
    name: "Roblox Tools",
    icon: "roblox",
    accent: "#e6ecff",
    position: 2,
    description: "Studio helpers, asset utilities and quality-of-life tools for Roblox creators.",
    children: ["Studio", "Assets", "Utilities"]
  },

  {
    slug: "roblox-executors",
    name: "Roblox Executors",
    icon: "roblox",
    accent: "#ff6b8a",
    position: 3,
    description: "Third-party Roblox executor listings with version and compatibility metadata.",
    children: ["Executors"]
  },

  {
    slug: "gamecheats",
    name: "GameCheats",
    icon: "gamepad",
    accent: "#ff5f7a",
    position: 4,
    description: "Third-party game modification and cheat software listings.",
    children: ["Cheats"]
  },

  {
    slug: "crypto",
    name: "Crypto Tools",
    icon: "ethereum",
    accent: "#9d7bff",
    position: 5,
    description: "Wallets, portfolio trackers and on-chain analytics.",
    children: ["Wallets", "Analytics", "Trading", "Security"]
  }
];

const FAQ_ITEMS = [
  { question: "Are all tools free to download?",
    answer: "Every entry shows its license on the product page. Free tools link straight to the vendor download, premium tools link to the official purchase page." },
  { question: "How do I find a specific tool?",
    answer: "Use the search box in the header, or open a category and filter by tag, rating or license. Search matches names, descriptions and tags." },
  { question: "How are ratings calculated?",
    answer: "A rating is the average of approved visitor reviews for that product. Reviews are moderated before they appear." },
  { question: "Can I request a tool?",
    answer: "Yes. Send the name and the official website through the contact address in the footer and it will be reviewed for the catalog." },
  { question: "How often is the catalog updated?",
    answer: "Version numbers, file sizes and changelogs are refreshed whenever a vendor ships a release." },
  { question: "Where do downloads come from?",
    answer: "Downloads redirect to the official source for each tool. ToolHub does not re-host installers." }
];

function homeBlocks() {
  return [
    { type: "hero", data: {
      eyebrow: "THE LARGEST COLLECTION",
      title: "Ultimate Tools",
      titleAccent: "Collection",
      subtitle: "The biggest collection of tools for Windows, Games, Roblox and Crypto. Verified details, real versions and links to the official source.",
      primaryLabel: "Browse Tools", primaryHref: "/windows",
      secondaryLabel: "Explore Categories", secondaryHref: "/about",
      // Replace the cube with your own artwork by setting `image` in the CMS.
      image: "",
      trust: [
        { label: "100% Safe", icon: "shield" },
        { label: "Regular Updates", icon: "refresh" },
        { label: "Verified Tools", icon: "verified" }
      ]
    } },
    { type: "categories", data: { title: "Browse by Categories", text: "Explore our range of tools across different categories" } },
    { type: "featuredProducts", data: { title: "Featured Tools", text: "Handpicked tools you might need", limit: 6, actionLabel: "View All", actionHref: "/windows" } },
    { type: "productGrid", data: { title: "Most Downloaded", text: "What the catalog is downloading this month", sort: "downloads", limit: 8 } },
    { type: "stats", data: { items: [
      { label: "Total Tools", source: "products", icon: "products" },
      { label: "Categories", source: "categories", icon: "categories" },
      { label: "Total Downloads", source: "downloads", icon: "downloads" },
      { label: "Average Rating", source: "rating", icon: "rating" },
      { label: "Safe & Verified", source: "custom", value: "100%", icon: "safe" }
    ] } },
    { type: "newsletter", data: {
      title: "Stay Updated",
      text: "Get the latest tools and updates delivered to your inbox",
      placeholder: "Enter your email address"
    } }
  ];
}

async function main() {
  console.log("Seeding ToolHub…");

  await prisma.country.createMany({
    data: COUNTRIES.map(([code, name, region]) => ({ code, name, region })),
    skipDuplicates: true
  });

  // A single administrator account; the panel has no staff management.
  const adminLogin = env.seed.adminLogin.toLowerCase();
  // Refuse a value the sign-in form would reject, rather than writing an
  // account nobody can use.
  if (!/^[a-z0-9._-]{3,60}$/.test(adminLogin)) {
    throw new Error(
      `SEED_ADMIN_LOGIN is not a valid login: "${env.seed.adminLogin}". ` +
      "Use latin letters, digits, dot, underscore or dash, at least 3 characters."
    );
  }
  await prisma.user.upsert({
    where: { username: adminLogin },
    update: {},
    create: {
      username: adminLogin,
      name: "Administrator",
      passwordHash: await bcrypt.hash(env.seed.adminPassword, 12)
    }
  });
  console.log(`  admin login: ${adminLogin}`);

  const categoryIds = new Map();
  for (const category of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { icon: category.icon, accent: category.accent },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        accent: category.accent,
        position: category.position,
        seoTitle: `${category.name} — ToolHub`,
        seoDescription: category.description
      }
    });
    categoryIds.set(category.slug, parent.id);
    for (const [index, childName] of category.children.entries()) {
      const slug = `${category.slug}-${childName.toLowerCase()}`;
      const child = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { slug, name: childName, parentId: parent.id, position: index, icon: "package" }
      });
      categoryIds.set(slug, child.id);
    }
  }

  // The placeholder catalog is removed by slug, but only when the entry still
  // looks untouched, so an edited product is never deleted from under you.
  const placeholders = await prisma.product.findMany({
    where: { slug: { in: PLACEHOLDER_SLUGS }, downloadUrl: { startsWith: "https://example.com/" } },
    select: { id: true, name: true }
  });
  if (placeholders.length) {
    await prisma.product.deleteMany({ where: { id: { in: placeholders.map((p) => p.id) } } });
    console.log(`  removed ${placeholders.length} placeholder products`);
  }

  for (const item of attachLogos(CATALOG)) {
    const slug = item.name
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const categoryId = categoryIds.get(item.category);
    const subcategoryId = item.sub ? categoryIds.get(`${item.category}-${item.sub.toLowerCase()}`) : null;
    if (!categoryId) throw new Error(`Unknown category "${item.category}" for ${item.name}`);
    if (item.sub && !subcategoryId) throw new Error(`Unknown subcategory "${item.sub}" for ${item.name}`);

    const data = {
      name: item.name,
      shortDescription: item.short,
      longDescription: item.long,
      categoryId,
      subcategoryId,
      // A catalog figure to start from. Real downloads are counted on top of it
      // by the download endpoint; nothing here fabricates analytics events.
      rating: item.rating,
      downloads: item.downloads,
      version: item.version,
      fileSize: item.size,
      license: item.price,
      price: item.price,
      officialUrl: `https://${item.site}`,
      thumbnail: item.logo,
      verified: true,
      status: "published",
      publishedAt: new Date(),
      features: item.features,
      requirements: item.requirements,
      seoTitle: `${item.name} — download, version and details`,
      seoDescription: item.short,
      seoKeywords: item.tags
    };

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        ...data,
        slug,
        // Left empty on purpose: point it at your own file or mirror from the
        // admin panel, or upload an installer on the product's Links tab.
        downloadUrl: "",
        images: { create: [{ url: item.logo, alt: `${item.name} logo`, kind: "gallery", position: 0 }] }
      }
    });

    for (const tagName of item.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { slug: tagSlug, name: tagName }
      });
      await prisma.productTag.upsert({
        where: { productId_tagId: { productId: product.id, tagId: tag.id } },
        update: {},
        create: { productId: product.id, tagId: tag.id }
      });
    }
  }
  console.log(`  catalog: ${CATALOG.length} products`);

  const products = await prisma.product.findMany({ select: { id: true } });

  // Demo reviews and a fabricated event history are useful for a screenshot and
  // misleading everywhere else, so they are off unless explicitly requested.
  const withDemoActivity = process.env.SEED_DEMO_ACTIVITY === "1";

  if (withDemoActivity && (await prisma.review.count()) === 0) {
    const reviewSeeds = [
      ["Mila K.", 5, "Exactly what I needed", "Clean interface and it did the job on the first run."],
      ["Alex L.", 5, "Solid", "Detailed changelog made it easy to see what changed before updating."],
      ["Sam K.", 4, "Good, with one gripe", "Works well, though the first scan took a while on an old laptop."],
      ["Jamie M.", 5, "Recommended", "Downloaded straight from the official source, no surprises."],
      ["David L.", 4, "Does what it says", "Simple, fast and the file size is honest."]
    ];
    for (const [index, product] of products.entries()) {
      const [authorName, rating, title, body] = reviewSeeds[index % reviewSeeds.length];
      await prisma.review.create({
        data: { productId: product.id, authorName, rating, title, body, status: "approved", country: "United States" }
      });
    }
  }

  // Ratings follow approved reviews. A product with none keeps the catalog
  // figure it was seeded with instead of being reset to zero.
  for (const product of products) {
    const stats = await prisma.review.aggregate({
      where: { productId: product.id, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true }
    });
    if (stats._count._all === 0) continue;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number((stats._avg.rating ?? 0).toFixed(2)),
        reviewCount: stats._count._all
      }
    });
  }

  if (withDemoActivity && (await prisma.downloadEvent.count()) === 0) {
    await seedDemoEvents(products);
  }

  const pages = [
    { slug: "home", title: "Home", seoTitle: "ToolHub — Ultimate Tools Collection",
      seoDescription: "A curated catalog of Windows, game, Roblox and crypto tools with verified details and official download links.",
      blocks: homeBlocks() },
    { slug: "windows", title: "Windows Tools", seoTitle: "Windows Tools — ToolHub", seoDescription: "System utilities and productivity tools for Windows.",
      blocks: [{ type: "hero", data: { eyebrow: "TOOL COLLECTION", title: "Windows", titleAccent: "Tools", subtitle: "Essential utilities and productivity tools for Windows.", variant: "compact" } },
               { type: "productGrid", data: { category: "windows", layout: "list", showFilters: true } }] },
    { slug: "game", title: "Game Tools", seoTitle: "Game Tools — ToolHub", seoDescription: "Utilities and tools for your favourite games.",
      blocks: [{ type: "hero", data: { eyebrow: "TOOL COLLECTION", title: "Game", titleAccent: "Tools", subtitle: "Discover utilities and tools for your favourite games.", variant: "compact" } },
               { type: "productGrid", data: { category: "game", layout: "list", showFilters: true } }] },
    { slug: "roblox", title: "Roblox Tools", seoTitle: "Roblox Tools — ToolHub", seoDescription: "Studio helpers and utilities for Roblox creators.",
      blocks: [{ type: "hero", data: { eyebrow: "TOOL COLLECTION", title: "Roblox", titleAccent: "Tools", subtitle: "Studio helpers and quality-of-life tools for Roblox creators.", variant: "compact" } },
               { type: "productGrid", data: { category: "roblox", layout: "list", showFilters: true } }] },
    { slug: "crypto", title: "Crypto Tools", seoTitle: "Crypto Tools — ToolHub", seoDescription: "Wallets, analytics and trading utilities.",
      blocks: [{ type: "hero", data: { eyebrow: "TOOL COLLECTION", title: "Crypto", titleAccent: "Tools", subtitle: "Wallets, portfolio trackers and on-chain analytics.", variant: "compact" } },
               { type: "productGrid", data: { category: "crypto", layout: "list", showFilters: true } }] },
    { slug: "faq", title: "Frequently Asked Questions", seoTitle: "FAQ — ToolHub", seoDescription: "Answers to common questions about the ToolHub catalog.",
      blocks: [{ type: "hero", data: { eyebrow: "HELP CENTER", title: "Frequently Asked", titleAccent: "Questions", subtitle: "Answers to the questions that come up most often.", variant: "narrow" } },
               { type: "faq", data: { items: FAQ_ITEMS } }] },
    { slug: "about", title: "About ToolHub", seoTitle: "About ToolHub", seoDescription: "Why ToolHub exists and how the catalog is maintained.",
      blocks: [
        { type: "hero", data: { eyebrow: "ABOUT TOOLHUB", title: "A better way to discover", titleAccent: "useful tools.", subtitle: "ToolHub is a directory built around clear product information, fast discovery and a calm dark interface.", variant: "compact" } },
        { type: "text", data: { title: "Our mission", body: "Make software discovery feel organized instead of overwhelming. Every product gets the same consistent card, a detailed page and metadata worth reading: real version numbers, file sizes, requirements and a changelog." } },
        { type: "text", data: { title: "How the catalog is maintained", body: "Entries are reviewed before publication and refreshed whenever a vendor ships a release. Downloads always redirect to the official source, so you are never installing something re-hosted here.", columns: 2,
          bullets: ["Curated, reviewed entries", "Version and changelog tracking", "Official download links only", "Moderated visitor reviews", "No visitor accounts, no tracking cookies"] } },
        { type: "stats", data: { items: [
          { label: "Tools listed", source: "products" },
          { label: "Categories", source: "categories" },
          { label: "Downloads served", source: "downloads" },
          { label: "Average rating", source: "rating" }
        ] } },
        { type: "cta", data: { title: "Have a suggestion?", text: "Tell us which tool deserves a place in the catalog.", buttonLabel: "Read the FAQ", buttonHref: "/faq" } }
      ] }
  ];

  // Pages are content, so an existing one is never overwritten by accident.
  // SEED_FORCE_PAGES=1 rebuilds them from these defaults, discarding CMS edits.
  const forcePages = process.env.SEED_FORCE_PAGES === "1";
  for (const page of pages) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } });
    if (existing && !forcePages) continue;
    if (existing) await prisma.page.delete({ where: { id: existing.id } });
    await prisma.page.create({
      data: {
        slug: page.slug,
        title: page.title,
        status: "published",
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
        blocks: {
          create: page.blocks.map((block, index) => ({
            type: block.type,
            position: index,
            data: block.data
          }))
        }
      }
    });
  }

  console.log("Seed complete.");
}

// Only used by SEED_DEMO_ACTIVITY=1: 90 days of invented downloads and views,
// for demonstrating the analytics screens on a machine with no real traffic.
async function seedDemoEvents(products) {
  const weights = [["US", 26], ["IN", 14], ["BR", 9], ["DE", 7], ["GB", 6], ["FR", 5], ["CA", 4],
    ["ID", 4], ["PL", 3], ["ES", 3], ["JP", 3], ["AU", 2], ["NG", 2], ["MX", 2], ["TR", 2]];
  const pool = weights.flatMap(([code, weight]) => Array(weight).fill(code));
  const countryNames = Object.fromEntries(COUNTRIES.map(([code, name]) => [code, name]));
  const referrers = ["", "https://www.google.com/", "https://duckduckgo.com/", "https://news.ycombinator.com/", "https://x.com/"];
  const devices = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];

  const downloads = [];
  const views = [];
  for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - dayOffset);
    const base = 18 + Math.round((90 - dayOffset) / 4);
    const weekend = [0, 6].includes(day.getDay()) ? 0.7 : 1;
    const count = Math.max(4, Math.round(base * weekend * (0.75 + Math.random() * 0.5)));
    for (let i = 0; i < count; i += 1) {
      const at = new Date(day);
      at.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const code = pool[Math.floor(Math.random() * pool.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const shared = {
        productId: product.id,
        countryCode: code,
        country: countryNames[code],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        ipHash: `seed-${Math.floor(Math.random() * 4000)}`,
        createdAt: at
      };
      downloads.push(shared);
      views.push({ ...shared, path: "/product" });
      if (Math.random() > 0.55) views.push({ ...shared, path: "/", productId: null });
    }
  }
  await prisma.downloadEvent.createMany({ data: downloads });
  await prisma.viewEvent.createMany({ data: views });
  console.log(`  demo activity: ${downloads.length} downloads, ${views.length} views`);

  for (const [code] of weights) {
    await prisma.country.update({
      where: { code },
      data: {
        downloads: downloads.filter((row) => row.countryCode === code).length,
        views: views.filter((row) => row.countryCode === code).length
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
