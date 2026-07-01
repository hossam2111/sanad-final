# SANAD — AI Video Production Bible
**"لكل قرارٍ سند." / "Behind Every Decision."**  
**Investor Cut — 2:30–3:00 min**  
Version: 1.0 | 2026-07-01

---

## قبل أي شيء — قواعد هذا الملف

هذا الملف هو المرجع الوحيد لكل نموذج ذكاء اصطناعي تستخدمه في المشروع.  
**لا تبدأ أي مرحلة قبل قراءته بالكامل.**  
كل ما هو موصوف هنا يمثل القرار النهائي — لا تجريب، لا تغيير بدون تحديث الملف أولاً.

---

## EPIC 0 — الهوية البصرية الثابتة (AI Reference Core)

*هذا القسم يُرسل لكل نموذج مع كل Prompt دون استثناء.*

### 0.1 — الرسالة
SANAD لا يستبدل الأطباء. SANAD يوصّل كل الأطراف في اللحظة الحرجة.  
الفارق بين عالم بـ SANAD وعالم بدونه ليس الحياة أو الموت — بل **الساعات، والمضاعفات، والتكلفة.**

### 0.2 — الأسلوب السينمائي
```
Style:       Cinematic Realism — NOT stock footage aesthetic
Framing:     Human-first, technology-second
Pace:        Act 1: slow, heavy | Act 2: same but coordinated | Act 4: rising
Emotion:     Restrained. Let the viewer feel, don't tell them how.
Reference:   "Arrival" (Denis Villeneuve) color philosophy
             "The Martian" — problem-solving calm under pressure
             "Capernaum" — raw human proximity
```

### 0.3 — Color Grading Rules (المرجع الثابت لكل Prompt)
| المشهد | Grade | توجيه للـ Prompt |
|--------|-------|-----------------|
| Act 1 — بدون SANAD | Warm tungsten, desaturated, heavy shadows | "warm tungsten lighting, desaturated colors, heavy dramatic shadows, 2700K ambient, clinical but overwhelming" |
| Act 2 — مع SANAD | Cool, clean, higher contrast, controlled | "cool clinical lighting, crisp contrast, precise shadows, 5000K clean white light, organized and purposeful" |
| Act 3 — العودة | Golden hour warmth, soft | "soft golden hour light, warm 3200K, natural daylight, intimate and human" |
| Act 4 — الرؤية | Night city + orchestral white | "aerial night city lights, deep blue-black sky, warm city glow below, scale and hope" |

### 0.4 — قواعد الكاميرا الثابتة
```
Lens style:     50mm–85mm equivalent (human eye perspective — no wide distortion)
Movement:       Slow, deliberate. No handheld shaking. No rushed pans.
Act 1 cuts:     Every 5-8s. Deliberate. Heavy.
Act 2 cuts:     Same duration, but movements feel resolved, not chaotic.
Act 3:          Long holds. Let silence breathe.
Act 4:          Wider shots. Scale. Then final intimacy on logo.
Avoid:          Dutch angles, fast cuts, drone reveals (except Shot 23), lens flares
```

### 0.5 — Language Consistency
```
All text overlays:  Arabic (large) + English subtitle (smaller, below)
Font style:         Clean sans-serif, NOT decorative Arabic calligraphy
SANAD brand text:   "سند" in Arabic | "SANAD" in Latin — always paired
Tagline:            "لكل قرارٍ سند." / "Behind Every Decision."
```

---

## EPIC 1 — تصميم الشخصيات (Character Sheets)

*لكل شخصية: أنشئ 4 صور مرجعية (أمام / جانب / ثلاثة أرباع / تعبير عاطفي)  
ثم استخدم هذه الصور كـ reference في كل Prompt يحتوي على هذه الشخصية.*

---

### Character 01 — الأب (The Father)
```
الدور:          بطل القصة. يعيش اللحظة الحرجة في العالمين.
العمر:          52–55 سنة
البشرة:         عربية متوسطة — قمحي دافئ
الشعر:         رمادي جزئي، قصير، مرتب لكنه مرهق
الملابس Act1:  بدلة داكنة (navy أو charcoal) مع رقبة قميص مفكوكة، كرافتة مرخية
الملابس Act2:  نفس البدلة — هذا نفس الليل
الملابس Act3:  ملابس منزلية بسيطة — قميص داكن وبنطال
الوجه:          خطوط تعب، عيون عميقة، وقار الخمسينيات
الحالة Act1:   ألم خفي في صدره، خوف مكتوم، إرهاق
الحالة Act2:   نفس الألم لكن محاط بفريق يعرف ما يفعل
الحالة Act3:   هادئ، ممتنن، أكثر بشرية

Prompt seed:  "Saudi man in his early 50s, partially gray hair, dark navy suit 
               with loosened collar and tie, warm olive-brown complexion, deep-set 
               eyes showing fatigue, cinematic lighting, photorealistic"
```

