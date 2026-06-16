// Ownership boundary verification — every assertion is a trust boundary.
// 127.0.0.1, not localhost: dual-stack happy-eyeballs crashes libuv on Node 24/Windows.
const API = "http://127.0.0.1:8080";
let pass = 0, fail = 0;

function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
}

async function login(username, password) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (!j.token) throw new Error(`login failed for ${username}: ${JSON.stringify(j)}`);
  return j.token;
}

const get = (path, token) => fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
const post = (path, token, body) => fetch(`${API}${path}`, {
  method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const patch = (path, token) => fetch(`${API}${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });

const citizen = await login("citizen_demo", "Citizen@2026");
const doctor = await login("dr.rashidi", "Doctor@2026");
const family = await login("family.fatima", "Family@2026");
const research = await login("research.reem", "Research@2026");
const emergency = await login("emergency_unit7", "Emergency@2026");
const admin = await login("admin.saad", "Admin@2026");

console.log("\n── Citizen: own record ──");
const ownRes = await get("/api/patients/national/1000000001", citizen);
check("own record by nationalId → 200", ownRes.status === 200, `got ${ownRes.status}`);
const own = await ownRes.json();
const ownId = own.id;
const otherId = ownId + 1;
console.log(`  (own numeric id = ${ownId})`);

console.log("\n── Citizen: foreign records blocked ──");
check("foreign nationalId → 403", (await get("/api/patients/national/1000000002", citizen)).status === 403);
check("numeric /patients/:id → 403", (await get(`/api/patients/${otherId}`, citizen)).status === 403);
const listRes = await get("/api/patients?search=Al", citizen);
const list = await listRes.json();
check("list/search returns only own record", listRes.status === 200 && list.total === 1 && list.patients?.[0]?.nationalId === "1000000001", `total=${list.total}`);
check("POST /patients (register) → 403", (await post("/api/patients", citizen, { nationalId: "1000000099", fullName: "X Y", dateOfBirth: "1990-01-01", gender: "male", bloodType: "O+" })).status === 403);

console.log("\n── Citizen: AI engine scoped to own record ──");
check(`own decision → 200`, (await get(`/api/ai/decision/${ownId}`, citizen)).status === 200);
check(`foreign decision → 403`, (await get(`/api/ai/decision/${otherId}`, citizen)).status === 403);
check(`foreign risk-score → 403`, (await get(`/api/ai/risk-score/${otherId}`, citizen)).status === 403);
check(`foreign predictions → 403`, (await get(`/api/ai/predictions/${otherId}`, citizen)).status === 403);
check(`foreign events → 403`, (await get(`/api/ai/events/${otherId}`, citizen)).status === 403);
check(`foreign audit → 403`, (await get(`/api/ai/audit/${otherId}`, citizen)).status === 403);
check(`foreign check-interaction → 403`, (await post("/api/ai/check-interaction", citizen, { patientId: otherId, newDrug: "Aspirin" })).status === 403);

console.log("\n── Citizen: consent ownership ──");
check("own consent profile → 200", (await get("/api/consent/patient/1000000001", citizen)).status === 200);
check("foreign consent profile → 403", (await get("/api/consent/patient/1000000002", citizen)).status === 403);
check("grant consent for another patient → 403", (await post("/api/consent/grant", citizen, { nationalId: "1000000002", consentType: "data_sharing", granted: false })).status === 403);

console.log("\n── Citizen: appointments ──");
check(`own appointments → 200`, (await get(`/api/appointments/patient/${ownId}`, citizen)).status === 200);
check(`foreign appointments → 403`, (await get(`/api/appointments/patient/${otherId}`, citizen)).status === 403);
check("book for another patient → 403", (await post("/api/appointments", citizen, { patientId: otherId, hospital: "X", department: "Cardiology", date: "2026-07-01", time: "09:00" })).status === 403);
check("global /appointments/all → 403", (await get("/api/appointments/all", citizen)).status === 403);

console.log("\n── Citizen: record sub-routes ──");
check(`foreign medications → 403`, (await get(`/api/medications?patientId=${otherId}`, citizen)).status === 403);
check(`foreign visits → 403`, (await get(`/api/visits?patientId=${otherId}`, citizen)).status === 403);
check(`foreign lab-results → 403`, (await get(`/api/lab-results?patientId=${otherId}`, citizen)).status === 403);
check("citizen POST medication → 403", (await post("/api/medications", citizen, { patientId: ownId, drugName: "Aspirin" })).status === 403);
check("citizen POST visit → 403", (await post("/api/visits", citizen, { patientId: ownId, visitDate: "2026-06-12", hospital: "X", visitType: "outpatient" })).status === 403);
check("citizen POST lab result → 403", (await post("/api/lab-results", citizen, { patientId: ownId, testName: "X", testDate: "2026-06-12", result: "1", status: "normal" })).status === 403);

console.log("\n── Citizen: alerts scoped + redaction for non-clinical ──");
const calRes = await get("/api/alerts/system", citizen);
const cal = await calRes.json();
check("citizen /alerts/system only own alerts", calRes.status === 200 && (cal.alerts ?? []).every(a => a.patientId === ownId), `ids=${[...new Set((cal.alerts ?? []).map(a => a.patientId))].join(",")}`);
check(`citizen foreign ?patientId → 403`, (await get(`/api/alerts?patientId=${otherId}`, citizen)).status === 403);
const ral = await (await get("/api/alerts/system", research)).json();
check("research /alerts/system has no patient identity", (ral.alerts ?? []).every(a => a.patientName === null && a.patientNationalId === null && a.patientId === null), JSON.stringify(ral.alerts?.[0] ?? {}));
const dal = await (await get("/api/alerts/system", doctor)).json();
check("doctor /alerts/system keeps patient identity", (dal.alerts ?? []).some(a => a.patientName), "no identified alerts in doctor feed");

console.log("\n── Clinical roles unaffected ──");
check(`doctor foreign decision → 200`, (await get(`/api/ai/decision/${otherId}`, doctor)).status === 200);
check("doctor patient by nationalId → 200", (await get("/api/patients/national/1000000002", doctor)).status === 200);
// Seed names are Arabic — search by nationalId digits (the registry is keyed both ways).
check("doctor patient search → many", ((await (await get("/api/patients?search=10000000", doctor)).json()).total ?? 0) > 1);

console.log("\n── Family: consent-gated (seed: محمد 1 granted, سعاد 2 not) ──");
check("family blocked from /patients entirely", (await get("/api/patients/national/1000000001", family)).status === 403);
check("family reads consented record (محمد) → 200", (await get("/api/family/patient/1000000001", family)).status === 200);
const gate = await get("/api/family/patient/1000000002", family);
const gateBody = await gate.json();
check("family gate on non-consented record (سعاد) → 403 CONSENT_REQUIRED", gate.status === 403 && gateBody.error === "CONSENT_REQUIRED", `got ${gate.status}`);
// Ownership + consent interaction: only the record holder can flip the gate.
await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "family_linking", granted: false });
check("after owner revokes → family loses access (403)", (await get("/api/family/patient/1000000001", family)).status === 403);
const regrant = await post("/api/consent/grant", citizen, { nationalId: "1000000001", consentType: "family_linking", granted: true });
check("owner re-grants family_linking → 200", regrant.status === 200);
const famAfter = await get("/api/family/patient/1000000001", family);
check("family access restored → 200", famAfter.status === 200, `got ${famAfter.status}`);
if (famAfter.status === 200) {
  const fam = await famAfter.json();
  check("relatives' national ids masked", (fam.familyMembers ?? []).every(m => m.nationalId.includes("•")), JSON.stringify((fam.familyMembers ?? []).map(m => m.nationalId)));
}

console.log("\n── Emergency: break-glass audited ──");
check("emergency lookup → 200", (await get("/api/emergency/1000000001", emergency)).status === 200);
const audit = await (await get("/api/admin/audit-log?limit=15", admin)).json();
const rows = JSON.stringify(audit);
check("audit chain contains BREAK-GLASS entry", rows.includes("BREAK-GLASS"), "not found in last 15 entries");

console.log("\n══ HOSPITAL SCOPING ══");
const pts2 = await (await get("/api/patients", doctor)).json();
check("Dr. Rashidi sees KAMC-RYD scoped patients (18 patients)", pts2.total === 18, `got ${pts2.total}`);

const emPts = await (await get("/api/patients", emergency)).json();
check("Emergency Unit sees ALL 50 patients (Break-glass)", emPts.total === 50, `got ${emPts.total}`);

console.log(`\n══ ${pass} passed, ${fail} failed ══`);
process.exitCode = fail ? 1 : 0;
