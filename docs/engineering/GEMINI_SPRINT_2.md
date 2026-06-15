# SANAD — Gemini Sprint 2: Family Relationship Model

**Branch to create:** `feature/family-relationship-model`  
**Base:** `main`  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Problem to Solve

The family portal (`artifacts/api-server/src/routes/family.ts:182`) determines
household membership by numeric ID adjacency:

```typescript
// CURRENT — WRONG for real data
const rawFamily = allPatients
  .filter(fp => fp.id !== p.id && fp.id >= Math.max(1, p.id - 3) && fp.id <= p.id + 5)
  .slice(0, 6);
```

This only works because the demo seed inserts the Al-Ghamdi family as IDs 1–5.
For any real patient population this returns random unrelated patients as "relatives."

---

## What To Build

### 1. Database Schema — new table

File: `lib/db/src/schema/family_relationships.ts`

```typescript
import { pgTable, serial, integer, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const familyRelationshipsTable = pgTable("family_relationships", {
  id:               serial("id").primaryKey(),
  patientId:        integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  relativeId:       integer("relative_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(),
  // "Parent" | "Child" | "Sibling" | "Spouse" | "Grandparent" | "Grandchild"
  verifiedAt:       timestamp("verified_at"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
});
```

Export it from `lib/db/src/schema/index.ts`.

### 2. Migration

File: `lib/db/drizzle/0001_family_relationships.sql`

```sql
CREATE TABLE IF NOT EXISTS "family_relationships" (
  "id"                SERIAL PRIMARY KEY,
  "patient_id"        INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "relative_id"       INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "relationship_type" VARCHAR(50) NOT NULL,
  "verified_at"       TIMESTAMP,
  "created_at"        TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_patient    ON family_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_relative   ON family_relationships(relative_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_pair ON family_relationships(patient_id, relative_id);
```

Also update `lib/db/drizzle/meta/_journal.json` — add entry:
```json
{ "idx": 1, "version": "5", "when": 1749945600000, "tag": "0001_family_relationships", "breakpoints": true }
```

### 3. Seed — wire Al-Ghamdi relationships

File: `scripts/src/seed.ts`

After inserting patients, add explicit family rows for the Al-Ghamdi household
(patients 1–5 in the engineered cast):

```typescript
// Import at top
import { familyRelationshipsTable } from "@workspace/db/schema";

// After patient inserts — Al-Ghamdi family wiring
// patient 1 = Mohammed (father), 2 = Saad (son), 3 = Khalid (son),
// 4 = Fatima (daughter), 5 = Nora (mother)
const alGhamdiRelationships = [
  { patientId: 1, relativeId: 2, relationshipType: "Child" },
  { patientId: 1, relativeId: 3, relationshipType: "Child" },
  { patientId: 1, relativeId: 4, relationshipType: "Child" },
  { patientId: 1, relativeId: 5, relationshipType: "Spouse" },
  { patientId: 2, relativeId: 1, relationshipType: "Parent" },
  { patientId: 2, relativeId: 3, relationshipType: "Sibling" },
  { patientId: 2, relativeId: 4, relationshipType: "Sibling" },
  { patientId: 2, relativeId: 5, relationshipType: "Parent" },
  { patientId: 3, relativeId: 1, relationshipType: "Parent" },
  { patientId: 3, relativeId: 2, relationshipType: "Sibling" },
  { patientId: 3, relativeId: 4, relationshipType: "Sibling" },
  { patientId: 3, relativeId: 5, relationshipType: "Parent" },
  { patientId: 4, relativeId: 1, relationshipType: "Parent" },
  { patientId: 4, relativeId: 2, relationshipType: "Sibling" },
  { patientId: 4, relativeId: 3, relationshipType: "Sibling" },
  { patientId: 4, relativeId: 5, relationshipType: "Parent" },
  { patientId: 5, relativeId: 1, relationshipType: "Spouse" },
  { patientId: 5, relativeId: 2, relationshipType: "Child" },
  { patientId: 5, relativeId: 3, relationshipType: "Child" },
  { patientId: 5, relativeId: 4, relationshipType: "Child" },
];

await db.insert(familyRelationshipsTable)
  .values(alGhamdiRelationships)
  .onConflictDoNothing();
```