**المهام:**
- [ ] **CH01-A** — صورة أمامية كاملة، Act 1 ملابس، تعبير حيادي
- [ ] **CH01-B** — صورة جانبية، Act 1 ملابس
- [ ] **CH01-C** — تعبير ألم خفي — يد على الصدر، لا دراما
- [ ] **CH01-D** — تعبير ارتياح — نهاية Act 2
- [ ] **CH01-E** — ملابس Act 3 (منزلية)، يخرج من السيارة

---

### Character 02 — الابنة (The Daughter)
```
الدور:          القلب العاطفي للفيلم. تمثل المستقبل.
العمر:          12 سنة
البشرة:         عربية — تشبه أباها في ملامح الوجه
الشعر:         داكن طويل، مربوط بسيط
الملابس:        ملابس منزلية عادية — بيج أو وردي خافت
التعبير الرئيسي: انتظار صامت، قلق حقيقي لا مسرحي
لحظتها:        تجري نحو أبيها في Act 3 — تتوقف قبله بخطوة — عناق هادئ

Prompt seed:  "Saudi girl around 12 years old, long dark hair simply tied back,
               warm complexion resembling her father, home clothes, innocent worried
               expression, photorealistic, cinematic"
```

**المهام:**
- [ ] **CH02-A** — في غرفة الانتظار، يدان مطويتان، تنظر للباب
- [ ] **CH02-B** — تجري بخطى هادئة نحو الكاميرا
- [ ] **CH02-C** — لحظة العناق — زاوية متوسطة، لا قريبة من الوجوه

---

### Character 03 — الأم (The Mother)
```
الدور:          حضور هادئ. القوة الصامتة.
العمر:          45–48 سنة
الملابس:        عباءة أو ملابس عربية محتشمة، داكنة
الحالة:         تراقب. لا تنهار. قلق مكتوم وأنوثة قوية.
الحضور:         غرفة الانتظار (Act 1 & 2) + على الباب في Act 3

Prompt seed:  "Saudi woman in her mid-40s, modest dark abaya, composed dignified 
               expression hiding deep worry, standing in doorway, cinematic lighting"
```

**المهام:**
- [ ] **CH03-A** — في غرفة الانتظار بجانب الابنة
- [ ] **CH03-B** — تقف على باب المنزل تراقب العناق

---

### Character 04 — الطبيب (The Doctor)
```
الدور:          يمثل الفريق الطبي. في Act 1 محبط، في Act 2 حاسم وهادئ.
العمر:          30–35 سنة
الجنس:          ذكر (أو أنثى — قرر واثبت على قرارك)
الملابس:        معطف أبيض + سماعة + شارة مستشفى
الفارق:        Act1 — يمسك ملف ورقي ويقلّب صفحات محبطاً
               Act2 — ينظر لشاشة SANAD، يتكلم بثقة وحسم

Prompt seed:  "Young Saudi doctor male, late 20s, white lab coat, stethoscope,
               hospital badge, [Act1: holding paper file, frustrated expression]
               [Act2: looking at digital screen, calm decisive expression]"
```

**المهام:**
- [ ] **CH04-A** — Act 1: يمسك ملف ورقي، نظرة إحباط
- [ ] **CH04-B** — Act 2: ينظر لشاشة، يتكلم "عنده وارفارين"

---

### Character 05 — الممرضة / الممرض
```
الدور:          يمثل الكفاءة العملية
الملابس:        سكراب طبي (Navy أو Teal)
الحالة Act1:   عجلة وفوضى
الحالة Act2:   عجلة لكن منظمة ومنسقة
```

**المهام:**
- [ ] **CH05-A** — يدفع نقالة في مشهد طوارئ Act 1
- [ ] **CH05-B** — ينظر لشاشة SANAD ويتحرك بثقة Act 2

---

## EPIC 2 — تصميم المواقع (Location Design)

*لكل موقع: أنشئ صورة مرجعية ثابتة — تُستخدم في كل Shot بهذا الموقع*

---

### Location 01 — مطبخ المنزل (Home Kitchen)
```
الزمن:         ليل، متأخر
الإضاءة:      مصابيح فوق المطبخ (tungsten warm) + ضوء خافت من النافذة
المحتوى:      طاولة خشب متوسطة، كوب ماء، هاتف على الطاولة
الحجم:        متوسط — لا فخامة زائدة، لا فقر — عائلة سعودية متوسطة مستقرة
المزاج:       هادئ ليلي، ثم ثقيل

Prompt seed:  "Modern Saudi home kitchen at night, warm tungsten overhead lighting,
               wooden dining table with glass of water, phone on table, no people,
               cinematic medium shot, photorealistic"
```

