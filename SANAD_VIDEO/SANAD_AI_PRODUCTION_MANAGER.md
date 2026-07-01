# SANAD — AI Production Manager
**وثيقة إدارة الإنتاج بالذكاء الاصطناعي**  
Version: 1.0 | 2026-07-01  
المرجع الأساسي: `SANAD_AI_PRODUCTION_BIBLE.md` + `SANAD_SHOT_LIST.md`

---

## كيفية استخدام هذه الوثيقة

لكل Work Package (WP):
1. تأكد أن كل الـ **Dependencies** مكتملة قبل البدء
2. أرسل الـ **Inputs** للنموذج المحدد مع الـ **Prompt Template**
3. قيّم الناتج على أساس **Acceptance Criteria**
4. إذا فشل → **Retry Protocol**
5. إذا نجح → سجّل في **Project Tracker** وانتقل للتالي

---

## Project Tracker (انسخه وحدّثه يومياً)

```
الفيلم: سند - Investor Cut
المدة المستهدفة: 2:30 – 3:00 دقيقة
تاريخ البدء: __________
تاريخ التسليم المستهدف: __________

PHASE 1 — Pre-Production
  WP-001 [ ] Voice Over Script
  WP-002 [ ] Prompt Base Template

PHASE 2 — Character Sheets
  WP-011 [ ] Character 01: The Father
  WP-012 [ ] Character 02: The Daughter
  WP-013 [ ] Character 03: The Mother
  WP-014 [ ] Character 04: The Doctor
  WP-015 [ ] Character 05: The Nurse

PHASE 3 — Location References
  WP-021 [ ] LOC01: Home Kitchen
  WP-022 [ ] LOC02: Emergency Room
  WP-023 [ ] LOC03: SANAD Screen UI
  WP-024 [ ] LOC04: Network Visualization
  WP-025 [ ] LOC05: House Exterior

PHASE 4 — Shot Images (25 shots)
  WP-031 [ ] Shot 01 — Audio only
  WP-032 [ ] Shot 02 — Father in Kitchen
  WP-033 [ ] Shot 03 — Sits down
  WP-034 [ ] Shot 04 — Phone on table
  WP-035 [ ] Shot 05 — ER entrance
  WP-036 [ ] Shot 06 — Doctor + paper file
  WP-037 [ ] Shot 07 — Pharmacist waiting
  WP-038 [ ] Shot 08 — 3 cuts chaos
  WP-039 [ ] Shot 09 — Waiting room
  WP-040 [ ] Shot 10 — Father in bed
  WP-041 [ ] Shot 11 — Title card
  WP-042 [ ] Shot 12 — Same kitchen + SANAD
  WP-043 [ ] Shot 13 — ER with SANAD
  WP-044 [ ] Shot 14 — Green screen
  WP-045 [ ] Shot 15 — 3 cuts SANAD
  WP-046 [ ] Shot 16 — Network animation
  WP-047 [ ] Shot 17 — Coming home
  WP-048 [ ] Shot 18 — The hug
  WP-049 [ ] Shot 19 — Fade black
  WP-050 [ ] Shot 20 — Title card 1
  WP-051 [ ] Shot 21 — Title card 2
  WP-052 [ ] Shot 22 — National montage
  WP-053 [ ] Shot 23 — Aerial city
  WP-054 [ ] Shot 24 — Fade white
  WP-055 [ ] Shot 25 — Logo

PHASE 5 — Video Generation (25 shots)
  WP-060 [ ] All shots converted to video

PHASE 6 — Audio
  WP-071 [ ] Voice Over (7 lines)
  WP-072 [ ] Medical Dialogue (2 lines)
  WP-073 [ ] Music (5 tracks)
  WP-074 [ ] Sound Effects (8 effects)

PHASE 7 — Assembly & Delivery
  WP-081 [ ] Edit Assembly
  WP-082 [ ] QA Review
  WP-083 [ ] Final Export
```

---

---

# PHASE 1 — Pre-Production

---

## WP-001 — Voice Over Script (Final Recording Script)

```
الهدف:        تحويل الـ VO من الـ Shot List إلى سكريبت تسجيل نهائي
النموذج:      أي LLM (Claude / ChatGPT / Gemini)
المدة:        30 دقيقة
```

**Inputs:**
- `SANAD_SHOT_LIST.md` — قسم الـ VO من كل Shot
- العربية الفصحى المعاصرة (ليست خليجية، ليست مصرية)

