import { prisma } from "../db.js";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, verifySession } from "../lib/auth.js";
import { forbidden, unauthorized } from "../lib/http.js";

// Attaches req.user when a valid session cookie is present. Never rejects:
// requireAuth decides what an anonymous request is allowed to do.
export async function attachUser(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return next();
    const payload = verifySession(token);
    if (!payload) return next();
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// The only authorization gate: the panel has a single administrator, so every
// admin route needs a valid session and nothing more. Checked server-side on
// each request, never inferred from what the client chose to render.
export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

// Double-submit CSRF: the cookie is readable by the admin SPA and must be
// echoed in a header. A cross-site form post cannot set that header.
export function csrfGuard(req, _res, next) {
  const safe = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
  if (safe) return next();
  if (!req.cookies?.[SESSION_COOKIE]) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(forbidden("Invalid CSRF token"));
  }
  next();
}
