# SANAD — AI Production Operating System (AI-POS)
**نظام تشغيل الإنتاج بالذكاء الاصطناعي**  
Version: 1.0 | 2026-07-01

---

## ما هو الـ AI-POS؟

الـ AI-POS هو النظام الذي يربط بين كل وثائق الإنتاج ويحوّلها من **أفكار** إلى **عمليات قابلة للتنفيذ**.

```
مدخلات المشروع
    ↓
00_Project Charter (هذا الملف — القرارات الاستراتيجية)
    ↓
01_Production Bible (الهوية البصرية والأسلوب)
    ↓
02_Task Queue (SANAD_TASK_QUEUE.md — ماذا تعمل الآن)
    ↓
03_Asset Registry (SANAD_ASSET_REGISTRY.md — ما تم إنتاجه)
    ↓
مخرجات — فيديوهات قابلة لإعادة الاستخدام
```

---

## القسم 00 — Project Charter

### هدف المشروع
إنتاج **Investor Cut** بجودة سينمائية يمكن إعادة استخدام أصوله (Assets) لإنتاج نسخ مستقبلية.

### الجمهور المستهدف (الأولوية بالترتيب)
```
1. المستثمرون (VC / Private Equity)
2. وزارة الصحة السعودية
3. شركات التأمين
4. الرأي العام (السوشيال ميديا)
```

### نسخ الفيديو المخطط إنتاجها
```
VERSION-01: Investor Cut (2:30–3:00 min) ← الأولوية الآن
VERSION-02: Ministry Cut (90 sec) — يُعاد تجميعه من نفس الأصول
VERSION-03: Social Cut (60 sec) — يُعاد تجميعه من نفس الأصول
VERSION-04: Teaser (30 sec) — يُعاد تجميعه من نفس الأصول
```

**المبدأ:** لا إنتاج جديد للنسخ 02-04 — فقط إعادة تجميع ما تم إنتاجه.

### التعديلات المعتمدة على Shot List
*(بناءً على نقد 2026-07-01 من زوايا طبيب + مستثمر + وزارة + مخرج)*

```
CHANGE-001: Shot 14
  من: "AI Safety Check: CLEARED"
  إلى: شاشة SANAD تعرض: "Drug Interaction: None detected · 
       Warfarin on record ✓ · Previous allergies: Penicillin · 
       Last CBC: 3 days ago — retrieved in 4s"
  السبب: المصطلح القديم غير طبي، يكسر مصداقية الفيلم مع الأطباء

CHANGE-002: Shot 15
  من: "نتيجة مختبر في 90 ثانية"
  إلى: "Previous CBC from 3 days ago — retrieved in 4 seconds"
  السبب: 90 ثانية مستحيل بيولوجياً لكثير من الاختبارات

CHANGE-003: Shot 23 — VO
  من: "المملكة العربية السعودية تستحق منظومة صحية تعمل كما ينبغي."
  إلى: "المملكة العربية السعودية تبني منظومة صحية للمستقبل."
  السبب: النص القديم يمتن النظام الحالي ضمنياً — خطر تنظيمي

CHANGE-004: Shot 08 — البديل
  من: ماكينة فاكس تتعطل (كليشيه 2000)
  إلى: طبيب يحاول الدخول لنظام إلكتروني، نسي الباسورد + شاشة loading
  السبب: الفاكس يُضحك الجمهور 2026 لا يُقنعه

CHANGE-005: إضافة قبل Shot 25
  مشهد جديد (3 ثوانٍ): خلفية بيضاء نظيفة، نص فقط:
  "12 hospital · 40,000 patients · 6 insurance partners | Beta KSA 2026"
  السبب: المستثمر يريد رقماً واحداً حقيقياً — الفيلم لا يقدم أي تراكشن
  ملاحظة: عدّل الأرقام لتطابق الواقع الفعلي
```

### الأصول ذات الأولوية القصوى
*(لا تتنازل عن جودتها)*
```
PRIORITY-1: Shot 18 (العناق) — الذاكرة العاطفية للفيلم
PRIORITY-2: Shot 09 (الانتظار) — أقوى لحظة صمت
PRIORITY-3: Shot 20-21 (النص الأسود) — يجب تنفيذها بدقة جراحية
PRIORITY-4: Shot 06 vs Shot 13 (الطبيب) — نفس الشخص، زاوية مطابقة
PRIORITY-5: Shot 10 (في المستشفى) — الـ VO يحمل الرسالة الاقتصادية
```

---

## القسم 01 — دليل الأقسام (Department Guide)