**Prompt Template:**
```
أنت محرر نصوص لفيلم وثائقي عربي. خذ مقاطع الـ Voice Over التالية 
وحوّلها إلى سكريبت تسجيل نهائي بالشكل:

[SHOT XX] — [المدة] ثانية
النص: "..."
الإيقاع: [هادئ / متأمل / صاعد]
الوقفات: [ضع | للوقفة القصيرة || للوقفة الطويلة]

الـ VO الخام:
[الصق كل خطوط الـ VO من الـ Shot List]
```

**Outputs المطلوبة:**
- [ ] ملف `VO_SCRIPT_FINAL.md` يحتوي كل خطوط VO بالترتيب
- [ ] مدة تقديرية لكل خط (بالثواني)

**Acceptance Criteria:**
- [ ] كل خط VO يتناسب مع مدة الـ Shot المحدد
- [ ] الإيقاع هادئ ومتأمل — ليس إعلانياً
- [ ] العربية فصيحة ومفهومة لكل العرب

**Quality Gate:**  
اقرأ النص بصوت عالٍ — هل تشعر أنه حوار لإنسان يحكي، لا مذيع يُعلن؟  
إذا نعم → اعتمد. إذا لا → أعد الصياغة.

**Retry Protocol:**  
إذا كان الإيقاع إعلانياً: أضف للـ Prompt "تحدث كشخص يروي قصة لصديق، لا كمعلن"

---

## WP-002 — Prompt Base Template

```
الهدف:        بناء القالب الثابت الذي يُستخدم في كل صورة
النموذج:      Claude / ChatGPT
المدة:        20 دقيقة
```

**Inputs:**
- `SANAD_AI_PRODUCTION_BIBLE.md` — Section 0.2, 0.3, 0.4

**الناتج المطلوب:**

```
STYLE ANCHOR (يُضاف لكل Prompt):
"Cinematic photorealistic 35mm film, [ACT_COLOR_GRADE], 
[LENS]mm lens equivalent, Saudi Arabia authentic setting, 
subtle film grain, high production value, NOT stock photo, 
NOT CGI, NOT anime, NOT Western"

ACT_COLOR_GRADE values:
- Act 1: "warm tungsten 2700K, desaturated, heavy dramatic shadows"
- Act 2: "cool clinical 5000K, crisp contrast, organized lighting"  
- Act 3: "soft golden hour 3200K, warm natural daylight"
- Act 4: "deep blue-black night sky, warm amber city glow"

LENS values:
- Close/Medium: "85mm"
- Medium/Wide: "50mm"
- Aerial: "24mm"

NEGATIVE PROMPT (يُضاف لكل Prompt):
"stock photo, cartoon, anime, 3D render, CGI, oversaturated, 
text watermark, unrealistic lighting, Western European faces, 
happy commercial smile, beauty filter, Instagram filter, 
artificial poses, fashion photography style"
```

**Acceptance Criteria:**
- [ ] الـ Style Anchor ينتج صوراً سينمائية لا تبدو كـ stock photos
- [ ] تم اختباره على نموذج الصور المختار

---

---

# PHASE 2 — Character Sheets

**قاعدة لا تُكسر:** كل شخصية تُولَّد بنفس النموذج (Midjourney/Flux/etc.) وبنفس الـ Seed.  
احفظ الـ Seed لكل شخصية فور نجاح أول صورة.

---

## WP-011 — Character 01: The Father

```
النموذج:      [اكتب اسم النموذج المختار]
المدة:        1–2 ساعة
Dependency:   WP-002 (Prompt Base Template)
```

**Inputs:**
- Prompt Base من WP-002
- Character Description من `PRODUCTION_BIBLE.md` — Character 01

**Prompt Template:**
```
[STYLE ANCHOR من WP-002 — Act 1 grade]

Saudi man in his early 50s, partially gray short hair, warm 
olive-brown complexion, deep-set eyes showing quiet fatigue, 
distinguished Middle Eastern features — NOT stereotypical, 
dark navy suit with loosened collar and tie slightly loosened,
[POSE], cinematic 85mm, photorealistic
```

**المهام — كل صورة تُولَّد منفصلاً:**

| ID | الـ POSE | الغرض | Status | Seed |
|----|---------|--------|--------|------|
| CH01-A | Full front, neutral expression | Reference master | [ ] | _____ |
| CH01-B | Side profile, standing | Reference side | [ ] | _____ |
| CH01-C | 3/4 angle, hand to chest, slight discomfort — NOT dramatic | Shot 02, 03 | [ ] | _____ |
| CH01-D | Sitting on hospital bed, IV attached, tired eyes open | Shot 10 | [ ] | _____ |
| CH01-E | Stepping out of car, simple home clothes, relieved | Shot 17 | [ ] | _____ |
| CH01-F | Being hugged by daughter, seen from behind/medium | Shot 18 | [ ] | _____ |

