import { Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { registerSseClient, getConnectedCount } from "../lib/sse.js";
import { randomUUID } from "crypto";

const router = Router();

const VALID_ROLES = new Set([
  "emergency", "doctor", "citizen", "admin", "lab",
  "pharmacy", "hospital", "insurance", "ai-control",
  "research", "family", "supply-chain",
]);

// EventSource (browser SSE API) cannot send custom headers, so we accept the
// JWT via the `token` query parameter as a fallback to the Authorization header.
router.get("/stream", (req, res) => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : (req.query["token"] as string | undefined);

  if (!rawToken) {
    res.status(401).json({ error: "Unauthorized", message: "Bearer token or ?token= required" });
    return;
  }

  let role: string | undefined;
  try {
    const decoded = jwt.verify(rawToken, secret) as JwtPayload | string;
    role = typeof decoded === "object" && typeof decoded.role === "string" ? decoded.role : undefined;
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }

  if (!role || !VALID_ROLES.has(role)) {
    res.status(401).json({ error: "Unauthorized", message: "Token does not carry a valid role" });
    return;
  }

  const clientId = randomUUID();
  registerSseClient(clientId, role, res);
});

router.get("/status", (_req, res) => {
  res.json({ connected: getConnectedCount() });
});

export default router;
