# SANAD — Gemini Sprint 8: Insurance Claim Review + AI Control Panel

**Branch to create:** `feature/insurance-ai-control`  
**Base:** `main` (after Sprint 7 merges)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Overview

Two portals that currently show data but lack the action flows a reviewer expects to see:

| Portal | Current state | Target |
|---|---|---|
| **Insurance** | Lists claims read-only | Approve/deny with AI recommendation inline |
| **AI Control** | Shows settings but no toggle persistence | Enable/disable AI features per role; view retrain job queue |

---

## Feature A — Insurance Claim Review

### A1 — Backend: Approve / Deny claim endpoint

File: `artifacts/api-server/src/routes/insurance.ts`

Read the file first. If `PATCH /api/insurance/claims/:id` doesn't exist, add it:

```typescript
import { claimReviewsTable } from "@workspace/db/schema";

router.patch("/claims/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { decision, reason } = req.body as { decision: "approved" | "denied"; reason?: string };

  if (!["approved", "denied"].includes(decision)) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "decision must be approved or denied" });
  }

  const [claim] = await db.update(claimReviewsTable)
    .set({
      status: decision,
      reviewedBy: req.userId ?? "unknown",
      reviewedAt: new Date(),
      reviewNotes: reason ?? null,
    })
    .where(eq(claimReviewsTable.id, id))
    .returning();

  if (!claim) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(claim);
});
```

Check `lib/db/src/schema/claim_reviews.ts` for exact column names.

### A2 — Backend: AI recommendation for a claim

File: `artifacts/api-server/src/routes/insurance.ts`

Add a route that calls the AI engine to get a recommendation:

```typescript
// GET /api/insurance/claims/:id/ai-recommendation
router.get("/claims/:id/ai-recommendation", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [claim] = await db.select().from(claimReviewsTable).where(eq(claimReviewsTable.id, id)).limit(1);
  if (!claim) return res.status(404).json({ error: "NOT_FOUND" });

  // Simple rule-based recommendation (no LLM call — deterministic for demo)
  const flags: string[] = [];
  if (claim.claimAmount > 50000) flags.push("High-value claim — manual review recommended");
  if (claim.visitCount !== undefined && claim.visitCount > 3) flags.push("Multiple visits — possible overutilization");

  const recommendation = flags.length > 0 ? "manual_review" : "auto_approve";
  res.json({ recommendation, flags, claimId: id });
});
```

### A3 — Frontend: Approve/Deny UI with AI recommendation

File: `artifacts/sanad/src/screens/insurance.tsx`

For each claim row in the pending list, add:

```tsx
type AiRec = { recommendation: string; flags: string[] } | null;
const [aiRecs, setAiRecs] = React.useState<Record<number, AiRec>>({});

async function fetchAiRec(claimId: number) {
  const rec = await api(`/api/insurance/claims/${claimId}/ai-recommendation`).then(r => r.json());
  setAiRecs(prev => ({ ...prev, [claimId]: rec }));
}

// In each claim row:
<div className="flex items-center gap-2 mt-2">
  <button onClick={() => fetchAiRec(claim.id)}
    className="text-xs rounded bg-primary/10 text-primary px-2 py-1">
    {text("AI Recommendation", "توصية الذكاء الاصطناعي")}
  </button>
  {aiRecs[claim.id] && (
    <span className={`text-xs px-2 py-0.5 rounded ${
      aiRecs[claim.id]!.recommendation === "auto_approve"
        ? "bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))]"
        : "bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))]"
    }`}>
      {aiRecs[claim.id]!.recommendation === "auto_approve"
        ? text("Recommend: Approve", "التوصية: اعتماد")
        : text("Recommend: Manual Review", "التوصية: مراجعة يدوية")}
    </span>
  )}
</div>

{claim.status === "pending" && (
  <div className="flex gap-2 mt-2">
    <button onClick={() => handleDecision(claim.id, "approved")}
      className="text-xs rounded bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 font-medium">
      {text("Approve", "اعتماد")}
    </button>
    <button onClick={() => handleDecision(claim.id, "denied")}
      className="text-xs rounded bg-destructive/10 text-destructive px-3 py-1 hover:bg-destructive/20 font-medium">
      {text("Deny", "رفض")}
    </button>
  </div>
)}
```

---

## Feature B — AI Control Panel

### B1 — Backend: Persist AI feature toggles

File: `artifacts/api-server/src/routes/ai_control.ts`

Check whether `PATCH /api/ai-control/features/:feature` exists to toggle features. If not, add a simple in-memory store (suitable for demo):

```typescript
// In-memory toggle store — resets on server restart (sufficient for demo)
const featureToggles: Record<string, boolean> = {
  risk_scoring: true,
  drug_interaction: true,
  digital_twin: true,
  ai_recommendations: true,
  retrain_jobs: false,
};

router.get("/features", (req, res) => {
  res.json({ features: featureToggles });
});

router.patch("/features/:feature", (req, res) => {
  const { feature } = req.params;
  if (!(feature in featureToggles)) {
    return res.status(404).json({ error: "UNKNOWN_FEATURE" });
  }
  const { enabled } = req.body as { enabled: boolean };
  featureToggles[feature as keyof typeof featureToggles] = enabled;
  res.json({ feature, enabled });
});
```

