import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, "..");

// Minimal .env loader so the server has no dotenv dependency.
// Real environment variables always win over the file.
function loadEnvFile() {
  const file = path.join(rootDir, ".env");
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "";

if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 characters in production.");
}

export const env = {
  rootDir,
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: jwtSecret || "toolhub-development-secret-not-for-production-use",
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 12),
  cookieSecure: process.env.COOKIE_SECURE === "1" || isProduction,
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  publicSiteUrl: (process.env.PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, ""),
  adminPath: (process.env.ADMIN_PATH || "/admin").replace(/\/$/, "") || "/admin",
  // Set when the origin sits behind Cloudflare. Only then is CF-Connecting-IP
  // believed: at a directly reachable origin anyone could forge it.
  trustCloudflare: process.env.TRUST_CLOUDFLARE === "1",
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY || "",
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
    get enabled() {
      return Boolean(this.siteKey && this.secretKey);
    },
    // Which forms must carry a solved challenge.
    protectReviews: process.env.TURNSTILE_PROTECT_REVIEWS !== "0",
    protectLogin: process.env.TURNSTILE_PROTECT_LOGIN !== "0"
  },
  // Product installers are stored on disk and streamed by the download
  // endpoint. They are never exposed through a static route.
  products: {
    dir: process.env.PRODUCTS_DIR
      ? path.resolve(rootDir, process.env.PRODUCTS_DIR)
      : path.join(dirname, "products"),
    maxBytes: Number(process.env.PRODUCT_FILE_MAX_MB || 512) * 1024 * 1024
  },
  storage: {
    driver: process.env.STORAGE_DRIVER === "s3" ? "s3" : "local",
    endpoint: (process.env.S3_ENDPOINT || "").replace(/\/$/, ""),
    region: process.env.S3_REGION || "auto",
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    publicUrl: (process.env.S3_PUBLIC_URL || "").replace(/\/$/, ""),
    maxBytes: Number(process.env.UPLOAD_MAX_MB || 8) * 1024 * 1024,
    localDir: path.join(dirname, "uploads")
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@toolhub.local",
    adminPassword: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!"
  }
};
