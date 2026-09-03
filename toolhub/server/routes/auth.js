import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { clearCookies, issueCookies, hashPassword, publicUser, verifyPassword } from "../lib/auth.js";
import { HttpError, parseBody, route, unauthorized } from "../lib/http.js";
import { turnstileRequired, verifyTurnstile } from "../lib/turnstile.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/limits.js";
import { changePasswordSchema, loginSchema, profileSchema } from "../schemas/index.js";

export const authRouter = express.Router();

authRouter.post("/login", loginLimiter, route(async (req, res) => {
  if (turnstileRequired("login")) await verifyTurnstile(req.body?.turnstileToken, req);
  const { email, password } = parseBody(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Same response for an unknown email and a wrong password, so the endpoint
  // cannot be used to confirm which address the administrator uses.
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) throw unauthorized("Invalid email or password");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const csrfToken = issueCookies(res, user);
  req.user = user;
  await audit(req, "auth.login", "user", user.id, {});
  res.json({ user: publicUser(user), csrfToken });
}));

authRouter.post("/logout", route(async (req, res) => {
  if (req.user) await audit(req, "auth.logout", "user", req.user.id, {});
  clearCookies(res);
  res.status(204).end();
}));

authRouter.get("/me", route(async (req, res) => {
  if (!req.user) throw unauthorized();
  res.json({ user: publicUser(req.user) });
}));

authRouter.put("/profile", requireAuth, route(async (req, res) => {
  const input = parseBody(profileSchema, req.body);
  const email = input.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== req.user.id) throw new HttpError(409, "That email is already in use");
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { email, name: input.name }
  });
  await audit(req, "auth.profile_update", "user", user.id, {});
  res.json({ user: publicUser(user) });
}));

authRouter.post("/password", requireAuth, route(async (req, res) => {
  const { currentPassword, newPassword } = parseBody(changePasswordSchema, req.body);
  const ok = await verifyPassword(currentPassword, req.user.passwordHash);
  if (!ok) throw unauthorized("Current password is incorrect");
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: await hashPassword(newPassword) }
  });
  await audit(req, "auth.password_change", "user", req.user.id, {});
  res.status(204).end();
}));
