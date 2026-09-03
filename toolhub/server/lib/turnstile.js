import { env } from "../env.js";
import { HttpError } from "./http.js";
import { clientIp } from "./analytics.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare Turnstile. Only active once both keys are configured, so the app
// runs unchanged in development and in setups that do not use Cloudflare.
export function turnstileRequired(form) {
  if (!env.turnstile.enabled) return false;
  return form === "login" ? env.turnstile.protectLogin : env.turnstile.protectReviews;
}

export async function verifyTurnstile(token, req) {
  if (!token || typeof token !== "string") {
    throw new HttpError(400, "Bot check missing. Reload the page and try again.");
  }

  const body = new URLSearchParams({
    secret: env.turnstile.secretKey,
    response: token,
    remoteip: clientIp(req)
  });

  let payload;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000)
    });
    payload = await response.json();
  } catch {
    // Fail closed: an unverifiable challenge is not a passed challenge.
    throw new HttpError(503, "Could not verify the bot check. Try again in a moment.");
  }

  if (!payload.success) {
    const codes = Array.isArray(payload["error-codes"]) ? payload["error-codes"] : [];
    // A token is single use and short lived; tell the visitor to retry rather
    // than leaving them stuck on a form that will never submit.
    const stale = codes.includes("timeout-or-duplicate");
    throw new HttpError(400, stale ? "The bot check expired. Please try again." : "Bot check failed.");
  }
}
