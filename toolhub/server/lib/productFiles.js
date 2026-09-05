import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { env } from "../env.js";
import { HttpError } from "./http.js";

// Installers the panel accepts. Anything not listed is refused: the folder is
// streamed back to visitors, so it must never hold arbitrary content.
const ALLOWED_EXTENSIONS = new Set([
  "exe", "msi", "msix", "appx", "zip", "rar", "7z", "tar", "gz", "tgz",
  "dmg", "pkg", "apk", "deb", "rpm", "appimage", "jar", "iso", "bin", "run"
]);

export function extensionOf(filename) {
  const match = /\.([a-z0-9]{1,10})$/i.exec(String(filename || "").trim());
  return match ? match[1].toLowerCase() : "";
}

// The stored name is generated here, so a client-supplied filename can never
// influence the path on disk.
export function assertAllowed(filename) {
  const extension = extensionOf(filename);
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new HttpError(400, `Unsupported file type. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`);
  }
  return extension;
}

// Keeps a name usable in a Content-Disposition header without letting it carry
// quotes, newlines or path separators.
export function safeDownloadName(filename, fallback = "download") {
  // Separators are folded first: basename() would otherwise treat a product
  // named "Blender / LTS" as a path and keep only the last segment.
  const flattened = String(filename || "").replace(/[\\/]+/g, "-");
  // Unicode aware: \w alone turned a Cyrillic product name into underscores.
  // Express encodes the header per RFC 5987, so non-ASCII names arrive intact.
  const base = path.basename(flattened).replace(/[^\p{L}\p{N}._+\- ]+/gu, "_").trim();
  return base && base !== "." ? base.slice(0, 120) : fallback;
}

// The visitor should receive the file named after the product they clicked,
// not after whatever the file was called when it was uploaded. One archive can
// therefore back several products and still arrive with the right name.
export function downloadNameFor(product) {
  const extension = extensionOf(product.fileName) || extensionOf(product.fileKey) || "zip";
  return safeDownloadName(`${product.name}.${extension}`, `${product.slug}.${extension}`);
}

export function resolveStoredPath(key) {
  if (!key || key.includes("/") || key.includes("\\") || key.includes("..")) {
    throw new HttpError(400, "Invalid file key");
  }
  const target = path.join(env.products.dir, key);
  if (path.dirname(target) !== path.resolve(env.products.dir)) {
    throw new HttpError(400, "Invalid file key");
  }
  return target;
}

// Streams the request body straight to disk so a large installer never has to
// fit in memory. The size cap is enforced while the bytes arrive.
export async function saveUploadStream(req, filename) {
  const extension = assertAllowed(filename);
  await fsp.mkdir(env.products.dir, { recursive: true });

  const declared = Number(req.headers["content-length"] || 0);
  if (declared && declared > env.products.maxBytes) {
    throw new HttpError(413, `File exceeds the ${Math.round(env.products.maxBytes / 1048576)}MB limit`);
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const target = path.join(env.products.dir, key);
  const sink = fs.createWriteStream(target);

  let bytes = 0;
  let aborted = null;
  req.on("data", (chunk) => {
    bytes += chunk.length;
    if (bytes > env.products.maxBytes && !aborted) {
      aborted = new HttpError(413, `File exceeds the ${Math.round(env.products.maxBytes / 1048576)}MB limit`);
      req.destroy(aborted);
    }
  });

  try {
    await pipeline(req, sink);
  } catch (error) {
    await fsp.rm(target, { force: true });
    throw aborted ?? error;
  }

  if (bytes === 0) {
    await fsp.rm(target, { force: true });
    throw new HttpError(400, "Empty upload");
  }
  return { key, bytes };
}

// Everything sitting in PRODUCTS_DIR, so a file copied there by hand can be
// picked in the panel instead of being uploaded a second time.
export async function listStoredFiles() {
  let names;
  try {
    names = await fsp.readdir(env.products.dir);
  } catch {
    return [];
  }
  const files = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (!ALLOWED_EXTENSIONS.has(extensionOf(name))) continue;
    try {
      const stat = await fsp.stat(path.join(env.products.dir, name));
      if (!stat.isFile()) continue;
      files.push({ key: name, bytes: stat.size, modifiedAt: stat.mtime.toISOString() });
    } catch {
      /* vanished between readdir and stat */
    }
  }
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export async function deleteStoredFile(key) {
  if (!key) return;
  await fsp.rm(resolveStoredPath(key), { force: true });
}

export async function statStoredFile(key) {
  try {
    return await fsp.stat(resolveStoredPath(key));
  } catch {
    return null;
  }
}

export function humanSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
