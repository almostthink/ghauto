import express from "express";
import { prisma } from "../db.js";
import { audit } from "../lib/audit.js";
import { hashPassword, publicUser } from "../lib/auth.js";
import { HttpError, notFound, parseBody, route } from "../lib/http.js";
import { requirePermission } from "../middleware/auth.js";
import { userPatchSchema, userSchema } from "../schemas/index.js";

// Staff accounts for the hidden admin panel. The public catalog has no
// visitor accounts, so these are the only users in the system.
export const usersRouter = express.Router();

usersRouter.use(requirePermission("*"));

usersRouter.get("/", route(async (_req, res) => {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ items: rows.map(publicUser) });
}));

usersRouter.post("/", route(async (req, res) => {
  const input = parseBody(userSchema, req.body);
  const email = input.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, "A user with this email already exists");
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      role: input.role,
      active: input.active,
      passwordHash: await hashPassword(input.password)
    }
  });
  await audit(req, "user.create", "user", user.id, { email, role: user.role });
  res.status(201).json(publicUser(user));
}));

usersRouter.put("/:id", route(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("User not found");
  const input = parseBody(userPatchSchema, req.body);

  // Guard against locking everyone out of the panel.
  if (existing.role === "super_admin" && (input.role && input.role !== "super_admin" || input.active === false)) {
    const admins = await prisma.user.count({ where: { role: "super_admin", active: true } });
    if (admins <= 1) throw new HttpError(409, "The last active super admin cannot be demoted or disabled");
  }

  const data = { ...input };
  if (input.email) data.email = input.email.toLowerCase();
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
    delete data.password;
  }
  const user = await prisma.user.update({ where: { id: existing.id }, data });
  await audit(req, "user.update", "user", user.id, { fields: Object.keys(data) });
  res.json(publicUser(user));
}));

usersRouter.delete("/:id", route(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound("User not found");
  if (existing.id === req.user.id) throw new HttpError(409, "You cannot delete your own account");
  if (existing.role === "super_admin") {
    const admins = await prisma.user.count({ where: { role: "super_admin", active: true } });
    if (admins <= 1) throw new HttpError(409, "The last super admin cannot be deleted");
  }
  await prisma.user.delete({ where: { id: existing.id } });
  await audit(req, "user.delete", "user", existing.id, { email: existing.email });
  res.status(204).end();
}));

usersRouter.get("/audit/log", route(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 30, 200);
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      actorEmail: row.actorEmail,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      meta: row.meta,
      createdAt: row.createdAt
    }))
  });
}));
