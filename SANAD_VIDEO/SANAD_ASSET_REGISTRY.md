# SANAD — Asset Registry (سجل الأصول)
**مشروع:** SANAD Health Intelligence Platform — Investor Cut  
**آخر تحديث:** 2026-07-01  
**الإصدار:** v2.0

---

## Master Asset Count

```
Characters:     00 / 15 assets
Locations:      00 / 11 assets
Shot Images:    00 / 25 assets
Shot Videos:    00 / 17 assets (shots that need video generation)
Audio VO:       00 / 7  assets
Audio Dialogue: 00 / 2  assets
Audio Music:    00 / 5  assets
Audio SFX:      00 / 8  assets

TOTAL LOCKED:   00 / 90 assets
```

---

## Lock Log

| Asset ID | Lock Date | Model Used | Notes |
|----------|-----------|------------|-------|
| —        | —         | —          | لا يوجد assets مقفلة بعد |

---

## قواعد التحديث اليومي

- **Status Flow:** TODO → GENERATING → QA → APPROVED → LOCKED
- **REJECTED** يُعاد إلى TODO مع تحديث رقم الإصدار
- عند LOCK: أضف صف جديد في Lock Log أعلاه وحدّث العداد
- لا تحذف بطاقة مرفوضة — اجعلها REJECTED مع ملاحظة السبب

---

## Prompt Version Index

| Prompt ID | Asset Type | Current Version | Last Updated | Notes |
|-----------|-----------|----------------|-------------|-------|
| P-001 | CH01 (Father) | v1 | 2026-07-01 | Base character — CRITICAL |
| P-002 | CH02 (Daughter) | v1 | 2026-07-01 | |
| P-003 | CH03 (Mother) | v1 | 2026-07-01 | |
| P-004 | CH04 (Doctor) | v1 | 2026-07-01 | |
| P-005 | CH05 (Nurse) | v1 | 2026-07-01 | |
| P-011 | LOC01 Kitchen | v1 | 2026-07-01 | |
| P-012 | LOC02 ER | v1 | 2026-07-01 | CRITICAL — invalidates many shots |
| P-013 | LOC03 SANAD Screen | v1 | 2026-07-01 | Updated: no standalone "CLEARED" text |
| P-014 | LOC04 Network | v1 | 2026-07-01 | |
| P-015 | LOC05 House Exterior | v1 | 2026-07-01 | |
| P-021 | Shot 01 | v1 | 2026-07-01 | |
| P-022 | Shot 02 | v1 | 2026-07-01 | |
| P-023 | Shot 03 | v1 | 2026-07-01 | |
| P-024 | Shot 04 | v1 | 2026-07-01 | |
| P-025 | Shot 05 | v1 | 2026-07-01 | |
| P-026 | Shot 06 | v1 | 2026-07-01 | |
| P-027 | Shot 07 | v1 | 2026-07-01 | |
| P-028 | Shot 08 | v1 | 2026-07-01 | |
| P-029 | Shot 09 | v1 | 2026-07-01 | |
| P-030 | Shot 10 | v1 | 2026-07-01 | |
| P-031 | Shot 11 | v1 | 2026-07-01 | Typography |
| P-032 | Shot 12 | v1 | 2026-07-01 | |
| P-033 | Shot 13 | v1 | 2026-07-01 | |
| P-034 | Shot 14 | v1 | 2026-07-01 | |
| P-035 | Shot 15 | v1 | 2026-07-01 | |
| P-036 | Shot 16 | v1 | 2026-07-01 | |
| P-037 | Shot 17 | v1 | 2026-07-01 | |
| P-038 | Shot 18 | v1 | 2026-07-01 | CRITICAL — most complex shot |
| P-039 | Shot 19 | v1 | 2026-07-01 | Post-production |
| P-040 | Shot 20 | v1 | 2026-07-01 | Typography |
| P-041 | Shot 21 | v1 | 2026-07-01 | Typography |
| P-042 | Shot 22 | v1 | 2026-07-01 | |
| P-043 | Shot 23 | v1 | 2026-07-01 | Updated VO |
| P-044 | Shot 24 | v1 | 2026-07-01 | Post-production |
| P-045 | Shot 25 | v1 | 2026-07-01 | Brand asset |
| P-046 | VO / DLG / MU / SFX | v1 | 2026-07-01 | Audio prompts |

---

## Critical Dependency Graph

### SHOT-18 (The Hug — MOST CRITICAL SHOT) depends on:

```
SHOT-18 (The Hug — MOST CRITICAL) depends on:
  CH01-F (Father: The Hug variant)   ← CRITICAL
  CH02-C (Daughter: The Hug Moment)  ← CRITICAL
  CH03-B (Mother: Doorway)           ← HIGH
  LOC05-C (House Door open)          ← HIGH
  MU-03 (Piano — Act 3)              ← MEDIUM
  VO-05 (if any ambient VO)          ← LOW

If ANY of these changes → SHOT-18 must be fully regenerated
```

### Upstream Dependencies (أهم سلاسل التبعية):

```
CH01-A (Reference) → CH01-B/C/D/E/F (all variants) → Shots 02,03,05,10,17,18
LOC02-A (ER Reference) → LOC02-B → LOC02-C → Shots 05,06,07,08,09,10,13,14,15
LOC03-A (SANAD Screen) → LOC03-B → LOC03-C → Shots 13,14,15
LOC05-A (House Ref) → LOC05-B → LOC05-C → Shots 17,18
```

---

## قواعد Replacement Cost

- **CRITICAL**: لو تغير، يبطل 5+ assets أخرى (مثل CH01-A، LOC02-A)
- **HIGH**: يبطل 3-4 assets (المواقع الرئيسية وvariant الشخصية في Shot 18)
- **MEDIUM**: يبطل 1-2 assets
- **LOW**: مستقل، يبطل صفر assets أو asset واحدة (أصوات SFX منفردة، موسيقى)

---

# SECTION 1 — CHARACTERS (الشخصيات)

---

## CH01 — The Father (الأب)

> الشخصية المحورية. رجل في الخمسينيات. حضور هادئ وثقيل.

---

### CH01-A — The Father: Reference Front (مرجع أمامي)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** مرجع أساسي لجميع لقطات الأب
**Replacement Cost:** CRITICAL
**Dependencies:** None

**Invalidates If Changed:**
  - CH01-B, CH01-C, CH01-D, CH01-E, CH01-F (جميع variants الأب)
  - SHOT-02-IMG, SHOT-02-VID
  - SHOT-03-IMG, SHOT-03-VID
  - SHOT-05-IMG, SHOT-05-VID
  - SHOT-10-IMG
  - SHOT-17-IMG, SHOT-17-VID
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** بطاقة المرجع الأساسية — يجب إقرارها أولاً قبل بقية variants الأب
**Locked By:** __________ | **Lock Date:** __________

---

### CH01-B — The Father: Reference Side (مرجع جانبي)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** مرجع أساسي — زاوية جانبية
**Replacement Cost:** CRITICAL
**Dependencies:** CH01-A (must be approved first)

**Invalidates If Changed:**
  - كل اللقطات التي تعتمد على الزاوية الجانبية للأب
  - SHOT-02-IMG, SHOT-03-IMG, SHOT-17-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يجب مطابقة CH01-A في الملامح والملابس والإضاءة
