# SANAD — Prompt Library (Investor Cut)
**"لكل قرارٍ سند." / "Behind Every Decision."**
مكتبة Prompts المحسّنة والجاهزة للنسخ — كل صورة وفيديو وموسيقى في المشروع
Version: 1.0 | 2026-07-01

---

# SECTION 1 — BASE ANCHORS
*انسخ الـ Anchor المناسب في بداية كل Prompt*

---

## Style Anchor — Act 1 (بدون SANAD)
```
Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime
```

## Style Anchor — Act 2 (مع SANAD)
```
Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime
```

## Style Anchor — Act 3 (العودة)
```
Cinematic photorealistic 35mm film, soft golden hour 3200K warm light,
gentle shadows, Saudi Arabia authentic setting, subtle film grain,
NOT stock photo, NOT CGI, NOT anime
```

## Style Anchor — Act 4 (الرؤية)
```
Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime
```

## Negative Prompt (أضفه لكل صورة)
```
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo
```

## Camera Rules
```
"85mm lens equivalent"  ← للمشاهد القريبة والمتوسطة
"50mm lens equivalent"  ← للمشاهد المتوسطة والواسعة
"24mm lens equivalent"  ← للمشاهد الجوية فقط
```

---

# SECTION 2 — CHARACTER REFERENCE PROMPTS

---

## CH01 — The Father

**Base Character Prompt (يُضاف مع كل صورة له):**
```
"Saudi man in his early 50s, partially gray short hair neatly kept but
slightly disheveled, warm olive-brown complexion, deep-set dark eyes showing
quiet fatigue, distinguished strong Middle Eastern facial structure,
prominent Arabic nose, [CLOTHING], [EXPRESSION], [POSE]"
```

**Clothing Variants:**
```
CLOTHING_ACT1:    "dark navy suit with tie loosened, top collar button undone"
CLOTHING_ACT2:    "dark navy suit with tie loosened, top collar button undone"
                  (same night — same clothes as Act 1)
CLOTHING_ACT3:    "simple dark shirt and trousers, home clothes, relaxed"
CLOTHING_HOSPITAL: "hospital gown, IV cannula in left arm, lying on stretcher"
```

**Expression Variants:**
```
EXPRESSION_DISCOMFORT: "subtle discomfort — NOT dramatic pain,
                        slight furrowing of brow, hand moving to chest,
                        trying to maintain composure"

EXPRESSION_FRIGHTENED: "confused and frightened — eyes wide, head turning,
                        overwhelmed by surroundings, NOT theatrical panic,
                        real quiet fear"

EXPRESSION_TIRED:      "exhausted but alive, eyes open staring upward,
                        heavy eyelids, weight of the night on his face"

EXPRESSION_RELIEVED:   "quiet relief, slight softening of face,
                        still processing what happened, NOT smiling broadly"
```

---

## CH02 — The Daughter

**Base Character Prompt:**
```
"Saudi girl around 12 years old, long dark brown hair simply tied back
with a plain band, warm olive complexion similar to her father's,
soft rounded innocent facial features, clear dark eyes,
beige or muted pink casual home clothes, [EXPRESSION], [POSE]"
```

**Expression Variants:**
```
EXPRESSION_WORRY:   "quiet worry, hands folded in lap, eyes drifting
                     sideways toward door, NOT theatrical fear — real silent worry"

EXPRESSION_RUNNING: "eyes intent ahead, starting to move toward someone,
                     face carrying both fear and hope"

EXPRESSION_RELIEF:  "tension releasing from face, eyes glistening slightly,
                     steps hesitant then decisive, looking up"
```

---

## CH03 — The Mother

**Base Character Prompt:**
```
"Saudi woman in her mid-40s, classic dark abaya (black or very dark navy),
composed dignified bearing that conceals deep emotion,
strong presence, Middle Eastern features showing maturity and quiet strength,
[EXPRESSION], [POSE]"
```

**Expression Variants:**
```
EXPRESSION_CONTROLLED: "controlled worry, hands together or resting in lap,
                         jaw set, eyes watchful — she does not cry in public"

EXPRESSION_WATCHING:   "still watching from doorway, holding back everything,
                        arms not moving, witness not participant"
```

---

## CH04 — The Doctor

**Base Character Prompt:**
```
"Young Saudi male doctor, late 20s to early 30s, short dark neat hair,
clean-shaven, white lab coat, stethoscope around neck,
hospital ID badge visible, professional Middle Eastern appearance,
[EXPRESSION_ACT], [POSE]"
```

**Expression Variants:**
```
EXPRESSION_ACT1: "frustrated but professional — NOT angry,
                   flipping through paper file pages rapidly, exasperated search,
                   jaw tightening, eyes scanning pages finding nothing"

EXPRESSION_ACT2: "calm decisive authority — NOT happy, focused intensity,
                  reading screen confidently, already formulating the decision,
                  turning to speak to team with certainty"
```

---

## CH05 — The Nurse

**Base Character Prompt:**
```
"Saudi nurse, late 20s to early 30s, navy or teal medical scrubs,
hair covered per hospital protocol, professional Middle Eastern appearance,
[EXPRESSION_ACT], [POSE]"
```

**Expression Variants:**
```
EXPRESSION_ACT1: "rushing, overwhelmed, clipboard in hand, looking around
                   for something that isn't there — controlled urgency turning to stress"

EXPRESSION_ACT2: "moving with purpose and confidence, eyes on screen,
                   coordinated movement — same urgency, zero chaos"
```

---

# SECTION 3 — LOCATION REFERENCE PROMPTS

---

## LOC01 — Home Kitchen (Empty Reference)
```
IMAGE PROMPT (Reference — No People):
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Modern Saudi middle-class home kitchen, late night setting,
warm tungsten overhead lighting above wooden dining table,
glass of water on table, smartphone face-down on table, clean but lived-in,
no people visible, 50mm lens equivalent, cinematic medium shot,
Saudi interior design aesthetic, neutral earth tones on walls,
NOT luxury, NOT poor — comfortable middle class.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

---

## LOC02-A — Emergency Room (Act 1 — Chaos)
```
IMAGE PROMPT (Act 1 Reference):
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi government hospital emergency room, harsh overhead fluorescent lighting
creating hard shadows, medical monitoring screens showing vital signs,
hospital stretcher, IV stands, medical cables, Arabic text hospital signage
visible on walls, linoleum floor, atmosphere of overwhelming chaos and urgency,
staff moving in multiple directions at once, no organized flow,
50mm lens equivalent, cinematic medium-wide shot.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

