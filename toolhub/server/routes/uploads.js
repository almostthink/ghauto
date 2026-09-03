import express from "express";
import { audit } from "../lib/audit.js";
import { badRequest, parseBody, route } from "../lib/http.js";
import { deleteObject, keyFromUrl, putObject } from "../lib/storage.js";
import { requirePermission } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/limits.js";
import { uploadSchema } from "../schemas/index.js";

// Images live in object storage, never in the database. The CMS posts a
// base64 payload; type and size are validated server-side before it is stored.
export const uploadsRouter = express.Router();

uploadsRouter.use(requirePermission("media.write"), uploadLimiter);

uploadsRouter.post("/", route(async (req, res) => {
  const input = parseBody(uploadSchema, req.body);
  const base64 = input.data.includes(",") ? input.data.slice(input.data.indexOf(",") + 1) : input.data;
  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    throw badRequest("Upload payload is not valid base64");
  }
  const stored = await putObject(buffer, input.contentType, input.prefix);
  await audit(req, "media.upload", "media", stored.key, { size: stored.size, type: stored.contentType });
  res.status(201).json(stored);
}));

uploadsRouter.delete("/", route(async (req, res) => {
  const url = String(req.query.url || "");
  const key = keyFromUrl(url);
  if (!key) throw badRequest("Only files stored by ToolHub can be deleted");
  await deleteObject(key);
  await audit(req, "media.delete", "media", key, {});
  res.status(204).end();
}));