**Locked By:** __________ | **Lock Date:** __________

---

### CH01-C — The Father: Hand to Chest (يد على الصدر)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** Shot 02, Shot 03, Shot 04, Shot 12
**Replacement Cost:** HIGH
**Dependencies:** CH01-A, CH01-B

**Invalidates If Changed:**
  - SHOT-02-IMG, SHOT-02-VID
  - SHOT-03-IMG, SHOT-03-VID
  - SHOT-04-IMG, SHOT-04-VID
  - SHOT-12-IMG, SHOT-12-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الإحساس بعدم الارتياح دون مبالغة درامية — "flicker of discomfort"
**Locked By:** __________ | **Lock Date:** __________

---

### CH01-D — The Father: Hospital Bed (سرير المستشفى)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** Shot 05, Shot 10
**Replacement Cost:** HIGH
**Dependencies:** CH01-A, LOC02-A

**Invalidates If Changed:**
  - SHOT-05-IMG, SHOT-05-VID
  - SHOT-10-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** عيون مفتوحة، متعب، IV attached — نجا لكن وجهه يحمل ثقل الليلة
**Locked By:** __________ | **Lock Date:** __________

---

### CH01-E — The Father: Coming Home (العودة للبيت)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** Shot 17
**Replacement Cost:** HIGH
**Dependencies:** CH01-A, LOC05-A

**Invalidates If Changed:**
  - SHOT-17-IMG, SHOT-17-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** أبطأ من المعتاد لكن منتصب القامة — حي وعائد
**Locked By:** __________ | **Lock Date:** __________

---

### CH01-F — The Father: The Hug (لحظة العناق)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-001 v1
**Generation Date:** __________
**Used In Shots:** Shot 18
**Replacement Cost:** CRITICAL
**Dependencies:** CH01-A, CH01-E, LOC05-C

**Invalidates If Changed:**
  - SHOT-18-IMG, SHOT-18-VID (إعادة توليد كاملة)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** Medium shot — بدون close-up على الوجوه. اترك للمشاهد أن يسقط مشاعره
**Locked By:** __________ | **Lock Date:** __________

---

## CH02 — The Daughter (الابنة)

> 12 سنة. هادئة. تنتظر وتراقب.

---

### CH02-A — The Daughter: Waiting Room (غرفة الانتظار)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-002 v1
**Generation Date:** __________
**Used In Shots:** Shot 09
**Replacement Cost:** MEDIUM
**Dependencies:** CH03-A (يجب أن تكون في نفس الإطار — تنسيق مشترك)

**Invalidates If Changed:**
  - SHOT-09-IMG, SHOT-09-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يداها متشابكتان، تنظر نحو الباب. جالسة بجانب الأم (CH03-A)
**Locked By:** __________ | **Lock Date:** __________

---

### CH02-B — The Daughter: Running Toward Camera (تجري نحو الكاميرا)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-002 v1
**Generation Date:** __________
**Used In Shots:** Shot 18
**Replacement Cost:** CRITICAL
**Dependencies:** CH02-A (visual consistency), LOC05-C

**Invalidates If Changed:**
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** تتوقف خطوة واحدة قبله — تنظر لأعلى. اللحظة هادئة وليست دراماتيكية
**Locked By:** __________ | **Lock Date:** __________

---

### CH02-C — The Daughter: The Hug Moment (لحظة العناق)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-002 v1
**Generation Date:** __________
**Used In Shots:** Shot 18
**Replacement Cost:** CRITICAL
**Dependencies:** CH01-F, CH02-B, LOC05-C

**Invalidates If Changed:**
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** مع CH01-F في نفس الإطار — medium shot
**Locked By:** __________ | **Lock Date:** __________

---

## CH03 — The Mother (الأم)

> حضور هادئ وقوي. تراقب وتصبر.

---

### CH03-A — The Mother: Waiting Room (غرفة الانتظار)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-003 v1
**Generation Date:** __________
**Used In Shots:** Shot 09
**Replacement Cost:** MEDIUM
**Dependencies:** CH02-A (تنسيق مشترك في نفس الإطار)

**Invalidates If Changed:**
  - SHOT-09-IMG, SHOT-09-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** جالسة بجانب الابنة (CH02-A) في غرفة الانتظار
**Locked By:** __________ | **Lock Date:** __________

---

### CH03-B — The Mother: Doorway (على عتبة الباب)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-003 v1
**Generation Date:** __________
**Used In Shots:** Shot 18
**Replacement Cost:** HIGH
**Dependencies:** CH03-A (visual consistency), LOC05-C

**Invalidates If Changed:**
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** تراقب من عتبة الباب — في الخلفية بينما الابنة والأب يتعانقان
**Locked By:** __________ | **Lock Date:** __________

---

## CH04 — The Doctor (الطبيب)

> شاب، حازم، محترف.

---

### CH04-A — The Doctor: Paper File, Act 1 (ملف ورقي — الفصل الأول)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-004 v1
**Generation Date:** __________
**Used In Shots:** Shot 06
**Replacement Cost:** HIGH
**Dependencies:** LOC02-B

**Invalidates If Changed:**
  - SHOT-06-IMG, SHOT-06-VID
  - CH04-B (consistency across acts — نفس الشخص في عالمين)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يمسك ملفاً ورقياً، يقلب الصفحات، يبحث — لا يجد، محبط. يرفع نظره
**Locked By:** __________ | **Lock Date:** __________

---

### CH04-B — The Doctor: SANAD Screen, Act 2 (شاشة SANAD — الفصل الثاني)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-004 v1
**Generation Date:** __________
**Used In Shots:** Shot 13
**Replacement Cost:** HIGH
**Dependencies:** CH04-A (visual consistency), LOC02-C, LOC03-A

**Invalidates If Changed:**
  - SHOT-13-IMG, SHOT-13-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** هادئ وحاسم — "عنده وارفارين — لا تعطوه أسبرين." — نفس الشخصية، عالم مختلف
**Locked By:** __________ | **Lock Date:** __________

---

## CH05 — The Nurse (الممرضة)

> سريعة الحركة، محترفة.

---

### CH05-A — The Nurse: Pushing Stretcher (تدفع النقالة)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-005 v1
**Generation Date:** __________
**Used In Shots:** Shot 05
**Replacement Cost:** MEDIUM
**Dependencies:** LOC02-B, CH01-D

**Invalidates If Changed:**
  - SHOT-05-IMG, SHOT-05-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** غرفة طوارئ فوضوية — ممرضات يتحدثن فوق بعضهن
**Locked By:** __________ | **Lock Date:** __________

---

### CH05-B — The Nurse: SANAD Screen (أمام شاشة SANAD)

**Type:** Character
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-005 v1
**Generation Date:** __________
**Used In Shots:** Shot 13
**Replacement Cost:** MEDIUM
**Dependencies:** CH05-A (visual consistency), LOC02-C, LOC03-A

**Invalidates If Changed:**
  - SHOT-13-IMG, SHOT-13-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الشاشة تعرض: medications, allergies, last three labs, risk index
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 2 — LOCATIONS (المواقع)

---

## LOC01 — Home Kitchen (مطبخ المنزل)

