import { z } from "zod";

const trimmed = (max) => z.string().trim().max(max);
const url = z.string().trim().max(600).refine(
  (value) => value === "" || /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
  { message: "Must be an http(s) URL" }
);

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10).max(200)
});

const changelogEntry = z.object({
  version: trimmed(40),
  date: trimmed(40),
  notes: trimmed(2000)
});

const imageInput = z.object({
  url,
  alt: trimmed(200).default(""),
  kind: z.enum(["gallery", "screenshot"]).default("gallery")
});

export const productSchema = z.object({
  name: trimmed(160).min(2),
  slug: trimmed(120).optional(),
  shortDescription: trimmed(400).default(""),
  longDescription: trimmed(20000).default(""),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().nullable().optional(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  downloads: z.coerce.number().int().min(0).default(0),
  views: z.coerce.number().int().min(0).default(0),
  version: trimmed(40).default("1.0.0"),
  fileSize: trimmed(40).default(""),
  license: trimmed(60).default("Free"),
  price: trimmed(60).default("Free"),
  downloadUrl: url.default(""),
  officialUrl: url.default(""),
  thumbnail: url.default(""),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  verified: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  availabilityMode: z.enum(["all", "allow", "block"]).default("all"),
  countryAvailability: z.array(z.string().trim().length(2).toUpperCase()).max(250).default([]),
  features: z.array(trimmed(200)).max(60).default([]),
  requirements: z.array(trimmed(200)).max(60).default([]),
  changelog: z.array(changelogEntry).max(80).default([]),
  seoTitle: trimmed(200).default(""),
  seoDescription: trimmed(400).default(""),
  seoKeywords: z.array(trimmed(60)).max(30).default([]),
  tags: z.array(trimmed(60)).max(30).default([]),
  gallery: z.array(imageInput).max(30).default([]),
  screenshots: z.array(imageInput).max(30).default([])
});

export const productPatchSchema = productSchema.partial();

export const bulkProductSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["publish", "unpublish", "archive", "delete", "feature", "unfeature"])
});

export const categorySchema = z.object({
  name: trimmed(80).min(2),
  slug: trimmed(80).optional(),
  description: trimmed(400).default(""),
  icon: trimmed(40).default("package"),
  accent: trimmed(20).default("#8b5cf6"),
  position: z.coerce.number().int().min(0).default(0),
  visible: z.boolean().default(true),
  parentId: z.string().uuid().nullable().optional(),
  seoTitle: trimmed(200).default(""),
  seoDescription: trimmed(400).default("")
});

export const categoryPatchSchema = categorySchema.partial();

export const BLOCK_TYPES = [
  "hero",
  "text",
  "stats",
  "categories",
  "featuredProducts",
  "productGrid",
  "faq",
  "cta",
  "newsletter",
  "customHtml"
];

const blockSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(BLOCK_TYPES),
  visible: z.boolean().default(true),
  data: z.record(z.string(), z.unknown()).default({})
});

export const pageSchema = z.object({
  title: trimmed(160).min(1),
  status: z.enum(["draft", "published"]).default("published"),
  seoTitle: trimmed(200).default(""),
  seoDescription: trimmed(400).default(""),
  seoKeywords: z.array(trimmed(60)).max(30).default([]),
  blocks: z.array(blockSchema).max(60).default([])
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: trimmed(60).min(2),
  rating: z.coerce.number().int().min(1).max(5),
  title: trimmed(120).default(""),
  body: trimmed(2000).min(10)
});

export const reviewPatchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  title: trimmed(120).optional(),
  body: trimmed(2000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional()
});

export const userSchema = z.object({
  email: z.string().trim().email().max(200),
  name: trimmed(120).min(2),
  password: z.string().min(10).max(200),
  role: z.enum(["super_admin", "editor", "moderator", "analyst"]).default("editor"),
  active: z.boolean().default(true)
});

export const userPatchSchema = z.object({
  email: z.string().trim().email().max(200).optional(),
  name: trimmed(120).min(2).optional(),
  password: z.string().min(10).max(200).optional(),
  role: z.enum(["super_admin", "editor", "moderator", "analyst"]).optional(),
  active: z.boolean().optional()
});

export const productQuerySchema = z.object({
  q: trimmed(120).optional(),
  category: trimmed(80).optional(),
  tag: trimmed(80).optional(),
  status: z.enum(["draft", "published", "archived", "any"]).optional(),
  price: z.enum(["free", "premium", "any"]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["popular", "rating", "latest", "alphabetical", "downloads"]).default("popular"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24)
});

export const analyticsQuerySchema = z.object({
  range: z.enum(["today", "7d", "30d", "90d", "12m", "custom"]).default("30d"),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const viewEventSchema = z.object({
  path: trimmed(300).default(""),
  productId: z.string().uuid().nullable().optional()
});

export const settingsSchema = z.object({
  value: z.record(z.string(), z.unknown())
});

export const uploadSchema = z.object({
  filename: trimmed(200).default("upload"),
  contentType: trimmed(100),
  // base64 payload, size is enforced against the decoded buffer
  data: z.string().min(4).max(20_000_000),
  prefix: z.enum(["products", "pages", "branding"]).default("products")
});
