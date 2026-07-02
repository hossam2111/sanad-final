// Demo scenario verification — every assertion mirrors a step in DEMO_PLAYBOOK.md.
// Run order matters: S1–S3 generate the decisions/audit entries that S5 displays.
// 127.0.0.1, not localhost: dual-stack happy-eyeballs socket cancellation
// crashes libuv (UV_HANDLE_CLOSING) under undici on Node 24/Windows.
const API = "http://127.0.0.1:8080";
let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
}
async function login(u, p) {
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
  const j = await r.json();
  if (!j.token) throw new Error(`login failed: ${u}`);
  return j.token;
}
const get = (p, t) => fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${t}` } });
const post = (p, t, b) => fetch(`${API}${p}`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(b) });

const doctor = await login("dr.rashidi", "Doctor@2026");
const citizen = await login("citizen_demo", "Citizen@2026");
const emergency = await login("emergency_unit7", "Emergency@2026");
const family = await login("family.fatima", "Family@2026");
const insurance = await login("ins.nora", "Insurance@2026");
const pharmacy = await login("pharm.hassan", "Pharmacy@2026");
const research = await login("research.reem", "Research@2026");
const admin = await login("admin.saad", "Admin@2026");

// Resolve cast numeric ids
const p1 = await (await get("/api/patients/national/1000000001", doctor)).json();
const p3 = await (await get("/api/patients/national/1000000003", doctor)).json();
const p6 = await (await get("/api/patients/national/1000000006", doctor)).json();

console.log("\n══ S1 · Clinical Decision Support — محمد الغامدي ══");
check("record loads, risk score 95 (engine-weighted)", p1.riskScore === 95, `got ${p1.riskScore}`);
check("5 active medications (polypharmacy)", p1.medications?.filter(m => m.isActive).length === 5);
const d1 = await (await get(`/api/ai/decision/${p1.id}`, doctor)).json();
check("decision: CRITICAL risk", d1.riskLevel === "critical" || d1.riskLevel === "حرِج", d1.riskLevel);
check("decision: IMMEDIATE urgency", d1.urgency === "immediate" || d1.urgency === "عاجل_جدا", d1.urgency);
check("digital twin: rapidly worsening trajectory", d1.digitalTwin?.riskTrajectory === "rapidly_worsening" || d1.digitalTwin?.riskTrajectory === "تدهور_سريع", d1.digitalTwin?.riskTrajectory);
check("explainable: ≥4 why-factors", (d1.whyFactors?.length ?? 0) >= 4, `${d1.whyFactors?.length}`);
const pred1 = await (await get(`/api/ai/predictions/${p1.id}`, doctor)).json();
check("prediction: persistently abnormal HbA1c", pred1.predictions?.some(p => p.title.includes("Persistently Abnormal: HbA1c")), JSON.stringify(pred1.predictions?.map(p => p.title)));
check("prediction: diabetic complication risk", pred1.predictions?.some(p => p.title.includes("Diabetic Complication")));

console.log("\n══ S2 · Drug Interaction Detection ══");
const metro = await (await post("/api/ai/check-interaction", doctor, { patientId: p3.id, newDrug: "Metronidazole" })).json();
check("Metronidazole + Warfarin → HIGH, blocked", metro.safe === false && metro.warnings?.some(w => w.severity === "high" && (/warfarin/i.test(w.conflictingDrug) || /وارفارين/.test(w.conflictingDrug))), JSON.stringify(metro.warnings?.map(w => w.severity)));
const cipro = await (await post("/api/ai/check-interaction", doctor, { patientId: p3.id, newDrug: "Ciprofloxacin" })).json();
check("Ciprofloxacin + Warfarin → MODERATE, monitor INR", cipro.safe === true && cipro.warnings?.some(w => w.severity === "moderate"));
const tram = await (await post("/api/ai/check-interaction", doctor, { patientId: p6.id, newDrug: "Tramadol" })).json();
check("Tramadol + Fluoxetine → CRITICAL serotonin syndrome", tram.safe === false && tram.warnings?.some(w => w.severity === "critical"), JSON.stringify(tram.warnings));
const pharmP3 = await (await get("/api/pharmacy/patient/1000000003", pharmacy)).json();
const statin = pharmP3.prescriptions?.find(rx => rx.drugName === "Atorvastatin");
check("pharmacy sees خالد's prescriptions", (pharmP3.prescriptions?.length ?? 0) >= 4, `${pharmP3.prescriptions?.length}`);
if (statin) {
  const disp = await (await post(`/api/pharmacy/dispense/${statin.id}`, pharmacy, { pharmacistName: "Hassan Al-Ghamdi" })).json();
  check("dispense returns SERVER-issued reference", /^RX-\d{4}-\d{5}-/.test(disp.referenceNo ?? ""), disp.referenceNo);
} else { check("dispense returns SERVER-issued reference", false, "no Atorvastatin rx found"); }

console.log("\n══ S3 · Emergency Retrieval — خالد الغامدي (break-glass) ══");
const er = await (await get("/api/emergency/1000000003", emergency)).json();
check("retrieval returns blood type + allergies", er.bloodType === "B+" && er.allergies?.includes("Iodine contrast"));
check("risk level critical", er.riskLevel === "critical", er.riskLevel);
check("DO_NOT_GIVE actions present (aspirin/codeine/contrast)", er.clinicalActions?.filter(a => a.action === "DO_NOT_GIVE").length >= 2, JSON.stringify(er.clinicalActions?.map(a => a.action)));
check("warfarin+amiodarone URGENT_REVIEW action", er.clinicalActions?.some(a => /amiodarone/i.test(a.description) || /amiodarone/i.test(a.reason)));
check("critical alerts surfaced to responder", (er.criticalAlerts?.length ?? 0) >= 1);

console.log("\n══ S4 · Consent Management — محمد الغامدي ══");
const c0 = await (await get("/api/consent/patient/1000000001", citizen)).json();
check("family_linking granted at baseline", c0.consents?.find(c => c.type === "family_linking")?.granted === true);
check("research NOT granted at baseline (opt-in)", c0.consents?.find(c => c.type === "research")?.granted === false);
const grantRes = await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "research", granted: true });
check("citizen grants research consent live", grantRes.status === 200);
const revokeIns = await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "insurance", granted: false });
check("citizen revokes insurance consent", revokeIns.status === 200);
const insBlocked = await get("/api/insurance/patient/1000000001", insurance);
const insBlockedBody = await insBlocked.json();
check("insurer immediately loses access → 403 CONSENT_REVOKED", insBlocked.status === 403 && insBlockedBody.error === "CONSENT_REVOKED", `${insBlocked.status}`);
await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "insurance", granted: true });
check("re-grant restores insurer access", (await get("/api/insurance/patient/1000000001", insurance)).status === 200);
// Restore seed baseline so this suite is idempotent across re-runs (demo itself
// leaves research granted; the regression harness cleans up after itself).
await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "research", granted: false });

console.log("\n══ S6 · Family Access — Al-Ghamdi household ══");
const famOk = await get("/api/family/patient/1000000001", family);
const fam = await famOk.json();
check("consented record loads for family member", famOk.status === 200);
check("household resolved (≥3 relatives)", (fam.familyMembers?.length ?? 0) >= 3, `${fam.familyMembers?.length}`);
check("relatives' national IDs masked", fam.familyMembers?.every(m => m.nationalId.includes("•")));
check("hereditary diabetes risk detected", fam.geneticRisks?.some(g => /diabetes/i.test(g.condition)), JSON.stringify(fam.geneticRisks?.map(g => g.condition)));
const famGate = await get("/api/family/patient/1000000002", family);
const famGateBody = await famGate.json();
check("سعاد (no consent) → 403 CONSENT_REQUIRED", famGate.status === 403 && famGateBody.error === "CONSENT_REQUIRED", `${famGate.status}`);

console.log("\n══ S7 · Insurance Authorization — سعد العنزي (claim anomaly) ══");
const fraud = await (await get("/api/insurance/patient/1000000007", insurance)).json();
check("anomaly engine flags HIGH fraud risk", fraud.fraudRisk === "high", `${fraud.fraudRisk} (${fraud.anomalyScore})`);
check("anomaly factors name the pattern (ER frequency + cycling)", fraud.anomalyFactors?.filter(f => f.flag).length >= 2, JSON.stringify(fraud.anomalyFactors?.filter(f => f.flag).map(f => f.label)));
const claim = fraud.claims?.[0];
if (claim) {
  const review = await post(`/api/insurance/claim/${claim.claimId}/review`, insurance, { action: "flag", notes: "Pattern review — concurrent ER claims", reviewedBy: "Nora Al-Qahtani" });
  check("claim review (flag) persists", review.status === 200);
} else check("claim review (flag) persists", false, "no claims");
const normal = await (await get("/api/insurance/patient/1000000001", insurance)).json();
check("normal patient does NOT trip fraud engine", normal.fraudRisk !== "high", normal.fraudRisk);

console.log("\n══ S5 · National Health Intelligence — Ministry view ══");
const stats = await (await get("/api/admin/stats", admin)).json();
check("50 patients registered", stats.totalPatients === 50, stats.totalPatients);
check("visits TODAY is non-zero (live registry)", stats.totalVisitsToday >= 2, stats.totalVisitsToday);
check("risk distribution sums to population", stats.riskDistribution?.reduce((s, r) => s + r.count, 0) === 50);
check("AI decisions counted from real engine runs", stats.aiDecisionsMade >= 1, stats.aiDecisionsMade);
check("drug interaction alerts tracked", stats.drugInteractionsBlocked >= 1, stats.drugInteractionsBlocked);
const pop = await (await get("/api/admin/population-health", admin)).json();
check("condition prevalence derived from registry", pop.conditionBreakdown?.some(c => c.condition === "Hypertension" && c.count > 5), JSON.stringify(pop.conditionBreakdown?.slice(0, 3)));
const activeMonths = pop.monthlyVisitTrend?.filter(m => m.visits > 0).length ?? 0;
check("monthly visit trend covers ≥6 months", activeMonths >= 6, `${activeMonths}`);
const audit = await (await get("/api/admin/audit-log?limit=30", admin)).json();
const auditStr = JSON.stringify(audit);
check("audit chain holds break-glass + consent + dispense events", auditStr.includes("BREAK-GLASS") && auditStr.includes("CONSENT_") && auditStr.includes("dispensed"), "");
const verify = await (await get("/api/admin/audit-log/verify", admin)).json();
check("audit hash chain verifies intact (Isnād)", verify.integrity === "VERIFIED" && verify.legacyRecords === 0, JSON.stringify(verify).slice(0, 120));
const exp = await (await get("/api/research/export?format=json", research)).json();
const expStr = JSON.stringify(exp);
check("research export is de-identified", !expStr.includes("1000000001") && !expStr.includes("الغامدي"), "");

console.log("\n══ Auth: JWT refresh ══");
const refreshRes = await fetch(`${API}/api/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${doctor}` } });
const refreshData = await refreshRes.json();
check("refresh issues new token for valid bearer", refreshRes.status === 200 && typeof refreshData.token === "string" && refreshData.expiresIn === 28800, `status=${refreshRes.status} expiresIn=${refreshData.expiresIn}`);
const refreshedToken = refreshData.token;
const afterRefresh = await get("/api/patients/national/1000000001", refreshedToken);
check("refreshed token is immediately usable", afterRefresh.status === 200, `status=${afterRefresh.status}`);
const expiredAttempt = await fetch(`${API}/api/auth/refresh`, { method: "POST", headers: { Authorization: "Bearer not.a.valid.token" } });
check("refresh rejects invalid token with 401", expiredAttempt.status === 401, `status=${expiredAttempt.status}`);

const supply = await login("supply.ibrahim", "Supply@2026");

console.log("\n══ S8 · Supply Chain Reorder ══");
const invRes = await get("/api/supply-chain/inventory", supply);
check("inventory endpoint loads", invRes.status === 200);
const invData = await invRes.json();
check("has critical alerts", invData.criticalAlerts?.length > 0);

const poRes = await post("/api/supply-chain/reorder", supply, { drugName: "Warfarin 5mg", quantity: 5000 });
check("purchase order created successfully", poRes.status === 200);
const poData = await poRes.json();
check("PO generated with order ID", !!poData.id);

console.log(`\n══ ${pass} passed, ${fail} failed ══`);
process.exitCode = fail ? 1 : 0; // let the event loop drain instead of hard-exiting
