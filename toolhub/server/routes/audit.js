import express from "express";
import { prisma } from "../db.js";
import { route } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

// Change history for the panel. There is a single administrator, so this is
// less about who did what and more about what changed, and when.
export const auditRouter = express.Router();

auditRouter.use(requireAuth);

auditRouter.get("/", route(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 30, 200);
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      actorName: row.actorName,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      meta: row.meta,
      createdAt: row.createdAt
    }))
  });
}));