> مطبخ ضاحية عادي — دافئ وإنساني.

---

### LOC01-A — Home Kitchen: Empty Reference (مرجع فارغ)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-011 v1
**Generation Date:** __________
**Used In Shots:** مرجع أساسي
**Replacement Cost:** HIGH
**Dependencies:** None

**Invalidates If Changed:**
  - LOC01-B, LOC01-C
  - SHOT-02-IMG, SHOT-02-VID
  - SHOT-03-IMG, SHOT-03-VID
  - SHOT-04-IMG, SHOT-04-VID
  - SHOT-12-IMG, SHOT-12-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** مطبخ ضاحية سعودية عصرية — بدون شخصيات. إضاءة ليلية دافئة
**Locked By:** __________ | **Lock Date:** __________

---

### LOC01-B — Home Kitchen: Act 1 (الفصل الأول — بدون SANAD)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-011 v1
**Generation Date:** __________
**Used In Shots:** Shot 02, Shot 03, Shot 04
**Replacement Cost:** HIGH
**Dependencies:** LOC01-A

**Invalidates If Changed:**
  - SHOT-02-IMG, SHOT-02-VID
  - SHOT-03-IMG, SHOT-03-VID
  - SHOT-04-IMG, SHOT-04-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** Color grade: desaturated, tungsten-warm — نفس المكان، عالم بدون SANAD
**Locked By:** __________ | **Lock Date:** __________

---

### LOC01-C — Home Kitchen: Act 2 (الفصل الثاني — SANAD Notification Glow)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-011 v1
**Generation Date:** __________
**Used In Shots:** Shot 12
**Replacement Cost:** MEDIUM
**Dependencies:** LOC01-A, LOC01-B (must visually match — same kitchen)

**Invalidates If Changed:**
  - SHOT-12-IMG, SHOT-12-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس المطبخ بالضبط — لكن شاشة الهاتف تضيء بـ SANAD alert. Color grade أكثر نظافة وبرودة طفيفة
**Locked By:** __________ | **Lock Date:** __________

---

## LOC02 — Emergency Room (غرفة الطوارئ)

> غرفة طوارئ مستشفى — إضاءة فلورسنت.

---

### LOC02-A — Emergency Room: Empty Reference (مرجع فارغ)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-012 v1
**Generation Date:** __________
**Used In Shots:** مرجع أساسي
**Replacement Cost:** CRITICAL
**Dependencies:** None

**Invalidates If Changed:**
  - LOC02-B, LOC02-C
  - SHOT-05-IMG, SHOT-05-VID
  - SHOT-06-IMG, SHOT-06-VID
  - SHOT-07-IMG
  - SHOT-08-IMG
  - SHOT-09-IMG, SHOT-09-VID
  - SHOT-10-IMG
  - SHOT-13-IMG, SHOT-13-VID
  - SHOT-14-IMG
  - SHOT-15-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** غرفة طوارئ — fluorescent lights — بدون شخصيات. المرجع الأساسي للاتساق
**Locked By:** __________ | **Lock Date:** __________

---

### LOC02-B — Emergency Room: Act 1 Chaos (الفصل الأول — فوضى)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-012 v1
**Generation Date:** __________
**Used In Shots:** Shot 05, Shot 06, Shot 07, Shot 08, Shot 09, Shot 10
**Replacement Cost:** HIGH
**Dependencies:** LOC02-A

**Invalidates If Changed:**
  - SHOT-05-IMG, SHOT-05-VID
  - SHOT-06-IMG, SHOT-06-VID
  - SHOT-07-IMG
  - SHOT-08-IMG
  - SHOT-09-IMG, SHOT-09-VID
  - SHOT-10-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** فوضوية، ممرضات يتحدثن فوق بعضهن، نقالة تدخل بسرعة. Color grade: tungsten-warm desaturated
**Locked By:** __________ | **Lock Date:** __________

---

### LOC02-C — Emergency Room: Act 2 Organized + SANAD Screen (الفصل الثاني — منظم)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-012 v1
**Generation Date:** __________
**Used In Shots:** Shot 13, Shot 14, Shot 15
**Replacement Cost:** HIGH
**Dependencies:** LOC02-A, LOC02-B (must visually match — same ER, different mood)

**Invalidates If Changed:**
  - SHOT-13-IMG, SHOT-13-VID
  - SHOT-14-IMG
  - SHOT-15-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس الإضاءة الفلورسنت لكن الإيقاع مختلف — شاشة SANAD ظاهرة. أكثر نظافة وتنظيماً
**Locked By:** __________ | **Lock Date:** __________

---

## LOC03 — SANAD Screen UI (واجهة شاشة SANAD)

---

### LOC03-A — SANAD Screen: Patient File Display (عرض ملف المريض)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-013 v1
**Generation Date:** __________
**Used In Shots:** Shot 13
**Replacement Cost:** HIGH
**Dependencies:** None (UI design asset)

**Invalidates If Changed:**
  - LOC03-B, LOC03-C (تعتمد على نفس نظام التصميم)
  - SHOT-13-IMG, SHOT-13-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يعرض: medications, allergies, last three labs, risk index — واجهة نظيفة ومقروءة
**Locked By:** __________ | **Lock Date:** __________

---

### LOC03-B — SANAD Screen: Drug Interaction Check — UPDATED (فحص تفاعل الأدوية)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-013 v1
**Generation Date:** __________
**Used In Shots:** Shot 14
**Replacement Cost:** MEDIUM
**Dependencies:** LOC03-A (design system consistency)

**Invalidates If Changed:**
  - SHOT-14-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ UPDATED — النص المعتمد على الشاشة:
`Drug Interaction: None detected · Warfarin on record ✓ · Previous CBC: 3 days ago — retrieved in 4s`
Green banner — AI Safety Check: CLEARED. Insurance authorization: pre-approved
**Locked By:** __________ | **Lock Date:** __________

---

### LOC03-C — SANAD Screen: Lab Retrieval Speed — UPDATED (سرعة استرجاع المختبر)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-013 v1
**Generation Date:** __________
**Used In Shots:** Shot 15
**Replacement Cost:** MEDIUM
**Dependencies:** LOC03-A (design system consistency)

**Invalidates If Changed:**
  - SHOT-15-IMG

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ UPDATED — النص المعتمد:
`Previous CBC from 3 days ago — retrieved in 4 seconds`
جزء من montage: Lab result transmitted: 90s / Pharmacy dispense: flagged safe / Insurance form: auto-completed
**Locked By:** __________ | **Lock Date:** __________

---

## LOC04 — Network Visualization (تصور الشبكة)

---

### LOC04 — Network Animation: 3 Frames (أنيميشن ثلاثة إطارات)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-014 v1
**Generation Date:** __________
**Used In Shots:** Shot 16
**Replacement Cost:** MEDIUM
**Dependencies:** None (standalone animation asset)

**Invalidates If Changed:**
  - SHOT-16-IMG, SHOT-16-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** 2D line-drawing aesthetic — NOT 3D render. خمسة nodes تظهر واحدة تلو الأخرى:
🚑 إسعاف / 🔬 مختبر / 💊 صيدلية / 🏥 مستشفى / 🛡️ تأمين
خطوط تصل بينها → تلتقي في نقطة مركزية تتوهج
**Locked By:** __________ | **Lock Date:** __________