**Acceptance Criteria:**
- [ ] يبدو عربياً أصيلاً — ليس غربياً بملامح عربية
- [ ] نفس الشخص في كل الـ 6 صور (ثبات الملامح)
- [ ] تعبيرات مقيّدة — لا دراما مسرحية
- [ ] الملابس متطابقة في الصور التي تمثل نفس المشهد

**Quality Gate — اختبار الثبات:**  
ضع صورتين من هذه الـ 6 جنباً إلى جنب — هل تعرف فوراً أنهما نفس الشخص؟  
إذا نعم → اعتمد. إذا لا → أعد التوليد مع رفع وصف الملامح تفصيلاً.

**Retry Protocol:**  
إذا تغيرت الملامح بين الصور → استخدم ميزة "Image Reference" في النموذج مع CH01-A  
إذا بدا غربي الملامح → أضف: "strong Middle Eastern facial structure, Arabic nose bridge, warm undertone, NOT European"

**الـ Seed النهائي المعتمد:** _____________

---

## WP-012 — Character 02: The Daughter

```
النموذج:      [نفس نموذج WP-011]
Dependency:   WP-011 (لضمان تشابه ملامح الأب والابنة)
```

**Prompt Template:**
```
[STYLE ANCHOR]

Saudi girl around 12 years old, long dark brown hair simply 
tied back, warm olive complexion similar to her father, 
soft innocent facial features, home casual clothes in beige 
or muted pink, [POSE], cinematic 85mm, photorealistic
```

**المهام:**

| ID | الـ POSE | الغرض | Status | Seed |
|----|---------|--------|--------|------|
| CH02-A | Sitting, hands folded in lap, looking sideways toward door, quiet worry | Shot 09 | [ ] | _____ |
| CH02-B | Walking/running slowly toward camera, expression shifting from worry to relief | Shot 18 motion ref | [ ] | _____ |
| CH02-C | Standing one step from father, looking up at him, hug starting | Shot 18 | [ ] | _____ |

**Acceptance Criteria:**
- [ ] تشبه أباها في الملامح الأساسية (عينان، بشرة)
- [ ] تعبير القلق حقيقي ومحتشم — لا مسرحي
- [ ] لحظة العناق من مسافة متوسطة — لا close-up على الوجه

**الـ Seed النهائي المعتمد:** _____________

---

## WP-013 — Character 03: The Mother

```
النموذج:      [نفس نموذج WP-011]
Dependency:   WP-011
```

**Prompt Template:**
```
[STYLE ANCHOR]

Saudi woman in her mid-40s, wearing modest dark navy or black 
abaya, composed dignified expression that conceals deep worry, 
strong quiet presence, [POSE], cinematic 85mm, photorealistic
```

**المهام:**

| ID | الـ POSE | الغرض | Status | Seed |
|----|---------|--------|--------|------|
| CH03-A | Sitting in waiting room beside daughter, hands together, controlled worry | Shot 09 | [ ] | _____ |
| CH03-B | Standing in open doorway, watching hug scene, holding back emotion | Shot 18 | [ ] | _____ |

**الـ Seed النهائي المعتمد:** _____________

---

## WP-014 — Character 04: The Doctor

```
الفارق الجوهري: نفس الشخص في Act 1 (محبط) وAct 2 (حاسم)
الملابس:       ثابتة — نفس معطف أبيض في العالمين
Dependency:   WP-002
```

**Prompt Template:**
```
[STYLE ANCHOR]

Young Saudi male doctor, late 20s to early 30s, white lab coat, 
stethoscope around neck, hospital ID badge on coat, 
short dark hair, clean professional appearance, 
[ACT_EXPRESSION], [POSE], cinematic 85mm, photorealistic
```

**المهام:**

| ID | Act | الـ POSE | الغرض | Status | Seed |
|----|-----|---------|--------|--------|------|
| CH04-A | 1 | Holding thick paper medical file, flipping pages, frustrated expression, hospital corridor | Shot 06 | [ ] | _____ |
| CH04-B | 2 | Looking at digital screen (SANAD UI), calm decisive expression, speaking to team | Shot 13 | [ ] | _____ |

**Acceptance Criteria:**
- [ ] نفس الشخص في الصورتين — فقط التعبير يختلف
- [ ] Act 1: إحباط حقيقي — لا غضب مبالغ
- [ ] Act 2: هدوء وحسم — ليس ابتهاجاً

**الـ Seed النهائي المعتمد:** _____________

