import { Router } from "express";
import { registerSseClient, getConnectedCount } from "../lib/sse.js";
import { randomUUID } from "crypto";

const router = Router();

const VALID_ROLES = new Set([
  "emergency", "doctor", "citizen", "admin", "lab",
  "pharmacy", "hospital", "insurance", "ai-control",
  "research", "family", "supply-chain",
]);

router.get("/stream", (req, res) => {
  const roleHeader = req.headers["x-user-role"] as string | undefined;
  const roleQuery = req.query["role"] as string | undefined;
  const role = roleHeader ?? roleQuery ?? "";

  if (!role || !VALID_ROLES.has(role)) {
    res.status(401).json({ error: "Unauthorized", message: "Valid role required" });
    return;
  }

  const clientId = randomUUID();
  registerSseClient(clientId, role, res);
});

router.get("/status", (_req, res) => {
  res.json({ connected: getConnectedCount() });
});

export default router;
