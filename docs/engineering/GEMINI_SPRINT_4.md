# SANAD — Gemini Sprint 4: Dark Mode + Harness Update

**Branch to create:** `feature/dark-mode`  
**Base:** `main` (after Sprint 3 is merged)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Overview

Two parallel workstreams:

| Workstream | Scope | Files touched |
|---|---|---|
| **A — Dark Mode** | Full dark/light theme toggle across all 15 screens | globals.css, layout.tsx, all screens |
| **B — Harness Update** | Update both test harnesses for Sprint 2 & 3 changes | scripts/harnesses/\*.mjs |

Both must pass before opening the PR.

---

## Workstream A — Dark Mode

### A1 — CSS Variables (Design Tokens)

File: `artifacts/sanad/app/globals.css`

Add a `[data-theme="dark"]` block alongside `:root`. Use the existing Tailwind HSL variable pattern already in the file:

```css
[data-theme="dark"] {
  --background: 222 47% 8%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 100% 56%;
  --primary-foreground: 222 47% 8%;
  --secondary: 217 32% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 32% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 32% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 50%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 32% 17%;
  --input: 217 32% 17%;
  --ring: 210 100% 56%;

  /* Risk tokens — same hue, higher contrast for dark bg */
  --risk-critical: 0 90% 65%;
  --risk-high: 25 95% 60%;
  --risk-medium: 45 95% 55%;
  --risk-low: 142 70% 50%;
  --risk-none: 217 32% 50%;
}
```

Also add these risk tokens to the `:root` block (they may be missing):

```css
:root {
  /* … existing variables … */
  --risk-critical: 0 84% 55%;
  --risk-high: 25 90% 50%;
  --risk-medium: 45 90% 48%;
  --risk-low: 142 65% 40%;
  --risk-none: 215 20% 60%;
}
```

---

### A2 — Theme Provider

File: `artifacts/sanad/app/layout.tsx`

Install `next-themes`:

```bash
pnpm --filter @workspace/sanad add next-themes
```

Wrap the root layout with `ThemeProvider`:

```tsx
import { ThemeProvider } from "next-themes";

// Inside the <body> tag:
<ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
  {children}
</ThemeProvider>
```

Use `attribute="data-theme"` (not `"class"`) to match the CSS variable selector above.

---

### A3 — Theme Toggle in Layout Header

File: `artifacts/sanad/src/components/layout.tsx`

Add a dark mode toggle button to the header bar (next to the language toggle that already exists):

```tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Inside the layout component:
const { theme, setTheme } = useTheme();

// In the header JSX (next to the existing language toggle):
<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  aria-label="Toggle dark mode"
>
  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</Button>
```

---

### A4 — Remove Hardcoded Colors from Screens

Screens currently use hardcoded Tailwind color classes that break in dark mode. Replace them with semantic variants.

**Pattern to find and replace:**

| Before (hardcoded) | After (semantic) |
|---|---|
| `bg-white` | `bg-card` or `bg-background` |
| `bg-gray-50` | `bg-muted/50` |
| `bg-gray-100` | `bg-muted` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-900` | `text-foreground` |
| `border-gray-200` | `border-border` |
| `bg-blue-50` | `bg-primary/10` |
| `text-blue-600` | `text-primary` |
| `bg-green-50` | `bg-risk-low/10` |
| `bg-red-50` | `bg-destructive/10` |

**Priority screens** (most hardcoded colors):

1. `artifacts/sanad/src/screens/admin.tsx`
2. `artifacts/sanad/src/screens/doctor.tsx`
3. `artifacts/sanad/src/screens/citizen.tsx`
4. `artifacts/sanad/src/screens/emergency.tsx`
5. `artifacts/sanad/src/screens/landing.tsx`

Remaining screens (lower priority — fix if time permits):
`hospital.tsx`, `lab.tsx`, `pharmacy.tsx`, `insurance.tsx`, `family.tsx`, `ai-control.tsx`, `supply-chain.tsx`, `research.tsx`

---

### A5 — Risk Token Components

Two components already exist:

- `artifacts/sanad/src/components/shared.tsx` — has `RiskBadge` component

Verify `RiskBadge` uses CSS variable colors (not hardcoded Tailwind). If it uses `bg-red-500` etc., replace with `var(--risk-critical)` or equivalent Tailwind classes mapped to the risk tokens.

Example after:
```tsx
const RISK_COLORS = {
  critical: "bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.3)]",
  high:     "bg-[hsl(var(--risk-high)/0.15)]     text-[hsl(var(--risk-high))]     border-[hsl(var(--risk-high)/0.3)]",
  medium:   "bg-[hsl(var(--risk-medium)/0.15)]   text-[hsl(var(--risk-medium))]   border-[hsl(var(--risk-medium)/0.3)]",
  low:      "bg-[hsl(var(--risk-low)/0.15)]       text-[hsl(var(--risk-low))]       border-[hsl(var(--risk-low)/0.3)]",
  none:     "bg-[hsl(var(--risk-none)/0.15)]      text-[hsl(var(--risk-none))]      border-[hsl(var(--risk-none)/0.3)]",
};
```

---

## Workstream B — Harness Update

### Context

Two test harnesses gate every publication:
- `scripts/harnesses/scenario-tests.mjs` — 43 assertions covering 7 demo scenarios
- `scripts/harnesses/ownership-tests.mjs` — 41 assertions covering BOLA boundaries

Sprints 2 and 3 changed the backend, but the harnesses haven't been updated to cover these changes. Some assertions may now be testing stale behavior.

---

### B1 — Update `scenario-tests.mjs`

File: `scripts/harnesses/scenario-tests.mjs`

**Add these assertions** (they're new scenarios, not replacements):

```javascript
// ── Sprint 2: Family relationships via DB (not id-adjacency) ────────────────