**المهام:**
- [ ] **LOC01-A** — المطبخ فارغ (reference أساسي)
- [ ] **LOC01-B** — نفس المطبخ مع الأب جالس (Act 1)
- [ ] **LOC01-C** — نفس المطبخ — الشاشة تضيء بتنبيه SANAD (Act 2)

---

### Location 02 — غرفة الطوارئ (Emergency Room)
```
المعيار:        واقعي — مستشفى حكومي سعودي، لا luxury
الإضاءة Act1: فلوريسنت أبيض قاسٍ، ظلال قوية، ضوضاء بصرية
الإضاءة Act2: نفس الإضاءة لكن المكان منظم — نفس الغرفة، عالم مختلف
التفاصيل:     سرير طوارئ، شاشة مراقبة، نقالة، كابلات، لافتة مستشفى عربية

Prompt seed:  "Saudi government hospital emergency room, harsh fluorescent overhead 
               lighting, medical equipment, stretcher, monitoring screens,
               Arabic hospital signage, [Act1: chaotic movement, overwhelmed]
               [Act2: same room but organized, SANAD screens visible]"
```

**المهام:**
- [ ] **LOC02-A** — الغرفة الفارغة (reference)
- [ ] **LOC02-B** — Act 1: فوضى وتوتر
- [ ] **LOC02-C** — Act 2: نفس الغرفة، منظمة، شاشة SANAD خضراء

---

### Location 03 — شاشة نظام SANAD
```
الهدف:        تبدو حقيقية — نظام طبي معلوماتي، لا demo زائف
المحتوى:     اسم المريض + رقم وطني، قائمة الأدوية، آخر 3 نتائج مختبر، مؤشر الخطورة
اللون:        خلفية داكنة (dark mode) + إضاءة primary blue (#0A84FF)
التفاصيل:    شارة خضراء "AI Safety Check: CLEARED" | "Insurance: Pre-Approved"
العربية:      كل النصوص بالعربية مع ترجمة إنجليزية خافتة

Design reference: dashboard SANAD الفعلي في المشروع
```

**المهام:**
- [ ] **LOC03-A** — شاشة SANAD تعرض ملف مريض (Shot 13)
- [ ] **LOC03-B** — شاشة خضراء: AI Safety Check CLEARED (Shot 14)
- [ ] **LOC03-C** — شاشة: نتيجة مختبر وصلت خلال 90 ثانية (Shot 15)

---

### Location 04 — Visualization الشبكة (Shot 16 — The Network)
```
الأسلوب:      2D line-drawing — لا 3D render
الخلفية:      أسود عميق
العناصر:      5 نقاط تضيء واحدة تلو الأخرى، خطوط تربطها، مركز يتوهج
الأيقونات:    🚑 إسعاف | 🔬 مختبر | 💊 صيدلية | 🏥 مستشفى | 🛡️ تأمين
اللون:        Primary blue لخطوط الاتصال، أبيض للنقاط
مرجع:        "شبكة عصبية" لا "خريطة جغرافية"
```

**المهام:**
- [ ] **LOC04-A** — الخمس نقاط بدون خطوط (Frame 1)
- [ ] **LOC04-B** — الخطوط تظهر تدريجياً
- [ ] **LOC04-C** — المركز يتوهج — الشبكة مكتملة

---

### Location 05 — الخارج والمنزل (Act 3)
```
الزمن:        نهار، ضوء ذهبي
المنزل:       سعودي متوسط — واجهة حجر أو طابوق، باب خشبي داكن
الفناء:       درب قصير من السيارة للباب
المزاج:       دافئ، هادئ، أخيراً آمن
```

**المهام:**
- [ ] **LOC05-A** — السيارة تدخل الدرب، الأب يخرج
- [ ] **LOC05-B** — الباب يفتح — الابنة تجري
- [ ] **LOC05-C** — العناق — زاوية متوسطة، لا close-up وجوه

---

### Location 06 — المشاهد السريعة (Act 4 Montage — Shot 22)
```
6 مشاهد سريعة — كل واحد 2–3 ثواني:
1. فني مختبر ليلاً يشغل جهاز
2. صيدلاني ينظر لشاشة — علامة حمراء تتحول خضراء
3. مسعف في إسعاف متحركة يتلقى ملف على تابلت
4. طبيب في ممر مستشفى يراجع dashboard
5. موظف تأمين يوافق على مطالبة في ثوانٍ
6. مريضة مسنة في video call مع طبيبها الأسري
```

**المهام:**
- [ ] **LOC06-A** — فني المختبر ليلاً
- [ ] **LOC06-B** — الصيدلاني والشاشة (red → green)
- [ ] **LOC06-C** — المسعف في الإسعاف بالتابلت
- [ ] **LOC06-D** — الطبيب في الممر
- [ ] **LOC06-E** — موظف التأمين
- [ ] **LOC06-F** — المريضة المسنة في video call

