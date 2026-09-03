import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

export const SESSION_COOKIE = "th_session";
export const CSRF_COOKIE = "th_csrf";
export const CSRF_HEADER = "x-csrf-token";

// Role capabilities. Every server-side permission check goes through `can()`.
const PERMISSIONS = {
  super_admin: ["*"],
  editor: ["content.read", "content.write", "media.write", "analytics.read", "reviews.read"],
  moderator: ["content.read", "reviews.read", "reviews.write", "analytics.read"],
  analyst: ["content.read", "analytics.read", "reviews.read"]
};

export function can(role, permission) {
  const granted = PERMISSIONS[role] || [];
  return granted.includes("*") || granted.includes(permission);
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: `${env.sessionTtlHours}h` }
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

export function issueCookies(res, user) {
  const maxAge = env.sessionTtlHours * 60 * 60 * 1000;
  const csrfToken = crypto.randomBytes(24).toString("hex");
  res.cookie(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    maxAge,
    path: "/"
  });
  // Readable by the admin SPA on purpose: it is echoed back in the CSRF header.
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.cookieSecure,
    maxAge,
    path: "/"
  });
  return csrfToken;
}

export function clearCookies(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };
}