---

## LOC05 — House Exterior (خارج المنزل)

---

### LOC05-A — House Exterior: Empty (مرجع فارغ)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-015 v1
**Generation Date:** __________
**Used In Shots:** مرجع أساسي
**Replacement Cost:** HIGH
**Dependencies:** None

**Invalidates If Changed:**
  - LOC05-B, LOC05-C
  - SHOT-17-IMG, SHOT-17-VID
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** منزل ضاحية سعودية — نهاراً — بدون شخصيات أو سيارة
**Locked By:** __________ | **Lock Date:** __________

---

### LOC05-B — House Exterior: Car Arriving (السيارة تصل)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-015 v1
**Generation Date:** __________
**Used In Shots:** Shot 17
**Replacement Cost:** MEDIUM
**Dependencies:** LOC05-A

**Invalidates If Changed:**
  - SHOT-17-IMG, SHOT-17-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** سيارة عائلية تدخل في النهار — الأب يخرج منها ببطء
**Locked By:** __________ | **Lock Date:** __________

---

### LOC05-C — House Exterior: Door Open, Daughter in Frame (الباب مفتوح، الابنة في الإطار)

**Type:** Location
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-015 v1
**Generation Date:** __________
**Used In Shots:** Shot 18
**Replacement Cost:** HIGH
**Dependencies:** LOC05-A, LOC05-B

**Invalidates If Changed:**
  - SHOT-18-IMG, SHOT-18-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الباب يُفتح قبل وصوله — الابنة تجري. الأم تراقب من عتبة الباب
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 3 — SHOTS: IMAGES (لقطات الصور)

---

### SHOT-01-IMG — Black Screen / Sound Only (شاشة سوداء — صوت فقط)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A
**Seed:** N/A
**Prompt Version:** P-021 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 4s
**Characters:** لا يوجد
**Location:** لا يوجد — شاشة سوداء
**Replacement Cost:** LOW
**Dependencies:** SFX-01, SFX-02, SFX-07

**Invalidates If Changed:**
  - None (شاشة سوداء — لا assets مرتبطة بصرياً)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** شاشة سوداء خالصة — لا صورة مرئية. فقط صوت: طرق باب السيارة + مفاتيح تسقط + أصوات ليل هادئة في الضاحية
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-02-IMG — The Father in Kitchen (الأب في المطبخ)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-022 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 6s
**Characters:** CH01-C
**Location:** LOC01-B
**Replacement Cost:** MEDIUM
**Dependencies:** CH01-C, LOC01-B, VO-01, MU-01

**Invalidates If Changed:**
  - SHOT-02-VID (source image للفيديو)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** رجل خمسيني، بدلة مفكوكة، يصب ماءً، يتوقف — يد على الصدر. لا مبالغة درامية بعد. VO: "لا شيء يُنبئ بما سيأتي."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-03-IMG — Father Sits, Face Tightens (يجلس، وجهه يشتد)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-023 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 5s
**Characters:** CH01-C
**Location:** LOC01-B
**Replacement Cost:** MEDIUM
**Dependencies:** CH01-C, LOC01-B, MU-01

**Invalidates If Changed:**
  - SHOT-03-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يجلس بثقل، يشرب، يحاول التنفس، وجهه يشتد. Music: single low cello note sustained
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-04-IMG — Phone on the Table (الهاتف على الطاولة)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-024 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 3s
**Characters:** CH01-C (يد فقط)
**Location:** LOC01-B
**Replacement Cost:** LOW
**Dependencies:** CH01-C, LOC01-B

**Invalidates If Changed:**
  - SHOT-04-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** هاتف على الطاولة، شاشة مقفلة. يده تمتد إليه ببطء
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-05-IMG — Emergency Room Entrance (دخول غرفة الطوارئ)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-025 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 8s
**Characters:** CH01-D (على النقالة)، CH05-A
**Location:** LOC02-B
**Replacement Cost:** HIGH
**Dependencies:** CH01-D, CH05-A, LOC02-B, VO-02, SFX-03

**Invalidates If Changed:**
  - SHOT-05-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** طوارئ — إضاءة فلورسنت — نقالة تدخل بسرعة — ممرضات يتحدثن. وجه الأب: مرتبك وخائف. VO: "في العالم الذي نعرفه..."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-06-IMG — Doctor with Paper File (الطبيب بالملف الورقي)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-026 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 7s
**Characters:** CH04-A
**Location:** LOC02-B
**Replacement Cost:** MEDIUM
**Dependencies:** CH04-A, LOC02-B, DLG-01, MU-01

**Invalidates If Changed:**
  - SHOT-06-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يقلب صفحات الملف الورقي، لا يجد شيئاً، محبط، يرفع نظره. Dialogue: "محتاجين ملفه... مين طبيبه المعالج؟"
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-07-IMG — Pharmacist Waiting (الصيدلاني ينتظر)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-027 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 6s
**Characters:** صيدلاني (شخصية ثانوية)
**Location:** LOC02-B (غرفة مجاورة)
**Replacement Cost:** LOW
**Dependencies:** LOC02-B, MU-01

**Invalidates If Changed:**
  - None (شخصية ثانوية مستقلة)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** صيدلاني على الهاتف ينتظر. نتائج المختبر لم تصل. نموذج تأمين غير موقع على الطاولة. Music: tension rises — clock-tick rhythm
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-08-IMG — Three Rapid Cuts: System Failure (ثلاث لقطات سريعة — فشل النظام)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-028 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 5s
**Characters:** ممرضة (شخصية ثانوية)
**Location:** LOC02-B
**Replacement Cost:** LOW
**Dependencies:** LOC02-B, SFX-04, SFX-05, SFX-08

**Invalidates If Changed:**
  - None (مونتاج ثانوي مستقل)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ثلاث صور للمونتاج: (1) آلة فاكس — ورقة تنحشر (2) ممرضة بكليبورد تنتظر تحميل النظام (3) هاتف يرن بدون رد. Audio: soft distorted beeping
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-09-IMG — Waiting Room: Daughter and Mother (غرفة الانتظار: الابنة والأم)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-029 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 6s
**Characters:** CH02-A، CH03-A
**Location:** LOC02-B (غرفة انتظار)
**Replacement Cost:** MEDIUM
**Dependencies:** CH02-A, CH03-A, LOC02-B, MU-01

**Invalidates If Changed:**
  - SHOT-09-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الابنة (12 سنة) وأمها جالستان. يدا الابنة متشابكتان. تنظر نحو الباب. Music: drops to near-silence
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-10-IMG — Father in Hospital Bed (الأب في سرير المستشفى)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-030 v1
**Generation Date:** __________
**Act:** 1
**Duration Target:** 8s
**Characters:** CH01-D
**Location:** LOC02-B (غرفة المستشفى)
**Replacement Cost:** HIGH
**Dependencies:** CH01-D, LOC02-B, VO-03

**Invalidates If Changed:**
  - None (لقطة نهائية — Act 1 climax)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** سرير المستشفى، IV attached، عيون مفتوحة ومتعبة. نجا — لكن وجهه يحمل ثقل ما كلفه تلك الليلة. VO: "نجا. لكن بعد ساعات من التأخير..."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-11-IMG — Title Card: Same Night (بطاقة العنوان: نفس الليلة)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Typography)