---

## EPIC 3 — مكتبة الـ Prompts (Prompt Library)

*قرار النموذج المستخدم للصور: __________ (أملأ قبل البدء)*  
*قرار النموذج المستخدم للفيديو: __________ (أملأ قبل البدء)*

### قالب كل Prompt — الزامي
```
[STYLE ANCHOR]
Cinematic photorealistic, [Color Grade from 0.3], [Camera from 0.4], 
Saudi Arabia setting, high production value, film grain subtle, 
NOT stock footage, NOT CGI, NOT anime

[CHARACTER REFERENCE]
[أضف وصف الشخصية من Epic 1 + reference image]

[LOCATION REFERENCE]  
[أضف وصف الموقع من Epic 2 + reference image]

[SHOT SPECIFIC]
[الوصف التفصيلي للحظة المحددة]

[NEGATIVE PROMPT]
stock photo, cartoon, anime, 3D render, oversaturated, 
text watermark, unrealistic lighting, western faces, happy stock smile
```

---

### Shot-by-Shot Prompts

---

**SHOT 01** — 4s — Black screen + sound only
```
مرحلة الإنتاج:  Audio only — لا صورة
المهمة:         صوت باب سيارة يُغلق + مفاتيح تسقط
الأدوات:        ElevenLabs Sound Effects / Freesound (CC)
Status: [ ]
```

---

**SHOT 02** — 6s — الأب في المطبخ
```
Image Prompt:
"[STYLE: warm tungsten desaturated cinematic] Saudi man early 50s, 
partially gray hair, dark navy suit loosened collar, standing in 
home kitchen at night, pouring water into glass, slight discomfort 
on his face — NOT dramatic pain, just a flicker. Medium shot 85mm. 
[LOC01 reference]"

Video Prompt (to gen video from image):
"Man pours water, pauses, brings hand slowly to chest, expression 
shifts to subtle discomfort. Movement: slow, deliberate, 3 seconds 
pause mid-action. Camera: static."

VO to record: "لا شيء يُنبئ بما سيأتي."

Status Image: [ ] | Status Video: [ ] | Status VO: [ ]
```

---

**SHOT 03** — 5s — يجلس، يحاول يتنفس
```
Image Prompt:
"[STYLE: warm tungsten heavy shadows] Same Saudi man sitting heavily 
at kitchen table, glass of water in hand, face tightening — trying 
to breathe normally but failing. Medium shot. Low camera angle 
slightly. [CH01 reference] [LOC01 reference]"

Video Prompt:
"Man sits down with visible effort, takes sip of water, face 
tightens. Breathing visible but controlled. No sudden movement."

Audio: Single low cello note — sustained (source from Suno/Udio or licensed)

Status Image: [ ] | Status Video: [ ] | Status Audio: [ ]
```

---

**SHOT 04** — 3s — الهاتف على الطاولة
```
Image Prompt:
"[STYLE: warm tungsten] Close-medium shot of kitchen table, phone 
on table with dark lock screen, a hand slowly reaching toward it. 
Shallow depth of field — phone sharp, background soft blur."

Video Prompt:
"Hand reaches slowly toward phone on table. Phone remains locked. 
Movement: hesitant, effortful."

Status Image: [ ] | Status Video: [ ]
```

---

**SHOT 05** — 8s — دخول الطوارئ (بدون SANAD)
```
Image Prompt:
"[STYLE: harsh fluorescent, desaturated, Act 1] Saudi government 
hospital emergency room, stretcher being rushed in fast, nurses 
in motion blurred, harsh overhead fluorescent lighting creating 
deep shadows, chaos and overwhelm. The father on stretcher, 
frightened and confused. [CH01 reference] [LOC02-B reference]"

Video Prompt:
"Camera follows stretcher from behind, fast movement, nurses 
rushing around, talking over each other (voices overlap). 
Man on stretcher turns head, face shows confusion and fear."

VO: "في العالم الذي نعرفه..."

Status Image: [ ] | Status Video: [ ] | Status VO: [ ]
```

---

**SHOT 06** — 7s — الطبيب والملف الورقي
```
Image Prompt:
"[STYLE: harsh fluorescent Act 1] Young Saudi doctor white coat, 
holding thick paper medical file, flipping through pages rapidly, 
frustrated expression. Hospital corridor background. [CH04-A reference]"

Video Prompt:
"Doctor flips through paper file pages — faster and more frustrated. 
Looks up with exasperated expression. Whispers to colleague."

Dialogue (whispered): "محتاجين ملفه... مين طبيبه المعالج؟"
Subtitle: "We need his file... who is his doctor?"

Status Image: [ ] | Status Video: [ ] | Status Dialogue: [ ]
```

