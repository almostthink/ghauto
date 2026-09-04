export type ProductStatus = "draft" | "published" | "archived";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type AvailabilityMode = "all" | "allow" | "block";

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  accent?: string;
}

export interface Category extends CategoryRef {
  description: string;
  accent: string;
  icon: string;
  position: number;
  visible: boolean;
  parentId: string | null;
  seoTitle: string;
  seoDescription: string;
  productCount: number;
  children: { id: string; slug: string; name: string; productCount: number }[];
}

export interface ProductImage {
  id?: string;
  url: string;
  alt: string;
  kind: "gallery" | "screenshot";
}

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string;
  category: CategoryRef | null;
  subcategoryId: string | null;
  subcategory: CategoryRef | null;
  rating: number;
  reviewCount: number;
  downloads: number;
  views: number;
  version: string;
  fileSize: string;
  license: string;
  price: string;
  hasFile: boolean;
  fileName: string;
  fileBytes: number;
  downloadUrl: string;
  officialUrl: string;
  thumbnail: string;
  featured: boolean;
  popular: boolean;
  verified: boolean;
  status: ProductStatus;
  availabilityMode: AvailabilityMode;
  countryAvailability: string[];
  features: string[];
  requirements: string[];
  changelog: ChangelogEntry[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  tags: string[];
  gallery: ProductImage[];
  screenshots: ProductImage[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export type BlockType =
  | "hero"
  | "text"
  | "stats"
  | "categories"
  | "featuredProducts"
  | "productGrid"
  | "faq"
  | "cta"
  | "newsletter"
  | "customHtml";

export interface PageBlock {
  id?: string;
  type: BlockType;
  position?: number;
  visible: boolean;
  data: Record<string, unknown>;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  updatedAt: string;
  blocks: PageBlock[];
}

export interface Review {
  id: string;
  productId: string;
  product: { id: string; name: string; slug: string } | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  country: string;
  createdAt: string;
}

// The single administrator of the hidden panel. Visitors have no accounts.
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalProducts: number;
  publishedProducts: number;
  totalCategories: number;
  totalDownloads: number;
  totalViews: number;
  totalVisitors: number;
  averageRating: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  downloadsThisMonth: number;
  downloadsInRange: number;
  viewsInRange: number;
  conversionRate: number;
  pendingReviews: number;
  totalReviews: number;
  range: { from: string; to: string };
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface CountryRow {
  countryCode: string;
  country: string;
  region: string;
  downloads: number;
  views: number;
  percentage: number;
  trend: number;
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  downloads: number;
  rating: number;
  category: { name: string; slug: string } | null;
  periodDownloads: number;
}

export interface Settings {
  site: {
    name: string;
    tagline: string;
    supportEmail: string;
    searchPlaceholder: string;
    headerCtaLabel: string;
    headerCtaHref: string;
  };
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string[];
    ogImage: string;
  };
  footer: {
    about: string;
    copyright: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
    newsletter: { title: string; text: string; placeholder: string };
  };
  features: { reviewsEnabled: boolean; newsletterEnabled: boolean; showDownloadCounts: boolean };
}

export type DateRange = "today" | "7d" | "30d" | "90d" | "12m" | "custom";
