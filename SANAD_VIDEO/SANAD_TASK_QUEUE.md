# SANAD Investor Cut — Task Queue
**فيديو 2:30–3:00 دق | 25 Shot | 4 Acts | إنتاج AI**
آخر تحديث: 2026-07-01

---

## Kanban Board

| TODO | READY | GENERATING | QA | APPROVED | LOCKED | REJECTED |
|------|-------|------------|----|-----------|---------| ---------|
| T-012 | T-001 | — | — | — | — | — |
| T-013 | T-002 | — | — | — | — | — |
| T-014 | T-003 | — | — | — | — | — |
| T-015 | T-011 | — | — | — | — | — |
| T-016 | T-021 | — | — | — | — | — |
| T-021→T-056 | T-022 | — | — | — | — | — |
| T-060 | T-023 | — | — | — | — | — |
| T-071→T-074 | T-024 | — | — | — | — | — |
| T-081→T-083 | T-025 | — | — | — | — | — |

> انقل كل مهمة يدوياً بين الأعمدة أثناء التنفيذ.

---

## جدول المهام الكامل

### PHASE 1 — Pre-Production | Script Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-001 | READY | Script Dept | Claude / GPT | — | مسودة القصة، 4 Acts | نص VO نهائي (7 سطور) | 🔴 |
| T-002 | READY | Script Dept | Claude / GPT | T-001 | نص VO + وصف كل Shot | Base Prompt Template لكل شخصية ومكان | 🔴 |
| T-003 | READY | Script Dept | Human | — | مقارنة أدوات AI | قرار نموذج الصور + قرار نموذج الفيديو (مقفول) | 🔴 |

---

### PHASE 2 — Character Sheets | Actor Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-011 | READY | Actor Dept | Image AI | T-002, T-003 | Prompt الأب (Arabic 50s, كوفية) | 6 reference images (وجوه، زوايا، ملابس) | 🔴 |
| T-012 | TODO | Actor Dept | Image AI | T-011 | Prompt البنت + صورة الأب للـ consistency | 3 reference images | 🔴 |
| T-013 | TODO | Actor Dept | Image AI | T-011 | Prompt الأم + صورة الأب | 2 reference images | 🟡 |
| T-014 | TODO | Actor Dept | Image AI | T-002 | Prompt الدكتور (بدلة طبية) | 2 reference images | 🟡 |
| T-015 | TODO | Actor Dept | Image AI | T-002 | Prompt الممرضة | 2 reference images | 🟢 |
| T-016 | TODO | Actor Dept | Vision AI | T-011 → T-015 | كل الـ reference images | تقرير consistency QA + رفض أي صورة فيها تعارض | 🔴 |

---

### PHASE 3 — Locations | Art Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-021 | READY | Art Dept | Image AI | T-002, T-003 | Prompt مطبخ سعودي (صباح، إضاءة دافئة) | 3 variants (زاوية مختلفة) | 🟡 |
| T-022 | READY | Art Dept | Image AI | T-002 | Prompt قسم طوارئ (فارغ أولاً) | 3 variants (ليلاً، فوضى، هدوء) | 🔴 |
| T-023 | READY | Art Dept | UI Design | — | Dashboard SANAD الفعلي (screenshot) | 3 UI screens (دم، مخدر، تحليل) | 🔴 |
| T-024 | TODO | Art Dept | Motion | — | مفهوم شبكة المستشفيات الوطنية | Animation مدة 5–8 ثواني (network nodes) | 🟡 |
| T-025 | READY | Art Dept | Image AI | T-002 | Prompt منزل سعودي خارجي (مساء، هادئ) | 2 variants | 🟡 |

---