### B2 — Backend: Retrain job queue

File: `artifacts/api-server/src/routes/ai_control.ts`

Add endpoints for the `ai_retrain_jobs` table:

```typescript
import { aiRetrainJobsTable } from "@workspace/db/schema";

// GET /api/ai-control/retrain-jobs
router.get("/retrain-jobs", async (req, res) => {
  const jobs = await db.select().from(aiRetrainJobsTable).orderBy(desc(aiRetrainJobsTable.createdAt)).limit(20);
  res.json({ jobs });
});

// POST /api/ai-control/retrain-jobs — queue a new retrain
router.post("/retrain-jobs", async (req, res) => {
  const { model, reason } = req.body as { model: string; reason: string };
  const [job] = await db.insert(aiRetrainJobsTable).values({
    model,
    reason,
    status: "queued",
    requestedBy: req.userId ?? "ai.khalid",
  }).returning();
  res.status(201).json(job);
});
```

Check `lib/db/src/schema/ai_retrain_jobs.ts` for column names.

### B3 — Frontend: Feature toggles + retrain queue

File: `artifacts/sanad/src/screens/ai-control.tsx`

**Feature toggles section** — replace any static toggle display with live API state:

```tsx
type Features = Record<string, boolean>;
const [features, setFeatures] = React.useState<Features>({});

React.useEffect(() => {
  api("/api/ai-control/features").then(r => r.json()).then(d => setFeatures(d.features ?? {}));
}, []);

async function toggleFeature(feature: string, current: boolean) {
  await api(`/api/ai-control/features/${feature}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled: !current }),
  });
  setFeatures(prev => ({ ...prev, [feature]: !current }));
}

// For each feature, render a toggle switch:
{Object.entries(features).map(([key, enabled]) => (
  <div key={key} dir={dir} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
    <span className="text-sm font-medium text-foreground capitalize">{key.replace(/_/g, " ")}</span>
    <button
      onClick={() => toggleFeature(key, enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  </div>
))}
```

**Retrain job queue** — add a section showing the queue and a "Queue Retrain" button:

```tsx
type RetrainJob = { id: number; model: string; reason: string; status: string; createdAt: string };
const [jobs, setJobs] = React.useState<RetrainJob[]>([]);

// Fetch on mount, show in a table below feature toggles
// "Queue Retrain" button opens a small inline form with model name + reason inputs
// On submit: POST /api/ai-control/retrain-jobs, then refresh jobs list
```

---

## Seed: Add demo retrain jobs

File: `scripts/src/seed.ts`

```typescript
import { aiRetrainJobsTable } from "@workspace/db/schema";

const retrainJobs = [
  { model: "risk-scoring-v3",      reason: "Q2 2026 dataset refresh — 12,000 new cases", status: "completed" as const, requestedBy: "ai.khalid" },
  { model: "drug-interaction-v2",  reason: "MOH formulary update June 2026",              status: "completed" as const, requestedBy: "ai.khalid" },
  { model: "digital-twin-v1",      reason: "Pilot cohort validation — KFMC",              status: "running"   as const, requestedBy: "ai.khalid" },
];
await db.insert(aiRetrainJobsTable).values(retrainJobs).onConflictDoNothing();
```

---

## Acceptance Criteria

### Insurance
- [ ] `GET /api/insurance/claims` returns existing claims
- [ ] `PATCH /api/insurance/claims/:id` with `{ decision: "approved" }` → 200, status changes
- [ ] `GET /api/insurance/claims/:id/ai-recommendation` → `{ recommendation, flags }`
- [ ] Insurance screen shows "AI Recommendation" button per pending claim
- [ ] Clicking "AI Recommendation" shows approve/manual-review badge
- [ ] Approve/Deny buttons fire API and the claim disappears from pending list

### AI Control
- [ ] `GET /api/ai-control/features` → object of feature flags
- [ ] `PATCH /api/ai-control/features/risk_scoring` with `{ enabled: false }` → feature toggled
- [ ] AI Control screen renders toggle switches that call the API on click
- [ ] `GET /api/ai-control/retrain-jobs` → list of jobs
- [ ] Retrain queue visible in the screen with status badges (completed / running / queued)
- [ ] "Queue Retrain" button creates a new job via POST and it appears in the list

### General
- [ ] `pnpm --filter @workspace/api-server typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] All new UI sections work in RTL (Arabic) mode

---

## Do NOT Touch

- `lib/db/` schema — tables already exist
- Other routes and screens
- Harnesses

---

## Git Instructions

```bash
git checkout -b feature/insurance-ai-control
pnpm install

git commit -m "feat(insurance): claim approve/deny + AI recommendation endpoint"
git commit -m "feat(insurance-ui): review UI with AI recommendation badge"
git commit -m "feat(ai-control): feature toggles + retrain job queue endpoints"
git commit -m "feat(ai-control-ui): live toggles + retrain queue UI"
git commit -m "feat(seed): demo retrain jobs"

pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/sanad typecheck

git push -u origin feature/insurance-ai-control
```