---

## WP-015 — Character 05: The Nurse/Paramedic

```
Dependency:   WP-002
```

**Prompt Template:**
```
[STYLE ANCHOR]

Saudi hospital nurse, medical scrubs in navy blue or teal, 
professional healthcare worker appearance, [POSE], cinematic, photorealistic
```

**المهام:**

| ID | Act | الـ POSE | Status |
|----|-----|---------|--------|
| CH05-A | 1 | Pushing stretcher fast in chaotic ER, blurred motion | [ ] |
| CH05-B | 2 | Looking at SANAD screen, nodding, moving with confidence | [ ] |

---

---

# PHASE 3 — Location References

**قاعدة:** أنشئ الصورة المرجعية للموقع أولاً بدون شخصيات — ثم أضف الشخصيات عليها.

---

## WP-021 — LOC01: Home Kitchen

```
النموذج:      [نموذج الصور المختار]
Dependency:   WP-002
```

**Prompt:**
```
[STYLE ANCHOR — Act 1 grade]

Modern Saudi middle-class home kitchen, late night, warm tungsten 
overhead lighting 2700K, wooden dining table in foreground with 
glass of water and smartphone face-down, clean but lived-in, 
no people, cinematic medium shot 50mm, photorealistic,
Saudi interior design aesthetic
```

**المهام:**

| ID | الوصف | Status | Image File |
|----|-------|--------|-----------|
| LOC01-A | المطبخ فارغ — Reference رئيسي | [ ] | __________ |
| LOC01-B | نفس المطبخ — ضوء الهاتف مُطفأ (Act 1) | [ ] | __________ |
| LOC01-C | نفس المطبخ — ضوء هاتف SANAD الأزرق يضيء (Act 2) | [ ] | __________ |

**Acceptance Criteria:**
- [ ] يبدو سعودياً حقيقياً — لا أوروبياً ولا فاخراً
- [ ] الإضاءة Tungsten دافئة ليلية
- [ ] الطاولة والكوب والهاتف كلها حاضرة

---

## WP-022 — LOC02: Emergency Room

```
الأهم: Act 1 وAct 2 يجب أن يكونا نفس الغرفة — فارق الإضاءة والنظام فقط
```

**Prompt Base:**
```
[STYLE ANCHOR]

Saudi government hospital emergency room, standard fluorescent 
overhead lighting, medical monitoring screens, stretcher bed, 
IV stands, medical equipment, Arabic hospital signage visible,
linoleum floor, clinical environment, cinematic 50mm, photorealistic
```

**المهام:**

| ID | الوصف | Status |
|----|-------|--------|
| LOC02-A | الغرفة فارغة — Reference رئيسي | [ ] |
| LOC02-B | Act 1: نفس الغرفة — فوضى وتوتر، تعليق مبعثر | [ ] |
| LOC02-C | Act 2: نفس الغرفة — منظمة، شاشة SANAD خضراء ظاهرة | [ ] |

**Acceptance Criteria:**
- [ ] LOC02-B وLOC02-C يبدوان كنفس الغرفة — هذا الاختبار الأهم
- [ ] اللافتات العربية مقروءة
- [ ] الإضاءة Fluorescent حادة في الاثنين

---

## WP-023 — LOC03: SANAD Screen UI

```
الهدف:      شاشة تبدو حقيقية — نظام طبي فعلي لا عرض ترويجي
الأداة:     Figma / Canva / لقطة شاشة من dashboard المشروع الفعلي
```

**المهام:**

| ID | المحتوى | Status | File |
|----|---------|--------|------|
| LOC03-A | ملف مريض: الاسم + رقم وطني + قائمة أدوية + آخر 3 مختبر + مؤشر خطورة | [ ] | ______ |
| LOC03-B | شاشة خضراء: ✓ AI Safety Check: CLEARED + التأمين مُعتمد | [ ] | ______ |
| LOC03-C | نتيجة مختبر مع مؤقت 90 ثانية وعلامة خضراء | [ ] | ______ |

**Design Specs:**
```
Background: #0A0A0F (near black)
Primary: #0A84FF
Success: #30D158
Font: System Arabic-compatible sans-serif
Mode: Dark
العربية: أساسية، الإنجليزية: ثانوية وأصغر
```

