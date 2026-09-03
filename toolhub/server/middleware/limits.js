import rateLimit from "express-rate-limit";
import { clientIp } from "../lib/analytics.js";

const keyGenerator = (req) => clientIp(req) || "unknown";

// Login attempts: slow enough to make credential stuffing impractical.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  skipSuccessfulRequests: true,
  message: { error: "Too many sign-in attempts. Try again later." }
});

// Anti-abuse on the download redirect so counters cannot be inflated.
export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Too many download requests. Slow down." }
});

export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Review limit reached. Try again later." }
});

export const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  skip: () => false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator
});