---

**SHOT 07** — 6s — الصيدلاني + نتائج المختبر
```
Image Prompt:
"[STYLE: Act 1 desaturated] Split impression: pharmacist on phone 
waiting, lab results not arrived, unsigned insurance form on desk. 
Stressed expression. [LOC reference pharmacy]"

Video Prompt:
"Pharmacist holds phone to ear, waiting, taps pen impatiently. 
Insurance form in frame, unsigned. Lab result machine in background — 
still processing indicator."

Audio: Tension rising, subtle clock-tick rhythm

Status Image: [ ] | Status Video: [ ] | Status Audio: [ ]
```

---

**SHOT 08** — 5s — ثلاث قطعات سريعة
```
Cut 1 (2s): Fax machine paper jam
"[STYLE: Act 1] Close shot of fax machine with jammed paper, 
red error light blinking"

Cut 2 (2s): Nurse with clipboard waiting
"[STYLE: Act 1] Nurse holding clipboard looking at frozen/slow 
loading computer screen, visible frustration"

Cut 3 (1s): Ringing phone, unanswered
"[STYLE: Act 1] Hospital desk phone ringing, nobody answers, 
ringing in empty frame"

Audio: Soft distorted beeping. Overwhelm.

Status Cut1: [ ] | Status Cut2: [ ] | Status Cut3: [ ]
```

---

**SHOT 09** — 6s — غرفة الانتظار (الابنة والأم)
```
Image Prompt:
"[STYLE: Act 1 desaturated, near silence visually] Hospital waiting 
room, Saudi girl 12 years old sitting with mother in abaya, 
hands folded in lap, looking toward door with quiet worry. 
Medium shot, still. No movement in background. [CH02-A] [CH03-A]"

Video Prompt:
"Both sit absolutely still. Girl's eyes move slowly toward the door. 
Camera holds without movement. Duration: 6 seconds of stillness."

Audio: Music drops to near-silence. Only distant ambient hospital sounds.

Status Image: [ ] | Status Video: [ ]
```

---

**SHOT 10** — 8s — المريض على السرير (ساعات لاحقاً)
```
Image Prompt:
"[STYLE: Act 1, warm but heavy, hospital room night] The father 
in hospital bed, IV drip attached to arm, eyes open but tired. 
Alive — but clearly exhausted by the ordeal. Room dark except 
monitoring equipment light. Medium shot. [CH01 reference, hospital clothes]"

Video Prompt:
"Man lies still on hospital bed, eyes stare at ceiling, breathing 
visible. Slow blink. IV drip in frame. Face carries weight of the night."

VO (multi-beat):
"نجا." [pause]
"لكن بعد ساعات من التأخير. مضاعفات لم تكن ضرورية. 
أيام إضافية في المستشفى. وتكلفة أثقلت الأسرة."

Status Image: [ ] | Status Video: [ ] | Status VO: [ ]
```

---

**SHOT 11** — 2s — شاشة سوداء + نص
```
نوع المشهد:   Motion Graphics فقط
النص:        "نفس الليلة." (عربي كبير، أبيض على أسود)
             "The same night." (إنجليزي أصغر، تحت)
الحركة:      Fade in فقط — لا حركة أخرى
الخط:        نفس الخط المستخدم في Final Title Cards
الصوت:       صمت كامل

الأداة:       After Effects / CapCut / DaVinci
Status: [ ]
```

---

**SHOT 12** — 4s — نفس المطبخ، مع SANAD
```
Image Prompt:
"[STYLE: Act 2 — same kitchen but SANAD version] EXACT same kitchen 
as Shot 02 — same man, same moment, hand to chest. 
BUT: his phone on the table is lit with a SANAD notification — 
blue glow, Arabic text showing health alert. Subtle difference 
from Act 1 but same location and character."

Video Prompt:
"Same action as Shot 02 but phone screen lights up with blue 
notification glow mid-shot. Man's attention drawn to it slightly."

VO: "لكن هذه المرة..."

Status Image: [ ] | Status Video: [ ] | Status VO: [ ]
```

---

**SHOT 13** — 5s — الطوارئ مع SANAD
```
Image Prompt:
"[STYLE: Act 2 — same ER, but coordinated] EXACT same emergency 
room as Shot 05 but: nurse at SANAD screen showing complete 
patient record, organized movement. Doctor calm and decisive. 
Screen shows: medications list, allergies highlighted, last 3 labs, 
risk index. Blue SANAD UI. [CH04-B reference] [LOC02-C reference]"

Video Prompt:
"Nurse points to screen confidently, doctor reads it, turns to 
team and speaks with calm authority. Same urgency, zero chaos."

Dialogue: "عنده وارفارين — لا تعطوه أسبرين."
Subtitle: "He's on Warfarin — no aspirin."
Audio: Subtle tone — resolution, not alarm.

Status Image: [ ] | Status Video: [ ] | Status Dialogue: [ ]
```

