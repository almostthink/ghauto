import { prisma } from "../db.js";
import { clientIp } from "./analytics.js";

// Records an administrative action. Never throws into the request path:
// a failed audit write must not hide the fact that the action itself succeeded.
export async function audit(req, action, entity, entityId, meta = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        actorName: req.user?.username ?? "",
        action,
        entity,
        entityId: entityId ? String(entityId) : "",
        meta,
        ip: clientIp(req).slice(0, 64)
      }
    });
  } catch (error) {
    console.error("audit log failed:", error.message);
  }
}