**Seed:** N/A
**Prompt Version:** P-031 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 2s
**Characters:** لا يوجد
**Location:** شاشة سوداء خالصة
**Replacement Cost:** LOW
**Dependencies:** None

**Invalidates If Changed:**
  - None

**Prompt (Final):**
```
N/A — Typography design
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** شاشة سوداء — نص أبيض مركزي:
`نفس الليلة.` / `The same night.`
White on pure black only. No motion graphics
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-12-IMG — Same Kitchen, SANAD Alert (نفس المطبخ، تنبيه SANAD)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-032 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 4s
**Characters:** CH01-C
**Location:** LOC01-C
**Replacement Cost:** MEDIUM
**Dependencies:** CH01-C, LOC01-C, VO-04, SFX-06

**Invalidates If Changed:**
  - SHOT-12-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس المطبخ بالضبط، نفس اللحظة — لكن شاشة الهاتف تضيء بـ quiet pulse من SANAD. VO: "لكن هذه المرة..."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-13-IMG — ER with SANAD: Nurse at Screen (طوارئ مع SANAD: ممرضة أمام الشاشة)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-033 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 5s
**Characters:** CH04-B، CH05-B
**Location:** LOC02-C
**Replacement Cost:** HIGH
**Dependencies:** CH04-B, CH05-B, LOC02-C, LOC03-A, DLG-02

**Invalidates If Changed:**
  - SHOT-13-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس إضاءة الفلورسنت لكن الإيقاع مختلف. الشاشة: LOC03-A. Doctor (calm): "عنده وارفارين — لا تعطوه أسبرين."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-14-IMG — AI Safety Check: CLEARED (فحص الأمان: تم التخليص)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-034 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 4s
**Characters:** لا يوجد (close-up على الشاشة)
**Location:** LOC03-B
**Replacement Cost:** MEDIUM
**Dependencies:** LOC03-B, SFX-06

**Invalidates If Changed:**
  - None (لقطة شاشة مستقلة)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** Green banner: AI Safety Check: CLEARED. Insurance: pre-approved. الفريق يتحرك أسرع. Audio: subtle tone — resolution, not alarm
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-15-IMG — Speed Montage: Lab / Pharmacy / Insurance (مونتاج السرعة)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-035 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 5s
**Characters:** لا يوجد
**Location:** LOC03-C
**Replacement Cost:** LOW
**Dependencies:** LOC03-C, MU-02

**Invalidates If Changed:**
  - None (مونتاج معلوماتي مستقل)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** مونتاج سريع — ثلاث ثوانٍ لكل:
→ Lab result transmitted: 90 seconds
→ Pharmacy dispense: authorized and flagged safe
→ Insurance form: auto-completed, sent
Music: rhythm shifts — lighter, coordinated
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-16-IMG — Network Visualization (تصور الشبكة)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-036 v1
**Generation Date:** __________
**Act:** 2
**Duration Target:** 8s
**Characters:** لا يوجد
**Location:** LOC04
**Replacement Cost:** MEDIUM
**Dependencies:** LOC04, VO-05, MU-02

**Invalidates If Changed:**
  - SHOT-16-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** Abstract visualization — NOT map of Saudi Arabia. 2D line-drawing. 5 nodes → center glow. VO: "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-17-IMG — Father Coming Home (الأب يعود للبيت)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-037 v1
**Generation Date:** __________
**Act:** 3
**Duration Target:** 5s
**Characters:** CH01-E
**Location:** LOC05-B
**Replacement Cost:** HIGH
**Dependencies:** CH01-E, LOC05-B, MU-03

**Invalidates If Changed:**
  - SHOT-17-VID
  - SHOT-18-IMG (mood continuity — يجب أن يكون الانتقال سلساً)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** خارج المنزل — نهاراً — سيارة في الممر — الأب يخرج أبطأ من المعتاد، لكن منتصب القامة. حي. عائد
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-18-IMG — The Hug (العناق)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-038 v1
**Generation Date:** __________
**Act:** 3
**Duration Target:** 8s
**Characters:** CH01-F، CH02-C، CH03-B
**Location:** LOC05-C
**Replacement Cost:** CRITICAL
**Dependencies:** CH01-F, CH02-B, CH02-C, CH03-B, LOC05-C, MU-03

**Invalidates If Changed:**
  - SHOT-18-VID (إعادة توليد كاملة إلزامية)

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ مهم جداً — Medium shot — لا close-up على الوجوه. الابنة تجري، تتوقف خطوة واحدة قبله، تنظر لأعلى. العناق هادئ وحقيقي. الأم في خلفية الباب. Music: single piano note, then another — nothing more
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-19-IMG — Slow Fade to Black (تلاشي بطيء للأسود)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Post-production)
**Seed:** N/A
**Prompt Version:** P-039 v1
**Generation Date:** __________
**Act:** 3
**Duration Target:** 3s
**Characters:** لا يوجد
**Location:** Transition
**Replacement Cost:** LOW
**Dependencies:** SHOT-18-VID (يجب أن يأتي بعده مباشرة)

**Invalidates If Changed:**
  - None

**Prompt (Final):**
```
N/A — Post-production transition
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** SLOW FADE TO BLACK — ثم صمت كامل لثانية واحدة. لا موسيقى. لا VO
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-20-IMG — Title Card: "Today One Patient Was Saved" (بطاقة النص: اليوم)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Typography)
**Seed:** N/A
**Prompt Version:** P-040 v1
**Generation Date:** __________
**Act:** 3
**Duration Target:** 4s
**Characters:** لا يوجد
**Location:** شاشة سوداء
**Replacement Cost:** LOW
**Dependencies:** SHOT-19-IMG (sequence dependency)

**Invalidates If Changed:**
  - SHOT-21-IMG (sequence dependency — يجب أن يكون التصميم متسقاً)

**Prompt (Final):**
```
N/A — Typography design
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** شاشة سوداء — نص أبيض عربي كبير مركزي:
`اليوم تُم إنقاذ مريض.`
لا موسيقى. لا VO. الكلمات وحدها
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-21-IMG — Title Card: "Tomorrow Millions" (بطاقة النص: غداً)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Typography)
**Seed:** N/A
**Prompt Version:** P-041 v1
**Generation Date:** __________
**Act:** 3
**Duration Target:** 3s
**Characters:** لا يوجد
**Location:** شاشة سوداء
**Replacement Cost:** LOW
**Dependencies:** SHOT-20-IMG (sequence — النص السابق يتلاشى)

**Invalidates If Changed:**
  - None

**Prompt (Final):**
```
N/A — Typography design
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس الشاشة السوداء — النص السابق يتلاشى، نص جديد يظهر:
`وغدًا يمكن إنقاذ ملايين.`
الصمت يستمر
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-22-IMG — National Montage (مونتاج وطني)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-042 v1
**Generation Date:** __________
**Act:** 4
**Duration Target:** 10s
**Characters:** شخصيات متعددة (ثانوية)
**Location:** مواقع متعددة
**Replacement Cost:** MEDIUM
**Dependencies:** VO-06, MU-04

