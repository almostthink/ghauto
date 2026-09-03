import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";
import { HttpError } from "./http.js";

const ALLOWED = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"]
]);

// Magic-number check: the declared content type alone is attacker controlled.
function sniff(buffer) {
  const head = buffer.subarray(0, 16);
  const hex = head.toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  if (head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (head.subarray(4, 12).toString("ascii") === "ftypavif") return "image/avif";
  const text = buffer.subarray(0, 200).toString("utf8").trimStart().toLowerCase();
  if (text.startsWith("<?xml") || text.startsWith("<svg")) return "image/svg+xml";
  return "";
}

function assertValid(buffer, declaredType) {
  if (buffer.length === 0) throw new HttpError(400, "Empty upload");
  if (buffer.length > env.storage.maxBytes) {
    throw new HttpError(413, `File exceeds the ${Math.round(env.storage.maxBytes / 1048576)}MB limit`);
  }
  const sniffed = sniff(buffer);
  if (!sniffed || !ALLOWED.has(sniffed)) {
    throw new HttpError(400, "Unsupported file type. Allowed: png, jpg, webp, gif, avif, svg");
  }
  // SVG can carry script; it is only accepted when explicitly declared as such.
  if (sniffed === "image/svg+xml" && declaredType !== "image/svg+xml") {
    throw new HttpError(400, "SVG uploads must declare the image/svg+xml content type");
  }
  return sniffed;
}

function objectKey(mime, prefix) {
  const ext = ALLOWED.get(mime);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}/${stamp}/${crypto.randomUUID()}.${ext}`;
}

// --- S3-compatible driver (Cloudflare R2, Supabase Storage, MinIO) ---------
// SigV4 is implemented directly to avoid pulling in the full AWS SDK.
function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function s3Request(method, key, body, contentType) {
  const { endpoint, bucket, region, accessKeyId, secretAccessKey } = env.storage;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new HttpError(500, "S3 storage is selected but not fully configured");
  }
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");

  const headers = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  headers.authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, { method, headers, body });
  if (!response.ok) {
    throw new HttpError(502, `Storage request failed (${response.status})`);
  }
}

// --- Public API -----------------------------------------------------------

export async function putObject(buffer, declaredType, prefix = "products") {
  const mime = assertValid(buffer, declaredType);
  const key = objectKey(mime, prefix);

  if (env.storage.driver === "s3") {
    await s3Request("PUT", key, buffer, mime);
    const base = env.storage.publicUrl || `${env.storage.endpoint}/${env.storage.bucket}`;
    return { url: `${base}/${key}`, key, size: buffer.length, contentType: mime };
  }

  const target = path.join(env.storage.localDir, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return { url: `/uploads/${key}`, key, size: buffer.length, contentType: mime };
}

export async function deleteObject(key) {
  if (!key || key.includes("..")) throw new HttpError(400, "Invalid storage key");
  if (env.storage.driver === "s3") {
    await s3Request("DELETE", key, "", "");
    return;
  }
  const target = path.join(env.storage.localDir, key);
  if (!target.startsWith(env.storage.localDir)) throw new HttpError(400, "Invalid storage key");
  await fs.rm(target, { force: true });
}

// Turns a stored public URL back into the key used by `deleteObject`.
export function keyFromUrl(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url.slice("/uploads/".length);
  const base = env.storage.publicUrl || `${env.storage.endpoint}/${env.storage.bucket}`;
  if (base && url.startsWith(`${base}/`)) return url.slice(base.length + 1);
  return "";
}