---

**SHOT 14** — 4s — الشاشة الخضراء
```
Image/Screen Design:
SANAD screen showing:
- Green banner top: "✓ AI Safety Check: CLEARED"  "✓ فحص السلامة: تم التخليص"
- Second line: "Insurance Authorization: Pre-Approved" "التأمين: مُعتمد مسبقاً"
- Background: Dark mode SANAD UI
- Team in background moving efficiently

Video Prompt:
"Screen displays green safety check. Medical team in background 
begins moving faster and more confidently. One team member nods."

Audio: Subtle positive tone — short, not triumphant.

Status Screen Design: [ ] | Status Video: [ ]
```

---

**SHOT 15** — 5s — ثلاث قطعات سريعة (مع SANAD)
```
Cut 1 (2s): Lab result transmitted — 90 seconds timer
"[STYLE: Act 2] Screen showing lab result with timer countdown 
showing 90 seconds, green confirmation indicator"

Cut 2 (2s): Pharmacy dispense authorized
"[STYLE: Act 2] Pharmacist at screen, green light, medication 
dispensing — confident not rushed"

Cut 3 (1s): Insurance form auto-completed
"[STYLE: Act 2] Screen showing insurance form with 'Auto-completed' 
and 'Sent' status — green checkmarks"

Audio: Rhythm shifts — same tempo but lighter, coordinated not chaotic

Status Cut1: [ ] | Status Cut2: [ ] | Status Cut3: [ ]
```

---

**SHOT 16** — 8s — The Network Visualization
```
Animation Approach:
Frame 1 (0-1s): 5 nodes appear one by one — fade in sequence
Frame 2 (1-4s): Lines draw between each node to center point
Frame 3 (4-8s): Center glows — network pulses alive

Node Icons (Arabic + English):
  🚑 إسعاف / Ambulance
  🔬 مختبر / Laboratory  
  💊 صيدلية / Pharmacy
  🏥 مستشفى / Hospital
  🛡️ تأمين / Insurance

Visual style: 2D vector line-drawing, NOT 3D, NOT map
Color: Deep black BG, #0A84FF lines, white nodes
Avoid: Globe graphics, Saudi map, data visualization complexity

VO: "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة."

Tool: After Effects / Motion / Canva Motion / Lottie
Status Animation: [ ] | Status VO: [ ]
```

---

**SHOT 17** — 5s — العودة للمنزل
```
Image Prompt:
"[STYLE: Act 3, golden hour warm] Exterior of Saudi family home, 
daytime, soft golden afternoon light. Family car pulling into 
driveway. Father stepping out slowly but upright — alive, home. 
Dressed in simple home clothes. Wide-medium shot. [LOC05-A]"

Video Prompt:
"Car door opens slowly. Father steps out with visible care — 
slower than usual but standing. Takes a breath. Looks at the house."

Audio: A single piano note. Just one.

Status Image: [ ] | Status Video: [ ]
```

---

**SHOT 18** — 8s — العناق
```
Image Prompt:
"[STYLE: Act 3, golden hour, intimate] Saudi family home front door 
open, 12-year-old daughter in doorway taking one step toward father, 
stopping just before him, looking up. The hug beginning — quiet, 
not dramatic. Medium shot, NOT close-up on faces. Mother visible 
watching from doorway. [CH01-E] [CH02-C] [CH03-B] [LOC05-B]"

Video Prompt:
"Door opens. Daughter runs — slows to a stop one step before him. 
She looks up. He looks down. The hug begins slowly, quietly. 
Mother watches from doorway without moving. 
Camera: HOLD. Do not push in. Let it breathe."

Audio: Single piano note. Then another. Silence. Nothing more.

Status Image: [ ] | Status Video: [ ]
```

---

**SHOT 19** — 3s — SLOW FADE TO BLACK
```
نوع المشهد:   Edit transition فقط
الحركة:      Slow fade to complete black — 3 full seconds
الصمت:       يبدأ من نهاية Shot 18
Status: [ ]
```

---

**SHOT 20** — 4s — النص الأول
```
Motion Graphics:
Background: Pure black
Text Arabic (large, centered, white):
"اليوم تُم إنقاذ مريض."

- No music
- No VO
- No subtitle
- No animation — just the text appearing. Fade in only.
- 1 second black before text appears
- Text holds 3 seconds

الخط:        [حدد الخط قبل البدء وثبته]
Status: [ ]
```

---

