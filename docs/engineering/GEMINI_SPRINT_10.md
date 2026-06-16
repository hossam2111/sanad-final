# SANAD — Gemini Sprint 10: UI Quality Hardening

**Branch to create:** `feature/ui-hardening`  
**Base:** `main`  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Context

This sprint fixes four categories of issues found during a visual audit:

1. **Dark mode is broken in all portals** — `shared.tsx` uses hardcoded `bg-white` and `border-black/*` values that bypass the CSS variable theme system. When a user switches to dark mode, every card, input, and select stays white. This is the single highest-impact fix.
2. **Data tables are broken in dark mode** — `globals.css` has hardcoded HSL light-mode values in `.data-table` styles.
3. **The brand name's meaning is missing from the hero** — The landing page explains the Islamic scholarly concept of "سند" in the Trust section (Section 5), but the hero (Section 1) never tells the user *why* the platform is called SANAD. Visitors who skip sections never learn the concept.
4. **Doctor prediction cards use hardcoded light colors** — Two elements in `doctor.tsx` use `border-white` and light-mode colors that look broken in dark mode.

**Do not add any new features, screens, or components. Every change below is a targeted replacement.**

---

## Change A — Fix `shared.tsx` theme tokens

**File:** `artifacts/sanad/src/components/shared.tsx`

Make the following **exact** string replacements. Read the file first to confirm each string exists before replacing.

### A1 — Card background and border

Find:
```tsx
        "bg-white rounded-[20px]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]",
        "border border-black/[0.05]",
```

Replace with:
```tsx
        "bg-card rounded-[20px]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]",
        "border border-border",
```

### A2 — CardHeader border

Find:
```tsx
    <div className={cn("flex items-center justify-between px-5 py-4 border-b border-black/[0.05]", className)} {...props}>
```

Replace with:
```tsx
    <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border", className)} {...props}>
```

### A3 — Button outline variant

Find:
```tsx
    outline:     "border border-black/[0.1] bg-white text-foreground hover:bg-secondary active:scale-[0.97]",
```

Replace with:
```tsx
    outline:     "border border-border bg-card text-foreground hover:bg-secondary active:scale-[0.97]",
```

### A4 — Input background and border

Find:
```tsx
        "flex h-9 w-full rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-sm",
        "placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
        "transition-all duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
```

Replace with:
```tsx
        "flex h-9 w-full rounded-[12px] border border-border bg-background px-4 py-2 text-sm",
        "placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
        "transition-all duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
```

### A5 — Select background and border

Find:
```tsx
        "flex h-9 w-full rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
        "transition-all duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
```

Replace with:
```tsx
        "flex h-9 w-full rounded-[12px] border border-border bg-background px-4 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
        "transition-all duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
```

### A6 — Badge outline border

Find:
```tsx
    outline:     "bg-secondary text-muted-foreground border border-black/[0.07]",
```

Replace with:
```tsx
    outline:     "bg-secondary text-muted-foreground border border-border",
```

### A7 — Tabs container border

Find:
```tsx
    <div className="flex border-b border-black/[0.06] overflow-x-auto">
```

Replace with:
```tsx
    <div className="flex border-b border-border overflow-x-auto">
```

---

## Change B — Fix `globals.css` dark-mode table styles

**File:** `artifacts/sanad/app/globals.css`

### B1 — Replace the `.data-table` block

Find the entire block:
```css
.data-table { border-collapse: separate; border-spacing: 0; width: 100%; }
.data-table th { @apply px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest; background: hsl(240 6% 97%); border-bottom: 1px solid hsl(240 6% 91%); }
.data-table td { @apply px-5 py-3.5 text-sm; border-bottom: 1px solid hsl(240 6% 93%); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: hsl(240 6% 97%); transition: background 0.15s ease; }
```

Replace with:
```css
.data-table { border-collapse: separate; border-spacing: 0; width: 100%; }
.data-table th { @apply px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest; background: hsl(var(--secondary)); border-bottom: 1px solid hsl(var(--border)); }
.data-table td { @apply px-5 py-3.5 text-sm; border-bottom: 1px solid hsl(var(--border)); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: hsl(var(--secondary)); transition: background 0.15s ease; }
```

### B2 — Fix `.ios-card`

Find:
```css
.ios-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}
```

Replace with:
```css
.ios-card {
  background: hsl(var(--card));
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}
```

---

## Change C — Fix `doctor.tsx` hardcoded light-mode colors

**File:** `artifacts/sanad/src/screens/doctor.tsx`

There are two hardcoded `border-white` instances in the Clinical Decision Panel that look broken in dark mode, and one hardcoded amber block.

