# SANAD — Gemini Sprint 3: Institutional Role Scoping

**Branch to create:** `feature/hospital-scoping`  
**Base:** `main` (after Sprint 2 is merged)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Problem to Solve

Currently a doctor credentialed at Hospital A can retrieve the full patient
list for Hospital B. This violates PDPL data minimization and would fail any
real Ministry security review.

**Current behavior:**
```
GET /api/patients?search=Ahmed
Doctor@HospitalA → returns ALL 50 patients across all hospitals
```

**Target behavior:**
```
GET /api/patients?search=Ahmed
Doctor@HospitalA → returns only patients registered at HospitalA

GET /api/patients/national/1000000003   ← individual lookup by nationalId
Doctor@HospitalA → still returns (needed for referrals and cross-hospital care)

GET /api/emergency/1000000003           ← break-glass
EmergencyUnit → always returns (life safety overrides scoping)
```

---

## What To Build

### Step 1 — Add `hospital_id` to patients table

File: `lib/db/src/schema/patients.ts`

Add one nullable column after `bloodType`:

```typescript
hospitalId: varchar("hospital_id", { length: 20 }),
```

Keep it nullable — existing patients without a hospital assignment still work.

---

### Step 2 — New `staff_assignments` table

File: `lib/db/src/schema/staff_assignments.ts`

```typescript
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const staffAssignmentsTable = pgTable("staff_assignments", {
  id:         serial("id").primaryKey(),
  username:   varchar("username", { length: 100 }).notNull(),
  hospitalId: varchar("hospital_id", { length: 20 }).notNull(),
  role:       varchar("role", { length: 50 }).notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});
```

Export from `lib/db/src/schema/index.ts`.

---

### Step 3 — SQL Migration

File: `lib/db/drizzle/0002_hospital_scoping.sql`

```sql
-- Add hospital_id to patients (nullable — no backfill required for existing rows)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(hospital_id);

-- Staff assignments: maps username → hospital
CREATE TABLE IF NOT EXISTS staff_assignments (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100) NOT NULL,
  hospital_id VARCHAR(20) NOT NULL,
  role        VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_username ON staff_assignments(username);
```

Update `lib/db/drizzle/meta/_journal.json` — add:
```json
{ "idx": 2, "version": "5", "when": 1749945601000, "tag": "0002_hospital_scoping", "breakpoints": true }
```

---

### Step 4 — Seed updates

File: `scripts/src/seed.ts`

**4a — Define hospital IDs** (add near the top of the file, with the other constants):
```typescript
const HOSPITALS = ["KAMC-RYD", "KFSH-RYD", "NGH-JED", "MOH-DMM", "KAUH-JED"] as const;
type HospitalId = typeof HOSPITALS[number];
```

**4b — Assign patients to hospitals** when inserting patients.  
Use the Mulberry32 PRNG already in the seed (re-use the existing `rand` function):

```typescript
// Inside the patient-insert loop, add hospitalId to each patient object:
hospitalId: HOSPITALS[Math.floor(rand() * HOSPITALS.length)],
```

For the engineered cast (Al-Ghamdi family, patients 1–5), assign them all to `"KAMC-RYD"`.

**4c — Assign staff** (add after patient inserts):
```typescript
import { staffAssignmentsTable } from "@workspace/db/schema";

const staffAssignments = [
  { username: "dr.rashidi",      hospitalId: "KAMC-RYD", role: "doctor" },
  { username: "emergency_unit7", hospitalId: "KAMC-RYD", role: "emergency" },
  // All other demo roles are non-clinical — no hospital scoping applies to them
];

await db.insert(staffAssignmentsTable)
  .values(staffAssignments)
  .onConflictDoNothing();
```

---

### Step 5 — Ownership guard

File: `artifacts/api-server/src/lib/ownership.ts`

Add one new exported function at the bottom:

