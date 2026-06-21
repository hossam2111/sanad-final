# SANAD Demo Runbook

## 5 Minutes Before Any Presentation

```bash
# 1. Warm the database connection pool (always run this first)
pnpm --filter "@workspace/scripts" seed

# 2. Start both servers (if not already running)
pnpm dev

# 3. Optional: full gate verification
.\verify-and-publish.ps1 -SkipSeed -DryRun
```

### Why the seed step is mandatory
Neon (serverless PostgreSQL) closes idle connections after ~5 minutes of inactivity.
Running the seed before a presentation warms the connection pool and guarantees
stable execution. Skipping this step may cause ECONNRESET on the first request.

---

## Demo Credentials

| Portal        | Username          | Password        |
|---------------|-------------------|-----------------|
| Admin         | `admin.saad`      | `Admin@2026`    |
| Doctor        | `dr.rashidi`      | `Doctor@2026`   |
| Emergency     | `emergency_unit7` | `Emergency@2026`|
| Lab           | `lab.sara`        | `Lab@2026`      |
| Pharmacy      | `pharm.hassan`    | `Pharmacy@2026` |
| Hospital Ops  | `hosp.ops`        | `Hospital@2026` |
| Insurance     | `ins.nora`        | `Insurance@2026`|
| AI Control    | `ai.khalid`       | `AiControl@2026`|
| Research      | `research.reem`   | `Research@2026` |
| Citizen       | `citizen_demo`    | `Citizen@2026`  |
| Family        | `family.fatima`   | `Family@2026`   |
| Supply Chain  | `supply.ibrahim`  | `Supply@2026`   |

---

## Recommended 8-Minute Demo Flow

### Opening (Admin) — 2 min
1. Login as `admin.saad`
2. **Dashboard tab** → National KPIs (patients, visits today, drug conflicts, AI decisions)
3. **System Health tab** → DB latency green, all engines operational
4. **AI Governance tab** → Urgency breakdown, policy insights

### Clinical AI (Doctor) — 3 min
5. Login as `dr.rashidi`
6. Search `1000000001` → محمد الغامدي → CRITICAL priority (index 95)
7. AI tab → Why-factors, recommendations, digital twin trajectory
8. Click **"مريض جديد"** → Register a new patient:
   - National ID: `1000000051`
   - Conditions: T2DM, Hypertension
   - Step 2: Accept suggested meds (Metformin, Amlodipine, Atorvastatin)
   - Lab: HbA1c = 9.2
   - Step 3: AI Assessment → HIGH priority

### Safety & Compliance — 2 min
9. Drug interaction: check Metronidazole on patient 1000000003 → CRITICAL serotonin flag
10. Admin → **Audit Trail** → show Isnād chain (break-glass, consent, dispense events)
11. Admin → **Maintenance** → Export Audit Logs → download CSV

### Closing — 1 min
12. Admin → **User Registry** → 12 roles, all portals
13. Admin → Reset Demo Environment (if needed for next session)

---

## Key Demo Patients (post-seed)

| National ID  | Name (AR)       | Scenario                              | Priority |
|-------------|-----------------|---------------------------------------|----------|
| 1000000001  | محمد الغامدي   | T2DM + CAD + polypharmacy             | CRITICAL (95) |
| 1000000003  | خالد الغامدي   | Warfarin + Amiodarone, INR 3.8        | CRITICAL |
| 1000000006  | سارة العتيبي   | Fluoxetine + Tramadol → serotonin risk| HIGH     |
| 1000000007  | سعد العنزي     | Insurance fraud pattern (4 ER / 4 hospitals) | — |
| 1000000008  | لطيفة الحربي   | Revoked insurance consent → 403       | —        |

---

## Important Presentation Notes

### On the Clinical Priority Index
SANAD displays a **Clinical Priority Index (0–100)** — not a medical probability score.

The index is an explainable clinical prioritization tool based on:
chronic conditions · medications · laboratory findings · care utilization · AI decision rules.

**Correct framing:**
> "Priority Index 95 means this patient requires immediate clinical attention based on
> multiple converging risk factors. It is not a probability of a specific outcome."

**Do not frame as:**
> ~~"95% chance of..."~~ or ~~"Risk = 95%"~~

The **risk level** (Low / Medium / High / Critical) is what drives triage decisions.
The index number supports explainability and ranking.

### On User Administration
The User Registry tab shows Enable/Disable controls that are UI-only in the demo.
Production identity management requires integration with LDAP / SAML / OAuth.
The "Demo Mode" badge is displayed on that tab.

---

## Verify Gate Reference

```
85/85 PASS (last verified: 2026-06-21)
  43/43 scenario-tests  (S1–S7 clinical scenarios)
  42/42 ownership-tests (BOLA + hospital scoping)
```

Re-run anytime with:
```powershell
.\verify-and-publish.ps1 -SkipSeed -DryRun
```
