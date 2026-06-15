import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable, patientsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isClinicalRole, requireOwnPatient, resolveOwnPatientId } from "../lib/ownership.js";

const router = Router();

router.get("/", async (req, res) => {
  const patientId = parseInt(req.query["patientId"] as string);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "INVALID_PARAM", message: "patientId is required" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.patientId, patientId))
    .orderBy(desc(alertsTable.createdAt));

  res.json({ alerts });
});

router.get("/system", async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 20, 50);

  // Citizens see only alerts on their own record; the system-wide feed would
  // leak other patients' clinical events.
  if (req.role === "citizen") {
    const ownId = await resolveOwnPatientId(req);
    if (ownId === null) {
      res.json({ alerts: [], unreadCount: 0 });
      return;
    }
    const [alerts, unreadResult] = await Promise.all([
      db.select().from(alertsTable)
        .where(eq(alertsTable.patientId, ownId))
        .orderBy(desc(alertsTable.createdAt))
        .limit(limit),
      db.select({ count: sql<number>`count(*)` }).from(alertsTable)
        .where(and(eq(alertsTable.isRead, false), eq(alertsTable.patientId, ownId))),
    ]);
    res.json({ alerts, unreadCount: Number(unreadResult[0]?.count ?? 0) });
    return;
  }

  const alerts = await db
    .select({
      id: alertsTable.id,
      alertType: alertsTable.alertType,
      severity: alertsTable.severity,
      title: alertsTable.title,
      message: alertsTable.message,
      isRead: alertsTable.isRead,
      createdAt: alertsTable.createdAt,
      patientId: alertsTable.patientId,
      patientName: patientsTable.fullName,
      patientNationalId: patientsTable.nationalId,
    })
    .from(alertsTable)
    .leftJoin(patientsTable, eq(alertsTable.patientId, patientsTable.id))
    .orderBy(desc(alertsTable.createdAt))
    .limit(limit);

  const unreadResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertsTable)
    .where(eq(alertsTable.isRead, false));

  // Non-clinical roles (insurance, research, family, supply-chain, ai-control)
  // get the operational feed without patient identity.
  const visible = isClinicalRole(req.role)
    ? alerts
    : alerts.map(a => ({ ...a, patientId: null, patientName: null, patientNationalId: null }));

  res.json({
    alerts: visible,
    unreadCount: Number(unreadResult[0]?.count ?? 0),
  });
});

router.patch("/:id/read", async (req, res) => {
  const alertId = parseInt(req.params["id"]!);
  if (isNaN(alertId)) {
    res.status(400).json({ error: "INVALID_PARAM", message: "Invalid alert ID" });
    return;
  }

  if (req.role === "citizen") {
    const [alert] = await db.select({ patientId: alertsTable.patientId })
      .from(alertsTable).where(eq(alertsTable.id, alertId)).limit(1);
    if (!alert) {
      res.status(404).json({ error: "NOT_FOUND", message: "Alert not found" });
      return;
    }
    const ownId = await resolveOwnPatientId(req);
    if (ownId === null || alert.patientId !== ownId) {
      res.status(403).json({ error: "FORBIDDEN", message: "You may only manage alerts on your own record" });
      return;
    }
  }

  await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(eq(alertsTable.id, alertId));

  res.json({ success: true });
});

router.patch("/read-all", async (req, res) => {
  // Citizens clear only their own alerts; everyone else clears the shared
  // operational feed.
  if (req.role === "citizen") {
    const ownId = await resolveOwnPatientId(req);
    if (ownId !== null) {
      await db.update(alertsTable).set({ isRead: true }).where(eq(alertsTable.patientId, ownId));
    }
    res.json({ success: true });
    return;
  }

  await db
    .update(alertsTable)
    .set({ isRead: true });

  res.json({ success: true });
});

export default router;
