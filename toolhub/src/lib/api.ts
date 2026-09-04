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
  /** Overrides the default guard; uploads pass their own longer budget. */
  timeoutMs?: number;
}

// Without this a request that never comes back (proxy hiccup, restart mid-save)
// leaves the panel spinning forever with nothing to click.
const DEFAULT_TIMEOUT_MS = 30000;

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  // Echoes the readable CSRF cookie back as a header; a cross-site form cannot.
  if (method !== "GET") headers["x-csrf-token"] = csrfToken();

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = window.setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener("abort", () => controller.abort(options.signal?.reason), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: "same-origin",
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (networkError) {
    if (options.signal?.aborted) throw networkError;
    if (controller.signal.aborted) {
      throw new ApiError(0, `The server did not answer within ${Math.round(timeoutMs / 1000)}s. Nothing was saved, try again.`);
    }
    throw new ApiError(0, "No connection to the server. Check the network and try again.");
  } finally {
    window.clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: Record<string, unknown> = {};
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // A proxy or a bot check answered with an HTML page instead of the API.
      throw new ApiError(
        response.status,
        response.ok
          ? "The server sent an unexpected answer. Reload the page and try again."
          : `Request failed (${response.status}). The answer came from a proxy, not from the panel.`
      );
    }
  }

  if (!response.ok) {
    const details = payload.details as { path: string; message: string }[] | undefined;
    let message = (payload.error as string) || `Request failed (${response.status})`;
    // Name the offending field rather than leaving a bare "Validation failed".
    if (details?.length) {
      message += `: ${details.map((d) => (d.path ? `${d.path} — ${d.message}` : d.message)).join(", ")}`;
    }
    throw new ApiError(response.status, message, details);
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