كل Asset يمر بهذه الأقسام بالترتيب — لكل قسم نموذج AI مختلف:

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION PIPELINE                   │
├──────────────┬──────────────────────────────────────────┤
│ القسم        │ المسؤولية                                 │
├──────────────┼──────────────────────────────────────────┤
│ Script Dept  │ الكتابة والـ VO — Claude / GPT / Gemini  │
│ Art Dept     │ المواقع والخلفيات — Image Model          │
│ Actor Dept   │ الشخصيات — Image Model (نفس النموذج دائماً)│
│ Costume Dept │ مراجعة اتساق الملابس — Vision Model      │
│ Lighting Dept│ Color Grade وتطبيقه — Image Model        │
│ Camera Dept  │ تحديد الـ Shot composition               │
│ Video Dept   │ تحويل الصور لفيديو — Video Model         │
│ Sound Dept   │ VO + Music + SFX — Audio Models          │
│ Edit Dept    │ المونتاج — DaVinci / CapCut              │
│ QA Dept      │ مراجعة الجودة — Vision Model + Human     │
│ Director     │ الاعتماد النهائي — أنت                   │
└──────────────┴──────────────────────────────────────────┘
```

### قرارات الأقسام التي تحتاج منك توقيعاً الآن:

```
DECISION-001: نموذج توليد الصور
  [ ] Midjourney v7
  [ ] Flux Pro 1.1
  [ ] Ideogram v3
  [ ] DALL-E 3
  القرار المختار: __________
  تاريخ القرار:   __________
  ⚠️ لا رجعة عنه بعد توليد أول Character Sheet

DECISION-002: نموذج توليد الفيديو
  [ ] Kling 2.0
  [ ] Runway Gen-4
  [ ] Veo 3
  [ ] Sora
  القرار المختار: __________

DECISION-003: نموذج الـ Voice Over
  [ ] ElevenLabs (Voice ID: __________)
  [ ] Play.ai
  [ ] Murf
  القرار المختار: __________

DECISION-004: أداة الموسيقى
  [ ] Suno v4
  [ ] Udio
  [ ] Artlist (مكتبة جاهزة)
  القرار المختار: __________

DECISION-005: أداة المونتاج
  [ ] DaVinci Resolve
  [ ] Adobe Premiere
  [ ] CapCut Pro
  القرار المختار: __________
```

---

## القسم 02 — إدارة الإصدارات (Version Control)

### قواعد الـ Versioning لكل Asset:

```
اسم الملف: [ID]_v[رقم]_[STATUS].[امتداد]

مثال:
CH01-A_v1_GENERATING.png    ← قيد التوليد
CH01-A_v1_QA.png            ← في المراجعة
CH01-A_v1_REJECTED.png      ← مرفوض
CH01-A_v2_APPROVED.png      ← معتمد
CH01-A_v2_LOCKED.png        ← مقفل ومحمي
```

### حالات الـ Asset:

```
[TODO] → [READY] → [GENERATING] → [QA] → [APPROVED] → [LOCKED]
                                     ↓
                                 [REJECTED]
                                     ↓
                                  [RETRY]
                                     ↓
                               [GENERATING]
