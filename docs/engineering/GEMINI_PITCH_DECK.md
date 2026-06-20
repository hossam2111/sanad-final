# SANAD — Gemini Task: Investor Pitch Deck

**Output file:** `docs/pitch/SANAD_PITCH_DECK.md`
**Format:** Markdown — each slide is a section with exact copy, speaker notes, and visual direction
**Language:** English (primary) + Arabic subtitle on each slide title
**Tone:** Authoritative, minimal, no hype — think McKinsey meets Palantir

---

## Context: What is SANAD?

SANAD (منظومة سند الصحية) is a **National AI Health Intelligence Platform** built for Saudi Arabia.

It connects every healthcare entity in the country — hospitals, clinics, pharmacies, labs, insurance companies, ambulances, and the Ministry of Health — into a single sovereign intelligence layer.

The platform has **12 portals**, each serving a different stakeholder:

| Portal | User |
|--------|------|
| Doctor Dashboard | Physicians — AI-generated risk scores, live lab alerts, drug predictions |
| Emergency Command | Triage coordination, mass-casualty routing, blood bank alerts |
| Pharmacy | Dispensing, drug interaction matrix, shortage alerts |
| Lab | Order management, result delivery, specimen tracking |
| Insurance | Claims review, AI fraud scoring, coverage decisions |
| Supply Chain | Procurement, inventory, purchase orders |
| Admin | National KPIs, epidemic radar, AI engine monitoring |
| AI Control | Model management, fine-tuning, explainability (XAI) |
| Citizen Portal | Personal health record, appointments, family health |
| Family | Proxy access for dependents |
| Research | Cohort builder, population analytics |
| Hospital | Bed management, staff, department coordination |

**Core concept — الإسناد (Isnād):**
In Islamic scholarly tradition, a "sanad" is the unbroken chain of transmission that makes knowledge trustworthy. SANAD Health applies this to medicine: every clinical event becomes a decision, and every decision carries its evidence chain. This is the audit trail philosophy embedded in the platform's core.

**Tech stack:** Next.js 15 · Express 5 · PostgreSQL (Neon) · Drizzle ORM · OpenAI · Gemini · Real-time SSE alerts

**Market:** Saudi Arabia primary. GCC expansion. Government B2B + insurance B2B revenue model.

---

## Your Task

Write a **10-slide investor pitch deck** as a Markdown document.

Each slide must contain:
1. **Slide title** (English + Arabic subtitle)
2. **Headline** — one bold sentence (the single thing the investor must remember from this slide)
3. **Body** — 3–5 bullet points maximum. No paragraphs. No fluff.
4. **Visual direction** — one sentence describing what the slide should look like (chart type, diagram, image concept)
5. **Speaker note** — 2–3 sentences the presenter says out loud (not on the slide)

---

## The 10 Slides — Exact Order and Instructions

### Slide 1: The Problem
**Title:** The Invisible Crisis  
**الأزمة غير المرئية**

Show the healthcare fragmentation problem in Saudi Arabia and globally.

Key facts to include (research and verify current numbers):
- Average time wasted per ER patient due to missing records
- Percentage of medical errors caused by incomplete patient data
- Annual cost of healthcare inefficiency in Saudi Arabia or GCC
- Number of siloed systems a typical Saudi hospital operates

The headline must make a decision-maker feel the problem personally, not academically.

---

### Slide 2: The Market Opportunity
**Title:** A $X Billion Imperative  
**فرصة بمليارات الدولارات**

Size the opportunity. Research and include:
- Saudi Arabia digital health market size (current + projected 2030)
- Vision 2030 Health sector transformation budget allocation
- GCC digital health market total
- Number of hospitals, clinics, pharmacies in Saudi Arabia (potential customers)

Be precise. Cite Vision 2030 / MOH sources where applicable.

---

### Slide 3: The Solution
**Title:** One Sovereign Intelligence Layer  
**طبقة ذكاء سيادية واحدة**

Explain SANAD in 3 bullets maximum. The investor must understand in 20 seconds:
- What it connects
- What it enables
- Why it's different from an EHR

Include the Isnād concept in one sentence — it's the differentiator that no competitor has.

Visual direction: a simple hub-and-spoke diagram. SANAD center. 6 entities around it.

---

### Slide 4: The Film — "نفس الرجل" (Same Man)
**Title:** Don't Explain It. Show It.  
**لا تشرحها. أرِها.**

This slide introduces the 90-second short film that plays during the presentation.

The film concept (write this clearly for the slide body):
- A man has a cardiac event on a highway at 6:47 AM
- World A (without SANAD): fragmented system, delayed care, 6 days in ICU
- World B (with SANAD): connected system, immediate care, home that evening
- Final line: "The difference wasn't the doctor. The difference was that everyone worked as one system."

**This slide is a transition slide.** The body should set up the film, not describe the platform features.

Speaker note: "What you're about to see is not a simulation of the future. This is what SANAD makes possible today."

---

### Slide 5: The Platform — 12 Portals
**Title:** One Platform. Every Stakeholder.  
**منصة واحدة. كل الأطراف.**

Show the breadth without overwhelming.

