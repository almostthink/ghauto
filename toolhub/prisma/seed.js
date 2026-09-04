import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../server/env.js";
import { COUNTRIES } from "../server/lib/countries.js";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "windows", name: "Windows Tools", icon: "windows", accent: "#4da3ff", position: 0,
    description: "System utilities, optimization and productivity software for Windows.",
    children: ["Optimization", "Security", "Drivers"] },
  { slug: "game", name: "Game Tools", icon: "gamepad", accent: "#b98cff", position: 1,
    description: "Utilities that improve how you play, record and tune your games.",
    children: ["Trainers", "Overlays", "Recording"] },
  { slug: "roblox", name: "Roblox Tools", icon: "roblox", accent: "#e6ecff", position: 2,
    description: "Studio helpers, asset utilities and quality-of-life tools for Roblox creators.",
    children: ["Studio", "Assets"] },
  { slug: "crypto", name: "Crypto Tools", icon: "ethereum", accent: "#9d7bff", position: 3,
    description: "Wallets, portfolio trackers and on-chain analytics.",
    children: ["Wallets", "Analytics", "Trading"] }
];

const PRODUCTS = [
  { name: "WinOptimizer 26", category: "windows", sub: "Optimization", tags: ["optimization", "cleanup"],
    short: "All-in-one Windows optimization and cleanup utility.",
    long: "WinOptimizer bundles disk cleanup, startup management, registry maintenance and a live performance monitor into one interface. Scheduled maintenance runs in the background and every change can be rolled back from the built-in restore point manager.",
    rating: 4.8, downloads: 128540, views: 402100, version: "26.1.4", size: "38 MB", price: "Free",
    featured: true, popular: true, verified: true,
    thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=900&q=80",
    features: ["One-click system cleanup", "Startup manager", "Live performance monitor", "Scheduled maintenance", "Restore points before every change"],
    requirements: ["Windows 10 or 11 (64-bit)", "2 GB RAM", "250 MB free disk space"],
    changelog: [
      { version: "26.1.4", date: "2026-08-24", notes: "Faster disk scan and fixes for external drives." },
      { version: "26.1.0", date: "2026-07-02", notes: "New startup manager and dark theme refresh." }
    ] },
  { name: "Malwarebytes", category: "windows", sub: "Security", tags: ["security", "antivirus"],
    short: "Real-time protection against malware, ransomware and unwanted software.",
    long: "A lightweight security scanner that pairs signature detection with behaviour analysis. The catalog entry tracks release notes and system requirements so you always know what changed before updating.",
    rating: 4.6, downloads: 52110, views: 190400, version: "5.2", size: "86 MB", price: "Free",
    verified: true, popular: true,
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
    features: ["Real-time protection", "Ransomware shield", "Browser guard", "Scheduled scans"],
    requirements: ["Windows 10 or 11", "4 GB RAM"],
    changelog: [{ version: "5.2", date: "2026-08-20", notes: "Reduced memory use during full scans." }] },
  { name: "Driver Booster Pro", category: "windows", sub: "Drivers", tags: ["drivers", "utility"],
    short: "Keeps every device driver on your machine current.",
    long: "Scans installed hardware, matches it against a maintained driver database and installs updates with an automatic backup of the previous version.",
    rating: 4.4, downloads: 41200, views: 118300, version: "12.0", size: "24 MB", price: "Premium",
    thumbnail: "https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=900&q=80",
    features: ["Automatic driver backup", "Offline driver updater", "Game-ready driver profiles"],
    requirements: ["Windows 10 or 11", "1 GB RAM"],
    changelog: [{ version: "12.0", date: "2026-06-11", notes: "New offline update mode." }] },
  { name: "FPS Overlay Studio", category: "game", sub: "Overlays", tags: ["overlay", "benchmark"],
    short: "Frame-rate and hardware overlay for any game.",
    long: "Shows frame time, GPU load and temperatures over your game without measurable overhead, and exports a session report you can compare between driver versions.",
    rating: 4.7, downloads: 67320, views: 210800, version: "1.8.0", size: "12 MB", price: "Free",
    featured: true, verified: true,
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    features: ["Frame time graph", "Hardware sensors", "Session reports", "Per-game profiles"],
    requirements: ["Windows 10 or 11", "DirectX 11 or Vulkan"],
    changelog: [{ version: "1.8.0", date: "2026-08-15", notes: "Vulkan overlay support." }] },
  { name: "ClipForge Recorder", category: "game", sub: "Recording", tags: ["recording", "capture"],
    short: "Instant replay and clip capture for gameplay.",
    long: "Keeps a rolling buffer of the last minutes of play so you can save a clip after something happens, with hardware encoding on modern GPUs.",
    rating: 4.5, downloads: 38900, views: 96200, version: "3.2.1", size: "54 MB", price: "Free",
    popular: true,
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    features: ["Rolling replay buffer", "Hardware encoding", "Auto-trim silence"],
    requirements: ["Windows 10 or 11", "NVENC, AMF or QuickSync capable GPU"],
    changelog: [{ version: "3.2.1", date: "2026-07-28", notes: "Lower CPU use while idle." }] },
  { name: "Roblox Studio Companion", category: "roblox", sub: "Studio", tags: ["studio", "workflow"],
    short: "Workflow helpers for Roblox Studio creators.",
    long: "Adds asset organization, a script snippet library and a place-file backup schedule to Roblox Studio. Built for creators who ship regularly and need their projects versioned.",
    rating: 4.6, downloads: 88420, views: 265000, version: "3.4.2", size: "18 MB", price: "Free",
    featured: true, verified: true,
    thumbnail: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=80",
    features: ["Asset organizer", "Snippet library", "Automatic place backups", "Team-create helpers"],
    requirements: ["Roblox Studio", "Windows 10 or 11 / macOS 13+"],
    changelog: [{ version: "3.4.2", date: "2026-08-09", notes: "Backup scheduling and snippet search." }] },
  { name: "Asset Pack Manager", category: "roblox", sub: "Assets", tags: ["assets", "library"],
    short: "Organize and reuse your Roblox asset library.",
    long: "Indexes the models, meshes and audio you own, tags them and pushes them into a place with one click.",
    rating: 4.3, downloads: 21450, views: 62800, version: "2.1.0", size: "9 MB", price: "Free",
    thumbnail: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=900&q=80",
    features: ["Tagged asset index", "Bulk import", "Duplicate detection"],
    requirements: ["Roblox Studio"],
    changelog: [{ version: "2.1.0", date: "2026-05-30", notes: "Duplicate detection across places." }] },
  { name: "Exodus Wallet", category: "crypto", sub: "Wallets", tags: ["wallet", "multichain"],
    short: "Multi-chain crypto wallet with a built-in exchange.",
    long: "A desktop and mobile wallet supporting a wide set of chains, hardware wallet pairing and a portfolio view that tracks cost basis over time.",
    rating: 4.7, downloads: 73450, views: 231400, version: "25.6", size: "96 MB", price: "Free",
    featured: true, verified: true,
    thumbnail: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",
    features: ["Multi-chain support", "Hardware wallet pairing", "Portfolio tracking", "Built-in swaps"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "4 GB RAM"],
    changelog: [{ version: "25.6", date: "2026-08-27", notes: "New portfolio cost-basis view." }] },
  { name: "ChainWatch Analytics", category: "crypto", sub: "Analytics", tags: ["analytics", "onchain"],
    short: "On-chain analytics and wallet monitoring.",
    long: "Tracks wallets and contracts across chains, alerts on large movements and exports the underlying data as CSV for your own analysis.",
    rating: 4.5, downloads: 34700, views: 88900, version: "4.8", size: "112 MB", price: "Premium",
    popular: true,
    thumbnail: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=900&q=80",
    features: ["Wallet alerts", "Contract monitoring", "CSV export", "Multi-chain dashboards"],
    requirements: ["Any modern browser", "Desktop app: 8 GB RAM"],
    changelog: [{ version: "4.8", date: "2026-08-02", notes: "Alert rules per wallet group." }] },
  { name: "Ledger Live", category: "crypto", sub: "Wallets", tags: ["wallet", "hardware"],
    short: "Companion app for hardware wallets.",
    long: "Manages accounts on a hardware device, installs firmware updates and shows a consolidated portfolio without exposing private keys.",
    rating: 4.4, downloads: 29800, views: 74100, version: "2.94", size: "142 MB", price: "Free",
    verified: true,
    thumbnail: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=900&q=80",
    features: ["Firmware updates", "Portfolio overview", "Staking support"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "Compatible hardware wallet"],
    changelog: [{ version: "2.94", date: "2026-07-19", notes: "Faster account synchronisation." }] }
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

  for (const item of PRODUCTS) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const categoryId = categoryIds.get(item.category);
    const subcategoryId = item.sub ? categoryIds.get(`${item.category}-${item.sub.toLowerCase()}`) : null;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: item.name,
        shortDescription: item.short,
        longDescription: item.long,
        categoryId,
        subcategoryId,
        rating: item.rating,
        downloads: item.downloads,
        views: item.views,
        version: item.version,
        fileSize: item.size,
        license: item.price,
        price: item.price,
        downloadUrl: `https://example.com/download/${slug}`,
        officialUrl: `https://example.com/${slug}`,
        thumbnail: item.thumbnail,
        featured: Boolean(item.featured),
        popular: Boolean(item.popular),
        verified: Boolean(item.verified),
        status: "published",
        publishedAt: new Date(),
        features: item.features,
        requirements: item.requirements,
        changelog: item.changelog,
        seoTitle: `${item.name} — download, version and details`,
        seoDescription: item.short,
        seoKeywords: item.tags,
        images: {
          create: [
            { url: item.thumbnail, alt: `${item.name} cover`, kind: "gallery", position: 0 },
            { url: item.thumbnail, alt: `${item.name} interface`, kind: "screenshot", position: 0 }
          ]
        }
      }
    });

    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagName },
        update: {},
        create: { slug: tagName, name: tagName }
      });
      await prisma.productTag.upsert({
        where: { productId_tagId: { productId: product.id, tagId: tag.id } },
        update: {},
        create: { productId: product.id, tagId: tag.id }
      });
    }
  }

  const products = await prisma.product.findMany({ select: { id: true } });

  // Demo reviews so moderation and rating recalculation have something to work on.
  const reviewSeeds = [
    ["Mila K.", 5, "Exactly what I needed", "Clean interface and it did the job on the first run."],
    ["Alex L.", 5, "Solid", "Detailed changelog made it easy to see what changed before updating."],
    ["Sam K.", 4, "Good, with one gripe", "Works well, though the first scan took a while on an old laptop."],
    ["Jamie M.", 5, "Recommended", "Downloaded straight from the official source, no surprises."],
    ["David L.", 4, "Does what it says", "Simple, fast and the file size is honest."]
  ];
  if ((await prisma.review.count()) === 0) {
    for (const [index, product] of products.entries()) {
      const [authorName, rating, title, body] = reviewSeeds[index % reviewSeeds.length];
      await prisma.review.create({
        data: { productId: product.id, authorName, rating, title, body, status: "approved", country: "United States" }
      });
    }
    await prisma.review.create({
      data: {
        productId: products[0].id,
        authorName: "Pending Pat",
        rating: 3,
        title: "Waiting on moderation",
        body: "This one is left pending so the review queue in the admin panel is not empty.",
        status: "pending"
      }
    });
  }

  for (const product of products) {
    const stats = await prisma.review.aggregate({
      where: { productId: product.id, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true }
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number((stats._avg.rating ?? 0).toFixed(2)),
        reviewCount: stats._count._all
      }
    });
  }

  // 90 days of download/view events so every analytics chart has real shape.
  if ((await prisma.downloadEvent.count()) === 0) {
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
      // Gentle upward trend with a weekday rhythm.
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
    console.log(`  events: ${downloads.length} downloads, ${views.length} views`);

    for (const [code] of weights) {
      const dl = downloads.filter((row) => row.countryCode === code).length;
      const vw = views.filter((row) => row.countryCode === code).length;
      await prisma.country.update({ where: { code }, data: { downloads: dl, views: vw } });
    }
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
