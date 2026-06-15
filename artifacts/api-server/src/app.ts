import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { authMiddleware } from "./middlewares/auth.js";
import { assertAuthPosture } from "./routes/auth.js";
import { correlationMiddleware, getRequestId } from "./middlewares/correlation.js";

const app: Express = express();

assertAuthPosture();

// ── Trust proxy (needed for correct IP behind Nginx / cloud LB) ──────────────
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // SSE requires this off
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// ── CORS — explicit origin allowlist ─────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env["ALLOWED_ORIGINS"] ?? "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no origin header) and allowlisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 600,
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Limits are env-overridable. Defaults protect against brute force while still
// comfortably covering a live demo session, where one presenter logs into 7+
// portals and replays scenarios (which re-authenticates and re-runs the engine).
const num = (key: string, fallback: number) => {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: num("AUTH_RATE_LIMIT", 50),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Too many login attempts — try again in 15 minutes" },
  skip: (req) => process.env["NODE_ENV"] === "test",
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: num("AI_RATE_LIMIT", 30),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "AI request rate limit reached — try again shortly" },
  skip: (req) => process.env["NODE_ENV"] === "test",
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: num("GENERAL_RATE_LIMIT", 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Too many requests" },
  skip: (req) => process.env["NODE_ENV"] === "test",
});

// ── Request correlation ID ────────────────────────────────────────────────────
app.use(correlationMiddleware);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => getRequestId(req as Request),
    customProps: (req) => {
      const expressReq = req as Request & { role?: string; userId?: string };
      return {
        requestId: getRequestId(expressReq),
        role: expressReq.role,
        userId: expressReq.userId,
      };
    },
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Routes with targeted rate limits ─────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api/ai/narrative", aiLimiter);
app.use("/api/ai/chat", aiLimiter);
app.use("/api", generalLimiter, authMiddleware, (req: Request, _res: Response, next: NextFunction) => {
  if (req.role || req.userId) {
    logger.info({
      requestId: getRequestId(req),
      role: req.role,
      userId: req.userId,
      path: req.path,
    }, "Authenticated request context");
  }
  next();
}, router);

// ── Global error handler — never expose stack traces in production ─────────────
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number })?.status ?? 500;
  const message =
    process.env["NODE_ENV"] === "production"
      ? status >= 500
        ? "Internal server error"
        : (err as Error)?.message ?? "Request error"
      : (err as Error)?.message ?? "Unknown error";

  if (status >= 500) {
    logger.error({ err, requestId: getRequestId(req), url: req.url, method: req.method }, "Unhandled error");
  }

  res.status(status).json({ error: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR", message });
});

export default app;
