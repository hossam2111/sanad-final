# SANAD — Demo Playbook

**Behind Every Decision · لكل قرارٍ سند**

This is a presenter's script for demonstrating SANAD to stakeholders. Every
scenario below runs against live engines and a real database — nothing on screen
is mocked, hardcoded, or staged. The dataset is engineered so each scenario
triggers a specific engine behavior you can point to and explain.

---

## Before you present

1. **Reseed the environment** (resets to a known, clean state — do this right before any demo):
   ```bash
   pnpm --filter @workspace/scripts seed
   ```
   This wipes and rebuilds 50 patients, their medications/visits/labs, consents,
   appointments, and a backdated baseline of AI decisions (so the national
   dashboards reflect a platform that has been operating, not one that just
   booted). The audit log starts empty and fills as you demo; the AI-decision
   counter starts at a credible baseline and *ticks up live* as you run S1–S2.

2. **Start the two dev servers** (each in its own terminal):
   ```bash
   pnpm --filter @workspace/api-server dev      # API on :8080
   pnpm --filter @workspace/sanad dev           # Web on :3001
   ```

3. **(Optional) verify everything is wired** before walking on stage:
   ```bash
   node %TEMP%\sanad-shots\scenario-tests.mjs   # expect: 43 passed, 0 failed
   ```

All logins use the role chips on the login screen (one click auto-fills
credentials), or type them manually. Passwords follow `Role@2026`.

---

## The cast

The demo data is built around the **Al-Ghamdi family** plus a few standalone
patients, each chosen to drive a specific engine. Names are Arabic (search by
National ID if typing Arabic is awkward).

| National ID | Name | Role in the demo |
|---|---|---|
| **1000000001** | محمد الغامدي (Mohammed) | Flagship clinical case — critical risk; the citizen demo account |
| 1000000002 | سعاد الغامدي (Souad) | His sister — shares diabetes (genetics); **has not** granted family consent |
| **1000000003** | خالد الغامدي (Khalid) | His brother — the drug-interaction + emergency case |
| 1000000004 / 5 | عبدالرحمن / نورة | His children — healthy contrast in the family tree |
| **1000000006** | سارة العتيبي (Sara) | Live serotonin-syndrome interaction (Fluoxetine + Tramadol) |
| **1000000007** | سعد العنزي (Saad) | Insurance fraud / claim-anomaly pattern |
| **1000000008** | لطيفة الحربي (Latifa) | Has **revoked** insurance consent |
| 1000000009 | يوسف العتيبي (Yousef) | Frailty / top-of-the-risk-queue critical patient |

Demo accounts: `citizen_demo` is محمد himself; `family.fatima` is **Fatima
Al-Ghamdi, محمد's wife** — so the family scenario is a spouse viewing her
husband's record under consent.

---

## S1 · Clinical Decision Support
**Login:** Physician (`dr.rashidi`) · **Patient:** 1000000001 (محمد)

**Say:** "A consultant opens a complex patient. SANAD doesn't just show data — it
reaches a decision and shows its reasoning."

**Do:**
1. Search `1000000001`, load the record. Land on **Overview**.
2. Point out the **risk score of 95 / 100 — Critical**. This is computed, not
   stored decoration: age 61 + three chronic conditions (hypertension, T2DM,
   coronary artery disease) + five concurrent medications (polypharmacy) +
   abnormal labs.
3. Open the **Intelligence** tab. Walk through, top to bottom:
   - **The decision:** urgency **IMMEDIATE**, act within 3 hours.
   - **Why** — the factor list. Each line is a weighted contributor with a
     confidence. This is the explainability story: "the model shows its work."
   - **Digital twin:** trajectory **rapidly worsening**, projected score, and the
     intervention window ("3–6 months before irreversible damage").
   - **Predictive warnings:** *Persistently Abnormal HbA1c* (it noticed three
     consecutive abnormal results trending) and *Diabetic Complication Risk*.

**The point:** every number traces to a clinical fact in the record. Click "Full
analysis" from Overview to jump straight here.