```

### تعريف كل حالة:

```
TODO:        المهمة موجودة في القائمة ولم تبدأ بعد
READY:       كل الـ Dependencies مكتملة، يمكن البدء
GENERATING:  النموذج يعمل حالياً
QA:          الناتج يُراجع وفق الـ Acceptance Criteria
APPROVED:    اجتاز الـ QA، يمكن الاستخدام
LOCKED:      اعتمده المخرج — ممنوع تعديله إلا بـ VERSION CHANGE REQUEST
REJECTED:    فشل الـ QA — يذهب للـ RETRY
RETRY:       إعادة توليد مع تعديل الـ Prompt
```

### VERSION CHANGE REQUEST (VCR)

إذا أردت تعديل Asset في حالة LOCKED:
```
VCR-[رقم]:
Asset ID:        __________
السبب:           __________
التأثير على:     [Shots التي تستخدم هذا الـ Asset]
القرار:          [ ] موافق على التغيير  [ ] رفض التغيير
```

---

## القسم 03 — هيكل مجلدات المشروع

```
/SANAD_VIDEO_PROJECT/
│
├── 00_CHARTER/
│   └── SANAD_AI_POS.md (هذا الملف)
│
├── 01_PRODUCTION_BIBLE/
│   └── SANAD_AI_PRODUCTION_BIBLE.md
│
├── 02_TASK_QUEUE/
│   └── SANAD_TASK_QUEUE.md
│
├── 03_ASSETS/
│   ├── SANAD_ASSET_REGISTRY.md
│   ├── characters/
│   │   ├── father/
│   │   │   ├── CH01-A_v2_LOCKED.png
│   │   │   ├── CH01-B_v1_LOCKED.png
│   │   │   └── ...
│   │   ├── daughter/
│   │   ├── mother/
│   │   ├── doctor/
│   │   └── nurse/
│   ├── locations/
│   │   ├── kitchen/
│   │   ├── emergency_room/
│   │   ├── sanad_screen/
│   │   ├── network_viz/
│   │   └── house_exterior/
│   └── screens/
│       ├── LOC03-A_patient_file.png
│       ├── LOC03-B_drug_interaction.png
│       └── LOC03-C_lab_retrieved.png
│
├── 04_PROMPTS/
│   ├── prompts_characters.md
│   ├── prompts_locations.md
│   └── prompts_shots.md
│
├── 05_SHOTS/
│   ├── images/
│   │   ├── SHOT02_v1_LOCKED.png
│   │   └── ...
│   └── videos/
│       ├── SHOT02_v1_LOCKED.mp4
│       └── ...
│
├── 06_AUDIO/
│   ├── vo/
│   │   ├── VO-01_v1_LOCKED.mp3
│   │   └── ...
│   ├── music/
│   └── sfx/
│
├── 07_EDIT/
│   ├── PROJECT_FILE.drp (DaVinci Project)
│   └── exports/
│       ├── SANAD_InvestorCut_4K_FINAL.mp4
│       └── ...
│
└── 08_ARCHIVE/
    └── [كل الإصدارات المرفوضة]
```

---

## القسم 04 — نظام QA متعدد الأبعاد

### QA Level 1 — فحص تقني تلقائي (يمكن تفويضه لـ Vision AI)

```
أرسل للـ Vision Model:
"انظر لهذه الصورة وأجب بـ Yes/No على كل سؤال:
1. هل الشخصية تبدو عربية الملامح؟
2. هل الإضاءة [warm tungsten / cool clinical / golden hour]؟
3. هل تبدو كصورة سينمائية لا إعلان تجاري؟
4. هل الملابس [وصف الملابس]؟
5. هل التعبير مقيّد وطبيعي لا مسرحي؟"

النتيجة: 5/5 → QA PASS | أقل → QA FAIL
```

### QA Level 2 — فحص الاتساق بين Shots

```
اجمع صور الشخصية من كل الـ Shots وضعها جنباً إلى جنب:
"هل هذه كلها نفس الشخص؟ قيّم من 1-10"

8-10 → PASS
أقل من 8 → حدد أي Shot يختلف وأعد توليده
```

### QA Level 3 — فحص الرسالة (Human Only)

```
شاهد الفيلم بدون صوت:
□ هل القصة واضحة؟
□ هل الفارق بين Act 1 وAct 2 مفهوم بصرياً؟
□ هل Shot 18 تُحرّك بدون مبالغة؟
□ هل Shot 20-21 لحظة صمت حقيقية؟
```

---

## القسم 05 — Asset Reuse Matrix

*لإنتاج النسخ المستقبلية دون الحاجة لإعادة الإنتاج*

| Asset | V01 Investor | V02 Ministry | V03 Social | V04 Teaser |
|-------|-------------|-------------|-----------|-----------|
| CH01 (Father) | ✅ كل Shots | ✅ Shots 02,10,18 | ✅ Shot 18 | ✅ Shot 18 |
| CH02 (Daughter) | ✅ | ✅ Shot 18 | ✅ Shot 18 | ✅ Shot 18 |
| LOC02-B (ER Act 1) | ✅ | ✅ | ✅ Shot 05 | ❌ |
| LOC02-C (ER Act 2) | ✅ | ✅ | ✅ Shot 13 | ❌ |
| VO-03 (نجا...) | ✅ | ✅ | ✅ | ❌ |
| Shot 20-21 (النص) | ✅ | ✅ | ✅ | ❌ |
| Shot 25 (Logo) | ✅ | ✅ | ✅ | ✅ |

**الخلاصة:** إنتاج V01 بشكل صحيح يعني إنتاج 70% من V02-V04 تلقائياً.

---

*AI-POS v1.0 — SANAD Health Intelligence Platform*  
*يُستخدم مع: TASK_QUEUE.md + ASSET_REGISTRY.md + PRODUCTION_BIBLE.md*
