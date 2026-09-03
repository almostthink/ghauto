import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

export const SESSION_COOKIE = "th_session";
export const CSRF_COOKIE = "th_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
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
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };
}