**Acceptance Criteria:**
- [ ] تبدو كنظام طبي حقيقي — لا تصميم إعلاني
- [ ] النصوص العربية صحيحة ومقروءة
- [ ] الألوان متطابقة مع SANAD Brand (#0A84FF)

---

## WP-024 — LOC04: Network Visualization Animation

```
الأداة:     After Effects / Lottie / CapCut
الأسلوب:   2D vector lines — لا 3D، لا خريطة جغرافية
```

**المهام:**

| Frame | الوصف | Status |
|-------|-------|--------|
| F1 (0–1s) | 5 nodes تظهر تباعاً على خلفية سوداء | [ ] |
| F2 (1–4s) | خطوط زرقاء ترسم نفسها من كل node للمركز | [ ] |
| F3 (4–8s) | المركز يتوهج ويتنفس (pulse animation) | [ ] |

**Specs:**
```
Background:   #000000
Node color:   #FFFFFF
Line color:   #0A84FF
Center glow:  #0A84FF with blur
Node labels:  Arabic first, English small below
Animation:    Ease in/out — no bouncing or spring
Duration:     8 seconds total
Export:       PNG sequence or MOV with alpha
```

---

## WP-025 — LOC05: House Exterior (Act 3)

**Prompt:**
```
[STYLE ANCHOR — Act 3 golden hour]

Exterior of Saudi middle-class family home, afternoon golden 
hour light, traditional Saudi architectural elements — stone 
or brick facade, dark wooden front door, short driveway, 
palm tree visible, warm amber sunlight, safe and peaceful feeling,
cinematic wide-medium 50mm, photorealistic
```

**المهام:**

| ID | الوصف | Status |
|----|-------|--------|
| LOC05-A | المنزل فارغ — Reference | [ ] |
| LOC05-B | السيارة في الدرب، الأب يخرج | [ ] |
| LOC05-C | الباب مفتوح، الابنة في المدخل | [ ] |

---

---

# PHASE 4 — Shot Image Generation

**للكل Shot:**
1. ابدأ بـ Style Anchor (من WP-002)
2. أضف Character Reference المناسب
3. أضف Location Reference المناسب
4. أضف Shot-Specific description من `PRODUCTION_BIBLE.md`
5. أضف Negative Prompt

**جدول التتبع:**

| WP | Shot | Act | Key Element | Status | File | Approved |
|----|------|-----|-------------|--------|------|---------|
| WP-031 | 01 | - | AUDIO ONLY | [ ] | N/A | [ ] |
| WP-032 | 02 | 1 | Father pours water | [ ] | ____ | [ ] |
| WP-033 | 03 | 1 | Father sits, breathes | [ ] | ____ | [ ] |
| WP-034 | 04 | 1 | Phone on table | [ ] | ____ | [ ] |
| WP-035 | 05 | 1 | ER entrance chaos | [ ] | ____ | [ ] |
| WP-036 | 06 | 1 | Doctor + paper file | [ ] | ____ | [ ] |
| WP-037 | 07 | 1 | Pharmacist waiting | [ ] | ____ | [ ] |
| WP-038 | 08 | 1 | 3 chaos cuts (A/B/C) | [ ] | ____ | [ ] |
| WP-039 | 09 | 1 | Daughter + Mother waiting | [ ] | ____ | [ ] |
| WP-040 | 10 | 1 | Father in hospital bed | [ ] | ____ | [ ] |
| WP-041 | 11 | - | MOTION GRAPHICS | [ ] | N/A | [ ] |
| WP-042 | 12 | 2 | Same kitchen + SANAD glow | [ ] | ____ | [ ] |
| WP-043 | 13 | 2 | ER with SANAD screen | [ ] | ____ | [ ] |
| WP-044 | 14 | 2 | SANAD green screen | [ ] | ____ | [ ] |
| WP-045 | 15 | 2 | 3 SANAD cuts (A/B/C) | [ ] | ____ | [ ] |
| WP-046 | 16 | - | ANIMATION (WP-024) | [ ] | N/A | [ ] |
| WP-047 | 17 | 3 | Father comes home | [ ] | ____ | [ ] |
| WP-048 | 18 | 3 | The hug | [ ] | ____ | [ ] |
| WP-049 | 19 | - | EDIT TRANSITION | [ ] | N/A | [ ] |
| WP-050 | 20 | - | MOTION GRAPHICS | [ ] | N/A | [ ] |
| WP-051 | 21 | - | MOTION GRAPHICS | [ ] | N/A | [ ] |
| WP-052 | 22 | 4 | 6 montage cuts | [ ] | ____ | [ ] |
| WP-053 | 23 | 4 | Aerial city night | [ ] | ____ | [ ] |
| WP-054 | 24 | - | EDIT TRANSITION | [ ] | N/A | [ ] |
| WP-055 | 25 | - | LOGO MOTION | [ ] | N/A | [ ] |

---

**Shot Image Acceptance Criteria (ينطبق على كل صورة):**
- [ ] الشخصية تبدو نفس الشخص المعتمد في الـ Character Sheet
- [ ] الإضاءة مطابقة للـ Color Grade المحدد للـ Act
- [ ] لا يبدو كـ stock photo أو إعلان تجاري
- [ ] الملامح عربية أصيلة
- [ ] التعبير مقيّد وطبيعي — لا مسرحي

**Retry Protocol لكل صورة:**
```
محاولة 1: الـ Prompt الأساسي
محاولة 2: أضف "ultra photorealistic, award winning cinematography"
محاولة 3: غيّر SEED مع إضافة وصف أكثر تفصيلاً للتعبير
محاولة 4: أرسل CH reference image مباشرةً كـ image-to-image
إذا فشلت 4 محاولات: راجع الـ Character Sheet وأعد توليده أولاً
```

---

---

# PHASE 5 — Video Generation

```
النموذج:      [اكتب اسم النموذج المختار: Kling / Runway / Veo]
المدخل:       كل صورة مُعتمدة من PHASE 4
الهدف:       تحويل كل صورة لفيديو بمدة الـ Shot المحددة
```

**قالب الـ Video Prompt:**
```
[وصف الحركة الرئيسية]
Camera: [STATIC / SLOW PAN / PUSH IN / PULL OUT / FOLLOW]
Movement speed: [very slow / slow / medium]
Character expression changes: [وصف أي تغيير في التعبير]
Duration: [X] seconds
```

**جدول Video Generation:**

| Shot | المدة | نوع الحركة | Camera | Approved |
|------|-------|-----------|--------|---------|
| 02 | 6s | Man pours water, hand to chest | STATIC | [ ] |
| 03 | 5s | Man sits heavily, face tightens | STATIC low angle | [ ] |
| 04 | 3s | Hand reaches slowly toward phone | STATIC | [ ] |
| 05 | 8s | Stretcher rushes in, camera follows | FOLLOW from behind | [ ] |
| 06 | 7s | Doctor flips pages faster, looks up | STATIC | [ ] |
| 07 | 6s | Pharmacist taps pen, waiting | STATIC | [ ] |
| 08 | 5s | Three separate clips (2s + 2s + 1s) | STATIC each | [ ] |
| 09 | 6s | Complete stillness, girl's eyes move | STATIC HOLD | [ ] |
| 10 | 8s | Man stares at ceiling, slow blink | STATIC | [ ] |
| 12 | 4s | Phone screen lights up blue | STATIC | [ ] |
| 13 | 5s | Doctor reads screen, speaks calmly | STATIC | [ ] |
| 14 | 4s | Team moves faster behind screen | STATIC on screen | [ ] |
| 15 | 5s | Three separate clips (2s + 2s + 1s) | STATIC each | [ ] |
| 17 | 5s | Car door opens, father steps out | STATIC WIDE | [ ] |
| 18 | 8s | Daughter runs, stops, hug begins | STATIC HOLD | [ ] |
| 22 | 10s | Six cuts (1.5s each) | STATIC each | [ ] |
| 23 | 5s | Aerial drone forward slow movement | FORWARD DRONE | [ ] |

**Video Acceptance Criteria:**
- [ ] الحركة بطيئة ومتعمدة — لا اهتزاز
- [ ] تعبيرات الوجه طبيعية — لا uncanny valley
- [ ] الشخصية تبدو نفس الشخص من الصورة المصدر
- [ ] المدة مطابقة للمطلوب (±0.5 ثانية)

**Retry Protocol:**
```
إذا تغيرت ملامح الشخصية → ارفع وزن الـ Source Image في الإعدادات
إذا كانت الحركة سريعة جداً → أضف "extremely slow deliberate movement"
إذا بدت مصطنعة → أضف "natural human movement, subtle breathing visible"
```

---

---

# PHASE 6 — Audio Production

---

## WP-071 — Voice Over Recording

```
الأداة:      ElevenLabs / Play.ai / Murf
الصوت:      ذكر، 40s، نبرة هادئة متأملة
اللهجة:     فصحى معاصرة
```

**Prompt للصوت في ElevenLabs:**
```
Voice style: Calm, contemplative Arabic male narrator. 
Measured pace. NOT news anchor. NOT commercial. 
Like a wise person telling a story to a friend.
Speed: 0.85 (أبطأ من المعدل)
Stability: 0.75
Clarity: 0.80
```

**قائمة التسجيل:**

| ID | النص | المدة | Status | File |
|----|------|-------|--------|------|
| VO-01 | "لا شيء يُنبئ بما سيأتي." | ~3s | [ ] | ____ |
| VO-02 | "في العالم الذي نعرفه..." | ~3s | [ ] | ____ |
| VO-03 | "نجا." [pause 1s] "لكن بعد ساعات من التأخير. مضاعفات لم تكن ضرورية. أيام إضافية في المستشفى. وتكلفة أثقلت الأسرة." | ~10s | [ ] | ____ |
| VO-04 | "لكن هذه المرة..." | ~2s | [ ] | ____ |
| VO-05 | "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة." | ~6s | [ ] | ____ |
| VO-06 | "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل." | ~7s | [ ] | ____ |
| VO-07 | "المملكة العربية السعودية تستحق منظومة صحية تعمل كما ينبغي." | ~6s | [ ] | ____ |

**VO Acceptance Criteria:**
- [ ] النبرة هادئة ومتأملة في كل الخطوط
- [ ] VO-03: الوقفة بعد "نجا." واضحة (ثانية كاملة)
- [ ] المدة لا تتجاوز مدة الـ Shot المحدد

---

## WP-072 — Medical Dialogue

```
الأداة:      ElevenLabs (صوت طبيب مختلف عن VO)
الصوت:      ذكر، 30s، طبيب
```

| ID | النص | النبرة | Status | File |
|----|------|-------|--------|------|
| DLG-01 | "محتاجين ملفه... مين طبيبه المعالج؟" | Whispered, frustrated | [ ] | ____ |
| DLG-02 | "عنده وارفارين — لا تعطوه أسبرين." | Calm, decisive, clear | [ ] | ____ |

---

## WP-073 — Music

```
الأداة:      [Suno / Udio / Artlist / اختار قبل البدء]
```

| Track | الوصف | المدة | المزاج | Status | File |
|-------|-------|-------|-------|--------|------|
| MU-01 | Act 1 tension — cello low sustained note | ~40s | ثقيل، بطيء | [ ] | ____ |
| MU-02 | Act 2 resolved — same BPM but coordinated feel | ~30s | منظم، آمل | [ ] | ____ |
| MU-03 | Act 3 piano — just 2 notes, minimalist | ~15s | صمت شبه كامل | [ ] | ____ |
| MU-04 | Act 4 orchestral — hopeful rise, NOT triumphant | ~25s | آمل وهادئ | [ ] | ____ |
| MU-05 | Logo breath — single ambient swell | ~8s | نهاية هادئة | [ ] | ____ |

**Suno/Udio Prompt للـ MU-04 (مثال):**
```
Orchestral score, hopeful and purposeful, strings and piano,
building slowly, NOT triumphant or bombastic, like Hans Zimmer's 
"Time" from Inception — the patience not the climax,
120 BPM, major key but subdued, cinematic
```

---

## WP-074 — Sound Effects

| Effect | المصدر | Status | File |
|--------|--------|--------|------|
| SFX-01: باب سيارة يُغلق | Freesound CC0 | [ ] | ____ |
| SFX-02: مفاتيح تسقط | Freesound CC0 | [ ] | ____ |
| SFX-03: ضجيج مستشفى عام | Freesound CC0 | [ ] | ____ |
| SFX-04: أجهزة رصد طبية beep | Freesound CC0 | [ ] | ____ |
| SFX-05: ماكينة فاكس تتعطل | Freesound CC0 | [ ] | ____ |
| SFX-06: هاتف يرن بدون رد | Freesound CC0 | [ ] | ____ |
| SFX-07: نغمة SANAD notification | صمم بـ ElevenLabs / Tone Generator | [ ] | ____ |
| SFX-08: نغمة تأكيد SANAD | صمم بـ ElevenLabs / Tone Generator | [ ] | ____ |

---

---

# PHASE 7 — Assembly & Delivery

---

## WP-081 — Edit Assembly

```
الأداة:      [DaVinci Resolve / Adobe Premiere / CapCut]
Dependency:  كل الـ WPs السابقة مكتملة 100%
```

**ترتيب مهام المونتاج:**

```
الخطوة 1 — بناء الخط الزمني:
[ ] أنشئ sequence بـ: 1920×1080, 25fps, Arabic RTL
[ ] اسحب كل الـ video clips بالترتيب (Shot 01 → Shot 25)
[ ] تأكد المدة الكلية: 2:30 – 3:00 دقيقة

الخطوة 2 — الصوت:
[ ] أضف VO tracks على Audio Track 1
[ ] أضف Music tracks على Audio Track 2
[ ] أضف SFX على Audio Track 3
[ ] ضبط مستويات: VO = -12dB | Music = -24dB | SFX = -18dB

الخطوة 3 — العناوين والنصوص:
[ ] Shot 11: "نفس الليلة." / "The same night."
[ ] Shot 20: "اليوم تُم إنقاذ مريض." (بدون موسيقى أو ترجمة)
[ ] Shot 21: "وغدًا يمكن إنقاذ ملايين." (بدون موسيقى)
[ ] Shot 25: SANAD logo + tagline

الخطوة 4 — الانتقالات:
[ ] Shot 19: Fade to black (3s)
[ ] Shot 24: Fade to white (4s)
[ ] كل الانتقالات الأخرى: Cut مباشر (لا transitions)

الخطوة 5 — تصحيح الألوان:
[ ] Act 1 shots: Warm tungsten grade
[ ] Act 2 shots: Cool clinical grade
[ ] Act 3 shots: Golden hour grade
[ ] Act 4 shots: Night + orchestral white
[ ] تأكد التناسق داخل كل Act

الخطوة 6 — الترجمة:
[ ] أضف Subtitles إنجليزية لكل VO
[ ] تظهر قبل الـ VO بـ 0.5 ثانية
[ ] لا subtitles في Shot 20 و21
```

---

## WP-082 — QA Review

**إجراء:** شاهد الفيلم 3 مرات متتالية بالترتيب:

**المشاهدة 1 — القصة:**
```
[ ] هل القصة واضحة بدون الـ VO؟
[ ] هل الفارق بين Act 1 وAct 2 مفهوم بصرياً؟
[ ] هل Shot 18 (العناق) يُحرّك عاطفياً بدون مبالغة؟
[ ] هل Shot 20-21 (الصمت والنص) أقوى لحظة في الفيلم؟
```

**المشاهدة 2 — التقني:**
```
[ ] الأب نفس الشخص في كل Shots (02, 03, 05, 10, 12, 13, 17, 18)؟
[ ] الابنة نفس الشخص (09, 18)؟
[ ] الطبيب نفس الشخص (06, 13)؟
[ ] غرفة الطوارئ Act 1 = Act 2 (فارق إضاءة فقط)؟
[ ] مطبخ Act 1 = Act 2 (فارق إضاءة + SANAD glow فقط)؟
[ ] الـ Subtitles تظهر بالتوقيت الصحيح؟
```

**المشاهدة 3 — الصوت:**
```
[ ] الـ VO لا يطغى عليه الموسيقى في أي نقطة؟
[ ] Shot 20 و21 صمت تام؟
[ ] نبرة الـ VO متسقة طول الفيلم؟
[ ] نغمة SANAD في Shot 14 تبدو professional لا رخيصة؟
```

**القرار النهائي:**
```
كل الـ checkboxes ✅ → انتقل لـ WP-083
أي ❌ → حدد الـ WP المسؤول وأعد التنفيذ
```

---

## WP-083 — Final Export

```
[ ] نسخة 4K (3840×2160) — MP4 H.264
    اسم الملف: SANAD_InvestorCut_4K_FINAL.mp4

[ ] نسخة 1080p (1920×1080) — MP4 H.264
    اسم الملف: SANAD_InvestorCut_1080p_FINAL.mp4

[ ] نسخة 1080p مع Captions — MP4 H.264
    اسم الملف: SANAD_InvestorCut_1080p_Captions.mp4

[ ] نسخة Square (1080×1080) — MP4
    اسم الملف: SANAD_InvestorCut_Square.mp4

[ ] ملف SRT — الترجمة الإنجليزية
    اسم الملف: SANAD_InvestorCut_EN.srt
```

---

---

# ملحق — AI Tool Decision Log

*سجّل قراراتك هنا قبل البدء — لا ترجع عنها في منتصف الإنتاج*

```
تاريخ البدء:            __________

نموذج توليد الصور:       __________
  الـ Seed الأساسي:       __________
  
نموذج توليد الفيديو:      __________
  الإعدادات الافتراضية:   __________

أداة الـ Voice Over:      __________
  Voice ID المختار:       __________
  إعدادات الصوت:          __________

أداة الموسيقى:           __________
  Style Reference:        __________

أداة المونتاج:           __________
  Project FPS:            25
  Resolution:             1920×1080

تاريخ أول صورة معتمدة:   __________
تاريخ الانتهاء المستهدف: __________
```

---

*AI Production Manager v1.0*  
*SANAD Health Intelligence Platform — Investor Cut*  
*يُستخدم مع: SANAD_AI_PRODUCTION_BIBLE.md + SANAD_SHOT_LIST.md*