---

## LOC02-C — Emergency Room (Act 2 — SANAD Version)
```
IMAGE PROMPT (Act 2 Reference — SAME ROOM, DIFFERENT WORLD):
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
EXACT SAME Saudi government hospital emergency room as Act 1 —
same layout, same Arabic signage on walls, same equipment placement —
but now: SANAD digital screen on left wall displaying patient data
with dark-mode blue UI (#0A84FF primary), medical team moving with
precision not panic, staff positions coordinated, no one scrambling,
50mm lens equivalent, cinematic medium-wide shot.
IMPORTANT: This must look like the same room — only the energy changes.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

---

## LOC03-B — SANAD Drug Interaction Screen (UI Design Spec)
```
SCREEN DESIGN (تصميم UI — ليس Prompt لتوليد صور):

Background color:     #0A0A0F
Primary accent:       #0A84FF
Header font:          Clean sans-serif, NOT decorative Arabic calligraphy
Language:             Arabic (large) + English subtitle (smaller, below)

Left panel header:
  Arabic: "فحص التفاعلات الدوائية"
  English: "Drug Interaction Check"

Results displayed (top to bottom):
  ✓  "No drug-drug interactions detected"              — color: #30D158 (green)
  ⚠  "Warfarin documented — Aspirin contraindicated: flagged"  — color: #FFD60A (yellow)
  ✓  "Previous CBC: 2 days ago — loaded in 4s"         — color: #30D158 (green)
  ⏳ "Insurance gateway: connected — authorization in progress" — color: #0A84FF (blue)

Bottom bar:
  SANAD logo (Arabic + Latin paired) + Arabic timestamp

IMPORTANT NOTE: Do NOT include "AI Safety Check: CLEARED" anywhere on this screen.
That phrase has been removed from the production bible.
```

---

## LOC04 — Network Visualization (Shot 16)
```
ANIMATION DESIGN SPEC (2D Motion Graphics — NOT a photo prompt):