---

## S2 · Drug Interaction Detection
**Login:** Physician (`dr.rashidi`) · **Patients:** 1000000003 (خالد), 1000000006 (سارة)

**Say:** "SANAD checks every new prescription against what the patient is already
taking — and it grades severity, it doesn't just warn."

**Do:**
1. Load خالد (1000000003). He's on **Warfarin + Amiodarone** already — point out
   the standing **critical interaction alert** on his record (amiodarone
   potentiates warfarin; his INR is 3.8, supratherapeutic).
2. In the interaction checker, try prescribing **Metronidazole** → **HIGH**,
   flagged unsafe (enhances anticoagulation). Try **Ciprofloxacin** → **MODERATE**,
   "monitor INR." Same patient, two different severities — it's reasoning about
   each pair, not pattern-matching a keyword.
3. Switch to سارة (1000000006), on **Fluoxetine**. Try prescribing **Tramadol** →
   **CRITICAL: serotonin syndrome risk.** This is the kind of cross-class
   interaction that's easy to miss manually.

**Optional (Pharmacy view):** log in as `pharm.hassan`, pull up خالد, dispense a
medication. The receipt carries a **server-issued reference number**
(`RX-2026-NNNNN-XXXX`) written into the audit trail — not a number the browser
made up.

**The point:** the same engine protects the doctor at prescribing time and the
pharmacist at dispensing time.

---

## S3 · Emergency Patient Retrieval (break-glass)
**Login:** Emergency (`emergency_unit7`) · **Patient:** 1000000003 (خالد)

**Say:** "A patient arrives unconscious. The responder has seconds, and may not
have the patient's permission in the moment. This is break-glass access."

**Do:**
1. Search `1000000003`. Instantly: **blood type B+**, allergies **(iodine
   contrast, aspirin, codeine)**, active medications, and **risk level critical**.
2. Point out the **clinical actions** the engine pre-computed for a responder:
   - **DO NOT GIVE** aspirin / codeine (documented allergies)
   - **ALERT before contrast imaging** (iodine allergy — and he may need a scan)
   - **Warfarin + Amiodarone** flagged for urgent review
3. **Say:** "Every one of these lookups is logged. Access is allowed in an
   emergency — but it is *never* silent." (You'll prove this in S5.)

**The point:** life-saving access is immediate, but it leaves a permanent,
tamper-evident record. Trust comes from accountability, not from blocking access.

---

## S4 · Consent Management
**Login:** Citizen (`citizen_demo`, i.e. محمد) — then Insurance (`ins.nora`)

**Say:** "The citizen owns their data. Consent isn't a checkbox in a settings
page nobody reads — it changes what other institutions can see, in real time."

**Do:**
1. As the citizen, open **Privacy**. Show the consent profile: data sharing,
   emergency access, insurance, AI processing, research, family linking — each
   with its legal basis (MOH circulars, PDPL).
2. Toggle **Research participation ON**. (Opt-in by default — you're granting it
   live.)
3. Now toggle **Insurance Data Access OFF.**
4. **Switch to the Insurance portal** (`ins.nora`) and try to open محمد
   (1000000001): **access denied — "Insurance Data Access consent revoked."** The
   insurer is locked out the instant the citizen revokes.
5. (Re-grant it from the citizen side to restore access if you want to continue.)

**The point:** consent is enforced at the data boundary, not just displayed. The
patient's choice has immediate teeth across the whole platform.

---

## S5 · National Health Intelligence
**Login:** Ministry / Admin (`admin.saad`)

**Say:** "Everything the individual portals do rolls up to a national view — and
it's all derived from the same live records, not a separate analytics mock."

**Do:**
1. Open the Admin dashboard. Note the headline numbers: **50 patients**, **visits
   today** (real — two patients have wellness visits dated today), the **risk
   distribution** (low→critical, summing to the whole population), and **AI
   decisions made** — note it ticked *up* from its baseline because of the
   decisions you ran in S1–S2.