### PHASE 4 — Shot Images | Camera Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-031 | TODO | Camera Dept | Audio | — | — | Shot 01: صوت أم + أصوات مطبخ (audio only) | 🟡 |
| T-032 | TODO | Camera Dept | Image AI | T-011, T-021 | Prompt: أب يفطر في المطبخ، إضاءة صباحية | Shot 02: صورة واحدة approved | 🔴 |
| T-033 | TODO | Camera Dept | Image AI | T-011, T-021 | Prompt: أب يجلس فجأة، يمسك صدره | Shot 03: صورة واحدة approved | 🟡 |
| T-034 | TODO | Camera Dept | Image AI | T-021 | Prompt: هاتف يسقط على أرضية المطبخ (CU) | Shot 04: صورة واحدة approved | 🟢 |
| T-035 | TODO | Camera Dept | Image AI | T-011, T-022 | Prompt: أب يُدخل على كرسي متحرك لمدخل الطوارئ | Shot 05: صورة واحدة approved | 🟡 |
| T-036 | TODO | Camera Dept | Image AI | T-014, T-022 | Prompt: دكتور يحمل ملف ورقي ويبدو محتاراً | Shot 06: صورة واحدة approved | 🔴 |
| T-037 | TODO | Camera Dept | Image AI | T-002 | Prompt: صيدلي يبحث في أدراج مستعجل | Shot 07: صورة واحدة approved | 🟢 |
| T-038 | TODO | Camera Dept | Image AI | T-015 | Prompt: 3 cuts فوضى (ممرضة، أوراق، انتظار) | Shot 08: 3 صور quick cuts | 🟢 |
| T-039 | TODO | Camera Dept | Image AI | T-012, T-013 | Prompt: بنت وأم في غرفة انتظار، وجه قلق | Shot 09: صورة واحدة approved | 🔴 |
| T-040 | TODO | Camera Dept | Image AI | T-011 | Prompt: أب في سرير المستشفى، وجه شاحب | Shot 10: صورة واحدة approved | 🔴 |
| T-041 | TODO | Camera Dept | Motion | — | نص: "ماذا لو كان هناك طريق أفضل؟" | Shot 11: Title card motion (3 ثواني) | 🟡 |
| T-042 | TODO | Camera Dept | Image AI | T-011, T-021, T-023 | Prompt: أب في المطبخ + شاشة SANAD تظهر في الخلفية | Shot 12: صورة واحدة approved | 🟡 |
| T-043 | TODO | Camera Dept | Image AI | T-014, T-022, T-023 | Prompt: دكتور ينظر لشاشة SANAD في الطوارئ | Shot 13: صورة واحدة approved | 🔴 |
| T-044 | TODO | Camera Dept | UI | T-023 | شاشة SANAD: drug interaction alert (animation) | Shot 14: UI screen recording 3 ثواني | 🔴 |
| T-045 | TODO | Camera Dept | UI + Image AI | T-023 | 3 cuts: مرضى + شاشات SANAD تعمل | Shot 15: 3 صور quick cuts | 🟡 |
| T-046 | TODO | Camera Dept | Motion | T-024 | Network animation جاهزة | Shot 16: render نهائي مع sound | 🟡 |
| T-047 | TODO | Camera Dept | Image AI | T-011, T-025 | Prompt: أب يصل للمنزل ببطء، مساء | Shot 17: صورة واحدة approved | 🔴 |
| T-048 | TODO | Camera Dept | Image AI | T-011, T-012, T-013, T-025 | Prompt: أب + بنت + أم عناق أمام المنزل | Shot 18: صورة واحدة approved ← **HERO SHOT** | 🔴 |
| T-049 | TODO | Camera Dept | Edit | T-048 | Shot 18 approved | Shot 19: Fade to black (transition) | 🟡 |
| T-050 | TODO | Camera Dept | Motion | — | نص: "SANAD — منصة الرعاية الصحية الوطنية" | Shot 20: Title 1 motion (4 ثواني) | 🔴 |
| T-051 | TODO | Camera Dept | Motion | T-050 | نص: رقم المرضى / المستشفيات / الدقة | Shot 21: Title 2 / Traction Stats (4 ثواني) | 🔴 |
| T-052 | TODO | Camera Dept | Image AI | T-022, T-023 | Prompt: montage سريع لمستشفيات + شاشات SANAD | Shot 22: 4–5 صور للـ montage | 🟡 |
| T-053 | TODO | Camera Dept | Image / Stock | — | Prompt: جوي للرياض ليلاً (أضواء المدينة) | Shot 23: صورة أو footage جاهز | 🟡 |
| T-054 | TODO | Camera Dept | Edit | T-053 | Shot 23 approved | Shot 24: Fade to white (transition) | 🟡 |
| T-055 | TODO | Camera Dept | Motion | — | شعار SANAD الرسمي | Shot 25: Logo reveal (3 ثواني) | 🟡 |
| T-056 | TODO | Camera Dept | Motion | — | أرقام Traction (مرضى، مستشفيات، دقة) | Shot 25B: Stats counter animation | 🟡 |