**SHOT 21** — 3s — النص الثاني
```
Motion Graphics:
Same black background. Shot 20 text fades.
New text appears:
"وغدًا يمكن إنقاذ ملايين."

- Complete silence continues
- Same treatment as Shot 20
- 1 second black between texts
Status: [ ]
```

---

**SHOT 22** — 10s — المونتاج الوطني (6 cuts × ~1.5s)
*(المهام في LOC06 أعلاه — 6 صور + 6 فيديوهات)*

```
VO: "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل."
Music: Orchestra rises — hopeful, purposeful, NOT triumphant

Status Images: [6/6] | Status Videos: [6/6] | Status VO: [ ] | Status Music: [ ]
```

---

**SHOT 23** — 5s — جوي ليلي فوق المدينة
```
Image/Video Prompt:
"Aerial shot of Saudi city at night — Riyadh or Jeddah skyline, 
city lights stretching to horizon, warm amber streetlights below, 
deep blue-black sky above. Slow drone movement forward.
[STYLE: Act 4 night city]"

Video: Either AI video gen or licensed aerial stock (check CC)

VO: "المملكة العربية السعودية تستحق منظومة صحية تعمل كما ينبغي."

Status Image/Video: [ ] | Status VO: [ ]
```

---

**SHOT 24** — 4s — SLOW FADE TO WHITE
```
نوع المشهد:   Edit transition
الحركة:      Slow fade from city to pure white — 4 seconds
Music:       Holds on final sustained note
Status: [ ]
```

---

**SHOT 25** — 5s — Logo
```
Motion Graphics:
Background: Pure white
Center: SANAD wordmark (Arabic + Latin)
Below, smaller: "لكل قرارٍ سند." / "Behind Every Decision."

Animation: Fade in from white — 1 second
Hold: 4 seconds
Audio: Silence, then one breath of ambient music — fade out

Brand assets: [استخدم الـ logo الرسمي من المشروع]
Status: [ ]
```

---

## EPIC 4 — الصوت والتعليق (Audio Production)

### 4.1 — Voice Over
```
الصوت المطلوب:  ذكر، 40s، إيقاع هادئ ومتأمل
                ليس مذيع أخبار، ليس دراما مسرحية
                مرجع: الصوت الذي يحكي لا الذي يعلن
الأداة:         ElevenLabs / Play.ai / Murf
اللهجة:         فصحى معاصرة — واضحة لكل العرب

قائمة الـ VO بالترتيب:
[ ] Shot 02: "لا شيء يُنبئ بما سيأتي."
[ ] Shot 05: "في العالم الذي نعرفه..."
[ ] Shot 10: "نجا." ... "لكن بعد ساعات من التأخير..."
[ ] Shot 12: "لكن هذه المرة..."
[ ] Shot 16: "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة."
[ ] Shot 22: "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل."
[ ] Shot 23: "المملكة العربية السعودية تستحق منظومة صحية تعمل كما ينبغي."
```

### 4.2 — الحوار الطبي
```
[ ] Shot 06: "محتاجين ملفه... مين طبيبه المعالج؟" (whispered, male doctor)
[ ] Shot 13: "عنده وارفارين — لا تعطوه أسبرين." (calm, decisive, male doctor)
```

### 4.3 — الموسيقى
```
المزاج:         Act 1: توتر هادئ (cello low note)
                Act 2: نفس الإيقاع لكن منظم (coordinated not chaotic)
                Act 3: بيانو بسيط — نوتتان فقط
                Act 4: أوركسترا آملة — "Time" by Hans Zimmer reference

الأدوات:        Suno / Udio / Soundraw / Adobe Stock Music / Artlist
قرار الأداة:    __________ (حدد قبل البدء)

[ ] Act 1 tension track (cello, building)
[ ] Act 2 resolved tension track (same BPM, different feel)  
[ ] Act 3 piano moment (2 notes, minimalist)
[ ] Act 4 orchestral rise (hopeful, 25s)
[ ] Final ambient breath (logo moment, 5s)
```

### 4.4 — مؤثرات صوتية
```
[ ] باب سيارة يُغلق (Shot 01)
[ ] مفاتيح تسقط (Shot 01)  
[ ] ضجيج مستشفى عام - Act 1 (محادثات مشوشة)
[ ] أجهزة رصد طبية - beeping
[ ] ماكينة فاكس تتعطل
[ ] هاتف يرن بدون رد
[ ] نغمة SANAD - notification chime (هادئة، professional)
[ ] نغمة تأكيد SANAD - resolution sound (Shot 14)
```

---

## EPIC 5 — المونتاج والتجميع (Assembly)

### 5.1 — أداة المونتاج
```
قرار الأداة: __________ (CapCut / DaVinci Resolve / Adobe Premiere)
```

