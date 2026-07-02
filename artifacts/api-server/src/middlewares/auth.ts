import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const VALID_ROLES = new Set([
  "emergency",
  "doctor",
  "citizen",
  "admin",
  "lab",
  "pharmacy",
  "hospital",
  "insurance",
  "ai-control",
  "research",
  "family",
  "supply-chain",
]);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  emergency: ["/api/emergency", "/api/patients", "/api/ai", "/api/alerts"],
  doctor: ["/api/patients", "/api/ai", "/api/lab", "/api/lab-results", "/api/medications", "/api/visits", "/api/alerts", "/api/appointments"],
  // /api/ai gives the citizen the same risk engine clinicians see, but every
  // patient-scoped endpoint enforces ownership (lib/ownership.ts): a citizen
  // token only resolves its own record, on /api/ai and everywhere else.
  citizen: ["/api/patients", "/api/lab-results", "/api/medications", "/api/visits", "/api/appointments", "/api/consent", "/api/ai", "/api/alerts"],
  admin: ["/api/admin", "/api/patients", "/api/ai", "/api/ai-control", "/api/alerts", "/api/lab", "/api/medications", "/api/visits", "/api/appointments"],
  // Every portal renders the system-alerts bell in the shared layout, so every
  // role gets read access to /api/alerts (writes are still role-checked in the
  // route handlers).
  lab: ["/api/lab", "/api/patients", "/api/lab-results", "/api/alerts"],
  pharmacy: ["/api/pharmacy", "/api/patients", "/api/medications", "/api/supply-chain", "/api/alerts"],
  hospital: ["/api/hospital", "/api/patients", "/api/visits", "/api/appointments", "/api/alerts"],
  insurance: ["/api/insurance", "/api/patients", "/api/medications", "/api/alerts"],
  "ai-control": ["/api/ai-control", "/api/ai", "/api/admin", "/api/alerts"],
  research: ["/api/research", "/api/alerts"],
  // Family reaches patient data only through /api/family, which is gated on
  // the patient's family_linking consent — no direct /api/patients access.
  family: ["/api/family", "/api/alerts"],
  "supply-chain": ["/api/supply-chain", "/api/medications", "/api/alerts"],
};

const userStatusCache = new Map<string, { status: string; ts: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// Evict expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of userStatusCache) if (now - v.ts >= CACHE_TTL_MS) userStatusCache.delete(k);
}, 5 * 60 * 1000).unref();

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/healthz" || req.path === "/livez" || req.path === "/readyz" || req.path === "/" || req.path.startsWith("/events/stream") || req.path === "/auth/login" || req.path === "/auth/refresh") {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized", message: "Bearer token required" });
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    return res.status(500).json({ error: "Server Configuration Error", message: "JWT secret is not configured" });
  }

  let decoded: JwtPayload;
  try {
    const result = jwt.verify(token, secret);
    if (typeof result === "string" || !result) throw new Error("invalid payload");
    decoded = result;
  } catch {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }

  const role = typeof decoded.role === "string" ? decoded.role : undefined;
  if (!role || !VALID_ROLES.has(role)) {
    return res.status(401).json({ error: "Unauthorized", message: "Valid token role required" });
  }
  
  const userId = typeof decoded.userId === "string" ? decoded.userId : undefined;
  
  if (userId) {
    let status = "active";
    const hit = userStatusCache.get(userId);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      status = hit.status;
    } else {
      const [user] = await db.select({ status: usersTable.status }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      status = user?.status ?? (userId.match(/^[A-Z]{3}-\d{3}$/) ? "active" : "revoked"); // if deleted from db, treat as revoked (but allow demo mock users)
      userStatusCache.set(userId, { status, ts: Date.now() });
    }
    
    if (status !== "active") {
      return res.status(401).json({ error: "Unauthorized", message: "User access has been revoked or suspended" });
    }
  }

  const allowedPaths = ROLE_PERMISSIONS[role] ?? [];
  const requestPath = `/api${req.path}`;

  const isAllowed = allowedPaths.some(p => requestPath === p || requestPath.startsWith(`${p}/`));

  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden", message: `Role '${role}' is not authorized to access this resource` });
  }

  req.role = role;
  req.userId = userId;
  req.userName = typeof decoded.userName === "string" ? decoded.userName : undefined;
  req.userNationalId = typeof decoded.nationalId === "string" ? decoded.nationalId : undefined;
  req.username = typeof decoded.username === "string" ? decoded.username : undefined;

  next();
}