Background:       Pure deep black (#000000)
Line color:       #0A84FF (SANAD primary blue)
Node color:       #FFFFFF white, circular
Style:            2D flat vector line-drawing — NOT 3D, NOT map of Saudi Arabia,
                  NOT data visualization complexity — think "neural network diagram"

5 nodes (appear one by one, then connect):
  Node 1: 🚑  إسعاف / Ambulance
  Node 2: 🔬  مختبر / Laboratory
  Node 3: 💊  صيدلية / Pharmacy
  Node 4: 🏥  مستشفى / Hospital
  Node 5: 🛡️  تأمين / Insurance

Animation sequence:
  0–1s:  Nodes fade in one by one (left to right, or star pattern)
  1–4s:  Lines draw from each node toward center point
  4–8s:  Center convergence point glows — network pulses alive

Tool: After Effects / Lottie / Canva Motion
```

---

## LOC05 — Home Exterior (Act 3)
```
IMAGE PROMPT (Reference):
"Cinematic photorealistic 35mm film, soft golden hour 3200K warm light,
gentle shadows, Saudi Arabia authentic setting, subtle film grain,
NOT stock photo, NOT CGI, NOT anime.
Exterior of Saudi middle-class family home, daytime, soft golden afternoon
light from right side, simple stone or brick facade typical of Riyadh
residential neighborhood, dark wooden front door, short driveway path,
warm and safe atmosphere, no people, 50mm lens equivalent,
medium-wide shot, cinematic.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

---

# SECTION 4 — SHOT-BY-SHOT PROMPTS (All 25 Shots)

---

## SHOT 01 — Black Screen + Sound Only | Act 1 | 4s

### Image Prompt:
```
NOT APPLICABLE — Audio only shot. No image generated.
```

### Video Prompt:
```
NOT APPLICABLE — Pure black frame, 4 seconds.
```

### Audio Notes:
```
SFX 1: Car door slamming shut — exterior, nighttime suburban sound
SFX 2: Keys dropping on hard floor surface — 1 second after door slam
Ambient: Quiet suburban night — distant crickets or light wind, very low
Music: None
VO: None
Tools: ElevenLabs Sound Effects / Freesound (CC0 license)
```

---

## SHOT 02 — The Father in Kitchen | Act 1 | 6s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi man in his early 50s, partially gray short hair neatly kept but
slightly disheveled, warm olive-brown complexion, deep-set dark eyes showing
quiet fatigue, distinguished strong Middle Eastern facial structure,
prominent Arabic nose, dark navy suit with tie loosened top collar button undone.
Standing in modern Saudi middle-class home kitchen at night,
pouring water from jug into glass on wooden dining table, smartphone face-down on table.
Expression: subtle discomfort beginning — NOT dramatic pain, just a flicker,
brow slightly furrowed, head tilting down slightly, trying to maintain composure.
Medium shot, 85mm lens equivalent, slightly low camera angle.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Man finishes pouring water into glass. Pauses mid-action.
Brings hand slowly to his chest — left side. Expression shifts:
a subtle flicker of discomfort crosses his face, NOT dramatic pain.
He looks down at his hand, then back at the glass. Tries to continue normally.
Camera: STATIC. No movement.
Movement speed: Very slow, deliberate.
Duration: 6 seconds."
```

### Audio Notes:
```
VO (Arabic): "لا شيء يُنبئ بما سيأتي."
VO Subtitle: "Nothing warned what was coming."
Music: None yet — only ambient kitchen night sounds, very soft
```

---

## SHOT 03 — He Sits, Tries to Breathe | Act 1 | 5s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi man in his early 50s, partially gray short hair neatly kept but
slightly disheveled, warm olive-brown complexion, deep-set dark eyes showing
quiet fatigue, distinguished strong Middle Eastern facial structure,
prominent Arabic nose, dark navy suit with tie loosened top collar button undone.
Sitting heavily at wooden dining table, glass of water in hand, face tightening —
trying to breathe normally, expression of controlled discomfort, not panic.
One hand on table edge. Body posture heavy, sinking slightly into chair.
Medium shot from slight low angle, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Man sits down at table with visible effort — not collapse, just heaviness.
Takes slow sip of water. Sets glass down. Face tightens as he attempts
to breathe slowly and calmly. Chest rises and falls visibly.
Camera: STATIC.
Movement speed: Very slow.
Duration: 5 seconds."
```

### Audio Notes:
```
Music: MU-01 — Single sustained low cello note begins here, barely audible
SFX: None
VO: None
```

---

## SHOT 04 — His Phone on the Table | Act 1 | 3s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Close-medium shot of wooden kitchen table at night.
Smartphone lying face-down on table with dark lock screen visible on edge.
A man's hand — warm olive skin, dress shirt sleeve, suit jacket partially seen —
reaching toward the phone slowly, hesitantly.
Shallow depth of field: phone is sharp, background kitchen soft blur.
85mm lens equivalent, table-level camera angle.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Hand moves slowly and with effort toward the phone on the table.
Movement is hesitant, deliberate — as if the simple act costs something.
Hand reaches phone but does not yet pick it up.
Camera: STATIC. Table-level.
Movement speed: Very slow.
Duration: 3 seconds."
```

### Audio Notes:
```
Music: MU-01 cello note continues, barely louder
SFX: None
VO: None
```

---

## SHOT 05 — Emergency Room Entrance (World Without SANAD) | Act 1 | 8s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi government hospital emergency room — harsh overhead fluorescent lighting
creating hard shadows, medical monitoring screens, IV stands, medical cables,
Arabic text hospital signage on walls.
Saudi man in his early 50s, partially gray short hair, warm olive-brown complexion,
deep-set dark eyes, distinguished Middle Eastern facial structure — now on
hospital stretcher, face showing confusion and quiet fear, not theatrical panic.
Saudi nurse in navy scrubs pushing stretcher fast from behind.
Other staff in motion. Atmosphere of chaos and overwhelm — multiple people
moving in different directions, voices overlapping.
Medium shot following the stretcher, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Camera follows stretcher from behind and slightly to the side as it's wheeled
into the emergency room at speed. Nurses and staff rushing around from multiple
directions. Man on stretcher turns his head — face shows quiet fear and confusion.
Voices overlap (Arabic): people calling to each other, asking questions, no one
clearly in charge. Movement: fast, chaotic, uncoordinated.
Camera: FOLLOW SHOT moving with the stretcher.
Movement speed: Medium-fast.
Duration: 8 seconds."
```

### Audio Notes:
```
VO (Arabic): "في العالم الذي نعرفه..."
VO Subtitle: "In the world we know..."
Music: MU-01 cello tension rising
SFX: Hospital ambient — overlapping Arabic voices, beeping monitors, wheels on linoleum
Dialogue (whispered, overlapping Arabic): "وين مريضنا؟" "جيبوا الكرسي" "مين الأهل؟"
```

---

## SHOT 06 — The Doctor with the Paper File | Act 1 | 7s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Young Saudi male doctor, late 20s to early 30s, short dark neat hair,
clean-shaven, white lab coat, stethoscope around neck, hospital ID badge visible.
Holding a thick paper medical file in both hands, flipping through pages rapidly
with visible frustration — NOT anger, professional frustration.
Eyes scanning pages, finding nothing useful. Jaw tightening.
Hospital corridor or emergency bay background, other staff moving behind him.
Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Doctor flips through paper file pages — the search grows more frustrated
as nothing is found. He stops on a page, looks up at colleague with
exasperated expression. Whispers to the person beside him.
Camera: STATIC, medium shot.
Movement speed: Doctor's hands move at medium pace; his expression tightens
progressively over 7 seconds.
Duration: 7 seconds."
```

### Audio Notes:
```
Dialogue (whispered, male doctor): "محتاجين ملفه... مين طبيبه المعالج؟"
Subtitle: "We need his file... who is his doctor?"
Music: MU-01 tension holding
SFX: Papers rustling, distant hospital ambient
VO: None
```

---

## SHOT 07 — Pharmacist Waiting, Lab Results Not Arrived | Act 1 | 6s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi pharmacist — late 20s, white pharmacy coat — standing at counter holding
a telephone handset to ear, waiting on hold. Expression: patient but stressed,
tapping pen on counter slowly. On the counter: an insurance authorization form,
unsigned, sitting alone. Lab results printer in background with no output.
Medium shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Pharmacist holds phone to ear, waiting. Taps pen on counter top rhythmically —
impatient but controlled. Glances at unsigned insurance form.
Lab results printer in background shows no activity.
Camera: STATIC, medium shot.
Movement speed: Only the pen tapping and small head movement.
Duration: 6 seconds."
```

### Audio Notes:
```
Music: MU-01 tension — clock-tick rhythm emerges subtly under the cello
SFX: Distant hold music from the phone, pen tapping
VO: None
```

---

## SHOT 08 — Three Rapid Cuts of System Failure | Act 1 | 5s

### Cut 1 (2s) — Wrong Password, Account Locked:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Close shot of a hospital computer monitor screen showing a login interface.
Red error message: 'Account locked — 3 failed attempts' in Arabic and English.
A doctor's hand in white coat sleeve in foreground, frozen — just seeing the message.
85mm lens equivalent, close-medium shot.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut 2 (2s) — Nurse with Clipboard, System Loading:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi nurse in navy scrubs standing at an empty nurses' station,
holding clipboard, staring at a computer screen displaying a loading spinner.
Screen caption visible: '00:30' or progress bar frozen. Expression: waiting,
frustrated but professional. Medium shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut 3 (1s) — Phone Ringing, Unanswered:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Hospital desk telephone ringing — red light blinking on handset.
No one in frame. Empty desk. The absence of a person is the subject.
Close shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Video Prompt — All 3 Cuts (جاهز للنسخ):
```
"Three rapid cuts:
Cut 1 (2 seconds): Computer screen shows 'Account locked' red message.
Doctor's hand freezes. No reaction — just the red text on screen.
Cut 2 (2 seconds): Nurse stares at spinning loading wheel on screen.
Loading bar frozen. She doesn't move. System is stuck.
Cut 3 (1 second): Hospital desk phone ringing. Nobody picks up.
Frame is empty of people. Phone just rings.
All cameras STATIC. No movement. The stillness is the failure."
```

### Audio Notes:
```
Music: MU-01 tension peak — most intense moment in Act 1
SFX: Cut 1: error beep / Cut 2: soft mechanical hum / Cut 3: phone ringing 3-4 times
VO: None
```

---

## SHOT 09 — Waiting Room: Daughter and Mother | Act 1 | 6s

*يتطلب عناية خاصة — اقرأ التعليمات بالكامل*

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Hospital waiting room, sparse and institutional. One overhead fluorescent light.
Muted color palette — beige walls, gray chairs.
MEDIUM SHOT — not close up on faces. Both figures completely visible from waist up.
LEFT: Saudi girl around 12 years old, long dark brown hair simply tied back with plain band,
warm olive complexion, soft rounded innocent features, beige casual home clothes —
hands folded in lap, eyes drifting sideways toward the door, NOT at camera.
RIGHT: Saudi woman mid-40s, classic dark navy abaya, composed dignified bearing —
hands together in lap, jaw set, eyes forward.
Both sitting completely still. The silence is visible in the composition.
50mm lens equivalent, STATIC medium shot.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Complete stillness. Neither figure moves their body or head.
Only the girl's eyes move — very slowly — turning sideways toward the door.
No body movement. No head turn. Just her eyes.
Mother remains completely still, facing forward.
Camera: STATIC HOLD for 6 seconds. No camera movement whatsoever.
This is a shot of waiting made visible."
```

### Audio Notes:
```
Music: Drops to near-silence. Only the lowest possible ambient hospital hum.
SFX: Distant — very faint intercom or footstep, barely audible
VO: None
```

---

## SHOT 10 — The Father on the Hospital Bed | Act 1 | 8s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, warm tungsten 2700K lighting,
desaturated colors, heavy dramatic shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi man in his early 50s, partially gray short hair, warm olive-brown complexion,
deep-set dark eyes, distinguished Middle Eastern facial structure — now in
hospital gown, IV cannula in left arm connected to drip, lying in hospital bed.
Room is dark except for monitoring equipment amber light casting warm but heavy glow.
Eyes open, staring upward at ceiling. Alive — but exhausted. Heavy eyelids.
Face carries the weight of what the night cost. Not dramatic — quiet exhaustion.
Medium shot from slightly elevated angle, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Man lies still in hospital bed. Eyes open, staring at ceiling.
A slow blink — heavy eyelids, like lifting something.
Chest rises and falls with breathing — visible but slow.
IV drip in frame, slow drip movement.
He does not look at camera. Just upward. Just existing.
Camera: STATIC, very slightly elevated angle looking down.
Movement speed: Only breathing and one slow blink.
Duration: 8 seconds."
```

### Audio Notes:
```
VO (Arabic, multi-beat):
  Beat 1: "نجا."  [pause — 2 full seconds of silence after this word]
  Beat 2: "لكن بعد ساعات من التأخير. مضاعفات لم تكن ضرورية.
           أيام إضافية في المستشفى. وتكلفة أثقلت الأسرة."
VO Subtitle:
  Beat 1: "He survived."  [pause]
  Beat 2: "But after hours of delay. Complications that weren't necessary.
           Extra days in hospital. A cost that burdened his family."
Music: MU-01 cello note sustains, then slowly fades toward silence
SFX: Hospital monitor beeping, very soft and slow
```

---

## SHOT 11 — Black Screen: "The Same Night" | Transition | 2s

### Image Prompt:
```
NOT APPLICABLE — Motion Graphics only.
```

### Video / Motion Graphics Spec (جاهز للتنفيذ):
```
Background:       #000000 pure black
Duration:         2 seconds total

Text (Arabic, large, centered, #FFFFFF white):
  "نفس الليلة."

Text (English, smaller, below, #FFFFFF white):
  "The same night."

Font:             Clean sans-serif, heavy weight — same font used throughout all title cards
Animation:        Fade in only (0.5s), hold (1.5s)
Audio:            Complete silence — the cello from Act 1 stops here, before this card appears

Tool: After Effects / DaVinci Resolve Fusion / CapCut
```

---

## SHOT 12 — Same Kitchen, With SANAD | Act 2 | 4s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
EXACT SAME modern Saudi middle-class home kitchen as Shot 02 —
same wooden dining table, same warm room, same layout.
Saudi man in his early 50s, partially gray short hair, warm olive-brown complexion,
deep-set dark eyes, dark navy suit with tie loosened top collar button undone.
Same moment: hand moving toward chest — same gesture as Act 1.
DIFFERENCE: His smartphone on the table is LIT — screen active,
showing a blue notification glow, Arabic text visible as a health alert,
SANAD app notification interface. The blue light from the phone
casts a subtle cool reflection on the table surface.
Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Same action as Shot 02: man brings hand to chest, the same gesture of discomfort.
But mid-action: the phone on the table screen activates — blue glow appears.
SANAD notification pulse. His eyes are slightly drawn to it — a micro-movement
of attention toward the screen. The system already knew.
Camera: STATIC.
Movement speed: Very slow — same pace as Act 1 equivalent.
Duration: 4 seconds."
```

### Audio Notes:
```
VO (Arabic): "لكن هذه المرة..."
VO Subtitle: "But this time..."
SFX: A quiet, professional SANAD notification chime — one soft tone, not alarming
Music: Silence transitioning — the chaos is gone
```

---

## SHOT 13 — Emergency Room With SANAD | Act 2 | 5s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
EXACT SAME Saudi government hospital emergency room as Shot 05 —
same fluorescent overhead lights, same Arabic signage on walls, same room.
NOW: a Saudi nurse in navy scrubs stands at a mounted screen showing
SANAD patient record interface — dark mode UI, blue accents, patient
medications list highlighted, allergy flags visible, last 3 lab results.
Young Saudi male doctor, late 20s, white lab coat, stethoscope, hospital badge —
standing at the screen, reading it with calm decisive expression, already
formulating his decision. He turns to speak to the team.
Medical team in background moving with coordinated purpose — no chaos.
Medium shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Nurse at screen points confidently to patient data.
Doctor reads, nods, turns to team and speaks with calm, quiet authority.
Team responds immediately — coordinated movement, no confusion.
Same urgency as Act 1 — zero chaos.
Camera: STATIC, medium shot.
Movement speed: Purposeful, neither rushed nor leisurely.
Duration: 5 seconds."
```

### Audio Notes:
```
Dialogue (male doctor, calm decisive): "عنده وارفارين — لا تعطوه أسبرين."
Subtitle: "He's on Warfarin — no aspirin."
SFX: SANAD resolution tone — subtle, professional (NOT an alarm, NOT triumphant)
Music: MU-02 — same rhythm as Act 1 but organized, lighter in texture
VO: None
```

---

## SHOT 14 — The SANAD Drug Interaction Screen | Act 2 | 4s

### Screen Design (جاهز للتنفيذ — refer to LOC03-B spec above):
```
Implement the LOC03-B UI design spec exactly.

Key elements visible on screen:
  ✓  "No drug-drug interactions detected"              — #30D158 green
  ⚠  "Warfarin documented — Aspirin contraindicated: flagged"  — #FFD60A yellow
  ✓  "Previous CBC: 2 days ago — loaded in 4s"         — #30D158 green
  ⏳ "Insurance gateway: connected — authorization in progress" — #0A84FF blue

Medical team visible in background (soft focus) moving with confidence.
```

### Video Prompt (جاهز للنسخ):
```
"Camera holds on the SANAD screen as results appear one by one —
each line appearing with a soft green or yellow indicator.
Medical team in background (soft focus) begins moving with increased confidence
as the screen shows everything is checked and flagged appropriately.
One team member nods without speaking.
Camera: STATIC, medium close on screen.
Duration: 4 seconds."
```

### Audio Notes:
```
SFX: SANAD resolution confirmation tone — short, professional, not loud
Music: MU-02 continues — coordinated rhythm
VO: None
```

---

## SHOT 15 — Three Rapid Cuts (With SANAD) | Act 2 | 5s

### Cut 1 (2s) — Lab Results Retrieved in 4 Seconds:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Hospital lab screen showing:
  - Header: 'CBC from 3 days ago — loaded' with green checkmark
  - Below: 'Troponin: pending collection'
  - Timer showing '4s' with green border
  - SANAD dark mode UI
Green confirmation indicator glowing.
Close shot of screen, 85mm lens.
stock photo, cartoon, anime, 3D render, CGI, oversaturated"
```

### Cut 2 (2s) — Pharmacy Authorized:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Saudi pharmacist in white coat at screen — green authorization light visible.
SANAD screen showing 'Drug interaction: CLEAR — Dispense authorized' in green.
Pharmacist hand reaching for medication with confidence, not hesitation.
Medium shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated"
```

### Cut 3 (1s) — Insurance Real-Time Authorization:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, cool clinical 5000K lighting,
crisp contrast, precise organized shadows, Saudi Arabia authentic setting,
subtle film grain, high production value, NOT stock photo, NOT CGI, NOT anime.
Screen showing insurance gateway interface:
  'Insurance Authorization: Connected'
  'Real-time gateway: active'
  Status bar showing 'In progress...' with blue pulsing indicator
SANAD dark mode UI.
Close shot of screen, 85mm lens.
stock photo, cartoon, anime, 3D render, CGI, oversaturated"
```

### Video Prompt — All 3 Cuts (جاهز للنسخ):
```
"Three coordinated cuts — same tempo as Shot 08 but entirely different energy:
Cut 1 (2 seconds): Lab result screen shows loaded data with green 4-second timer.
No spinning wheel. No waiting. Just: loaded.
Cut 2 (2 seconds): Pharmacist reaches for medication confidently —
green authorization on screen beside him. Purposeful, not rushed.
Cut 3 (1 second): Insurance gateway screen shows active connection and
real-time authorization in progress. System working.
All cameras STATIC. The stillness now reads as competence, not paralysis."
```

### Audio Notes:
```
Music: MU-02 — rhythm is same tempo as Act 1 cuts but lighter, coordinated, not chaotic
SFX: Soft confirmation chimes on each cut (subtle, not celebratory)
VO: None
```

---

## SHOT 16 — The Network Visualization | Act 2 | 8s

### Animation Prompt (جاهز للتنفيذ):
```
Implement the LOC04 animation design spec exactly.

Sequence:
  0–1s:   5 labeled nodes fade in one by one on deep black background
  1–4s:   Blue lines (#0A84FF) draw from each node toward center point
           Lines animate with a slow, deliberate drawing speed
  4–8s:   Center convergence point glows white, then pulses blue
           The entire network takes one synchronized breath — all lines pulse once

Style notes:
  - 2D flat vector only — NOT 3D
  - NOT a map of Saudi Arabia — this is a systems diagram, not geography
  - Nodes are circles, NOT icons (keep it clean and credible)
  - Arabic label + English label for each node, stacked

Tool options: After Effects with path animation / Lottie / Motion
```

### Audio Notes:
```
VO (Arabic): "سند لا يستبدل الأطباء. سند يوصّل كل الأطراف باللحظة الحرجة."
VO Subtitle: "SANAD doesn't replace doctors. SANAD connects every party at the critical moment."
Music: MU-02 continues, holds
SFX: Subtle electronic tone as center point glows — like a connection being made
```

---

## SHOT 17 — The Return Home | Act 3 | 5s

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, soft golden hour 3200K warm light,
gentle shadows, Saudi Arabia authentic setting, subtle film grain,
NOT stock photo, NOT CGI, NOT anime.
Exterior of Saudi middle-class family home, daytime, soft golden afternoon
light from right side, simple stone or brick facade, dark wooden front door.
Saudi man in his early 50s, partially gray hair, warm olive-brown complexion,
distinguished Middle Eastern features — wearing simple dark shirt and trousers,
home clothes, not the suit anymore.
He has stepped out of a family car visible at frame edge.
Standing in the driveway, upright but moving carefully — slower than before.
Alive. Home. One hand resting on car door as he steadies himself.
Medium-wide shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Family car stops in driveway. Car door opens slowly from inside.
The father steps out with visible care — not weakness, just deliberateness.
His movements are slower than they should be, but he is standing.
He takes one slow breath. Looks at the front door of his home.
Camera: STATIC, medium-wide.
Movement speed: Slow.
Duration: 5 seconds."
```

### Audio Notes:
```
Music: MU-03 — A single piano note. Just one. Holds until it fades naturally.
SFX: Car door closing softly, light breeze
VO: None
```

---

## SHOT 18 — The Hug | Act 3 | 8s

*يتطلب عناية خاصة — اقرأ التعليمات بالكامل*

### Image Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, soft golden hour 3200K warm light,
gentle shadows, Saudi Arabia authentic setting, subtle film grain,
NOT stock photo, NOT CGI, NOT anime.
MEDIUM SHOT — crucial: NOT close-up on faces. See both figures completely
from waist up. This framing is required.
Saudi family home front doorway, warm afternoon light from right.
FOREGROUND: Saudi man in his early 50s, partially gray hair, warm olive-brown
complexion, simple dark shirt and trousers — standing in driveway.
FOREGROUND: Saudi girl around 12 years old, long dark hair simply tied back,
warm complexion — standing ONE STEP before him, stopped. Looking up at him.
He looks down at her. The hug is just beginning — arms starting to come together,
slowly and quietly. NOT dramatic. NOT sentimental. Real.
BACKGROUND: Saudi woman mid-40s, dark abaya — watching from the doorway.
She does not move toward them. She witnesses.
Golden afternoon light from right. Mother in soft focus behind.
50mm lens equivalent, STATIC medium shot.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

### Video Prompt (جاهز للنسخ):
```
"Front door opens. Daughter appears in doorway.
She moves toward her father — begins almost running, then slows.
She stops exactly one step before him.
She looks up. He looks down. The moment holds — one second of looking.
Then arms come together slowly, quietly. The hug begins.
It is not dramatic. It is the hug of someone who almost wasn't there.
Mother in doorway does not move. She watches from the doorway.
CAMERA: STATIC. DO NOT push in. DO NOT zoom. DO NOT follow.
Hold the medium shot for the full 8 seconds.
The viewer must project — not be told how to feel."
```

### Audio Notes:
```
Music: MU-03 — a second piano note, after the first. Then silence. Nothing more.
SFX: None
VO: None
```

---

## SHOT 19 — Slow Fade to Black | Transition | 3s

### Spec (جاهز للتنفيذ):
```
Type:           Edit transition only — no image generation required
Effect:         Slow linear fade from Shot 18's final frame to pure #000000 black
Duration:       3 full seconds
Audio:          Silence begins from end of Shot 18 — the piano has already faded
Music:          None
VO:             None
SFX:            None

Note: The silence must begin BEFORE the fade completes — the viewer enters
the black in complete silence.
```

---

## SHOT 20 — "Today, One Patient Was Saved." | Act 4 | 4s

### Motion Graphics Spec (جاهز للتنفيذ):
```
Background:     #000000 pure black — not dark gray, not navy — pure black

Text (Arabic, large, centered):
  "اليوم تُم إنقاذ مريض."
  Color: #FFFFFF pure white
  Font: Clean sans-serif, heavy/bold weight (decide on one font and lock it
        for ALL title cards: Shots 11, 20, 21, 25)
  Size: Large — must be readable at arm's length on a laptop screen

Animation:
  0.0–0.5s:  Pure black (silence, darkness)
  0.5s:      Text fades in — 1 second fade duration
  1.5–4.0s:  Text holds. Nothing moves.

Audio:         COMPLETE SILENCE. No music. No ambient. No VO. No SFX.
               Nothing.
Subtitle:      NONE — no English translation for these two lines.
               The Arabic carries itself.

IMPORTANT: This is not a motion graphics moment. There is no motion.
The text appears and sits. That is the entire shot.
```

---

## SHOT 21 — "Tomorrow, Millions Can Be." | Act 4 | 3s

### Motion Graphics Spec (جاهز للتنفيذ):
```
Background:     #000000 pure black (continuous from Shot 20)

Sequence from Shot 20 end:
  Shot 20 text fades out — 0.5 second fade
  0.5 seconds of pure black and pure silence
  New text fades in — 0.5 second fade

Text (Arabic, large, centered):
  "وغدًا يمكن إنقاذ ملايين."
  Color: #FFFFFF pure white
  Font: EXACT SAME font as Shot 20 — same size, same weight, same position

Hold: 2 seconds after text appears
Audio: SILENCE CONTINUES — unbroken from Shot 19 through Shot 21
Subtitle: NONE

The two sentences together:
  "اليوم تُم إنقاذ مريض."   →   Shot 20
  "وغدًا يمكن إنقاذ ملايين."  →   Shot 21

This is not hyperbole. This is the film's entire argument, stated plainly.
```

---

## SHOT 22 — National Montage (6 Cuts) | Act 4 | 10s

*6 cuts × approximately 1.5–2 seconds each*

---

### Cut A — Lab Technician at Night:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Saudi lab technician — late 20s, lab coat, safety glasses on forehead —
at night in a clinical laboratory, running a blood test on automated analyzer.
Concentrated expression, skilled hands. Lab equipment glowing. Night through window.
Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter"
```

### Cut B — Pharmacist: Red Flag to Green:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Saudi pharmacist at computer screen — the screen shows a drug interaction flag
changing from red warning to green clearance (or show both states: left side red,
right side green after override review). Pharmacist's face shows controlled
professional focus. Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut C — Emergency Responder in Moving Ambulance:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Interior of moving Saudi ambulance at night. Emergency responder (male, 30s,
in Saudi emergency services uniform) receiving patient medical record on a tablet
— SANAD interface visible on screen (dark mode, blue UI). City lights visible
through ambulance window in motion blur behind. Focused, purposeful expression.
Medium close shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut D — Doctor Reviewing Dashboard in Hospital Corridor:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Young Saudi doctor (white coat, stethoscope) walking in hospital corridor,
pausing to review a SANAD dashboard on a wall-mounted screen or tablet.
Corridor stretches behind him, other staff in soft focus.
Purposeful, decisive expression. Medium shot, 50mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut E — Insurance Officer Approving in Seconds:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Saudi insurance officer (business attire, mid-30s) at a clean desk,
clicking to approve a claim on screen — the screen shows green 'Approved' status
appearing. Expression: professional, quick, efficient. Office environment.
Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces"
```

### Cut F — Elderly Patient in Video Call:

**Image Prompt (جاهز للنسخ):**
```
"Cinematic photorealistic 35mm film, soft golden hour 3200K warm light,
gentle shadows, Saudi Arabia authentic setting, subtle film grain,
NOT stock photo, NOT CGI, NOT anime.
Saudi elderly woman, 70s, in modest home setting — sitting comfortably,
video-calling her family doctor on a tablet or phone.
Doctor visible on screen, listening attentively.
The woman's expression: calm, cared-for, dignified. NOT sick-looking —
she is being seen and heard.
Medium shot, 85mm lens equivalent.
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter"
```

### Video Prompt — All 6 Cuts (جاهز للنسخ):
```
"Six cinematic cuts, each 1.5–2 seconds. All showing coordinated, purposeful action:
Cut A: Lab technician hands work on analyzer — smooth professional movement.
Cut B: Screen transitions from red flag to green clearance — pharmacist nods.
Cut C: Emergency responder scrolls through patient data on tablet in moving ambulance.
Cut D: Doctor pauses, reads dashboard, continues walking with purpose.
Cut E: Insurance officer clicks once — green approval appears — moves to next case.
Cut F: Elderly woman speaks to doctor on screen — she is heard, she is calm.
All cameras STATIC or very slow follow. No shaky cam. No dramatic angles.
Music rises under all cuts — purposeful, not triumphant."
```

### Audio Notes:
```
VO (Arabic): "في كل مستشفى. في كل صيدلية. في كل غرفة طوارئ. في كل منزل."
VO Subtitle: "In every hospital. Every pharmacy. Every ER. Every home."
Music: MU-04 — orchestral rises here. Hopeful, purposeful. NOT triumphant. NOT heroic fanfare.
```

---

## SHOT 23 — Aerial City at Night | Act 4 | 5s

### Image/Video Prompt (جاهز للنسخ):
```
"Cinematic photorealistic 35mm film, deep blue-black night sky,
warm amber city glow below, Saudi Arabia scale and grandeur,
subtle film grain, NOT stock photo, NOT CGI, NOT anime.
Aerial shot of Saudi city at night — Riyadh or Jeddah skyline.
City lights stretching to the horizon in all directions.
Warm amber streetlights and building lights below.
Deep blue-black sky above. Scale: the viewer feels the size of what this means.
Slow forward drone movement — unhurried, purposeful.
24mm lens equivalent (aerial only).
stock photo, cartoon, anime, 3D render, CGI, oversaturated,
text watermark, unrealistic lighting, Western European faces,
happy commercial smile, beauty filter, Instagram filter,
artificial poses, fashion photography style, tourist photo"
```

*Production note: Either generate via AI video (Kling 2.0 / Runway Gen-4) or use licensed aerial stock footage. Verify CC licensing if using stock.*

### Audio Notes:
```
VO (Arabic): "المملكة العربية السعودية تبني منظومة صحية للمستقبل."
VO Subtitle: "Saudi Arabia is building a health system for the future."
Music: MU-04 orchestral — near its sustained peak
SFX: None
```

---

## SHOT 24 — Slow Fade to White | Transition | 4s

### Spec (جاهز للتنفيذ):
```
Type:       Edit transition only — no image generation required
Effect:     Slow linear fade from the aerial city shot to pure #FFFFFF white
Duration:   4 full seconds
Music:      MU-04 holds on its final sustained note through this entire fade
VO:         None
SFX:        None

Note: The fade to white is the inverse of Shot 19's fade to black.
Black was the weight of "what this costs." White is "what is possible."
```

---

## SHOT 25B — Traction Numbers | Act 4 | 3s

### Motion Graphics Spec (جاهز للتنفيذ):
```
Background:     #FFFFFF pure white

Text line 1 (large, centered):
  "12 hospitals · 40,000 patients · 6 insurance partners"
  Color: #0A0A0F (near-black on white)
  Font: SAME clean sans-serif as title cards

Text line 2 (smaller, below, same center alignment):
  "Beta — KSA 2026"
  Color: #0A0A0F
  Font: Same, lighter weight

Animation:
  0.0s:   Pure white (continuous from Shot 24)
  0.5s:   Text fades in — 0.5 second fade
  0.5–3s: Text holds
  3s:     Hold ends (transitions to Shot 25 logo)

Audio:       SILENCE — same unbroken silence from Shots 20–21 returns here
Music:       None
VO:          None
Subtitle:    None
SFX:         None

IMPORTANT: Replace these numbers with actual live figures before final production.
The silence + white + clean numbers = credibility. Do not add decoration.
```

---

## SHOT 25 — The Logo | Act 4 | 5s

### Motion Graphics Spec (جاهز للتنفيذ):
```
Background:     #FFFFFF pure white (continuous from Shot 25B)

Center content:
  SANAD wordmark — use the official logo file from the project
  Arabic: "سند"  paired with  Latin: "SANAD"

Below wordmark, smaller:
  Arabic: "لكل قرارٍ سند."
  English: "Behind Every Decision."
  Color: #0A0A0F

Animation:
  0.0s:   Logo fades in from white — 1 second fade
  1–5s:   Logo holds. Completely still.

Audio sequence:
  0.0–4.0s:  Silence (continued from Shot 25B)
  4.0s:      One single breath of ambient music — very quiet, like air returning
  5.0s:      Fade out to complete silence

Music:    MU-05 — Final ambient breath (5 seconds, barely audible)
VO:       None
SFX:      None
```

---

# SECTION 5 — MUSIC PROMPTS (Suno / Udio)

---

## MU-01 — Act 1 Tension Track

**Suno/Udio Prompt (جاهز للنسخ):**
```
"Single sustained cello note, very low pitch, almost subterranean,
no melody, just a held tone that breathes slightly — a slow swell
from silence to barely audible, then settles.
Very slow swell from silence to barely audible.
Duration: 40 seconds.
NO percussion. NO harmony. NO melody. ONE note.
The note should feel like dread that hasn't declared itself yet."
```

**Style tags for Suno:** `cinematic, cello, drone, tension, no melody, minimalist, film score`

**Usage:** Shot 03 through Shot 10. Builds slowly across Act 1.

---

## MU-02 — Act 2 Resolved Tension Track

**Suno/Udio Prompt (جاهز للنسخ):**
```
"Same tempo and energy as a tense scene score — but resolved.
Strings and low woodwinds, same pace as MU-01 but with minor tension
replaced by coordinated purpose. Not relaxed — purposeful.
Like a surgical team working: precise, confident, no wasted movement.
NO victory fanfare. NOT celebratory.
Duration: 30 seconds.
BPM: slow, deliberate — same as MU-01."
```

**Style tags for Suno:** `cinematic, strings, purposeful, minimal, medical, coordinated, film score`

**Usage:** Shot 13 through Shot 16.

---

## MU-03 — Act 3 Piano Moment

**Suno/Udio Prompt (جاهز للنسخ):**
```
"Solo piano. Two notes. That is all.
First note: holds until it fades naturally (approximately 4 seconds).
Silence for 2 seconds.
Second note: a different note — slightly warmer, slightly higher. Holds and fades.
Then silence.
No melody. No chord progression. No additional instruments.
Just two piano notes, each standing alone.
Duration: 12 seconds total."
```

**Style tags for Suno:** `piano solo, minimalist, two notes, silence, intimate, film score`

**Usage:** Shot 17 (first note) and Shot 18 (second note). Silence after.

---

## MU-04 — Act 4 Orchestral Rise (The Most Important)

**Suno/Udio Prompt (جاهز للنسخ):**
```
"Cinematic orchestral score, strings and piano, hopeful and purposeful,
building slowly from single piano note to full strings.
NOT triumphant. NOT bombastic. NOT heroic fanfare.
The feeling: watching the sun rise — not winning a race.
Reference emotion: Hans Zimmer 'Time' from Inception — the patience, not the climax.
The music should feel like a system coming online, not a celebration.
120 BPM approximately, major key but restrained.
Duration: 25 seconds.
Build: 0–8s piano alone, 8–16s strings join gradually, 16–25s full but still quiet."
```

**Style tags for Suno:** `orchestral, cinematic, hopeful, strings, piano, Hans Zimmer style, purposeful, not triumphant, film score`

**Usage:** Shot 22 (begins) through Shot 23. Holds through Shot 24 fade.

---

## MU-05 — Final Ambient Breath (Logo Moment)

**Suno/Udio Prompt (جاهز للنسخ):**
```
"A single breath of ambient air — musical but barely so.
Like a room after everyone has left and the silence settles.
A soft pad or sustained note, just at the threshold of hearing.
Duration: 5 seconds.
Fades in from silence (1 second), holds (2 seconds), fades out to silence (2 seconds).
NO melody. NO rhythm. Just presence."
```

**Style tags for Suno:** `ambient, pad, breath, ending, silence, minimal, logo moment`

**Usage:** Final 1 second of Shot 25. The last sound the viewer hears.

---

# SECTION 6 — QUICK REFERENCE TABLE

| Shot | Act | Duration | Type | Style Anchor | Characters |
|------|-----|----------|------|-------------|------------|
| 01 | 1 | 4s | Audio Only | — | None |
| 02 | 1 | 6s | Image + Video | Act 1 | CH01 |
| 03 | 1 | 5s | Image + Video | Act 1 | CH01 |
| 04 | 1 | 3s | Image + Video | Act 1 | CH01 (hand only) |
| 05 | 1 | 8s | Image + Video | Act 1 | CH01, CH05 |
| 06 | 1 | 7s | Image + Video | Act 1 | CH04 |
| 07 | 1 | 6s | Image + Video | Act 1 | CH05 (pharmacist) |
| 08 | 1 | 5s | 3 Cuts | Act 1 | None / CH05 |
| 09 | 1 | 6s | Image + Video | Act 1 | CH02, CH03 |
| 10 | 1 | 8s | Image + Video | Act 1 | CH01 |
| 11 | Trans | 2s | Motion Graphics | — | None |
| 12 | 2 | 4s | Image + Video | Act 2 | CH01 |
| 13 | 2 | 5s | Image + Video | Act 2 | CH04, CH05 |
| 14 | 2 | 4s | Screen Design | Act 2 | None |
| 15 | 2 | 5s | 3 Cuts | Act 2 | None |
| 16 | 2 | 8s | Animation | — | None |
| 17 | 3 | 5s | Image + Video | Act 3 | CH01 |
| 18 | 3 | 8s | Image + Video | Act 3 | CH01, CH02, CH03 |
| 19 | Trans | 3s | Edit Transition | — | None |
| 20 | 4 | 4s | Motion Graphics | — | None |
| 21 | 4 | 3s | Motion Graphics | — | None |
| 22 | 4 | 10s | 6 Cuts | Act 4 | Multiple |
| 23 | 4 | 5s | Aerial Video | Act 4 | None |
| 24 | Trans | 4s | Edit Transition | — | None |
| 25B | 4 | 3s | Motion Graphics | — | None |
| 25 | 4 | 5s | Motion Graphics | — | None |

---

# SECTION 7 — CONSISTENCY RULES (قبل توليد أي صورة)

```
RULE 1 — CHARACTER LOCK:
Generate CH01-A (father, Act 1 clothes, neutral expression) FIRST.
Save this image. Use it as reference input in every subsequent shot with the father.
Same for CH02-A, CH03-A, CH04-A.

RULE 2 — LOCATION LOCK:
Generate LOC01-A (empty kitchen) FIRST.
Generate LOC02-A (empty ER) FIRST.
Save both. Use as reference input for all shots in those locations.

RULE 3 — SAME ROOM RULE (Critical for Acts 1 and 2):
Shot 02 and Shot 12 MUST show the same kitchen.
Shot 05 and Shot 13 MUST show the same emergency room.
Use the reference image from Act 1 as literal input for Act 2 generation.

RULE 4 — SHOT 18 FRAMING:
Medium shot. Never close-up on faces. This is not negotiable.
If the generated image is too close — regenerate.

RULE 5 — SHOTS 20 AND 21 — SILENCE:
These two title cards must have zero audio — no music, no ambient, no VO.
Verify in editing before export.

RULE 6 — FONT CONSISTENCY:
Choose one font for all title cards (Shots 11, 20, 21, 25B, 25) before generating any of them.
Lock it. Never change it.

RULE 7 — AI SAFETY CHECK PHRASE:
Do NOT use "AI Safety Check: CLEARED" anywhere in the film.
This phrase was removed from the production bible.
Use the LOC03-B spec exactly as written.
```

---

*SANAD Prompt Library v1.0 — 2026-07-01*
*Investor Cut — "لكل قرارٍ سند." / "Behind Every Decision."*
*Based on: SANAD_SHOT_LIST.md v1.1 + SANAD_AI_PRODUCTION_BIBLE.md v1.0*