```typescript
import { staffAssignmentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/**
 * Returns the hospitalId the requesting user is assigned to,
 * or null if they have no hospital assignment (non-clinical roles).
 */
export async function getStaffHospitalId(username: string): Promise<string | null> {
  const rows = await db
    .select({ hospitalId: staffAssignmentsTable.hospitalId })
    .from(staffAssignmentsTable)
    .where(eq(staffAssignmentsTable.username, username))
    .limit(1);
  return rows[0]?.hospitalId ?? null;
}
```

---

### Step 6 — Apply scoping in routes

#### `artifacts/api-server/src/routes/patients.ts`

Only the **list/search** endpoint needs scoping. Individual lookup by nationalId stays open.

Find the `GET /` handler (patient list/search). Add hospital filter for clinical roles:

```typescript
import { getStaffHospitalId } from "../lib/ownership.js";
import { eq, and, or, ilike, isNull } from "drizzle-orm";

// Inside GET / handler, before building the query:
const CLINICAL_ROLES = ["doctor", "hospital", "lab", "pharmacy"];
let hospitalFilter = undefined;

if (CLINICAL_ROLES.includes(req.role ?? "")) {
  const hospitalId = await getStaffHospitalId(req.userId ?? "");
  if (hospitalId) {
    // Show patients at their hospital OR patients with no hospital assigned
    hospitalFilter = or(
      eq(patientsTable.hospitalId, hospitalId),
      isNull(patientsTable.hospitalId)
    );
  }
}

// Add hospitalFilter to existing where clause (alongside search filter if present)
// If you already have a `where` condition, use and(existingWhere, hospitalFilter)
```

#### Routes that do NOT need changes:
- `GET /api/patients/national/:nationalId` — keep open for clinical roles (referrals)
- `GET /api/patients/:id` — keep open for clinical roles
- `GET /api/emergency/:nationalId` — keep open (break-glass)
- All non-clinical routes — unchanged

---

## Acceptance Criteria

- [ ] `pnpm --filter @workspace/db typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/api-server typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/scripts seed` completes without error
- [ ] `GET /api/patients?search=10000000` as `dr.rashidi` → returns only patients with `hospitalId = "KAMC-RYD"` (not all 50)
- [ ] `GET /api/patients/national/1000000009` as `dr.rashidi` → still returns the patient (individual lookup stays open)
- [ ] `GET /api/emergency/1000000009` as `emergency_unit7` → still returns (break-glass unaffected)
- [ ] `GET /api/patients?search=10000000` as `admin.saad` → still returns all patients (admin unaffected)
- [ ] No reference to `fp.id >= Math.max(1, p.id - 3)` — Sprint 2 prerequisite
- [ ] `ownership-tests.mjs` still passes (it uses `dr.rashidi` on cross-hospital records that ARE at KAMC-RYD)

---

## Important — Do NOT Touch

- `GET /api/patients/national/:nationalId` — stays open for clinical roles  
- `GET /api/emergency/:nationalId` — stays open always  
- Any AI routes — unchanged  
- Frontend (`artifacts/sanad/`) — no changes needed; the filter is transparent  
- `DEMO_PLAYBOOK.md` — scenarios use `dr.rashidi` + KAMC-RYD patients; they still work  

---

## Git Instructions

```bash
git clone https://github.com/hossam2111/sanad-final.git
cd sanad-final

# Wait for Sprint 2 to be merged into main before branching
git pull origin main
git checkout -b feature/hospital-scoping

pnpm install

# Implement in order: schema → migration → seed → guard → route
git commit -m "feat(db): add hospital_id to patients and staff_assignments table"
git commit -m "feat(seed): assign patients to hospitals, wire staff assignments"
git commit -m "feat(ownership): getStaffHospitalId guard"
git commit -m "fix(patients): scope list/search to staff hospital for clinical roles"

# Verify
pnpm --filter @workspace/db typecheck
pnpm --filter @workspace/api-server typecheck

git push -u origin feature/hospital-scoping
```
