/**
 * SANAD Demo Environment Seed
 * ───────────────────────────
 * This is not sample data — it is a demonstration scenario library in database
 * form. Every record exists to make a specific engine fire a specific way:
 *
 *   S1  Clinical decision support . محمد الغامدي (1000000001) — uncontrolled T2DM
 *       + CAD + polypharmacy → decision engine: CRITICAL risk, IMMEDIATE urgency.
 *   S2  Drug interaction detection خالد الغامدي (1000000003) — Warfarin+Amiodarone
 *       on board, INR 3.8 critical; live checks: Metronidazole→HIGH, and
 *       سارة العتيبي (1000000006) Fluoxetine + Tramadol → CRITICAL (serotonin).
 *   S3  Emergency retrieval ...... خالد الغامدي — allergies (iodine/aspirin/codeine)
 *       drive DO_NOT_GIVE actions; break-glass access is audited.
 *   S4  Consent management ....... محمد grants research live; لطيفة الحربي
 *       (1000000008) has REVOKED insurance consent → insurer sees 403.
 *   S5  National intelligence .... all admin numbers derive from this dataset —
 *       visits seeded across 12 months incl. TODAY, risk spread is real.
 *   S6  Family access ............ Al-Ghamdi household occupies consecutive ids
 *       (family engine links by id adjacency); محمد has family_linking GRANTED,
 *       his sister سعاد (1000000002) has NOT → consent gate demo.
 *   S7  Insurance authorization .. سعد العنزي (1000000007) — engineered claim
 *       pattern (4 ER visits / 4 hospitals / 2 visits 2 days apart) trips the
 *       anomaly engine; normal patients score low.
 *
 * Engineering rules:
 *   • All dates are RELATIVE to seed time (daysAgo/daysAhead) — the engines
 *     use 3/6/12-month windows, so the demo never decays.
 *   • Deterministic PRNG (fixed seed) — the background population is identical
 *     on every run; assertions in scenario-tests.mjs stay valid.
 *   • Idempotent — TRUNCATE ... RESTART IDENTITY first. Reseed before every
 *     presentation: `npm run seed` (workspace: scripts).
 *   • Lab status fields always match their values and reference ranges.
 *   • Stored riskScore mirrors the API's calculateRiskScore weights so admin
 *     dashboards don't shift when a record is opened mid-demo.
 */
import {
  db, pool,
  patientsTable, medicationsTable, visitsTable, labResultsTable,
  alertsTable, consentTable, appointmentsTable, aiDecisionsTable,
  staffAssignmentsTable, purchaseOrdersTable, aiRetrainJobsTable,
  familyRelationshipsTable, usersTable
} from "@workspace/db";

// ── Deterministic PRNG ────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260612);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

// ── Relative dating ───────────────────────────────────────────────────────────
const iso = (d: Date) => d.toISOString().split("T")[0]!;
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const daysAhead = (n: number) => daysAgo(-n);

// Hospitals — must match the appointment route's HOSPITALS list so every
// portal aggregates over the same facility names.
const HOSPITALS = [
  "King Fahd Medical City — Riyadh",
  "King Abdulaziz Medical City — Jeddah",
  "King Khalid University Hospital — Riyadh",
  "Prince Sultan Military Medical City",
  "King Faisal Specialist Hospital & Research Centre",
  "Al-Noor Specialist Hospital — Makkah",
  "Maternity & Children Hospital — Dammam",
  "Aseer Central Hospital — Abha",
] as const;
const SCOPING_HOSPITALS = ["KAMC-RYD", "KFSH-RYD", "NGH-JED", "MOH-DMM", "KAUH-JED"] as const;
type HospitalId = typeof SCOPING_HOSPITALS[number];
const KFMC = HOSPITALS[0];
const KKUH = HOSPITALS[2];

// ── Risk mirror of api-server calculateRiskScore (same weights) ──────────────
const HIGH_RISK = ["heart failure", "coronary artery disease", "chronic kidney disease", "ckd", "cirrhosis", "copd", "cancer"];
const MOD_RISK = ["hypertension", "diabetes", "hypothyroidism", "hyperthyroidism", "asthma", "atrial fibrillation", "stroke", "depression"];
function mirrorRisk(p: { dob: string; conditions: string[]; allergies: string[]; medCount: number; abnormalLabs: number; visitsLastYear: number }): number {
  let s = 0;
  const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
  if (age >= 75) s += 25; else if (age >= 60) s += 15; else if (age >= 45) s += 5;
  for (const c of p.conditions) {
    const n = c.toLowerCase();
    if (HIGH_RISK.some(h => n.includes(h))) s += 20;
    else if (MOD_RISK.some(m => n.includes(m))) s += 10;
  }
  if (p.medCount >= 5) s += 20; else if (p.medCount >= 3) s += 10;
  if (p.allergies.length >= 3) s += 10;
  if (p.abnormalLabs >= 3) s += 20; else if (p.abnormalLabs >= 1) s += 10;
  if (p.visitsLastYear >= 6) s += 15;
  return Math.min(s, 100);
}

async function reset() {
  await pool.query(`
    TRUNCATE TABLE
      audit_log, events, ai_decisions, alerts, lab_results, visits,
      medications, consent_records, appointments, claim_reviews, purchase_orders, patients,
      family_relationships
    RESTART IDENTITY CASCADE
  `);
  console.log("Database reset (identities restarted)");
}