### C1 — Risk factor rows: replace `border border-white` with `border border-border`

Find (there are **two** identical occurrences — replace both):
```tsx
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-card/70 border border-white rounded-xl">
```

Replace both with:
```tsx
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-card/70 border border-border rounded-xl">
```

And the recommendation rows — find:
```tsx
                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-card/70 border border-white rounded-xl">
```

Replace with:
```tsx
                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-card/70 border border-border rounded-xl">
```

### C2 — AI Alert block: replace hardcoded amber with risk tokens

Find:
```tsx
                          <div className="mt-2 px-3 py-2 bg-amber-100/60 border border-amber-200 rounded-xl">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">{text("AI Alert", "تنبيه ذكي")}</p>
                            <p className="text-xs text-amber-800 font-medium">{topPredictions[0]?.title}</p>
                          </div>
```

Replace with:
```tsx
                          <div className="mt-2 px-3 py-2 rounded-xl" style={{ background: "hsl(var(--risk-high) / 0.1)", border: "1px solid hsl(var(--risk-high) / 0.3)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--risk-high))" }}>{text("AI Alert", "تنبيه ذكي")}</p>
                            <p className="text-xs font-medium text-foreground">{topPredictions[0]?.title}</p>
                          </div>
```

### C3 — predictionSeverityStyle: use CSS variables instead of hardcoded Tailwind colors

Find:
```tsx
const predictionSeverityStyle: Record<string, { bg: string; border: string; icon: string; badge: "destructive" | "warning" | "info" | "outline" | "success" | "default"  }> = {
  critical: { bg: "bg-destructive/10", border: "border-red-200", icon: "text-red-600", badge: "destructive" },
  high: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", badge: "warning" },
  moderate: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-600", badge: "info" },
  low: { bg: "bg-secondary", border: "border-border", icon: "text-muted-foreground", badge: "outline" },
};
```

Replace with:
```tsx
const predictionSeverityStyle: Record<string, { bg: string; border: string; icon: string; badge: "destructive" | "warning" | "info" | "outline" | "success" | "default"  }> = {
  critical: { bg: "bg-[hsl(var(--risk-critical)/0.1)]", border: "border-[hsl(var(--risk-critical)/0.3)]", icon: "text-[hsl(var(--risk-critical))]", badge: "destructive" },
  high:     { bg: "bg-[hsl(var(--risk-high)/0.1)]",     border: "border-[hsl(var(--risk-high)/0.3)]",     icon: "text-[hsl(var(--risk-high))]",     badge: "warning" },
  moderate: { bg: "bg-[hsl(var(--risk-medium)/0.1)]",   border: "border-[hsl(var(--risk-medium)/0.3)]",   icon: "text-[hsl(var(--risk-medium))]",   badge: "info" },
  low:      { bg: "bg-secondary",                        border: "border-border",                           icon: "text-muted-foreground",             badge: "outline" },
};
```

---

## Change D — Landing hero subtitle: add the سند etymology

**File:** `artifacts/sanad/src/screens/landing.tsx`

The hero subtitle currently describes what the platform does but never explains why it's called SANAD. The Trust section (buried later on the page) has the explanation. We need one sentence in the hero that creates the hook.

Find the hero subtitle paragraph:
```tsx
            <p className="mx-auto mb-10 max-w-[640px] text-[16px] leading-relaxed text-white/60 lg:text-[17px]">
              {text(
                "SANAD Health connects every hospital, laboratory, pharmacy and ambulance into one sovereign intelligence layer — where every clinical event becomes a decision, and every decision carries its evidence.",
                "تربط سند كل مستشفى ومختبر وصيدلية وسيارة إسعاف في طبقة ذكاء سيادية واحدة — حيث يتحوّل كل حدث سريري إلى قرار، ويحمل كل قرارٍ دليله.",
              )}
            </p>
```

Replace with:
```tsx
            <p className="mx-auto mb-10 max-w-[640px] text-[16px] leading-relaxed text-white/60 lg:text-[17px]">
              {text(
                "In the Arabic scholarly tradition, a sanad is the chain of transmission that makes knowledge trustworthy. SANAD applies that same rigour to medicine — connecting every hospital, laboratory, pharmacy, and ambulance into one sovereign intelligence layer where every clinical decision carries its provenance.",
                "في التراث العلمي العربي، السند هو سلسلة الرواية التي تجعل المعرفة جديرة بالثقة. تطبّق سند الصرامةَ ذاتها على الطب — بربط كل مستشفى ومختبر وصيدلية وإسعاف في طبقة ذكاء سيادية واحدة، حيث يحمل كل قرارٍ سريري إسناده.",
              )}
            </p>
```