// S6-ext: Mohammed's family members should include خالد and نورة (explicitly linked)
const familyRes = await api("GET", `/api/family/patient/${patIds[0]}`, null, tokens.familyFatima);
assert(Array.isArray(familyRes.familyMembers), "S6-ext: familyMembers is array");
assert(familyRes.familyMembers.length > 0, "S6-ext: Mohammed has family members");
// The relationship type comes from DB, not id ordering
const hasRelType = familyRes.familyMembers.some(m => ["Child", "Spouse", "Sibling", "Parent"].includes(m.relationship));
assert(hasRelType, "S6-ext: family member has explicit relationship type from DB");

// S6-ext2: Patient with no relationships returns empty array (يوسف العتيبي, id 9)
const isolatedFamily = await api("GET", `/api/family/patient/${patIds[8]}`, null, tokens.familyFatima);
// This should 403 (consent gate) or return familyMembers: [] — not crash
assert(isolatedFamily === null || Array.isArray(isolatedFamily?.familyMembers), "S6-ext2: no-relationship patient handled");

// ── Sprint 3: Hospital scoping ───────────────────────────────────────────────

// S3-ext: dr.rashidi sees only KAMC-RYD patients in list
const scopedList = await api("GET", "/api/patients?search=10000000", null, tokens.drRashidi);
assert(Array.isArray(scopedList.patients), "S3-ext: scoped patient list is array");
// All returned patients must be KAMC-RYD or have null hospitalId
const wrongHospital = scopedList.patients.filter(p => p.hospitalId && p.hospitalId !== "KAMC-RYD");
assert(wrongHospital.length === 0, `S3-ext: no cross-hospital patients in scoped list (found ${wrongHospital.length})`);

// S3-ext2: dr.rashidi can still fetch خالد by nationalId (cross-hospital referral stays open)
const crossHospital = await api("GET", `/api/patients/national/1000000003`, null, tokens.drRashidi);
assert(crossHospital?.nationalId === "1000000003", "S3-ext2: individual nationalId lookup bypasses hospital scope");

// S3-ext3: admin.saad still sees all patients (admin unaffected by scoping)
const adminList = await api("GET", "/api/patients?search=10000000", null, tokens.adminSaad);
assert(adminList.patients.length >= 10, `S3-ext3: admin sees all patients (got ${adminList.patients.length})`);
```

**Also update the login block** to include `tokens.drRashidi` and `tokens.adminSaad`:

```javascript
// Already in the harness — just make sure these are logged in:
tokens.drRashidi = await login("dr.rashidi", "Doctor@2026");
tokens.adminSaad = await login("admin.saad", "Admin@2026");
tokens.familyFatima = await login("family.fatima", "Family@2026");
```

---

### B2 — Update `ownership-tests.mjs`

File: `scripts/harnesses/ownership-tests.mjs`

**Add these assertions** after the existing BOLA tests:

```javascript
// ── Sprint 3: Hospital scoping BOLA ─────────────────────────────────────────