2. **Population Health:** condition prevalence (hypertension and diabetes lead —
   that's the real registry), age distribution, and a **12-month visit trend**
   (the data is spread across the year, with emergency/inpatient breakdowns).
3. **The trust capstone — the audit chain (Isnād):** open the audit log and run
   **Verify Integrity.** It returns **VERIFIED** — every record is hash-chained to
   the one before it (SHA-256), so tampering with any entry breaks the chain.
   Point out it contains the **break-glass** access from S3, the **consent**
   changes from S4, and the **dispense** from S2. *This* is "Behind Every
   Decision" made literal: every action is accountable.

**The point:** national intelligence and individual accountability are the same
system viewed at two zoom levels.

---

## S6 · Family Access Workflow
**Login:** Family (`family.fatima` — Fatima, محمد's wife)

**Say:** "Families share genetics. SANAD supports family-wide risk screening —
but only with the record holder's explicit consent."

**Do:**
1. Search **1000000001** (محمد — who granted family linking). The **Family Tree**
   loads: the whole Al-Ghamdi household with per-member AI risk scores. Point out:
   - خالد (brother) at **risk 100**, محمد at **95**, سعاد (sister) at **35**, the
     two children at **0** — a realistic spread.
   - **Shared conditions** highlighted (Type 2 Diabetes, Hypertension).
   - **Genetic Risks** tab: hereditary diabetes risk detected, heritability
     score, family-wide **screening plan**.
   - Relatives' National IDs are **masked** (`••••••0002`) — you can see the
     family structure without exposing everyone's full identifiers.
2. Now search **1000000002** (سعاد, who has *not* granted linking): you get a
   clean **"Family Health Linking consent required"** card, not the record. The
   gate is a feature — and the attempt is logged.

**The point:** powerful family genetics, gated entirely on patient consent. Same
consent system as S4, enforced on a different workflow.

---

## S7 · Insurance Authorization Workflow
**Login:** Insurance (`ins.nora`) · **Patient:** 1000000007 (سعد العنزي)

**Say:** "Insurers need to process claims and catch fraud — without a separate,
untrustworthy data silo. SANAD scores claim patterns on the real clinical record."

**Do:**
1. Open سعد (1000000007). The **anomaly engine** flags **HIGH fraud risk**. Walk
   through the factors it actually found:
   - **4 emergency visits** across **4 different hospitals**
   - **two visits 2 days apart** (rapid cycling)
   - all with unremarkable findings — the classic doctor-shopping signature.
2. Show the **premium calculation** (risk-loaded) and the **claims list** with
   per-claim anomaly scores. **Flag a claim for review** — it persists.
3. For contrast, open محمد (1000000001): **fraud risk is not high.** A genuinely
   sick, high-clinical-risk patient is *not* a fraud risk — the engine
   distinguishes clinical severity from billing anomaly.

**The point:** fraud detection that reasons about behavior patterns, and is
honest enough to clear a sick patient instead of flagging everyone expensive.

---

## If something looks off mid-demo

- **A number seems stale after you changed data:** the AI decision endpoint
  recomputes and persists risk on each open — just reopen the record.
- **"Too many login attempts":** you've exceeded the auth rate limit (50 / 15 min).
  Raise it with `AUTH_RATE_LIMIT=200` in the environment, or wait. (The limit is
  deliberately demo-generous but still protects against brute force.)
- **A portal looks empty:** confirm both dev servers are running and you reseeded.
- **Reset to a pristine state at any time:** rerun the seed. It's idempotent.

---

## Why this is credible (the one-liner for skeptics)

Every screen is backed by a deterministic engine reading a real Postgres
database. The risk scores, interaction grades, predictions, fraud flags, and
genetic risks are all *computed from the seeded clinical facts* — change the
facts and the outputs change. The audit chain is cryptographically verifiable.
There are no fabricated metrics, no hardcoded dashboards, and no "screenshot
mode." Reseed it, run `scenario-tests.mjs`, and watch all 43 assertions pass.
