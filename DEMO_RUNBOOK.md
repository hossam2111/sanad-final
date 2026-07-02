# SANAD Demo Runbook

## 5 Minutes Before Any Presentation

```bash
# 1. Warm the database connection pool (always run this first)
pnpm --filter "@workspace/scripts" seed

# 2. Start both servers (if not already running)
pnpm dev

# 3. Optional: full gate verification (seed is included — do NOT add -SkipSeed)
.\verify-and-publish.ps1 -DryRun
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
9. Drug interactions — two scenarios:
   - Search `1000000003` (خالد الغامدي) → Medications tab → **Warfarin + Amiodarone** → CRITICAL anticoagulation alert (INR 3.8, supratherapeutic)
   - Search `1000000006` (سارة العتيبي) → Medications tab → **Fluoxetine + Tramadol** → CRITICAL serotonin syndrome flag
10. Admin → **Audit Trail** → show Isnād chain (break-glass, consent, dispense events)
11. Admin → **Maintenance** → Export Audit Logs → download CSV

### Closing — 1 min
12. Admin → **Data Sovereignty tab** → PDPL compliance (6 articles), KSA sovereign cloud, data classification matrix
13. Admin → **Maintenance → AI Brain** → show runtime model/key management (provider dropdown,
    encrypted key, Test Connection) — "the Ministry controls the brain, not the vendor"
14. Admin header → **Region switcher** (🇸🇦→🇦🇪→🇶🇦) → ministry name/ID label/currency re-brand live —
    "one platform, exportable across the GCC"
15. Admin → **User Registry** → 12 roles, all portals
16. Admin → Reset Demo Environment (if needed for next session)

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
The User Registry tab is LIVE (TASK-017): Revoke/Restore writes `users.status`, is audited
in the Isnād chain, and kills the target user's active tokens **on their very next request**
(the middleware status cache is invalidated on change). Powerful demo beat:
1. Login as doctor in a second browser tab.
2. Admin → User Registry → Revoke `dr.rashidi` → doctor's next click → 401 logout.
3. Restore → doctor works again. Reseeding resets all users to active.
Production deployments would still integrate LDAP / SAML / OAuth for identity lifecycle.

---

## Verify Gate Reference

```
88/88 PASS (last verified: 2026-06-21 · tag demo-ready-v8)
  46/46 scenario-tests  (S1–S7 clinical scenarios + JWT refresh)
  42/42 ownership-tests (BOLA + hospital scoping)
```

> **Since last verify:** Added Data Sovereignty tab (Admin → tab 8), expanded drug
> interaction DB to 30+ drug classes, added UAE to presentation comparison.
> Re-run `verify-and-publish.ps1 -DryRun` to refresh gate count.

Re-run anytime with:
```powershell
.\verify-and-publish.ps1 -DryRun
```

> **Note:** Never pass `-SkipSeed` when running verify. The seed runs immediately before
> tests to warm Neon idle connections — skipping it causes ECONNRESET on the first DB call.
