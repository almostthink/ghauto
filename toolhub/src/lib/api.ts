export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];

  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function csrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)th_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  // Echoes the readable CSRF cookie back as a header; a cross-site form cannot.
  if (method !== "GET") headers["x-csrf-token"] = csrfToken();

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload.error as string) || `Request failed (${response.status})`,
      payload.details as { path: string; message: string }[] | undefined
    );
  }
  return payload as T;
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

// Fire-and-forget page-view beacon. Failures are ignored on purpose:
// analytics must never break the page the visitor came for.
export function trackView(path: string, productId?: string) {
  const body = JSON.stringify({ path, productId: productId ?? null });
  try {
    fetch("/api/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => undefined);
  } catch {
    /* ignored */
  }
}