Use `onConflictDoNothing()` so the seed is idempotent (safe to run multiple times).

### 4. Route — replace ID-adjacency with DB lookup

File: `artifacts/api-server/src/routes/family.ts`

Replace lines 171–208 (the `allPatients` query and `rawFamily` filter).

**Before (delete this):**
```typescript
const [medications, labResults, visits, allPatients] = await Promise.all([
  db.select().from(medicationsTable)...,
  db.select().from(labResultsTable)...,
  db.select().from(visitsTable)...,
  db.select().from(patientsTable).limit(50),   // ← wrong: loads all patients
]);

const rawFamily = allPatients
  .filter(fp => fp.id !== p.id && fp.id >= Math.max(1, p.id - 3) && fp.id <= p.id + 5)
  .slice(0, 6);

const parents   = rawFamily.filter(fp => fp.id < p.id).slice(0, 2);
const siblings  = rawFamily.filter(fp => fp.id > p.id && fp.id <= p.id + 2).slice(0, 2);
const children  = rawFamily.filter(fp => fp.id > p.id + 2).slice(0, 2);
```

**After (replace with this):**
```typescript
import { familyRelationshipsTable } from "@workspace/db/schema";
import { eq, or, inArray } from "drizzle-orm";

// Inside the route handler, after the consent check:
const [medications, labResults, visits, relationshipRows] = await Promise.all([
  db.select().from(medicationsTable).where(eq(medicationsTable.patientId, p.id)).orderBy(desc(medicationsTable.createdAt)),
  db.select().from(labResultsTable).where(eq(labResultsTable.patientId, p.id)).orderBy(desc(labResultsTable.testDate)).limit(20),
  db.select().from(visitsTable).where(eq(visitsTable.patientId, p.id)).orderBy(desc(visitsTable.visitDate)).limit(20),
  db.select().from(familyRelationshipsTable).where(eq(familyRelationshipsTable.patientId, p.id)),
]);

// Fetch actual relative records
const relativeIds = relationshipRows.map(r => r.relativeId);
const relativePatients = relativeIds.length > 0
  ? await db.select().from(patientsTable).where(inArray(patientsTable.id, relativeIds))
  : [];

// Build family members with relationship type from the join
const familyMembers = relativePatients.map(fp => {
  const rel = relationshipRows.find(r => r.relativeId === fp.id);
  return mapMember(fp, rel?.relationshipType ?? "Relative");
});
```

Remove the `parents`, `siblings`, `children` split — the `mapMember` call already handles it.
The `familyMembers` array replaces the old three-way split entirely.

### 5. Do NOT change

- `artifacts/sanad/src/screens/family.tsx` — frontend consumes `fam.familyMembers` array, shape unchanged
- The consent gate logic in `family.ts` — keep as-is
- The audit write — keep as-is
- `scripts/src/seed.ts` demographic data for patients 1–5 — only ADD the relationship inserts

---

## Acceptance Criteria

- [ ] `pnpm --filter @workspace/db typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/api-server typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/scripts seed` runs without error
- [ ] `GET /api/family/patient/1000000001` returns `familyMembers` with correct `relationship` values ("Child", "Spouse") not "Parent"/"Sibling"/"Child" derived from ID ordering
- [ ] `GET /api/family/patient/1000000009` (random patient with no relationships) returns `familyMembers: []`
- [ ] No reference to `fp.id >= Math.max(1, p.id - 3)` remains in codebase

---

## Git Instructions

```bash
git clone https://github.com/hossam2111/sanad-final.git
cd sanad-final
git checkout -b feature/family-relationship-model
pnpm install

# Implement schema → migration → seed → route in that order
# One commit per step:
git commit -m "feat(db): add family_relationships table and migration"
git commit -m "feat(seed): wire Al-Ghamdi household into family_relationships"
git commit -m "fix(family): replace id-adjacency with explicit relationship query"

# Verify
pnpm --filter @workspace/db typecheck
pnpm --filter @workspace/api-server typecheck

git push -u origin feature/family-relationship-model
```
