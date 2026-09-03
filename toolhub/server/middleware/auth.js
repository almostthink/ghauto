import { prisma } from "../db.js";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, can, verifySession } from "../lib/auth.js";
import { forbidden, unauthorized } from "../lib/http.js";

// Attaches req.user when a valid session cookie is present. Never rejects:
// route guards decide what an anonymous request is allowed to do.
export async function attachUser(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return next();
    const payload = verifySession(token);
    if (!payload) return next();
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.active) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

// Permission gate. Checked server-side on every mutating admin route; the
// client-side menu is a convenience, not the boundary.
export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!can(req.user.role, permission)) return next(forbidden(`Missing permission: ${permission}`));
    next();
  };
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
