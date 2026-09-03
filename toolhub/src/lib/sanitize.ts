// Admin-authored HTML is still sanitized before rendering: an editor account
// should not be able to plant script into the public site.
const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "div", "em", "h2", "h3", "h4", "hr", "i",
  "li", "ol", "p", "pre", "small", "span", "strong", "table", "tbody", "td",
  "th", "thead", "tr", "ul"
]);
const ALLOWED_ATTRS = new Set(["href", "title", "target", "rel", "class", "colspan", "rowspan"]);

export function sanitizeHtml(input: string) {
  if (!input) return "";
  const template = document.createElement("template");
  template.innerHTML = input;

  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        child.remove();
        continue;
      }
      for (const attribute of [...child.attributes]) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        const unsafeUrl = name === "href" && !/^(https?:|mailto:|\/|#)/.test(value);
        if (!ALLOWED_ATTRS.has(name) || name.startsWith("on") || unsafeUrl) {
          child.removeAttribute(attribute.name);
        }
      }
      if (tag === "a" && child.getAttribute("target") === "_blank") {
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    }
  };

  walk(template.content as unknown as Element);
  return template.innerHTML;
}