**Invalidates If Changed:**
  - SHOT-22-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** 6 مشاهد سريعة — cinematic, NOT stock:
(1) فني مختبر ليلاً يشغّل نتيجة (2) صيدلاني: red flag → green override (3) مسعف في سيارة يستقبل ملفاً على تابلت (4) طبيب في ممر يراجع dashboard (5) موظف تأمين يوافق في ثوانٍ (6) مريضة مسنة تتصل بطبيبها عبر الفيديو
VO: "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل."
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-23-IMG — Aerial City at Night (مدينة من الجو ليلاً)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-043 v1
**Generation Date:** __________
**Act:** 4
**Duration Target:** 5s
**Characters:** لا يوجد
**Location:** مدينة سعودية — جوي
**Replacement Cost:** LOW
**Dependencies:** VO-07, MU-04

**Invalidates If Changed:**
  - SHOT-23-VID

**Prompt (Final):**
```
__________
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ UPDATED VO — النص المعتمد:
"المملكة العربية السعودية تبني منظومة صحية تعمل كما ينبغي."
(تم تغيير "تستحق" إلى "تبني")
مدينة من الجو ليلاً — أضواء، حركة، حياة
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-24-IMG — Slow Fade to White (تلاشي بطيء للأبيض)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Post-production)
**Seed:** N/A
**Prompt Version:** P-044 v1
**Generation Date:** __________
**Act:** 4
**Duration Target:** 4s
**Characters:** لا يوجد
**Location:** Transition
**Replacement Cost:** LOW
**Dependencies:** SHOT-23-VID, MU-04

**Invalidates If Changed:**
  - None

**Prompt (Final):**
```
N/A — Post-production transition
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** SLOW FADE TO WHITE — الموسيقى تمسك على النوتة الأخيرة
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-25-IMG — SANAD Logo (شعار SANAD)

**Type:** Shot-Image
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** N/A (Brand asset)
**Seed:** N/A
**Prompt Version:** P-045 v1
**Generation Date:** __________
**Act:** 4
**Duration Target:** 5s
**Characters:** لا يوجد
**Location:** خلفية بيضاء
**Replacement Cost:** CRITICAL
**Dependencies:** SHOT-24-IMG (الخلفية البيضاء تأتي منه), MU-05

**Invalidates If Changed:**
  - كل مواد التسويق المرتبطة بالفيديو لو تغير الشعار

**Prompt (Final):**
```
N/A — Brand design asset
```

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** SANAD wordmark على خلفية بيضاء. تحته (أصغر):
`لكل قرارٍ سند.` / `Behind Every Decision.`
Audio: صمت → نفَس واحد من الموسيقى المحيطة → انتهاء
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 4 — SHOTS: VIDEOS (لقطات الفيديو)

> الـ Shots التي تحتاج توليد فيديو (حركة). الـ Shots الثابتة (01، 11، 19، 20، 21، 24، 25) لا تحتاج video generation.

---

### SHOT-02-VID — The Father in Kitchen (الأب في المطبخ)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-022 v1
**Generation Date:** __________
**Source Image:** SHOT-02-IMG
**Motion:** الأب يصب الماء ببطء، يتوقف، يضع يده على صدره
**Camera:** STATIC — مع drift خفيف
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-02-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None (نهاية سلسلة التبعية)

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الحركة هادئة وطبيعية — لا مبالغة
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-03-VID — Father Sits and Breathes (يجلس ويتنفس)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-023 v1
**Generation Date:** __________
**Source Image:** SHOT-03-IMG
**Motion:** يجلس بثقل، صدره يرتفع وينزل، وجهه يشتد
**Camera:** STATIC
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-03-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-04-VID — Hand Reaching for Phone (يد تمتد للهاتف)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-024 v1
**Generation Date:** __________
**Source Image:** SHOT-04-IMG
**Motion:** يد تمتد ببطء نحو الهاتف على الطاولة
**Camera:** STATIC — close on table
**Replacement Cost:** LOW
**Dependencies:** SHOT-04-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-05-VID — Stretcher Rushing In (النقالة تدخل بسرعة)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-025 v1
**Generation Date:** __________
**Source Image:** SHOT-05-IMG
**Motion:** نقالة تدخل بسرعة — ممرضات تتحرك — الكاميرا تتبع الحركة
**Camera:** FOLLOW
**Replacement Cost:** HIGH
**Dependencies:** SHOT-05-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-06-VID — Doctor Flipping Pages (الطبيب يقلب الصفحات)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-026 v1
**Generation Date:** __________
**Source Image:** SHOT-06-IMG
**Motion:** يقلب صفحات الملف الورقي، يتوقف، يرفع نظره بإحباط
**Camera:** STATIC — slight push in
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-06-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-09-VID — Daughter Looking at the Door (الابنة تنظر للباب)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-029 v1
**Generation Date:** __________
**Source Image:** SHOT-09-IMG
**Motion:** الابنة تحرك نظرها ببطء نحو الباب. الأم ثابتة
**Camera:** STATIC
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-09-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-12-VID — Phone Screen Lights Up (شاشة الهاتف تضيء)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-032 v1
**Generation Date:** __________
**Source Image:** SHOT-12-IMG
**Motion:** شاشة الهاتف تضيء بـ quiet pulse — الأب ينظر إليها
**Camera:** STATIC — drift خفيف نحو الهاتف
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-12-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-13-VID — Nurse at SANAD Screen (الممرضة أمام شاشة SANAD)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-033 v1
**Generation Date:** __________
**Source Image:** SHOT-13-IMG
**Motion:** الممرضة تتحرك أمام الشاشة — الطبيب يعطي أمراً — الفريق يستجيب
**Camera:** STATIC — slight rack focus
**Replacement Cost:** HIGH
**Dependencies:** SHOT-13-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-16-VID — Network Animation (أنيميشن الشبكة)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-036 v1
**Generation Date:** __________
**Source Image:** LOC04
**Motion:** 5 nodes تظهر واحدة تلو الأخرى → خطوط تتصل → نقطة مركزية تتوهج
**Camera:** STATIC — 2D animation
**Replacement Cost:** MEDIUM
**Dependencies:** LOC04 (must be LOCKED first), SHOT-16-IMG

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** 2D line-drawing — NOT 3D. الأنيميشن يتزامن مع VO
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-17-VID — Car Pulling Into Driveway (السيارة تدخل في الممر)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-037 v1
**Generation Date:** __________
**Source Image:** SHOT-17-IMG
**Motion:** سيارة تدخل في الممر — الأب يخرج ببطء — يتوقف لحظة
**Camera:** STATIC — wide
**Replacement Cost:** HIGH
**Dependencies:** SHOT-17-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-18-VID — The Hug (العناق)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-038 v1
**Generation Date:** __________
**Source Image:** SHOT-18-IMG
**Motion:** الباب يُفتح → الابنة تجري → تتوقف → العناق الهادئ
**Camera:** STATIC — medium shot, NO close-up
**Replacement Cost:** CRITICAL
**Dependencies:** SHOT-18-IMG (must be LOCKED first — CRITICAL dependency)