// O-H1: doctor at KAMC-RYD cannot see patients from another hospital in the list
// (patients 6-10 have null hospitalId so they'd appear; look for patients
//  with a non-KAMC-RYD hospitalId)
const ownHospList = await api("GET", "/api/patients", null, tokens.drRashidi);
assert(Array.isArray(ownHospList.patients), "O-H1: scoped list returns array");
const foreignHospPatients = ownHospList.patients.filter(p => p.hospitalId && p.hospitalId !== "KAMC-RYD");
assert(foreignHospPatients.length === 0, `O-H1: dr.rashidi list has 0 foreign-hospital patients (got ${foreignHospPatients.length})`);

// O-H2: individual lookup by nationalId stays open (required for referrals)
// Use a patient that is NOT at KAMC-RYD if any exist in the scoped population.
// Safest: use /national/:nationalId which is explicitly open per the spec.
const openLookup = await api("GET", "/api/patients/national/1000000001", null, tokens.drRashidi);
assert(openLookup?.nationalId === "1000000001", "O-H2: individual nationalId lookup open for clinical roles");

// O-H3: emergency break-glass bypasses hospital scope
const breakGlass = await apiRaw("GET", "/api/emergency/1000000009", null, tokens.emergencyUnit7);
assert(breakGlass.status !== 403, "O-H3: emergency break-glass not blocked by hospital scope");

// O-H4: doctor without a staff_assignment gets empty list (safe-fail)
// Note: no doctor credential maps to a hospital other than dr.rashidi in demo.
// This is verified implicitly — if dr.rashidi's hospitalId lookup fails,
// the route returns [] not all patients.
```

---

### B3 — Update assertion counts in verify-and-publish.ps1

After adding assertions, update the hardcoded counts in `verify-and-publish.ps1`:

```powershell
# Line ~99: scenario-tests
Step "4/5" "scenario-tests.mjs  (XX assertions — S1–S7 demo scenarios)"
Pass "scenario-tests  XX/XX"

# Line ~113: ownership-tests
Step "5/5" "ownership-tests.mjs  (XX assertions — BOLA trust boundaries)"
Pass "ownership-tests  XX/XX"
```

Replace `XX` with the actual new assertion counts after running the harnesses locally.

---

## Acceptance Criteria

### Dark Mode
- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad build` → successful (18/18 routes)
- [ ] Moon/Sun toggle appears in the layout header
- [ ] Switching to dark mode: background turns dark, text stays readable, cards visible
- [ ] Language toggle still works in dark mode
- [ ] RiskBadge colors are readable in both light and dark mode
- [ ] No hardcoded `bg-white` or `text-gray-900` in the 5 priority screens
- [ ] No new `as any` introduced; no new `dir="ltr"` on containers

### Harness Update
- [ ] `node scripts/harnesses/scenario-tests.mjs` exits 0 (against a seeded DB)
- [ ] `node scripts/harnesses/ownership-tests.mjs` exits 0
- [ ] New Sprint 2 family assertions verify DB-based relationships (not id-adjacency)
- [ ] New Sprint 3 hospital scoping assertions pass: `dr.rashidi` sees only KAMC-RYD patients in list, individual lookup stays open, admin unaffected
- [ ] Counts in `verify-and-publish.ps1` updated to match actual totals

---

## Important — Do NOT Touch

- `artifacts/api-server/` — backend is frozen after Sprint 3
- `lib/db/` — schema is frozen
- `artifacts/sanad/src/contexts/language-context.tsx` — keep as-is
- `artifacts/sanad/src/lib/terms.ts` — keep as-is
- `DEMO_PLAYBOOK.md` — scenarios use existing endpoints; no update needed

---

## Git Instructions

```bash
git clone https://github.com/hossam2111/sanad-final.git
cd sanad-final

# Wait for Sprint 3 to be merged into main
git pull origin main
git checkout -b feature/dark-mode

pnpm install

# Work on A1–A5, then B1–B3
# Commit each workstream separately:
git commit -m "feat(theme): dark mode CSS tokens, ThemeProvider, and layout toggle"
git commit -m "fix(screens): replace hardcoded colors with semantic Tailwind tokens"
git commit -m "test(harnesses): add Sprint 2/3 coverage — family DB, hospital scoping"
git commit -m "chore: update assertion counts in verify-and-publish.ps1"

# Verify
pnpm --filter @workspace/sanad typecheck
pnpm --filter @workspace/sanad build
node scripts/harnesses/scenario-tests.mjs
node scripts/harnesses/ownership-tests.mjs

git push -u origin feature/dark-mode
```
