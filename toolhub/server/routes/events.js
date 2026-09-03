import express from "express";
import { prisma } from "../db.js";
import { requestContext } from "../lib/analytics.js";
import { parseBody, route } from "../lib/http.js";
import { eventLimiter } from "../middleware/limits.js";
import { viewEventSchema } from "../schemas/index.js";

export const eventsRouter = express.Router();

// Anonymous page-view beacon. Bots are counted but never inflate the product
// view counter, and no raw IP is stored.
eventsRouter.post("/view", eventLimiter, route(async (req, res) => {
  const input = parseBody(viewEventSchema, req.body);
  const context = requestContext(req);

  const productId = input.productId ?? null;
  const writes = [
    prisma.viewEvent.create({ data: { productId, path: input.path, ...context } })
  ];
  if (productId && context.device !== "bot") {
    writes.push(prisma.product.update({ where: { id: productId }, data: { views: { increment: 1 } } }));
  }
  if (context.countryCode) {
    writes.push(prisma.country.updateMany({
      where: { code: context.countryCode },
      data: { views: { increment: 1 } }
    }));
  }
  await prisma.$transaction(writes);
  res.status(202).end();
}));