**Invalidates If Changed:**
  - None (نهاية سلسلة التبعية — أهم لقطة في الفيلم)

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ أهم لقطة في الفيلم — medium shot فقط. لا close-up على الوجوه
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-22-VID — National Montage Motion (مونتاج وطني بالحركة)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-042 v1
**Generation Date:** __________
**Source Image:** SHOT-22-IMG
**Motion:** 6 لقطات سريعة — كل لقطة بها حركة خاصة
**Camera:** متنوع — FOLLOW / PAN / STATIC
**Replacement Cost:** MEDIUM
**Dependencies:** SHOT-22-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** cinematic, NOT stock. كل لقطة من الـ 6 قد تحتاج file منفصل
**Locked By:** __________ | **Lock Date:** __________

---

### SHOT-23-VID — Aerial City (المدينة من الجو)

**Type:** Shot-Video
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-043 v1
**Generation Date:** __________
**Source Image:** SHOT-23-IMG
**Motion:** حركة جوية بطيئة فوق المدينة ليلاً
**Camera:** SLOW PAN — aerial
**Replacement Cost:** LOW
**Dependencies:** SHOT-23-IMG (must be LOCKED first)

**Invalidates If Changed:**
  - None

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 5 — AUDIO: VOICE OVER (الصوت: تعليق صوتي)

---

### VO-01 — "لا شيء يُنبئ بما سيأتي."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 02
**Replacement Cost:** LOW
**Dependencies:** None (صوت مستقل)

**Invalidates If Changed:**
  - SHOT-02-VID (إعادة مزج صوتي)

**النص الكامل:**
> "لا شيء يُنبئ بما سيأتي."
> *Subtitle: "Nothing warned what was coming."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** صوت ذكر، الأربعينيات، إيقاع متأنٍّ — ليس مذيعاً، ليس درامياً
**Locked By:** __________ | **Lock Date:** __________

---

### VO-02 — "في العالم الذي نعرفه..."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 05
**Replacement Cost:** LOW
**Dependencies:** VO-01 (نفس الصوت — consistency)

**Invalidates If Changed:**
  - SHOT-05-VID (إعادة مزج صوتي)

**النص الكامل:**
> "في العالم الذي نعرفه..."
> *Subtitle: "In the world we know..."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### VO-03 — "نجا." [pause] "لكن بعد ساعات..."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 10
**Replacement Cost:** MEDIUM
**Dependencies:** VO-01, VO-02 (نفس الصوت — consistency critical)

**Invalidates If Changed:**
  - SHOT-10-IMG (إعادة مزج صوتي — الـ timing مرتبط)

**النص الكامل:**
> "نجا."
> [pause — beat]
> "لكن بعد ساعات من التأخير. مضاعفات لم تكن ضرورية. أيام إضافية في المستشفى. وتكلفة أثقلت الأسرة."
> *Subtitle: "He survived. But after hours of delay. Complications that weren't necessary. Extra days in hospital. A cost that burdened his family."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الـ pause بعد "نجا." مهمة جداً — تسمح للكلمة أن تستقر
**Locked By:** __________ | **Lock Date:** __________

---

### VO-04 — "لكن هذه المرة..."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 12
**Replacement Cost:** LOW
**Dependencies:** VO-01, VO-02, VO-03 (نفس الصوت — نبرة مختلفة)

**Invalidates If Changed:**
  - SHOT-12-VID (إعادة مزج صوتي)

**النص الكامل:**
> "لكن هذه المرة..."
> *Subtitle: "But this time..."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** تحول في النبرة — نفس الصوت، لكن أخف
**Locked By:** __________ | **Lock Date:** __________

---

### VO-05 — "سند لا يستبدل الأطباء..."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 16
**Replacement Cost:** MEDIUM
**Dependencies:** VO-01, VO-04 (نفس الصوت — الجملة المحورية)

**Invalidates If Changed:**
  - SHOT-16-VID (إعادة مزج صوتي)

**النص الكامل:**
> "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة."
> *Subtitle: "SANAD doesn't replace doctors. SANAD connects every party at the critical moment."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** أهم جملة في الفيلم من ناحية الرسالة — الإيقاع محسوب
**Locked By:** __________ | **Lock Date:** __________

---

### VO-06 — "في كل مستشفى..."

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 22
**Replacement Cost:** LOW
**Dependencies:** VO-01, VO-05 (نفس الصوت)

**Invalidates If Changed:**
  - SHOT-22-VID (إعادة مزج صوتي)

**النص الكامل:**
> "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل."
> *Subtitle: "In every hospital. Every pharmacy. Every ER. Every home."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** إيقاع الجمل القصيرة المتتالية — يتصاعد مع الموسيقى
**Locked By:** __________ | **Lock Date:** __________

---

### VO-07 — "المملكة العربية السعودية تبني..." — UPDATED

**Type:** Audio — Voice Over
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 23
**Replacement Cost:** LOW
**Dependencies:** VO-01, VO-06 (نفس الصوت — الجملة الختامية)

**Invalidates If Changed:**
  - SHOT-23-VID (إعادة مزج صوتي)

**النص الكامل:**
> "المملكة العربية السعودية تبني منظومة صحية تعمل كما ينبغي."
> *Subtitle: "Saudi Arabia is building a health system that works as it should."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ UPDATED — تم تغيير "تستحق" إلى "تبني" — الفعل النشط أقوى في السياق
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 6 — AUDIO: DIALOGUE (الصوت: الحوار)

---

### DLG-01 — "محتاجين ملفه..."

**Type:** Audio — Dialogue
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 06
**Speaker:** CH04-A (الطبيب)
**Replacement Cost:** LOW
**Dependencies:** CH04-A (voice must match character)

**Invalidates If Changed:**
  - SHOT-06-VID (إعادة مزج صوتي)

**النص الكامل:**
> "محتاجين ملفه... مين طبيبه المعالج؟"
> *Subtitle: "We need his file... who is his doctor?"*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** همس متداخل مع أصوات أخرى — overlapping dialogue — ليس حواراً رسمياً
**Locked By:** __________ | **Lock Date:** __________

---

### DLG-02 — "عنده وارفارين — لا تعطوه أسبرين."

**Type:** Audio — Dialogue
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 13
**Speaker:** CH04-B (الطبيب)
**Replacement Cost:** MEDIUM
**Dependencies:** CH04-B (نفس الصوت كـ DLG-01 — consistency critical), DLG-01

**Invalidates If Changed:**
  - SHOT-13-VID (إعادة مزج صوتي)

**النص الكامل:**
> "عنده وارفارين — لا تعطوه أسبرين."
> *Subtitle: "He's on Warfarin — no aspirin."*

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نبرة هادئة وحاسمة — الثقة من المعلومة، ليس من الصراخ
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 7 — AUDIO: MUSIC (الصوت: الموسيقى)

---

### MU-01 — Act 1 Tension: Cello (توتر الفصل الأول — تشيلو)

**Type:** Audio — Music
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 02 → Shot 10
**Replacement Cost:** HIGH
**Dependencies:** None (موسيقى أساسية للفصل الأول)

**Invalidates If Changed:**
  - MU-02 (يجب أن يتصل بها بسلاسة — continuity)
  - مزج الصوت لجميع لقطات Act 1