---

### PHASE 5 — Video Generation | Video Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-060 | TODO | Video Dept | Video AI (Kling/Runway) | T-032 → T-048, T-052, T-053 | كل الصور approved (Shots 02–18, 22–23) | كليبات فيديو 3–6 ثواني لكل Shot | 🔴 |

> ملاحظة: T-060 تُنفذ Shot بـ Shot فور approval الصورة — لا تنتظر كل الصور.

---

### PHASE 6 — Audio | Sound Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-071 | TODO | Sound Dept | ElevenLabs | T-001 | نص VO النهائي (7 سطور، عربي فصيح) | 7 ملفات صوتية VO مرتبة | 🔴 |
| T-072 | TODO | Sound Dept | ElevenLabs | T-001 | نص حوار طبي (2 سطور، صوت دكتور) | 2 ملفات صوتية حوار | 🟡 |
| T-073 | TODO | Sound Dept | Suno / Udio | T-003 | Direction موسيقي: emotional → hopeful | 5 tracks (Act 1 tension / Act 2 relief / Act 3 warm / Act 4 epic / outro) | 🟡 |
| T-074 | TODO | Sound Dept | Freesound | — | قائمة SFX: هاتف، طوارئ، قلب، باب، خطوات، تنبيه UI، نبض، شاشة | 8 SFX files | 🟢 |

---

### PHASE 7 — Assembly | Edit Dept

| Task ID | الحالة | القسم | AI Owner | Dependencies | المدخلات | المخرجات | الأولوية |
|---------|--------|-------|----------|--------------|----------|----------|---------|
| T-081 | TODO | Edit Dept | Human + DaVinci Resolve | T-060, T-071, T-072, T-073, T-074 | كل الـ assets جاهزة | مونتاج أول — rough cut 2:30–3:00 دق | 🔴 |
| T-082 | TODO | Edit Dept | Vision AI + Human | T-081 | Rough cut | 3 جولات QA: timing / consistency / message | 🔴 |
| T-083 | TODO | Edit Dept | Human | T-082 | Final approved cut | MP4 4K + Subtitles + Thumbnail | 🔴 |

---

## Critical Path

المهام التي لو تأخرت تأخر المشروع كله:

```
T-003 (Tool Decision Lock) ─────────────────────────────────┐
  │                                                          │
  ▼                                                          ▼
T-011 (Father — 6 images)                              T-022 (ER Location)
  │                                                          │
  ├──► T-012 (Daughter)                              T-023 (SANAD UI Screens)
  │         │                                               │
  │         └──────────────────────────────────────────────┤
  │                                                         │
  ▼                                                         ▼
T-048 (Shot 18 — The Hug) ◄── T-013 (Mother) ◄────── T-043 (Shot 13 ER+SANAD)
  │
  ▼
T-016 (Character Consistency QA)
  │
  ▼
T-060 (Video Generation — كل الـ Shots)
  │
  ▼
T-071 (VO Recording)
  │
  ▼
T-081 (Edit Assembly)
  │
  ▼
T-082 (QA Review × 3)
  │
  ▼
T-083 (Final Export) ← DONE
```

**الأصل الأكثر خطورة:** T-048 (Shot 18 — The Hug) — يعتمد على 4 شخصيات + location. أي تأخر فيه يوقف المونتاج.

---

## Day 1 Checklist — ابدأ هنا

```
□ T-003  اختر نموذج الصور (Midjourney / Flux) ونموذج الفيديو (Kling / Runway) — قرار لا رجعة عنه
□ T-001  راجع نص الـ VO النهائي بعد التعديلات الأخيرة (7 سطور، عربي فصيح)
□ T-011  ابدأ توليد شخصية الأب فقط — 6 صور (وجوه + زوايا مختلفة + ملابس)
□ T-022  ابدأ توليد غرفة الطوارئ — فارغة أولاً ثم 3 variants
□ T-023  اصمم شاشة SANAD من الـ Dashboard الفعلي (screenshot → UI mockup)
```

> تفاصيل كل مهمة موجودة في `SANAD_AI_PRODUCTION_MANAGER.md`