async function seed() {
  console.log("Seeding SANAD demo environment...");
  await reset();

  // ════════════════════════════════════════════════════════════════════════════
  // THE CAST — ids 1–10 are scenario-engineered. Family relationships are wired
  // via family_relationships table (Sprint 2). Al-Ghamdi household (1–5) is
  // assigned to KAMC-RYD so dr.rashidi sees them after Sprint 3 hospital scoping.
  // ════════════════════════════════════════════════════════════════════════════
  type PatientSeed = typeof patientsTable.$inferInsert;
  const cast: PatientSeed[] = [
    { // id 1 — S1 flagship + citizen demo account (auth: citizen_demo / Mohammed Al-Ghamdi)
      nationalId: "1000000001", fullName: "محمد الغامدي", dateOfBirth: "1965-03-15", gender: "male", bloodType: "O+",
      hospitalId: "KAMC-RYD",
      phone: "+966501234567", emergencyContact: "فاطمة الغامدي (زوجة)", emergencyPhone: "+966501234568",
      chronicConditions: ["Hypertension", "Type 2 Diabetes", "Coronary Artery Disease"],
      allergies: ["Penicillin", "Sulfa drugs"], riskScore: 95,
    },
    { // id 2 — sister; shares T2DM (genetic-risk engine); has NOT granted family_linking (consent-gate demo)
      nationalId: "1000000002", fullName: "سعاد الغامدي", dateOfBirth: "1968-07-22", gender: "female", bloodType: "A+",
      hospitalId: "KAMC-RYD",
      phone: "+966502345678", emergencyContact: "محمد الغامدي (أخ)", emergencyPhone: "+966501234567",
      chronicConditions: ["Type 2 Diabetes", "Hypothyroidism"], allergies: ["Latex"], riskScore: 45,
    },
    { // id 3 — brother; S2 interaction + S3 emergency patient
      nationalId: "1000000003", fullName: "خالد الغامدي", dateOfBirth: "1958-11-08", gender: "male", bloodType: "B+",
      hospitalId: "KAMC-RYD",
      phone: "+966503456789", emergencyContact: "محمد الغامدي (أخ)", emergencyPhone: "+966501234567",
      chronicConditions: ["Heart Failure", "Atrial Fibrillation", "Chronic Kidney Disease", "Hypertension"],
      allergies: ["Iodine contrast", "Aspirin", "Codeine"], riskScore: 100,
    },
    { // id 4 — son, healthy (family tree contrast)
      nationalId: "1000000004", fullName: "عبدالرحمن الغامدي", dateOfBirth: "1993-04-17", gender: "male", bloodType: "O+",
      hospitalId: "KAMC-RYD",
      phone: "+966504567890", emergencyContact: "محمد الغامدي (أب)", emergencyPhone: "+966501234567",
      chronicConditions: [], allergies: [], riskScore: 0,
    },
    { // id 5 — daughter, healthy; her wellness visit TODAY feeds admin "visits today"
      nationalId: "1000000005", fullName: "نورة الغامدي", dateOfBirth: "1997-12-25", gender: "female", bloodType: "O+",
      hospitalId: "KAMC-RYD",
      phone: "+966505678901", emergencyContact: "محمد الغامدي (أب)", emergencyPhone: "+966501234567",
      chronicConditions: [], allergies: [], riskScore: 0,
    },
    { // id 6 — S2b: live CRITICAL interaction (Tramadol → serotonin syndrome on Fluoxetine)
      nationalId: "1000000006", fullName: "سارة العتيبي", dateOfBirth: "1985-06-30", gender: "female", bloodType: "O-",
      phone: "+966506789012", emergencyContact: "عمر العتيبي", emergencyPhone: "+966506789013",
      chronicConditions: ["Depression", "Migraine"], allergies: [], riskScore: 30,
    },
    { // id 7 — S7: engineered claim-anomaly pattern (4 ER / 4 hospitals / rapid cycling)
      nationalId: "1000000007", fullName: "سعد العنزي", dateOfBirth: "1979-02-11", gender: "male", bloodType: "B-",
      phone: "+966507890123", emergencyContact: "منيرة العنزي", emergencyPhone: "+966507890124",
      chronicConditions: ["Hypertension"], allergies: [], riskScore: 25,
    },
    { // id 8 — S4/S7: revoked insurance consent → insurer gets 403 CONSENT_REVOKED
      nationalId: "1000000008", fullName: "لطيفة الحربي", dateOfBirth: "1990-09-02", gender: "female", bloodType: "A+",
      phone: "+966508901234", emergencyContact: "بندر الحربي", emergencyPhone: "+966508901235",
      chronicConditions: ["Asthma"], allergies: ["Aspirin"], riskScore: 20,
    },
    { // id 9 — frailty/critical patient: tops every risk queue; rich emergency actions
      nationalId: "1000000009", fullName: "يوسف العتيبي", dateOfBirth: "1943-08-30", gender: "male", bloodType: "O+",
      phone: "+966509012345", emergencyContact: "منى العتيبي", emergencyPhone: "+966509012346",
      chronicConditions: ["Heart Failure", "COPD", "Type 2 Diabetes", "Hypertension"],
      allergies: ["Penicillin", "Sulfa drugs", "Iodine contrast"], riskScore: 100,
    },
    { // id 10 — young healthy contrast; second visit TODAY
      nationalId: "1000000010", fullName: "ريم الشمري", dateOfBirth: "2001-05-19", gender: "female", bloodType: "AB+",
      phone: "+966510123456", emergencyContact: "نواف الشمري", emergencyPhone: "+966510123457",
      chronicConditions: [], allergies: [], riskScore: 0,
    },
  ];

  // ── Background population (ids 11–50) — deterministic archetypes ────────────
  const MALE_NAMES = ["أحمد", "فهد", "سلطان", "ناصر", "بندر", "تركي", "فيصل", "ماجد", "وليد", "إبراهيم", "عمر", "حسن", "طلال", "راكان", "نواف", "سامي", "عادل", "مشعل", "بدر", "جابر"];
  const FEMALE_NAMES = ["فاطمة", "هند", "عائشة", "دانة", "جواهر", "منيرة", "أمل", "هيفاء", "شهد", "غادة", "لمى", "رهف", "وعد", "العنود", "بشاير", "نوف", "أريج", "سلمى", "مها", "ريما"];
  const FAMILIES = ["القحطاني", "الحربي", "الزهراني", "الشهري", "الدوسري", "المطيري", "الشمري", "العنزي", "السبيعي", "البقمي", "الرشيدي", "المالكي", "اليامي", "الجهني"];
  const BLOOD = ["O+", "O+", "A+", "A+", "B+", "O-", "AB+", "A-", "B-", "AB-"] as const;

  // archetype: [conditions, allergyPool, birthYearRange]
  const ARCHETYPES: Array<{ conditions: string[]; allergies: string[]; born: [number, number]; weight: number }> = [
    { conditions: [], allergies: [], born: [1985, 2004], weight: 12 },
    { conditions: ["Hypertension"], allergies: [], born: [1960, 1985], weight: 7 },
    { conditions: ["Type 2 Diabetes"], allergies: ["Penicillin"], born: [1955, 1985], weight: 6 },
    { conditions: ["Asthma"], allergies: [], born: [1975, 2000], weight: 4 },
    { conditions: ["Hypothyroidism"], allergies: [], born: [1965, 1995], weight: 3 },
    { conditions: ["Hypertension", "Type 2 Diabetes"], allergies: ["Sulfa drugs"], born: [1950, 1975], weight: 4 },
    { conditions: ["Hypertension", "Hypercholesterolemia"], allergies: [], born: [1955, 1975], weight: 2 },
    { conditions: ["Chronic Kidney Disease", "Hypertension"], allergies: ["Ibuprofen", "NSAIDs"], born: [1945, 1965], weight: 1 },
    { conditions: ["COPD", "Hypertension"], allergies: ["Penicillin"], born: [1945, 1962], weight: 1 },
  ];
  const archetypeBag = ARCHETYPES.flatMap((a, i) => Array(a.weight).fill(i) as number[]);

  const background: PatientSeed[] = [];
  for (let i = 11; i <= 50; i++) {
    const male = rand() < 0.5;
    const archetype = ARCHETYPES[pick(archetypeBag)]!;
    const born = randInt(archetype.born[0], archetype.born[1]);
    const dob = `${born}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;
    const first = male ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    background.push({
      nationalId: `10000000${String(i).padStart(2, "0")}`,
      fullName: `${first} ${pick(FAMILIES)}`,
      dateOfBirth: dob,
      gender: male ? "male" : "female",
      bloodType: pick(BLOOD), hospitalId: pick(SCOPING_HOSPITALS),
      phone: `+9665${String(randInt(10000000, 99999999))}`,
      emergencyContact: male ? pick(FEMALE_NAMES) : pick(MALE_NAMES),
      emergencyPhone: `+9665${String(randInt(10000000, 99999999))}`,
      chronicConditions: archetype.conditions,
      allergies: archetype.allergies,
      riskScore: 0, // computed after labs/visits below
    });
  }

  const patients = await db.insert(patientsTable).values([...cast, ...background]).returning();
  const id = (idx: number) => patients[idx - 1]!.id; // 1-based cast index → DB id
  console.log(`Inserted ${patients.length} patients`);

  const staffAssignments = [
    { username: "dr.rashidi", hospitalId: "KAMC-RYD", role: "doctor" },
    { username: "emergency_unit7", hospitalId: "KAMC-RYD", role: "emergency" },
  ];
  await db.insert(staffAssignmentsTable).values(staffAssignments).onConflictDoNothing();
  console.log(`Inserted ${staffAssignments.length} staff assignments`);

  // ════════════════════════════════════════════════════════════════════════════
  // MEDICATIONS — every drug here is deliberate (engines key on names)
  // ════════════════════════════════════════════════════════════════════════════
  type MedSeed = typeof medicationsTable.$inferInsert;
  const meds: MedSeed[] = [
    // محمد (1): 5 active → polypharmacy factor; aspirin+metformin drive emergency holds
    { patientId: id(1), drugName: "Metformin", dosage: "1000mg", frequency: "Twice daily", prescribedBy: "Dr. Khalid Al-Rashid", hospital: KFMC, startDate: daysAgo(900), isActive: true },
    { patientId: id(1), drugName: "Atorvastatin", dosage: "40mg", frequency: "Once daily at night", prescribedBy: "Dr. Khalid Al-Rashid", hospital: KFMC, startDate: daysAgo(900), isActive: true },
    { patientId: id(1), drugName: "Amlodipine", dosage: "10mg", frequency: "Once daily", prescribedBy: "Dr. Reem Al-Saud", hospital: HOSPITALS[4], startDate: daysAgo(1400), isActive: true },
    { patientId: id(1), drugName: "Aspirin", dosage: "81mg", frequency: "Once daily", prescribedBy: "Dr. Reem Al-Saud", hospital: HOSPITALS[4], startDate: daysAgo(1400), isActive: true },
    { patientId: id(1), drugName: "Lisinopril", dosage: "10mg", frequency: "Once daily", prescribedBy: "Dr. Reem Al-Saud", hospital: HOSPITALS[4], startDate: daysAgo(800), isActive: true },
    // سعاد (2)
    { patientId: id(2), drugName: "Metformin", dosage: "500mg", frequency: "Twice daily", prescribedBy: "Dr. Samia Al-Qahtani", hospital: HOSPITALS[3], startDate: daysAgo(700), isActive: true },
    { patientId: id(2), drugName: "Levothyroxine", dosage: "100mcg", frequency: "Once daily, fasting", prescribedBy: "Dr. Samia Al-Qahtani", hospital: HOSPITALS[3], startDate: daysAgo(1100), isActive: true },
    // خالد (3): Warfarin + Amiodarone = the standing CRITICAL interaction
    { patientId: id(3), drugName: "Warfarin", dosage: "5mg", frequency: "Once daily", prescribedBy: "Dr. Hassan Al-Otaibi", hospital: KKUH, startDate: daysAgo(600), isActive: true },
    { patientId: id(3), drugName: "Amiodarone", dosage: "200mg", frequency: "Once daily", prescribedBy: "Dr. Tariq Al-Ghamdi", hospital: HOSPITALS[3], startDate: daysAgo(120), isActive: true },
    { patientId: id(3), drugName: "Carvedilol", dosage: "12.5mg", frequency: "Twice daily", prescribedBy: "Dr. Hassan Al-Otaibi", hospital: KKUH, startDate: daysAgo(600), isActive: true },
    { patientId: id(3), drugName: "Furosemide", dosage: "40mg", frequency: "Once daily", prescribedBy: "Dr. Hassan Al-Otaibi", hospital: KKUH, startDate: daysAgo(600), isActive: true },
    { patientId: id(3), drugName: "Atorvastatin", dosage: "20mg", frequency: "Once daily at night", prescribedBy: "Dr. Hassan Al-Otaibi", hospital: KKUH, startDate: daysAgo(400), isActive: true },
    // سارة (6): Fluoxetine on board → live Tramadol check = CRITICAL serotonin syndrome
    { patientId: id(6), drugName: "Fluoxetine", dosage: "20mg", frequency: "Once daily", prescribedBy: "Dr. Joud Al-Jaber", hospital: HOSPITALS[3], startDate: daysAgo(300), isActive: true },
    { patientId: id(6), drugName: "Propranolol", dosage: "40mg", frequency: "As needed for migraine", prescribedBy: "Dr. Joud Al-Jaber", hospital: HOSPITALS[3], startDate: daysAgo(300), isActive: true },
    // سعد (7): modest meds — fraud signal comes from the claim pattern, not pills
    { patientId: id(7), drugName: "Amlodipine", dosage: "5mg", frequency: "Once daily", prescribedBy: "Dr. Walid Al-Anzi", hospital: KFMC, startDate: daysAgo(500), isActive: true },
    // لطيفة (8)
    { patientId: id(8), drugName: "Salbutamol Inhaler", dosage: "100mcg/dose", frequency: "As needed", prescribedBy: "Dr. Ahmad Al-Ghamdi", hospital: HOSPITALS[6], startDate: daysAgo(420), isActive: true },
    // يوسف (9): 6 active incl. Digoxin + Insulin → dense emergency action set
    { patientId: id(9), drugName: "Insulin Glargine", dosage: "20 units", frequency: "Once daily at bedtime", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(2000), isActive: true },
    { patientId: id(9), drugName: "Digoxin", dosage: "0.125mg", frequency: "Once daily", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(700), isActive: true },
    { patientId: id(9), drugName: "Bisoprolol", dosage: "2.5mg", frequency: "Once daily", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(700), isActive: true },
    { patientId: id(9), drugName: "Furosemide", dosage: "40mg", frequency: "Twice daily", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(400), isActive: true },
    { patientId: id(9), drugName: "Tiotropium Inhaler", dosage: "18mcg", frequency: "Once daily", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(1500), isActive: true },
    { patientId: id(9), drugName: "Metformin", dosage: "500mg", frequency: "Twice daily", prescribedBy: "Dr. Basma Al-Sulami", hospital: HOSPITALS[1], startDate: daysAgo(2200), isActive: true },
  ];

  // Background meds: condition-appropriate, 0–2 each. One HTN+chol patient gets
  // Simvastatin + Amlodipine — a real moderate interaction the matrix can show.
  const CONDITION_MEDS: Record<string, Array<[string, string, string]>> = {
    "Hypertension": [["Amlodipine", "5mg", "Once daily"], ["Lisinopril", "10mg", "Once daily"], ["Valsartan", "80mg", "Once daily"]],
    "Type 2 Diabetes": [["Metformin", "500mg", "Twice daily"], ["Sitagliptin", "100mg", "Once daily"]],
    "Asthma": [["Salbutamol Inhaler", "100mcg/dose", "As needed"], ["Budesonide Inhaler", "200mcg", "Twice daily"]],
    "Hypothyroidism": [["Levothyroxine", "75mcg", "Once daily, fasting"]],
    "Hypercholesterolemia": [["Simvastatin", "20mg", "Once daily at night"]],
    "Chronic Kidney Disease": [["Furosemide", "20mg", "Once daily"]],
    "COPD": [["Tiotropium Inhaler", "18mcg", "Once daily"]],
  };
  const DOCTORS = ["Dr. Khalid Al-Rashid", "Dr. Reem Al-Saud", "Dr. Hassan Al-Otaibi", "Dr. Samia Al-Qahtani", "Dr. Basma Al-Sulami", "Dr. Walid Al-Anzi", "Dr. Nadia Al-Harbi", "Dr. Fahad Al-Jaber"];
  for (let i = 11; i <= 50; i++) {
    const p = patients[i - 1]!;
    for (const cond of p.chronicConditions ?? []) {
      const options = CONDITION_MEDS[cond];
      if (!options) continue;
      const [drugName, dosage, frequency] = pick(options);
      meds.push({ patientId: p.id, drugName, dosage, frequency, prescribedBy: pick(DOCTORS), hospital: pick(HOSPITALS), startDate: daysAgo(randInt(90, 900)), isActive: true });
    }
  }
  await db.insert(medicationsTable).values(meds);
  console.log(`Inserted ${meds.length} medications`);

  // ════════════════════════════════════════════════════════════════════════════
  // VISITS — relative dates; the cast's patterns drive engine windows
  // ════════════════════════════════════════════════════════════════════════════
  type VisitSeed = typeof visitsTable.$inferInsert;
  const visits: VisitSeed[] = [
    // محمد (1): recent ER for hypertensive urgency → cardiology referral story
    { patientId: id(1), visitDate: daysAgo(10), hospital: KFMC, department: "Endocrinology", doctor: "Dr. Khalid Al-Rashid", diagnosis: "Type 2 Diabetes follow-up. HbA1c 7.8% — above 7.0% target despite metformin titration.", visitType: "follow-up", notes: "Reinforced dietary counseling. Consider adding SGLT2 inhibitor at next review." },
    { patientId: id(1), visitDate: daysAgo(21), hospital: KFMC, department: "Emergency", doctor: "Dr. Turki Al-Dosari", diagnosis: "Hypertensive urgency — BP 196/112 with headache. Managed with IV labetalol, observed 6h, discharged.", visitType: "emergency" },
    { patientId: id(1), visitDate: daysAgo(95), hospital: HOSPITALS[4], department: "Cardiology", doctor: "Dr. Reem Al-Saud", diagnosis: "Stable angina on exertion. Nuclear stress test booked. Continue aspirin + statin.", visitType: "outpatient" },
    { patientId: id(1), visitDate: daysAgo(240), hospital: KFMC, department: "Endocrinology", doctor: "Dr. Khalid Al-Rashid", diagnosis: "Type 2 Diabetes annual review. HbA1c 8.4% — control deteriorating.", visitType: "outpatient" },
    // سعاد (2)
    { patientId: id(2), visitDate: daysAgo(30), hospital: HOSPITALS[3], department: "Endocrinology", doctor: "Dr. Samia Al-Qahtani", diagnosis: "T2DM + hypothyroidism review. HbA1c 7.9%. TSH in range.", visitType: "follow-up" },
    { patientId: id(2), visitDate: daysAgo(200), hospital: HOSPITALS[3], department: "Endocrinology", doctor: "Dr. Samia Al-Qahtani", diagnosis: "Routine thyroid panel — stable on levothyroxine 100mcg.", visitType: "outpatient" },
    // خالد (3): escalating pattern — 4 visits in 3 months, 2 emergencies in 6 months
    { patientId: id(3), visitDate: daysAgo(4), hospital: KKUH, department: "Cardiology", doctor: "Dr. Hassan Al-Otaibi", diagnosis: "Post-discharge HF review. INR 3.8 — supratherapeutic on amiodarone. Warfarin dose reduced 30%.", visitType: "follow-up" },
    { patientId: id(3), visitDate: daysAgo(12), hospital: KKUH, department: "Emergency", doctor: "Dr. Layla Al-Harbi", diagnosis: "Acute decompensated heart failure — IV furosemide 80mg, admitted 48h. Echo EF 32%.", visitType: "emergency" },
    { patientId: id(3), visitDate: daysAgo(40), hospital: KKUH, department: "Nephrology", doctor: "Dr. Saad Al-Bishi", diagnosis: "CKD Stage 3b — eGFR 38 and declining. Nephrotoxin review completed.", visitType: "outpatient" },
    { patientId: id(3), visitDate: daysAgo(75), hospital: KKUH, department: "Emergency", doctor: "Dr. Layla Al-Harbi", diagnosis: "Atrial fibrillation with rapid ventricular response — rate controlled, amiodarone continued.", visitType: "emergency" },
    { patientId: id(3), visitDate: daysAgo(130), hospital: HOSPITALS[3], department: "Cardiology", doctor: "Dr. Tariq Al-Ghamdi", diagnosis: "AF follow-up. Amiodarone initiated — warfarin interaction counselling given.", visitType: "outpatient" },
    // نورة (5) + ريم (10): wellness checks TODAY → admin "visits today" is real
    { patientId: id(5), visitDate: daysAgo(0), hospital: KFMC, department: "General Medicine", doctor: "Dr. Ahmad Al-Yami", diagnosis: "Annual wellness check — all parameters within normal limits.", visitType: "outpatient" },
    { patientId: id(10), visitDate: daysAgo(0), hospital: HOSPITALS[6], department: "General Medicine", doctor: "Dr. Nadia Al-Harbi", diagnosis: "Pre-employment health screening — fit, no abnormalities.", visitType: "outpatient" },
    // سارة (6)
    { patientId: id(6), visitDate: daysAgo(15), hospital: HOSPITALS[3], department: "Neurology", doctor: "Dr. Joud Al-Jaber", diagnosis: "Migraine — increasing frequency (4/month). Propranolol prophylaxis reviewed. Analgesic options discussed.", visitType: "outpatient" },
    { patientId: id(6), visitDate: daysAgo(120), hospital: HOSPITALS[3], department: "Psychiatry", doctor: "Dr. Joud Al-Jaber", diagnosis: "Depression — responding to fluoxetine 20mg. PHQ-9 down from 16 to 8.", visitType: "follow-up" },
    // سعد (7): THE claim-anomaly pattern — 4 ER across 4 hospitals, two visits 2 days apart
    { patientId: id(7), visitDate: daysAgo(8), hospital: KFMC, department: "Emergency", doctor: "Dr. Omar Al-Sulami", diagnosis: "Acute lower back pain — examination unremarkable, discharged with analgesia.", visitType: "emergency" },
    { patientId: id(7), visitDate: daysAgo(10), hospital: HOSPITALS[1], department: "Emergency", doctor: "Dr. Rima Al-Rashidi", diagnosis: "Chest pain — troponin negative ×2, ECG normal, discharged.", visitType: "emergency" },
    { patientId: id(7), visitDate: daysAgo(34), hospital: HOSPITALS[5], department: "Emergency", doctor: "Dr. Khalid Al-Mutairi", diagnosis: "Severe headache — CT normal, discharged.", visitType: "emergency" },
    { patientId: id(7), visitDate: daysAgo(60), hospital: HOSPITALS[7], department: "Emergency", doctor: "Dr. Majed Al-Shehri", diagnosis: "Abdominal pain — labs and ultrasound unremarkable, discharged.", visitType: "emergency" },
    { patientId: id(7), visitDate: daysAgo(80), hospital: KFMC, department: "Orthopedics", doctor: "Dr. Walid Al-Anzi", diagnosis: "Chronic back pain — inpatient admission for pain management.", visitType: "inpatient" },
    // لطيفة (8)
    { patientId: id(8), visitDate: daysAgo(50), hospital: HOSPITALS[6], department: "Pulmonology", doctor: "Dr. Ahmad Al-Ghamdi", diagnosis: "Asthma — mild persistent, well controlled on current inhaler.", visitType: "outpatient" },
    // يوسف (9): inpatient 3 days ago — COPD exacerbation; frailty story
    { patientId: id(9), visitDate: daysAgo(3), hospital: HOSPITALS[1], department: "Pulmonology", doctor: "Dr. Basma Al-Sulami", diagnosis: "COPD exacerbation with hypoxia (SpO2 87%) — admitted, oral prednisolone + azithromycin started.", visitType: "inpatient" },
    { patientId: id(9), visitDate: daysAgo(20), hospital: HOSPITALS[1], department: "Endocrinology", doctor: "Dr. Fahad Al-Jaber", diagnosis: "T2DM — HbA1c 9.2%, poor control. Insulin titrated upward.", visitType: "outpatient" },
    { patientId: id(9), visitDate: daysAgo(55), hospital: HOSPITALS[1], department: "Emergency", doctor: "Dr. Rima Al-Rashidi", diagnosis: "Acute dyspnea — decompensated HF vs COPD. Diuresed and discharged after observation.", visitType: "emergency" },
  ];

  // Background visits: 1–4 per patient spread over 12 months (monthly trend data)
  const DEPT_BY_COND: Record<string, string> = {
    "Hypertension": "Cardiology", "Type 2 Diabetes": "Endocrinology", "Asthma": "Pulmonology",
    "Hypothyroidism": "Endocrinology", "Hypercholesterolemia": "Cardiology",
    "Chronic Kidney Disease": "Nephrology", "COPD": "Pulmonology",
  };
  const ROUTINE_DX: Record<string, string[]> = {
    "Cardiology": ["Blood pressure review — regimen adjusted.", "Lipid panel review — statin continued.", "Stable cardiovascular status."],
    "Endocrinology": ["Diabetes follow-up — medication adherence reviewed.", "Thyroid function stable on current dose.", "Glycemic control reviewed with dietitian referral."],
    "Pulmonology": ["Inhaler technique reviewed — symptoms controlled.", "Spirometry stable versus prior year.", "Seasonal exacerbation plan updated."],
    "Nephrology": ["Renal function monitoring — stable eGFR.", "Blood pressure target review for renal protection."],
    "General Medicine": ["Annual wellness check — parameters within normal limits.", "Routine screening visit — no acute findings."],
  };
  const visitCountByPatient = new Map<number, number>();
  for (let i = 11; i <= 50; i++) {
    const p = patients[i - 1]!;
    const conds = p.chronicConditions ?? [];
    const nVisits = conds.length === 0 ? randInt(0, 1) : randInt(1, 4);
    visitCountByPatient.set(p.id, nVisits);
    for (let v = 0; v < nVisits; v++) {
      const dept = conds.length ? (DEPT_BY_COND[pick(conds)] ?? "General Medicine") : "General Medicine";
      const emergency = conds.length >= 2 && rand() < 0.2;
      visits.push({
        patientId: p.id,
        visitDate: daysAgo(randInt(1, 360)),
        hospital: pick(HOSPITALS),
        department: emergency ? "Emergency" : dept,
        doctor: pick(DOCTORS),
        diagnosis: emergency ? "Emergency presentation — assessed, stabilized, and discharged with follow-up plan." : pick(ROUTINE_DX[dept] ?? ROUTINE_DX["General Medicine"]!),
        visitType: emergency ? "emergency" : pick(["outpatient", "outpatient", "follow-up"]),
      });
    }
  }
  await db.insert(visitsTable).values(visits);
  console.log(`Inserted ${visits.length} visits`);

  // ════════════════════════════════════════════════════════════════════════════
  // LAB RESULTS — status always matches value vs reference range
  // ════════════════════════════════════════════════════════════════════════════
  type LabSeed = typeof labResultsTable.$inferInsert;
  const labs: LabSeed[] = [
    // محمد (1): HbA1c persistently abnormal across 3 tests → deterioration prediction
    { patientId: id(1), testName: "HbA1c", testDate: daysAgo(10), result: "7.8", unit: "%", referenceRange: "< 7.0", status: "abnormal", hospital: KFMC, notes: "Above target. Improving from 8.4% after metformin titration." },
    { patientId: id(1), testName: "HbA1c", testDate: daysAgo(120), result: "8.1", unit: "%", referenceRange: "< 7.0", status: "abnormal", hospital: KFMC },
    { patientId: id(1), testName: "HbA1c", testDate: daysAgo(240), result: "8.4", unit: "%", referenceRange: "< 7.0", status: "abnormal", hospital: KFMC },
    { patientId: id(1), testName: "Fasting Blood Glucose", testDate: daysAgo(10), result: "138", unit: "mg/dL", referenceRange: "70-100", status: "abnormal", hospital: KFMC },
    { patientId: id(1), testName: "LDL Cholesterol", testDate: daysAgo(95), result: "2.1", unit: "mmol/L", referenceRange: "< 1.8 (CAD target)", status: "abnormal", hospital: HOSPITALS[4] },
    { patientId: id(1), testName: "Creatinine", testDate: daysAgo(95), result: "88", unit: "umol/L", referenceRange: "62-106", status: "normal", hospital: HOSPITALS[4] },
    { patientId: id(1), testName: "eGFR", testDate: daysAgo(95), result: "72", unit: "mL/min/1.73m²", referenceRange: "> 60", status: "normal", hospital: HOSPITALS[4] },
    // سعاد (2)
    { patientId: id(2), testName: "HbA1c", testDate: daysAgo(30), result: "7.9", unit: "%", referenceRange: "< 7.0", status: "abnormal", hospital: HOSPITALS[3] },
    { patientId: id(2), testName: "TSH", testDate: daysAgo(30), result: "2.8", unit: "mIU/L", referenceRange: "0.4-4.0", status: "normal", hospital: HOSPITALS[3] },
    // خالد (3): INR critical (amiodarone potentiation) + BNP critical + rising creatinine (29% → CKD progression)
    { patientId: id(3), testName: "INR", testDate: daysAgo(2), result: "3.8", unit: "", referenceRange: "2.0-3.0", status: "critical", hospital: KKUH, notes: "Supratherapeutic — consistent with amiodarone potentiation of warfarin. Dose reduced." },
    { patientId: id(3), testName: "BNP", testDate: daysAgo(5), result: "1240", unit: "pg/mL", referenceRange: "< 100", status: "critical", hospital: KKUH, notes: "Consistent with decompensated heart failure." },
    { patientId: id(3), testName: "Potassium", testDate: daysAgo(5), result: "5.4", unit: "mmol/L", referenceRange: "3.5-5.0", status: "abnormal", hospital: KKUH },
    { patientId: id(3), testName: "Creatinine", testDate: daysAgo(5), result: "171", unit: "umol/L", referenceRange: "62-106", status: "abnormal", hospital: KKUH, notes: "Rising trend — CKD progression." },
    { patientId: id(3), testName: "Creatinine", testDate: daysAgo(60), result: "158", unit: "umol/L", referenceRange: "62-106", status: "abnormal", hospital: KKUH },
    { patientId: id(3), testName: "Creatinine", testDate: daysAgo(150), result: "132", unit: "umol/L", referenceRange: "62-106", status: "abnormal", hospital: KKUH },
    { patientId: id(3), testName: "eGFR", testDate: daysAgo(5), result: "38", unit: "mL/min/1.73m²", referenceRange: "> 60", status: "abnormal", hospital: KKUH },
    // سارة (6)
    { patientId: id(6), testName: "CBC", testDate: daysAgo(120), result: "Normal", unit: "", referenceRange: "—", status: "normal", hospital: HOSPITALS[3] },
    // يوسف (9): three criticals 3 days ago — tops the alert board honestly
    { patientId: id(9), testName: "SpO2", testDate: daysAgo(3), result: "87", unit: "%", referenceRange: "> 95", status: "critical", hospital: HOSPITALS[1], notes: "On admission — COPD exacerbation." },
    { patientId: id(9), testName: "HbA1c", testDate: daysAgo(3), result: "9.2", unit: "%", referenceRange: "< 7.0", status: "critical", hospital: HOSPITALS[1], notes: "Severely uncontrolled." },
    { patientId: id(9), testName: "BNP", testDate: daysAgo(3), result: "1850", unit: "pg/mL", referenceRange: "< 100", status: "critical", hospital: HOSPITALS[1] },
    { patientId: id(9), testName: "Creatinine", testDate: daysAgo(3), result: "142", unit: "umol/L", referenceRange: "62-106", status: "abnormal", hospital: HOSPITALS[1] },
    // نورة (5) + ريم (10): clean panels from today's wellness visits
    { patientId: id(5), testName: "CBC", testDate: daysAgo(0), result: "Normal", unit: "", referenceRange: "—", status: "normal", hospital: KFMC },
    { patientId: id(10), testName: "CBC", testDate: daysAgo(0), result: "Normal", unit: "", referenceRange: "—", status: "normal", hospital: HOSPITALS[6] },
  ];

  // Background labs: condition-consistent values
  for (let i = 11; i <= 50; i++) {
    const p = patients[i - 1]!;
    const conds = p.chronicConditions ?? [];
    for (const cond of conds) {
      if (cond === "Type 2 Diabetes") {
        const val = (randInt(66, 92) / 10).toFixed(1); // 6.6–9.2
        labs.push({ patientId: p.id, testName: "HbA1c", testDate: daysAgo(randInt(5, 200)), result: val, unit: "%", referenceRange: "< 7.0", status: parseFloat(val) >= 9 ? "critical" : parseFloat(val) > 7 ? "abnormal" : "normal", hospital: pick(HOSPITALS) });
      } else if (cond === "Hypothyroidism") {
        const val = (randInt(8, 60) / 10).toFixed(1); // 0.8–6.0
        labs.push({ patientId: p.id, testName: "TSH", testDate: daysAgo(randInt(5, 200)), result: val, unit: "mIU/L", referenceRange: "0.4-4.0", status: parseFloat(val) > 4 ? "abnormal" : "normal", hospital: pick(HOSPITALS) });
      } else if (cond === "Chronic Kidney Disease") {
        const val = String(randInt(130, 290));
        labs.push({ patientId: p.id, testName: "Creatinine", testDate: daysAgo(randInt(5, 120)), result: val, unit: "umol/L", referenceRange: "62-106", status: parseInt(val) >= 250 ? "critical" : "abnormal", hospital: pick(HOSPITALS) });
      } else if (cond === "Hypercholesterolemia") {
        const val = (randInt(20, 42) / 10).toFixed(1);
        labs.push({ patientId: p.id, testName: "LDL Cholesterol", testDate: daysAgo(randInt(5, 250)), result: val, unit: "mmol/L", referenceRange: "< 2.6", status: parseFloat(val) > 2.6 ? "abnormal" : "normal", hospital: pick(HOSPITALS) });
      } else if (cond === "COPD") {
        const val = String(randInt(89, 96));
        labs.push({ patientId: p.id, testName: "SpO2", testDate: daysAgo(randInt(5, 150)), result: val, unit: "%", referenceRange: "> 95", status: parseInt(val) < 92 ? "abnormal" : "normal", hospital: pick(HOSPITALS) });
      }
    }
  }
  const insertedLabs = await db.insert(labResultsTable).values(labs).returning();
  console.log(`Inserted ${insertedLabs.length} lab results`);

  // ── Recompute stored riskScore with the API's own weights ───────────────────
  const scoreById = new Map<number, number>();
  for (const p of patients) {
    const pMeds = meds.filter(m => m.patientId === p.id && m.isActive).length;
    const pLabs = insertedLabs.filter(l => l.patientId === p.id);
    // mirror "recent 10" window — all our labs are within a year
    const abnormal = pLabs.slice(0, 10).filter(l => l.status !== "normal").length;
    const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const pVisits = visits.filter(v => v.patientId === p.id && new Date(v.visitDate) >= yearAgo).length;
    const score = mirrorRisk({
      dob: p.dateOfBirth,
      conditions: p.chronicConditions ?? [],
      allergies: p.allergies ?? [],
      medCount: pMeds,
      abnormalLabs: abnormal,
      visitsLastYear: pVisits,
    });
    scoreById.set(p.id, score);
    await pool.query("UPDATE patients SET risk_score = $1 WHERE id = $2", [score, p.id]);
  }
  console.log("Risk scores recomputed with engine weights");

  // ════════════════════════════════════════════════════════════════════════════
  // ALERTS — every alert corresponds to a seeded lab or medication above
  // ════════════════════════════════════════════════════════════════════════════
  type AlertSeed = typeof alertsTable.$inferInsert;
  const alerts: AlertSeed[] = [
    { patientId: id(3), alertType: "drug-interaction", severity: "critical", title: "CRITICAL: Warfarin + Amiodarone Interaction", message: "Amiodarone potentiates warfarin anticoagulation (INR can rise 30–50%). INR measured 3.8 on " + daysAgo(2) + ". Warfarin dose reduced 30% — recheck INR in 3 days.", isRead: false },
    { patientId: id(3), alertType: "critical-lab", severity: "critical", title: "Critical INR: 3.8", message: "INR 3.8 (target 2.0–3.0) — supratherapeutic anticoagulation with active amiodarone co-prescription. Bleeding risk elevated.", isRead: false },
    { patientId: id(3), alertType: "critical-lab", severity: "critical", title: "Critical BNP: 1240 pg/mL", message: "BNP markedly elevated — consistent with decompensated heart failure. Cardiology follow-up completed " + daysAgo(4) + ".", isRead: false },
    { patientId: id(9), alertType: "critical-lab", severity: "critical", title: "Critical SpO2: 87%", message: "Oxygen saturation critically low on admission — COPD exacerbation. Supplemental oxygen initiated.", isRead: false },
    { patientId: id(9), alertType: "critical-lab", severity: "critical", title: "Critical HbA1c: 9.2%", message: "Severely uncontrolled diabetes. Insulin titrated on " + daysAgo(20) + " — repeat HbA1c in 3 months.", isRead: false },
    { patientId: id(1), alertType: "risk-score", severity: "high", title: "Critical Risk Score", message: "Multi-factor risk: CAD + uncontrolled T2DM + polypharmacy (5 active medications) + recent hypertensive emergency. Care coordinator assessment recommended.", isRead: true },
    { patientId: id(1), alertType: "predictive", severity: "moderate", title: "Predictive Alert: Cardiovascular Risk", message: "Three major cardiovascular risk factors present (hypertension, diabetes, CAD) with HbA1c above target — elevated 5-year MACE risk. Cardiology review scheduled.", isRead: false },
    { patientId: id(2), alertType: "predictive", severity: "moderate", title: "HbA1c Above Target: 7.9%", message: "Glycemic control above the 7.0% target. Dietitian referral and metformin dose review recommended.", isRead: true },
    // يوسف (9) — drug interactions backed by his actual active medications (Digoxin + Furosemide + Bisoprolol)
    { patientId: id(9), alertType: "drug-interaction", severity: "high", title: "Drug Interaction: Digoxin + Furosemide", message: "Furosemide-induced hypokalemia increases the risk of digoxin toxicity. Monitor serum potassium and digoxin levels; supplement potassium as needed.", isRead: true },
    { patientId: id(9), alertType: "drug-interaction", severity: "moderate", title: "Drug Interaction: Digoxin + Bisoprolol", message: "Additive negative chronotropic effect — risk of bradycardia and AV block. Monitor heart rate and ECG.", isRead: true },
  ];
  // Background: critical creatinine alerts for CKD patients whose labs are critical
  for (const lab of insertedLabs) {
    if (lab.status === "critical" && lab.testName === "Creatinine" && lab.patientId > id(10)) {
      alerts.push({ patientId: lab.patientId, alertType: "critical-lab", severity: "critical", title: `Critical Creatinine: ${lab.result} umol/L`, message: `Creatinine ${lab.result} umol/L — significant renal impairment. Nephrology review required.`, isRead: false });
    }
  }
  await db.insert(alertsTable).values(alerts);
  console.log(`Inserted ${alerts.length} alerts`);

  // ════════════════════════════════════════════════════════════════════════════
  // AI DECISIONS — historical decision log so the national dashboards (Ministry,
  // AI Control, Research) reflect a platform that has been OPERATING, not one
  // that just booted. Each row is derived from a real patient's risk profile
  // (same thresholds as the live decision engine) and backdated across ~10
  // months so the 12-month confidence-history chart is populated. The live
  // engine still appends NEW decisions during a demo (the counters tick up).
  // ════════════════════════════════════════════════════════════════════════════
  const levelOf = (s: number): "low" | "medium" | "high" | "critical" =>
    s >= 70 ? "critical" : s >= 50 ? "high" : s >= 25 ? "medium" : "low";
  const urgencyOf = (s: number): "routine" | "soon" | "urgent" | "immediate" =>
    s >= 80 ? "immediate" : s >= 60 ? "urgent" : s >= 35 ? "soon" : "routine";
  const actionOf = (u: string) =>
    u === "immediate" ? { action: "Immediate specialist referral and urgent care escalation required", window: "Act within 3 hours" }
    : u === "urgent" ? { action: "Specialist referral within 24–48 hours; optimize current treatment plan", window: "Within 24–48 hours" }
    : u === "soon" ? { action: "Schedule specialist consultation; review medications and lab trends", window: "Within 2 weeks" }
    : { action: "Continue routine monitoring; annual preventive screening", window: "Next routine appointment" };

  type DecisionSeed = typeof aiDecisionsTable.$inferInsert;
  const decisions: DecisionSeed[] = [];
  for (const p of patients) {
    const conds = p.chronicConditions ?? [];
    if (conds.length === 0) continue; // only patients with an active profile generate decisions
    const score = scoreById.get(p.id) ?? 0;
    const level = levelOf(score);
    const urgency = urgencyOf(score);
    const { action, window } = actionOf(urgency);
    // higher-acuity patients are reviewed more often
    const n = level === "critical" ? randInt(2, 4) : level === "high" ? randInt(1, 3) : randInt(1, 2);
    for (let k = 0; k < n; k++) {
      const created = new Date();
      created.setDate(created.getDate() - randInt(0, 300));
      decisions.push({
        patientId: p.id,
        riskScore: score,
        riskLevel: level,
        urgency,
        primaryAction: action,
        timeWindow: window,
        whyFactors: [
          { factor: conds[0] ? `Chronic condition: ${conds[0]}` : "Clinical profile", impact: level === "critical" || level === "high" ? "high" : "moderate", contribution: 20, description: "Primary driver of clinical risk requiring active management." },
          ...(conds.length >= 2 ? [{ factor: "Multiple comorbidities", impact: "high", contribution: 15, description: `${conds.length} concurrent chronic conditions compound risk.` }] : []),
        ],
        confidence: randInt(80, 95) / 100,
        source: "clinical_rules_v3",
        recommendations: [
          conds.some(c => c.toLowerCase().includes("diabetes")) ? "Glycemic optimization — target HbA1c < 7%" : "Maintain guideline-directed therapy",
          "Continue monitoring and preventive care schedule",
        ],
        digitalTwinProjection: null,
        behavioralFlags: null,
        createdAt: created,
      });
    }
  }
  await db.insert(aiDecisionsTable).values(decisions);
  console.log(`Inserted ${decisions.length} AI decisions`);

  // ════════════════════════════════════════════════════════════════════════════
  // PURCHASE ORDERS — Demo POs for Supply Chain module
  // ════════════════════════════════════════════════════════════════════════════
  const pos: (typeof purchaseOrdersTable.$inferInsert)[] = [
    {
      id: "PO-2026-0001",
      drugName: "Amiodarone",
      quantity: 500,
      supplier: "SaudiVax",
      status: "submitted",
    },
    {
      id: "PO-2026-0002",
      drugName: "Insulin Glargine",
      quantity: 2000,
      supplier: "SPIMACO",
      status: "confirmed",
    }
  ];
  await db.insert(purchaseOrdersTable).values(pos);
  console.log(`Inserted ${pos.length} purchase orders`);

  console.log("-----------------------------------------");

  // ════════════════════════════════════════════════════════════════════════════
  // CONSENTS — the consent module is load-bearing: family + insurance routes
  // enforce these records. Absence of a record = the definition default.
  // ════════════════════════════════════════════════════════════════════════════
  type ConsentSeed = typeof consentTable.$inferInsert;
  const consents: ConsentSeed[] = [
    // محمد (1): full profile; family_linking GRANTED → S6 works standalone.
    // research intentionally ABSENT → granted live during S4.
    { patientId: id(1), consentType: "data_sharing", purpose: "Allow SANAD Clinical Network to access medical records", grantedTo: "SANAD Clinical Network", granted: true, notes: "Granted at registration" },
    { patientId: id(1), consentType: "emergency_access", purpose: "Allow SRCA emergency access during medical emergency", grantedTo: "SRCA Emergency Services", granted: true, notes: "Granted at registration" },
    { patientId: id(1), consentType: "insurance", purpose: "Allow Tawuniya Insurance to access records for claims", grantedTo: "Tawuniya Insurance", granted: true, notes: "Granted at registration" },
    { patientId: id(1), consentType: "ai_processing", purpose: "Required: AI engines process data for risk scoring", grantedTo: "SANAD AI Division", granted: true, notes: "Platform requirement" },
    { patientId: id(1), consentType: "family_linking", purpose: "Link health record to family for genetic risk analysis", grantedTo: "SANAD Family Health Module", granted: true, notes: "Granted by patient for household genetic screening" },
    // سعاد (2): NO family_linking record → family portal shows the consent gate (default deny)
    { patientId: id(2), consentType: "data_sharing", purpose: "Allow SANAD Clinical Network to access medical records", grantedTo: "SANAD Clinical Network", granted: true, notes: "Granted at registration" },
    { patientId: id(2), consentType: "emergency_access", purpose: "Allow SRCA emergency access during medical emergency", grantedTo: "SRCA Emergency Services", granted: true, notes: "Granted at registration" },
    // خالد (3)
    { patientId: id(3), consentType: "data_sharing", purpose: "Allow SANAD Clinical Network to access medical records", grantedTo: "SANAD Clinical Network", granted: true, notes: "Granted at registration" },
    { patientId: id(3), consentType: "emergency_access", purpose: "Allow SRCA emergency access during medical emergency", grantedTo: "SRCA Emergency Services", granted: true, notes: "Granted at registration" },
    { patientId: id(3), consentType: "insurance", purpose: "Allow Tawuniya Insurance to access records for claims", grantedTo: "Tawuniya Insurance", granted: true, notes: "Granted at registration" },
    { patientId: id(3), consentType: "family_linking", purpose: "Link health record to family for genetic risk analysis", grantedTo: "SANAD Family Health Module", granted: true, notes: "Granted by patient" },
    // 4, 5, 6
    { patientId: id(4), consentType: "family_linking", purpose: "Link health record to family for genetic risk analysis", grantedTo: "SANAD Family Health Module", granted: true, notes: "Granted by patient" },
    { patientId: id(5), consentType: "family_linking", purpose: "Link health record to family for genetic risk analysis", grantedTo: "SANAD Family Health Module", granted: true, notes: "Granted by patient" },
    { patientId: id(6), consentType: "family_linking", purpose: "Link health record to family for genetic risk analysis", grantedTo: "SANAD Family Health Module", granted: true, notes: "Granted by patient" },
    // لطيفة (8): insurance REVOKED → insurer portal returns 403 CONSENT_REVOKED
    { patientId: id(8), consentType: "insurance", purpose: "Allow Tawuniya Insurance to access records for claims", grantedTo: "Tawuniya Insurance", granted: false, notes: "Revoked by patient — privacy preference" },
  ];
  // ~10 background research participants (real consent backing for the research portal)
  let researchCount = 0;
  for (let i = 11; i <= 50 && researchCount < 10; i += 4) {
    consents.push({ patientId: patients[i - 1]!.id, consentType: "research", purpose: "Anonymous data for national health research", grantedTo: "SANAD Research Division", granted: true, notes: "Opt-in via citizen portal" });
    researchCount++;
  }
  await db.insert(consentTable).values(consents);
  console.log(`Inserted ${consents.length} consent records`);

  // ════════════════════════════════════════════════════════════════════════════
  // APPOINTMENTS — citizen portal shows a real upcoming booking
  // ════════════════════════════════════════════════════════════════════════════
  const year = new Date().getFullYear();
  await db.insert(appointmentsTable).values([
    { patientId: id(1), patientName: "محمد الغامدي", patientNationalId: "1000000001", hospital: KFMC, department: "Cardiology", service: "Echocardiogram", appointmentDate: daysAhead(7), appointmentTime: "09:00", status: "confirmed", referenceNo: `APT-${year}-10417`, notes: "Pre-visit: avoid caffeine 4 hours before." },
    { patientId: id(1), patientName: "محمد الغامدي", patientNationalId: "1000000001", hospital: KFMC, department: "Endocrinology", service: "HbA1c Review", appointmentDate: daysAgo(10), appointmentTime: "10:30", status: "completed", referenceNo: `APT-${year}-09822`, completedAt: new Date(Date.now() - 10 * 86400000) },
    { patientId: id(2), patientName: "سعاد الغامدي", patientNationalId: "1000000002", hospital: HOSPITALS[3], department: "Endocrinology", service: "Diabetes Management", appointmentDate: daysAhead(3), appointmentTime: "11:00", status: "confirmed", referenceNo: `APT-${year}-10502` },
    { patientId: id(3), patientName: "خالد الغامدي", patientNationalId: "1000000003", hospital: KKUH, department: "Cardiology", service: "Heart Failure Clinic", appointmentDate: daysAhead(2), appointmentTime: "08:30", status: "confirmed", referenceNo: `APT-${year}-10510`, notes: "INR recheck before clinic." },
  ]);
  console.log("Inserted 4 appointments");

  // ════════════════════════════════════════════════════════════════════════════
  // RETRAIN JOBS
  // ════════════════════════════════════════════════════════════════════════════
  const retrainJobs = [
    { id: "job_001", engine: "risk-scoring-v3",      status: "completed" as const, triggeredBy: "ai.khalid", progress: 100 },
    { id: "job_002", engine: "drug-interaction-v2",  status: "completed" as const, triggeredBy: "ai.khalid", progress: 100 },
    { id: "job_003", engine: "digital-twin-v1",      status: "running"   as const, triggeredBy: "ai.khalid", progress: 45 },
  ];
  await db.insert(aiRetrainJobsTable).values(retrainJobs).onConflictDoNothing();
  console.log("Inserted 3 retrain jobs");

  // ════════════════════════════════════════════════════════════════════════════
  // FAMILY RELATIONSHIPS — relationship-based family portal query logic (Sprint 2)
  // ════════════════════════════════════════════════════════════════════════════
  const familyRelationships = [
    { patientId: id(1), relativeId: id(2), relationshipType: "Sibling" },
    { patientId: id(1), relativeId: id(3), relationshipType: "Sibling" },
    { patientId: id(1), relativeId: id(4), relationshipType: "Child" },
    { patientId: id(1), relativeId: id(5), relationshipType: "Child" },

    { patientId: id(2), relativeId: id(1), relationshipType: "Sibling" },
    { patientId: id(2), relativeId: id(3), relationshipType: "Sibling" },

    { patientId: id(3), relativeId: id(1), relationshipType: "Sibling" },
    { patientId: id(3), relativeId: id(2), relationshipType: "Sibling" },

    { patientId: id(4), relativeId: id(1), relationshipType: "Parent" },
    { patientId: id(4), relativeId: id(5), relationshipType: "Sibling" },

    { patientId: id(5), relativeId: id(1), relationshipType: "Parent" },
    { patientId: id(5), relativeId: id(4), relationshipType: "Sibling" },
  ];
  await db.insert(familyRelationshipsTable).values(familyRelationships);
  console.log(`Inserted ${familyRelationships.length} family relationships`);

  // ── users registry (upsert — table is NOT truncated, so revocations done in a
  // demo are reset to active on reseed; the middleware status check reads these
  // rows by the JWT userId). Login itself uses the in-memory CREDENTIALS map,
  // so password_hash here is a placeholder, never verified.
  const DUMMY_HASH = "$2b$10$seedplaceholderhash.notusedforlogin.demo000000000000";
  const demoUsers = [
    { id: "ADM-001", nationalId: "9000000001", fullName: "Eng. Saad Al-Otaibi",    role: "admin",        hospitalId: null },
    { id: "DOC-001", nationalId: "9000000002", fullName: "Dr. Ahmed Al-Rashidi",   role: "doctor",       hospitalId: "KAMC-RYD" },
    { id: "EMP-001", nationalId: "9000000003", fullName: "Unit 7 — Riyadh Central",role: "emergency",    hospitalId: null },
    { id: "LAB-001", nationalId: "9000000004", fullName: "Sara Al-Otaibi",         role: "lab",          hospitalId: null },
    { id: "PHA-001", nationalId: "9000000005", fullName: "Hassan Al-Ghamdi",       role: "pharmacy",     hospitalId: null },
    { id: "HOS-001", nationalId: "9000000006", fullName: "Operations Manager",     role: "hospital",     hospitalId: "KAMC-RYD" },
    { id: "INS-001", nationalId: "9000000007", fullName: "Nora Al-Qahtani",        role: "insurance",    hospitalId: null },
    { id: "AIC-001", nationalId: "9000000008", fullName: "Dr. Khalid Al-Mansouri", role: "ai-control",   hospitalId: null },
    { id: "RES-001", nationalId: "9000000009", fullName: "Dr. Reem Al-Zahrani",    role: "research",     hospitalId: null },
    { id: "CIT-001", nationalId: "1000000001", fullName: "Mohammed Al-Ghamdi",     role: "citizen",      hospitalId: null },
    { id: "FAM-001", nationalId: "9000000011", fullName: "Fatima Al-Ghamdi",       role: "family",       hospitalId: null },
    { id: "SUP-001", nationalId: "9000000012", fullName: "Ibrahim Al-Dosari",      role: "supply-chain", hospitalId: null },
  ];
  await db.insert(usersTable)
    .values(demoUsers.map(u => ({ ...u, passwordHash: DUMMY_HASH, status: "active" })))
    .onConflictDoUpdate({ target: usersTable.id, set: { status: "active", updatedAt: new Date() } });
  console.log(`Upserted ${demoUsers.length} demo users (registry + revocation demo)`);

  // ai_decisions / events / audit_log start EMPTY — they accumulate from real
  // engine runs during the demo (no fabricated decision history).
  console.log("\nDemo environment ready.");
  console.log("Cast: 1000000001 محمد (S1/S4) · 1000000003 خالد (S2/S3) · 1000000006 سارة (S2b) · 1000000007 سعد (S7) · 1000000008 لطيفة (S4b) · 1000000009 يوسف (frailty)");
  console.log("Reseed any time with: pnpm --filter @workspace/scripts seed");
}

seed()
  .then(() => { console.log("Seed complete."); process.exit(0); })
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); });
