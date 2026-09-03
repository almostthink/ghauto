// Text helpers: slugs and HTML escaping for server-rendered markup.

export function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Ensures a slug is unique inside a table by appending -2, -3, ... when taken.
export async function uniqueSlug(model, base, ignoreId) {
  let candidate = base;
  let counter = 2;
  for (;;) {
    const existing = await model.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${counter++}`;
  }
}