**وصف:**
نوتة تشيلو منخفضة واحدة — sustained. تتصاعد ببطء مع الإيقاع. Clock-tick rhythm يدخل في Shot 07. يخف تقريباً للصمت في Shot 09.

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** مرجع: Hans Zimmer "Time" (Inception) — الصبر، ليس الذروة
**Locked By:** __________ | **Lock Date:** __________

---

### MU-02 — Act 2 Resolved (الفصل الثاني — حل)

**Type:** Audio — Music
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 12 → Shot 16
**Replacement Cost:** HIGH
**Dependencies:** MU-01 (يجب أن تتصل بسلاسة)

**Invalidates If Changed:**
  - MU-03 (continuity)
  - مزج الصوت لجميع لقطات Act 2

**وصف:**
نفس الـ tempo لكن أخف وأنظف. الإيقاع منسق وليس فوضوياً. subtle tone of resolution عند Shot 14.

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** نفس الموسيقى تقريباً لكن في "عالم مختلف" — color grade الموسيقى يتغير مع color grade الصورة
**Locked By:** __________ | **Lock Date:** __________

---

### MU-03 — Act 3 Piano (الفصل الثالث — بيانو)

**Type:** Audio — Music
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 17 → Shot 21
**Replacement Cost:** MEDIUM
**Dependencies:** MU-02 (emotional transition)

**Invalidates If Changed:**
  - SHOT-18-VID (الموسيقى جزء لا يتجزأ من اللحظة)
  - MU-04 (continuity)

**وصف:**
نوتة بيانو واحدة. ثم نوتة ثانية. لا شيء أكثر. الصمت بين النوتتين مهم بقدر النوتتين.

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** أبسط موسيقى في الفيلم وأقواها عاطفياً — لا تزيد عليها
**Locked By:** __________ | **Lock Date:** __________

---

### MU-04 — Act 4 Orchestral Rise (الفصل الرابع — انتشار أوركسترالي)

**Type:** Audio — Music
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 22 → Shot 24
**Replacement Cost:** MEDIUM
**Dependencies:** MU-03 (emotional crescendo — يتبعها)

**Invalidates If Changed:**
  - MU-05 (continuity)
  - مزج الصوت لجميع لقطات Act 4

**وصف:**
موسيقى أوركسترالية تتصاعد — hopeful, purposeful. ليس triumphant. يمسك على النوتة الأخيرة مع Fade to White.

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الفرق بين hopeful وtriumphant مهم — لا نبالغ
**Locked By:** __________ | **Lock Date:** __________

---

### MU-05 — Logo Breath (نفَس الشعار)

**Type:** Audio — Music
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 25
**Replacement Cost:** LOW
**Dependencies:** MU-04 (الصمت يأتي بعدها)

**Invalidates If Changed:**
  - None (نهاية الفيلم)

**وصف:**
صمت → نفَس واحد من الموسيقى المحيطة (ambient breath) → انتهاء تام.

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ختام هادئ — الفيلم ينتهي كما بدأ: بالصمت
**Locked By:** __________ | **Lock Date:** __________

---

# SECTION 8 — AUDIO: SFX (المؤثرات الصوتية)

---

### SFX-01 — Car Door Slam (طرق باب السيارة)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 01
**Replacement Cost:** LOW
**Dependencies:** None

**Invalidates If Changed:**
  - None (مؤثر صوتي مستقل)

**وصف:** صوت إغلاق باب سيارة — حاد وواضح — في الصمت الليلي

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** أول صوت في الفيلم — يجب أن يكون حاداً ومفاجئاً
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-02 — Keys Dropping (مفاتيح تسقط)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 01
**Replacement Cost:** LOW
**Dependencies:** SFX-01 (يأتي بعده مباشرة — sequence)

**Invalidates If Changed:**
  - None

**وصف:** صوت مفاتيح تسقط على سطح صلب (طاولة أو أرض)

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** يأتي بعد SFX-01 مباشرة — الشخصية منهكة من يومها
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-03 — Hospital Ambience (أجواء المستشفى)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 05، Shot 06، Shot 07، Shot 08
**Replacement Cost:** LOW
**Dependencies:** None

**Invalidates If Changed:**
  - None (خلفية صوتية مستقلة)

**وصف:** ضجيج خلفية مستشفى — أصوات متداخلة — beeping أجهزة خافتة

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** الفوضى في الصوت تعكس الفوضى في الصورة
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-04 — Fax Machine Jam (انحشار الفاكس)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 08
**Replacement Cost:** LOW
**Dependencies:** SFX-03 (layer on top of hospital ambience)

**Invalidates If Changed:**
  - None

**وصف:** صوت آلة فاكس تعمل ثم تنحشر — خشخشة ورق وتوقف

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** رمز للنظام القديم المعطل
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-05 — Unanswered Phone Ringing (هاتف يرن بدون رد)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 08
**Replacement Cost:** LOW
**Dependencies:** None

**Invalidates If Changed:**
  - None

**وصف:** هاتف مكتب يرن مرتين أو ثلاثاً — لا أحد يرد

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** __________
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-06 — SANAD Alert Tone (نبرة تنبيه SANAD)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 12، Shot 14
**Replacement Cost:** MEDIUM
**Dependencies:** None

**Invalidates If Changed:**
  - SHOT-12-VID, SHOT-14-IMG (إعادة مزج صوتي إذا تغير الـ tone)

**وصف:** نبرة هادئة وناعمة — resolution وليس alarm. نغمة إيجابية خافتة

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ⚠️ مهم — هذا الصوت يعكس الفلسفة: SANAD يُطمئن، لا يُخيف
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-07 — Suburban Night Sounds (أصوات الليل في الضاحية)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 01، Shot 02
**Replacement Cost:** LOW
**Dependencies:** None

**Invalidates If Changed:**
  - None

**وصف:** أصوات ليلية هادئة في ضاحية — ربما صرصار أو ريح خفيفة — عادية وهادئة

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** Layer خلفي — يُؤسس للإحساس بالحياة الاعتيادية قبل الحدث
**Locked By:** __________ | **Lock Date:** __________

---

### SFX-08 — Distorted Beeping / Overwhelm (صوت Beep مشوه — إحساس الإرهاق)

**Type:** Audio — SFX
**Status:** TODO
**Version:** v1
**File:** __________
**Model:** __________
**Seed:** __________
**Prompt Version:** P-046 v1
**Generation Date:** __________
**Used In Shots:** Shot 08
**Replacement Cost:** LOW
**Dependencies:** SFX-03 (layer on top of hospital ambience)

**Invalidates If Changed:**
  - None

**وصف:** beeping طبي خافت ومشوه — إحساس بالإرهاق وعدم التنسيق

**QA Result:**
- [ ] QA L1 (Technical): PASS/FAIL — __________
- [ ] QA L2 (Consistency): PASS/FAIL — __________
- [ ] QA L3 (Story/Message): PASS/FAIL — __________

**Notes:** ليس beep حاد — مشوه وغير منتظم — يعكس الفوضى لا الخطر المباشر
**Locked By:** __________ | **Lock Date:** __________

---

*سجل الأصول — SANAD Health Intelligence Platform — Investor Cut*
*إصدار: v2.0 — 2026-07-01*
*إجمالي الأصول: 90 asset عبر 8 أقسام*