---

## Change E — Scan all screens for emoji usage

**Files to check:** all files in `artifacts/sanad/src/screens/`

Search each file for Unicode emoji characters (characters outside the ASCII range that are used decoratively, e.g., ✅ ❌ ⚠️ 🏥 💊 etc.) that appear as text content in JSX (not inside icon components or SVG).

If you find any emoji used as icons in JSX, replace them with the appropriate Lucide icon from the imports already at the top of that file. Use `h-4 w-4` sizing for inline icons and `h-5 w-5` for card-level icons.

**Do NOT remove emoji from string literals used in data (patient names, medical notes, etc.). Only replace emoji that are acting as UI icons.**

If no emoji are found, skip this step and note "No emoji icons found" in the commit message.

---

## Acceptance Criteria

- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] Switch to dark mode (click Moon icon) → all cards become dark (not white)
- [ ] Switch to dark mode → all inputs and selects have dark backgrounds
- [ ] Switch to dark mode → data tables have dark header and border colors
- [ ] Switch to dark mode → doctor prediction cards use colored borders (not `border-white`)
- [ ] Landing hero subtitle now mentions "chain of transmission" / "سلسلة الرواية" in the first paragraph
- [ ] No hardcoded `bg-white`, `border-black/`, `bg-amber-50`, `bg-amber-100` remain in `shared.tsx` or `doctor.tsx` (run a search to verify)
- [ ] All changes are in exactly the files listed above — no other files touched

---

## Do NOT Touch

- `artifacts/api-server/` — no backend changes
- `lib/db/` — no schema changes
- `scripts/harnesses/` — no test changes
- `artifacts/sanad/app/globals.css` — only the `.data-table` block and `.ios-card` block listed above; do not touch font imports, CSS variables, or animations
- `artifacts/sanad/src/screens/landing.tsx` — only the hero subtitle paragraph listed above; do not touch any other section
- `artifacts/sanad/src/screens/doctor.tsx` — only the three elements listed in Change C; do not refactor or restructure anything else
- Any screen not explicitly named above
- Do NOT change the light-mode `:root` CSS variables — the light theme is intentionally white and should stay white
- Do NOT add new dependencies or npm packages
- Do NOT introduce `!important` anywhere

---

## Verification Commands

After completing all changes, run these to verify no regressions:

```powershell
pnpm --filter @workspace/sanad typecheck
```

Then search for remaining violations:

```powershell
# Should return zero results in shared.tsx:
Select-String -Path "artifacts\sanad\src\components\shared.tsx" -Pattern "bg-white|border-black"

# Should return zero results in doctor.tsx for these specific patterns:
Select-String -Path "artifacts\sanad\src\screens\doctor.tsx" -Pattern "border-white|bg-amber-50|bg-amber-100"

# Should return zero results in globals.css for hardcoded table colors:
Select-String -Path "artifacts\sanad\app\globals.css" -Pattern "hsl\(240 6%"
```

All three searches must return zero results before committing.

---

## Git Instructions

```bash
git checkout -b feature/ui-hardening

# After completing all changes:
pnpm --filter @workspace/sanad typecheck

git add artifacts/sanad/src/components/shared.tsx
git commit -m "fix(shared): replace hardcoded bg-white/border-black with theme tokens for dark mode"

git add artifacts/sanad/app/globals.css
git commit -m "fix(globals): replace hardcoded HSL values in data-table and ios-card with CSS variables"

git add artifacts/sanad/src/screens/doctor.tsx
git commit -m "fix(doctor): replace hardcoded light-mode colors with risk tokens in prediction cards"

git add artifacts/sanad/src/screens/landing.tsx
git commit -m "copy(landing): add sanad etymology to hero subtitle — chain of scholarly transmission"

# If emoji were found and replaced:
git add artifacts/sanad/src/screens/
git commit -m "fix(screens): replace emoji UI icons with Lucide equivalents"

git push -u origin feature/ui-hardening
```

---

## Notes for Reviewer (Claude)

When Gemini submits this sprint, verify:

1. Run the three PowerShell `Select-String` commands above — all must return zero results
2. Check that `landing.tsx` hero still has both English and Arabic in the `text()` call — not just one language
3. Check that `globals.css` still has the `[data-theme="dark"]` block untouched  
4. Check that NO new `bg-white` or hardcoded colors were added elsewhere while "fixing" the listed ones
5. Check that `predictionSeverityStyle` in `doctor.tsx` uses the exact pattern `hsl(var(--risk-*)/0.1)` — not Tailwind color names