Group the 12 portals into 4 categories:
- **Clinical:** Doctor, Emergency, Hospital, Lab, Pharmacy
- **Financial:** Insurance, Supply Chain
- **Intelligence:** Admin (National KPIs), AI Control, Research
- **Citizen:** Citizen Portal, Family

One line per category. No technical jargon.

Visual direction: 4 clean columns, icon + label per portal, SANAD logo at center connecting them all.

---

### Slide 6: The AI Core
**Title:** AI That Explains Itself  
**ذكاء اصطناعي يشرح قراراته**

SANAD's AI is not a black box. Every prediction carries its evidence chain (Isnād).

Include:
- Risk stratification (critical/high/moderate/low) with confidence scores
- Drug interaction detection before dispensing
- Fraud scoring on insurance claims
- Epidemic radar (population-level anomaly detection)
- XAI — every AI decision has an explanation a clinician can audit

Headline must emphasize: **clinical trust**, not just accuracy.

---

### Slide 7: Traction & Demo
**Title:** Built. Running. Ready.  
**مبني. يعمل. جاهز.**

This is the credibility slide. Be factual:
- 12 production-ready portals (not mockups)
- Live demo available on request (127.0.0.1:3000)
- Full seed dataset: Al-Ghamdi family, 7 demo scenarios
- 85 automated test assertions (43 scenario + 42 ownership/BOLA)
- TypeScript strict mode, zero hardcoded colors, dark mode complete

Do NOT oversell. "Production-ready prototype" is accurate. Do not claim "deployed" unless it is.

---

### Slide 8: Business Model
**Title:** Three Revenue Streams. Government-Grade Contracts.  
**ثلاثة مصادر للإيراد. عقود على مستوى حكومي.**

Research standard health IT pricing models and propose realistic numbers:

- **Government / MOH License:** Annual SaaS fee per entity (hospital, clinic, pharmacy). Estimate per-entity fee range.
- **Insurance Integration:** Per-claim processing fee or annual API license to insurance companies.
- **Research Data:** Anonymized population health analytics sold to pharma / research institutions (GDPR/PDPL compliant).

Include a simple revenue projection table: Year 1 / Year 2 / Year 3 (conservative scenario).

---

### Slide 9: The Roadmap
**Title:** Saudi First. GCC Next.  
**المملكة أولاً. الخليج تالياً.**

3-phase roadmap:

**Phase 1 — Saudi Pilot (Year 1):**
- MOH partnership / regulatory approval
- 3–5 hospital pilot in Riyadh
- Seed funding deployment

**Phase 2 — Saudi Scale (Year 2):**
- National rollout via MOH mandate
- Insurance company integrations (BUPA, Tawuniya, Medgulf)
- Revenue positive

**Phase 3 — GCC Expansion (Year 3–4):**
- UAE, Kuwait, Bahrain
- Sovereign data hosting per country
- Regional AI model training

Visual direction: horizontal timeline with 3 phases, clean milestones.

---

### Slide 10: The Ask
**Title:** Join the Infrastructure of Saudi Healthcare  
**انضم إلى البنية التحتية للرعاية الصحية السعودية**

Be direct and specific:

- **Funding round:** [Seed / Pre-Series A — specify what's appropriate given the stage]
- **Amount:** $X million (research typical seed rounds for health IT in MENA)
- **Use of funds:** 3 lines maximum (team, regulatory, infrastructure)
- **What we're looking for:** Strategic investors with MOH/government access OR health system operators

Final line on slide (large, centered):
> "كل قرار سريري يحمل إسناده." — Every clinical decision carries its evidence.

---

## Tone & Style Rules

1. **No bullet point starts with "Our"** — passive confidence, not self-promotion.
2. **No "world-class", "revolutionary", "cutting-edge"** — these are empty words.
3. **Numbers must be real** — research and cite actual market data. If uncertain, use a range and note the source.
4. **Every slide has one headline** — one thing. Not two. Not three.
5. **Arabic subtitles** on slide titles only — not in the body.
6. **Speaker notes are conversational** — how a founder actually speaks, not how a consultant writes.

---

## Output Format (per slide)

```markdown
---

## Slide N: [Title]
### [Arabic Subtitle]

**Headline:** [Single bold sentence]

- Bullet 1
- Bullet 2
- Bullet 3

**Visual:** [One sentence description]

> **Speaker note:** [2–3 sentences]

---
```

---

## What NOT to include

- No technical architecture diagrams (save for due diligence)
- No code snippets
- No API documentation
- No competitor comparison table (mention differentiation without naming competitors)
- No founding team slide (not requested)
- No appendix

---

## Verification Before Submitting

After writing all 10 slides, run this checklist:

- [ ] Every slide has exactly one headline
- [ ] No slide has more than 5 bullets
- [ ] Numbers on slides 2, 8 are researched (not invented)
- [ ] Slide 4 sets up the film correctly without spoiling the emotional ending
- [ ] Slide 7 says "prototype" not "deployed"
- [ ] Slide 10 has a specific funding ask (not "seeking investment")
- [ ] Arabic appears only on slide titles, not in body text
- [ ] Total reading time per slide ≤ 30 seconds

Save as: `docs/pitch/SANAD_PITCH_DECK.md`
