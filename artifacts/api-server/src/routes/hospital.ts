import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, visitsTable } from "@workspace/db/schema";
import { desc, gte, count, and, eq, inArray } from "drizzle-orm";
import { getStaffHospitalId } from "../lib/ownership.js";

const router = Router();

router.use((req, res, next) => {
  const allowedRoles = ["hospital", "admin", "doctor"];
  if (!req.role || !allowedRoles.includes(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Hospital administrative or medical role required" });
    return;
  }
  next();
});

router.get("/overview", async (req, res) => {
  let hospitalFilter: string | null = null;
  if (req.role !== "admin") {
    if (!req.username) {
      res.status(403).json({ error: "FORBIDDEN", message: "Clinical token missing username" });
      return;
    }
    hospitalFilter = await getStaffHospitalId(req.username);
    if (!hospitalFilter) {
      res.status(403).json({ error: "FORBIDDEN", message: "Staff not assigned to a hospital" });
      return;
    }
  }

  const today = new Date();
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const AVG_LOS_DAYS = 4.2;
  // visitDate is stored as YYYY-MM-DD text — compare as string
  const last30DaysStr = last30Days.toISOString().split("T")[0]!;
  const todayStr = today.toISOString().split("T")[0]!;
  const dischargeProxyDate = new Date(today.getTime() - Math.round(AVG_LOS_DAYS) * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0]!;

  const [highRiskPatients, [totalPatientsRow], admissionTypeRows, [admissionsTodayRow], [dischargesTodayRow]] = await Promise.all([
    db.select().from(patientsTable).where(
      hospitalFilter
        ? and(gte(patientsTable.riskScore, 50), eq(patientsTable.hospitalId, hospitalFilter))
        : gte(patientsTable.riskScore, 50)
    ).orderBy(desc(patientsTable.riskScore)).limit(15),

    db.select({ count: count() }).from(patientsTable).where(
      hospitalFilter ? eq(patientsTable.hospitalId, hospitalFilter) : undefined
    ),

    // Counts by visit type in last 30 days (replaces the 500-row in-memory filter)
    db.select({ visitType: visitsTable.visitType, cnt: count() })
      .from(visitsTable)
      .where(and(
        hospitalFilter ? eq(visitsTable.hospital, hospitalFilter) : undefined,
        gte(visitsTable.visitDate, last30DaysStr),
        inArray(visitsTable.visitType, ["inpatient", "emergency"]),
      ))
      .groupBy(visitsTable.visitType),

    db.select({ cnt: count() }).from(visitsTable)
      .where(and(
        hospitalFilter ? eq(visitsTable.hospital, hospitalFilter) : undefined,
        eq(visitsTable.visitDate, todayStr),
        inArray(visitsTable.visitType, ["inpatient", "emergency"]),
      )),

    db.select({ cnt: count() }).from(visitsTable)
      .where(and(
        hospitalFilter ? eq(visitsTable.hospital, hospitalFilter) : undefined,
        eq(visitsTable.visitDate, dischargeProxyDate),
        eq(visitsTable.visitType, "inpatient"),
      )),
  ]);

  const totalPatientCount = Number(totalPatientsRow?.count ?? 0);
  const HOSPITAL_NAME = hospitalFilter || "SANAD Global Network";

  const typeMap = new Map(admissionTypeRows.map(r => [r.visitType, Number(r.cnt)]));
  const emergencyCount = typeMap.get("emergency") ?? 0;
  const inpatientCount = typeMap.get("inpatient") ?? 0;

  // Fetch last visit for each high-risk patient in one targeted IN query (replaces O(n×m) in-memory scan)
  const patientIds = highRiskPatients.map(p => p.id);
  const patientLastVisits = patientIds.length > 0
    ? await db.select({
        patientId: visitsTable.patientId,
        visitDate: visitsTable.visitDate,
        visitType: visitsTable.visitType,
        department: visitsTable.department,
      }).from(visitsTable)
        .where(inArray(visitsTable.patientId, patientIds))
        .orderBy(desc(visitsTable.visitDate))
    : [];

  const lastVisitMap = new Map<number, { date: string; type: string; department: string }>();
  for (const v of patientLastVisits) {
    if (!lastVisitMap.has(v.patientId)) {
      lastVisitMap.set(v.patientId, { date: v.visitDate, type: v.visitType, department: v.department });
    }
  }

  const totalBeds = { icu: 45, general: 320, emergency: 80, pediatric: 60, maternity: 40, surgical: 90 };
  const occupiedBeds = {
    icu: Math.min(totalBeds.icu, Math.round(inpatientCount * 0.15) + 18),
    general: Math.min(totalBeds.general, Math.round(inpatientCount * 0.6) + 95),
    emergency: Math.min(totalBeds.emergency, emergencyCount + 12),
    pediatric: Math.min(totalBeds.pediatric, Math.round(inpatientCount * 0.12) + 8),
    maternity: Math.min(totalBeds.maternity, 22),
    surgical: Math.min(totalBeds.surgical, Math.round(inpatientCount * 0.13) + 30),
  };

  const bedStatus = Object.entries(totalBeds).map(([unit, total]) => {
    const occupied = occupiedBeds[unit as keyof typeof occupiedBeds];
    const available = total - occupied;
    const occupancyPct = Math.round((occupied / total) * 100);
    return {
      unit: unit.charAt(0).toUpperCase() + unit.slice(1).replace("_", " "),
      unitKey: unit,
      total,
      occupied,
      available,
      occupancyPct,
      status: occupancyPct >= 90 ? "critical" : occupancyPct >= 75 ? "high" : occupancyPct >= 50 ? "moderate" : "low",
    };
  });

  const priorityQueue = highRiskPatients.map(p => ({
    id: p.id,
    name: p.fullName,
    nationalId: p.nationalId,
    age: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
    riskScore: p.riskScore ?? 0,
    riskLevel: (p.riskScore ?? 0) >= 70 ? "high" : (p.riskScore ?? 0) >= 40 ? "moderate" : "low",
    chronicConditions: p.chronicConditions ?? [],
    lastVisit: lastVisitMap.get(p.id) ?? null,
    suggestedWard: (p.riskScore ?? 0) >= 80 ? "ICU" : (p.riskScore ?? 0) >= 65 ? "Emergency" : "General",
    priority: (p.riskScore ?? 0) >= 80 ? "immediate" : (p.riskScore ?? 0) >= 65 ? "urgent" : "soon",
  }));

  const staffKPIs = {
    doctors: 124,
    nurses: 486,
    specialists: 67,
    available: 89,
    onDuty: 312,
    doctorPatientRatio: `1:${Math.round(totalPatientCount / 124)}`,
    nursePatientRatio: `1:${Math.round(totalPatientCount / 486)}`,
  };

  const aiCapacityInsights = [
    `ICU occupancy at ${bedStatus.find(b => b.unitKey === "icu")?.occupancyPct}% — ${bedStatus.find(b => b.unitKey === "icu")?.available} beds available. ${bedStatus.find(b => b.unitKey === "icu")!.occupancyPct >= 80 ? "Consider activating surge protocol." : "Within normal operational range."}`,
    `${priorityQueue.filter(p => p.priority === "immediate").length} high-risk patients flagged for immediate clinical review in the next 24 hours.`,
    `Emergency department running at ${bedStatus.find(b => b.unitKey === "emergency")?.occupancyPct}% capacity. ${emergencyCount} emergency admissions in last 30 days.`,
    `AI recommends pre-emptive discharge planning for ${inpatientCount > 20 ? "top 10" : "top 5"} longest-stay patients to free general ward capacity.`,
  ];

  const icuAlerts = priorityQueue
    .filter(p => p.priority === "immediate" || p.suggestedWard === "ICU")
    .slice(0, 6)
    .map(p => ({
      patientId: p.id,
      name: p.name,
      nationalId: p.nationalId,
      riskScore: p.riskScore,
      conditions: p.chronicConditions.slice(0, 2),
      alertType: p.riskScore >= 90 ? "Immediate Transfer Required" : "ICU Review Pending",
      severity: p.riskScore >= 90 ? "critical" : "high",
      timeWindow: p.riskScore >= 90 ? "≤ 15 min" : "≤ 2 hours",
    }));

  const orSchedule = [
    { id: "OR-001", patient: "Patient #1000000003", procedure: "Coronary Bypass Graft", surgeon: "Dr. Al-Rashidi", room: "OR-3", scheduledTime: "08:00", status: "in_progress", estimatedDuration: "4h 30m" },
    { id: "OR-002", patient: "Patient #1000000007", procedure: "Knee Arthroplasty", surgeon: "Dr. Al-Zahrani", room: "OR-1", scheduledTime: "10:30", status: "scheduled", estimatedDuration: "2h 15m" },
    { id: "OR-003", patient: "Patient #1000000012", procedure: "Cholecystectomy", surgeon: "Dr. Al-Ghamdi", room: "OR-2", scheduledTime: "13:00", status: "scheduled", estimatedDuration: "1h 45m" },
    { id: "OR-004", patient: "Patient #1000000019", procedure: "Appendectomy (Emergency)", surgeon: "Dr. Al-Harbi", room: "OR-4", scheduledTime: "14:30", status: "emergency", estimatedDuration: "1h 00m" },
    { id: "OR-005", patient: "Patient #1000000025", procedure: "Hip Replacement", surgeon: "Dr. Al-Otaibi", room: "OR-1", scheduledTime: "16:00", status: "scheduled", estimatedDuration: "3h 00m" },
  ];

  const readmissionRisks = priorityQueue.slice(0, 5).map(p => ({
    patientId: p.id,
    name: p.name,
    nationalId: p.nationalId,
    readmissionRisk: Math.min(95, Math.round(p.riskScore * 0.85 + (p.id % 10))),
    lastDischarge: p.lastVisit?.date ?? "N/A",
    primaryReason: p.chronicConditions[0] ?? "General",
    recommendedAction: p.riskScore >= 80 ? "Schedule follow-up within 48h" : "Outpatient follow-up in 1 week",
  }));

  res.json({
    hospitalName: HOSPITAL_NAME,
    bedStatus,
    totalBeds: Object.values(totalBeds).reduce((a, b) => a + b, 0),
    totalOccupied: Object.values(occupiedBeds).reduce((a, b) => a + b, 0),
    overallOccupancy: Math.round((Object.values(occupiedBeds).reduce((a, b) => a + b, 0) / Object.values(totalBeds).reduce((a, b) => a + b, 0)) * 100),
    priorityQueue,
    staffKPIs,
    aiCapacityInsights,
    icuAlerts,
    orSchedule,
    readmissionRisks,
    admissionsToday: Number(admissionsTodayRow?.cnt ?? 0),
    dischargesToday: Number(dischargesTodayRow?.cnt ?? 0),
    avgLengthOfStay: AVG_LOS_DAYS,
    pendingSurgeries: orSchedule.length,
  });
});

export default router;