### 5.2 — قائمة مهام المونتاج
```
[ ] تجميع كل الـ video clips بالترتيب
[ ] إضافة الـ VO على الخط الزمني
[ ] ضبط توقيت VO مع الصور
[ ] إضافة الموسيقى والـ sound effects
[ ] ضبط مستويات الصوت (VO أعلى، موسيقى خلفية)
[ ] إضافة Title Cards (Shot 11, 20, 21, 25)
[ ] تصحيح الألوان النهائي (Color grade consistency check)
[ ] إضافة Subtitles الإنجليزية
[ ] مراجعة الإيقاع الكلي للفيلم
[ ] Export نسخة Review أولى (720p)
[ ] مراجعة + تعديلات
[ ] Export نسخة نهائية
```

---

## EPIC 6 — ضبط الجودة (QA Checklist)

قبل التصدير النهائي، كل السؤال التالية يجب أن تكون إجابتها **نعم**:

### ثبات الشخصيات
- [ ] الأب يبدو نفس الشخص في Shots 02, 03, 05, 10, 12, 13, 17, 18؟
- [ ] الابنة نفس الشخص في Shots 09, 18؟
- [ ] الطبيب نفس الشخص في Shots 06, 13؟

### ثبات المواقع
- [ ] مطبخ Act 1 (Shot 02) ومطبخ Act 2 (Shot 12) نفس المكان؟
- [ ] غرفة الطوارئ Act 1 وAct 2 نفس الغرفة (فارق الإضاءة فقط)؟

### الرسالة
- [ ] في Act 1 الفيلم لا يقول "النظام القديم دائماً فاشل"؟
- [ ] الفارق بين العالمين هو التنسيق والوقت — لا الكفاءة الطبية؟
- [ ] Shot 18 (العناق) لا يُظهر وجوه الشخصيات عن قرب زائد؟

### الصوت
- [ ] صوت الـ VO متسق في النبرة طول الفيلم؟
- [ ] الموسيقى لا تطغى على الـ VO في أي نقطة؟
- [ ] Shot 20 و21 صامتان تماماً (لا موسيقى)؟

### التقني
- [ ] الـ subtitles تظهر قبل الـ VO بـ 0.5 ثانية؟
- [ ] النص العربي في Title Cards يستخدم خط واحد ثابت؟
- [ ] Logo نهائي واضح على خلفية بيضاء؟

---

## EPIC 7 — التصدير النهائي (Delivery)

```
[ ] نسخة 4K (3840×2160) — للعروض الكبيرة
[ ] نسخة 1080p (1920×1080) — للعروض التقديمية والإيميل  
[ ] نسخة 1080p مع Captions مدمجة — للسوشيال ميديا
[ ] نسخة Square 1:1 (1080×1080) — إنستغرام
[ ] نسخة Vertical 9:16 (1080×1920) — ريلز / تيك توك (اختياري)
[ ] ملف SRT للترجمة الإنجليزية (منفصل)
```

---

## نموذج حالة المشروع (Project Status Dashboard)

```
التاريخ:        ______
المرحلة الحالية: ______

EPIC 0 — Production Bible:          ✅ مكتمل
EPIC 1 — Character Sheets:          ___ / 5 شخصيات
EPIC 2 — Location References:       ___ / 6 مواقع
EPIC 3 — Image Generation:          ___ / 25 Shot
EPIC 4 — Video Generation:          ___ / 25 Shot
EPIC 5 — Audio (VO):                ___ / 7 مقاطع
EPIC 5 — Audio (Music):             ___ / 5 مقاطع
EPIC 6 — Assembly:                  ☐ لم يبدأ
EPIC 7 — QA:                        ☐ لم يبدأ
EPIC 8 — Delivery:                  ☐ لم يبدأ
```

---

## الأدوات المقترحة (AI Tool Stack)

| المرحلة | الأداة الأولى | البديل |
|---------|-------------|--------|
| توليد الصور | Midjourney v7 | Flux Pro / Ideogram v3 |
| توليد الفيديو | Kling 2.0 | Runway Gen-4 / Veo 3 |
| الصوت VO | ElevenLabs | Play.ai |
| الموسيقى | Suno v4 | Udio / Soundraw |
| التأثيرات | Freesound (CC0) | Adobe Firefly Audio |
| Motion Graphics | After Effects | CapCut / Canva |
| المونتاج | DaVinci Resolve | Adobe Premiere |

**ملاحظة:** حدد الأدوات قبل توليد أول صورة — لا تغير النموذج في منتصف الإنتاج حتى لا تختلف الشخصيات بين الـ shots.

---

*Production Bible v1.0 — SANAD Health Intelligence Platform*  
*Investor Cut — "لكل قرارٍ سند." / "Behind Every Decision."*  
*بناءً على Shot List v1.0 (SANAD_SHOT_LIST.md)*
