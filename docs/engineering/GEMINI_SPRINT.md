# SANAD — Gemini Localization Sprint

**Branch to create:** `localization/rtl-hardening`  
**Base:** `main` (already pushed to `sanad-final`)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Context

SANAD is a national AI health platform for Saudi Arabia.  
Frontend: Next.js 15 · TypeScript · Tailwind · shadcn/ui  
All screens are in `artifacts/sanad/src/screens/`

The i18n infrastructure is **already wired**:
- `artifacts/sanad/src/contexts/language-context.tsx` — `useLanguage()` hook
- `artifacts/sanad/src/lib/terms.ts` — bilingual glossary (75 keys)
- All screens already import `useLanguage` and call `text(english, arabic)`

**Reference implementation (gold standard):** `artifacts/sanad/src/screens/doctor.tsx`  
It shows the full pattern. Read it before starting.

---

## The Three Tasks

---

### T1 — Fix `dir` Pinning (Priority: HIGH)

**Problem:** `dir="ltr"` is hardcoded on containers.  
In Arabic (RTL) mode, the layout direction must flip. Currently it's stuck LTR.

**How to get `dir`:**
```tsx
const { text, dir } = useLanguage()
// dir === "rtl" when locale is "ar", "ltr" when locale is "en"
```

**Rule — when to replace vs keep:**

| Element | Action |
|---|---|
| `<div>`, `<section>`, `<Card>`, `<CardContent>`, `<CardHeader>` with `dir="ltr"` | **Replace** → `dir={dir}` |
| `<span>` containing only a number, date, lab value, or medical code | **KEEP** `dir="ltr"` — numbers stay LTR in Arabic |
| `<Badge>` showing status text | **Replace** → `dir={dir}` |
| `<p>`, `<h2>`, `<h3>` with `dir="ltr"` | **Replace** → `dir={dir}` |

**Screens with hardcoded `dir="ltr"` (count per file):**

| Screen | Count | Priority |
|---|---|---|
| `citizen.tsx` | 12 | HIGH |
| `doctor.tsx` | 18 | HIGH |
| `emergency.tsx` | 9 | HIGH |
| `lab.tsx` | 6 | MEDIUM |
| `landing.tsx` | 6 | MEDIUM |
| `admin.tsx` | 4 | MEDIUM |
| `ai-control.tsx` | 4 | MEDIUM |
| `login.tsx` | 4 | MEDIUM |
| `family.tsx` | 3 | LOW |
| `insurance.tsx` | 1 | LOW |
| `pharmacy.tsx` | 1 | LOW |

Also fix `artifacts/sanad/src/components/layout.tsx` which has 1 `dir="ltr"` on the sidebar.

---

### T2 — Fix `as any` Casts (Priority: HIGH)

**30 casts across 6 files.** Replace each with the actual inferred type.

**Pattern — before:**
```tsx
const data = response as any
data.riskScore
```

**Pattern — after:**
```tsx
type PatientRecord = { riskScore: number; fullName: string; /* ... */ }
const data = response as PatientRecord
```

Look at the API route files in `artifacts/api-server/src/routes/` to see exactly what each endpoint returns, then type the response accordingly.

**Files and cast counts:**

| File | `as any` count |
|---|---|
| `emergency.tsx` | 11 |
| `admin.tsx` | 9 |
| `doctor.tsx` | 5 |
| `citizen.tsx` | 3 |
| `lab.tsx` | 1 |
| `research.tsx` | 1 |

**Strategy:** Define inline `type` aliases at the top of each component for API response shapes. Do not create a shared types package — keep the types co-located in each screen for now.

---

### T3 — Wrap Untranslated UI Strings (Priority: MEDIUM)

Screens with high line counts but few `text()` calls have hardcoded English strings not yet wrapped.

**Priority screens (ratio: lines vs text() calls):**

| Screen | Lines | `text()` calls | Gap |
|---|---|---|---|
| `pharmacy.tsx` | 879 | 16 | HIGH |
| `research.tsx` | 737 | 16 | HIGH |
| `insurance.tsx` | 670 | 17 | HIGH |
| `supply-chain.tsx` | 579 | 17 | HIGH |
| `hospital.tsx` | 457 | 17 | MEDIUM |

**Pattern:**
```tsx
// Before
<CardTitle>Patient Overview</CardTitle>
<p>No data found</p>
<Button>Refresh</Button>

// After
<CardTitle>{text("Patient Overview", "نظرة عامة على المريض")}</CardTitle>
<p>{text("No data found", "لا توجد بيانات")}</p>
<Button>{text("Refresh", "تحديث")}</Button>
```

**Check `terms.ts` first** — if the term already has a key (e.g., `T.patient`), you can use:
```tsx
import { T } from "@/lib/terms"
// text(T.patient[0], T.patient[1])
```

If a clinical term is missing from `terms.ts`, add it there first, then use the key.  
Terms file: `artifacts/sanad/src/lib/terms.ts`

---

## Pattern Reference — `useLanguage` API

```tsx
import { useLanguage } from "@/contexts/language-context"

function MyComponent() {
  const { text, dir, locale } = useLanguage()

  return (
    <div dir={dir}>                              {/* container flips with language */}
      <h2>{text("Patient Record", "سجل المريض")}</h2>
      <span dir="ltr">{patient.riskScore}</span> {/* number stays LTR */}
    </div>
  )
}
```

---

## Acceptance Criteria

Before opening a PR, verify:

- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad build` → successful (18/18 routes)
- [ ] No `dir="ltr"` remains on container elements (grep: `grep -rn 'dir="ltr"' src/screens/ src/components/layout.tsx`)
- [ ] Zero new `as any` introduced; count reduced from 30 → 0
- [ ] Language toggle in the app switches all visible text between Arabic and English
- [ ] Numbers and lab values remain LTR in RTL mode

---

## Git Instructions

```bash
# Clone and set up
git clone https://github.com/hossam2111/sanad-final.git
cd sanad-final
git checkout -b localization/rtl-hardening

# Install
pnpm install

# Work on T1, T2, T3 in that order
# Commit each task separately:
git commit -m "fix: replace container dir=ltr with dynamic dir in all screens"
git commit -m "fix: replace as-any casts with typed response shapes (30 → 0)"
git commit -m "feat: wrap remaining hardcoded strings in text() across 5 screens"

# Final check
pnpm --filter @workspace/sanad typecheck
pnpm --filter @workspace/sanad build

# Push
git push -u origin localization/rtl-hardening
```

---

## Do NOT Touch

- `artifacts/api-server/` — backend is frozen
- `lib/db/` — schema is frozen  
- `scripts/` — seed and harnesses are frozen
- `artifacts/sanad/src/contexts/language-context.tsx` — hook is correct as-is
- Any file not listed in T1/T2/T3 above
