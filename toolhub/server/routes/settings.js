import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { parseBody, route } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { settingsSchema } from "../schemas/index.js";

export const settingsRouter = express.Router();

// Settings the public site is allowed to read (branding, footer, toggles).
const PUBLIC_KEYS = new Set(["site", "footer", "seo", "features"]);

export const DEFAULT_SETTINGS = {
  site: {
    name: "ToolHub",
    tagline: "Ultimate Tools Collection",
    supportEmail: "hello@toolhub.local",
    searchPlaceholder: "Search tools..."
  },
  seo: {
    titleTemplate: "%s — ToolHub",
    defaultTitle: "ToolHub — Ultimate Tools Collection",
    defaultDescription:
      "A curated catalog of Windows, game, Roblox and crypto tools with verified details, versions and download links.",
    keywords: ["tools", "windows", "game", "roblox", "crypto"],
    ogImage: ""
  },
  footer: {
    about: "Your curated directory for useful software, utilities and tools.",
    copyright: "© 2026 ToolHub. All rights reserved.",
    columns: [
      { title: "Categories", links: [
        { label: "Windows Tools", href: "/windows" },
        { label: "Game Tools", href: "/game" },
        { label: "Roblox", href: "/roblox" },
        { label: "Crypto", href: "/crypto" }
      ] },
      { title: "Company", links: [
        { label: "About", href: "/about" },
        { label: "FAQ", href: "/faq" }
      ] }
    ],
    newsletter: { title: "Newsletter", text: "Get useful updates in your inbox.", placeholder: "Your email" }
  },
  features: { reviewsEnabled: true, newsletterEnabled: true, showDownloadCounts: true }
};

export async function readSettings(keys) {
  const rows = await prisma.setting.findMany({ where: keys ? { key: { in: keys } } : undefined });
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const result = {};
  for (const key of keys ?? Object.keys(DEFAULT_SETTINGS)) {
    result[key] = { ...(DEFAULT_SETTINGS[key] ?? {}), ...(stored[key] ?? {}) };
  }
  return result;
}

settingsRouter.get("/", route(async (req, res) => {
  const keys = req.user ? undefined : [...PUBLIC_KEYS];
  res.json(await readSettings(keys));
}));

settingsRouter.put("/:key", requireAuth, route(async (req, res) => {
  const { value } = parseBody(settingsSchema, req.body);
  const key = req.params.key.slice(0, 40);
  const saved = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
  await audit(req, "settings.update", "setting", key, { keys: Object.keys(value) });
  res.json({ key: saved.key, value: saved.value });
}));
