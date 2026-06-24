import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/healthz" || req.path === "/livez" || req.path === "/readyz" || req.path === "/" || req.path.startsWith("/events/stream") || req.path === "/auth/login" || req.path === "/auth/refresh") {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Bearer token required",
    });
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    return res.status(500).json({
      error: "Server Configuration Error",
      message: "JWT secret is not configured",
    });
  }

  let decoded: JwtPayload;
  try {
    const result = jwt.verify(token, secret);
    if (typeof result === "string" || !result) throw new Error("invalid payload");
    decoded = result;
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }

  const role = typeof decoded.role === "string" ? decoded.role : undefined;
  if (!role || !VALID_ROLES.has(role)) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid token role required",
    });
  }

  const allowedPaths = ROLE_PERMISSIONS[role] ?? [];
  const requestPath = `/api${req.path}`;

  const isAllowed = allowedPaths.some(p => requestPath === p || requestPath.startsWith(`${p}/`));

  if (!isAllowed) {
    return res.status(403).json({
      error: "Forbidden",
      message: `Role '${role}' is not authorized to access this resource`,
    });
  }

  req.role = role;
  req.userId = typeof decoded.userId === "string" ? decoded.userId : undefined;
  req.userName = typeof decoded.userName === "string" ? decoded.userName : undefined;
  req.userNationalId = typeof decoded.nationalId === "string" ? decoded.nationalId : undefined;
  req.username = typeof decoded.username === "string" ? decoded.username : undefined;

  next();
}
