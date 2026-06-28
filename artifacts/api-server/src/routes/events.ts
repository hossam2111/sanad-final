import { Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "@workspace/db";
import { patientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { registerSseClient, getConnectedCount } from "../lib/sse.js";
import { getStaffHospitalId } from "../lib/ownership.js";
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
  let username: string | undefined;
  let nationalId: string | undefined;
  try {
    const decoded = jwt.verify(rawToken, secret) as JwtPayload;
    if (typeof decoded === "object") {
      role = decoded.role;
      username = decoded.username;
      nationalId = decoded.nationalId;
    }
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }

  if (!role || !VALID_ROLES.has(role)) {
    res.status(401).json({ error: "Unauthorized", message: "Token does not carry a valid role" });
    return;
  }

  const clientId = randomUUID();
  
  (async () => {
    let hospitalId: string | undefined;
    let patientId: number | undefined;
    
    if (username) {
      hospitalId = (await getStaffHospitalId(username)) ?? undefined;
    }

    if (role === "citizen" && nationalId) {
      const [row] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.nationalId, nationalId)).limit(1);
      patientId = row?.id;
    }

    registerSseClient(clientId, role, res, hospitalId, patientId);
  })().catch(() => {
    res.status(500).end();
  });
});

router.get("/status", (_req, res) => {
  res.json({ connected: getConnectedCount() });
});

export default router;
