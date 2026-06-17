# GEMINI · SPRINT 11 — Semantic Color Tokenization (Dark-Mode Completion)

**Owner:** Gemini (execution) · **Reviewer:** Claude (verify + merge)
**Goal:** Finish the dark-mode token system. Today ~800 hardcoded Tailwind color
utilities (`bg-emerald-50`, `text-red-600`, `border-sky-200`, …) bypass the CSS
variable system, so they look correct in light mode but **break or look wrong in
dark mode**. Replace them with semantic tokens that resolve per-theme.

This is the **last roadmap item** before the project is publication-ready.
It is mechanical and high-volume. **Precision over creativity.** Do not invent
token names. Do not restyle layouts. Do not touch logic, props, or data.

---

## SCOPE — what you may change

✅ `artifacts/sanad/app/globals.css` — Part A only (exact CSS provided below)
✅ `artifacts/sanad/src/screens/*.tsx` — color utility class strings only
✅ `artifacts/sanad/src/components/*.tsx` — color utility class strings only

## OUT OF SCOPE — do NOT touch

❌ Any `.ts`/`.tsx` logic, hooks, state, props, API calls, imports
❌ Layout/spacing/sizing classes (`flex`, `gap-4`, `rounded-2xl`, `w-10`, `p-4`)
❌ The print/PDF HTML template in `pharmacy.tsx` (the `<style>…</style>` string
   with inline hex like `#fee2e2`, and the `🏥 SANAD` text inside it). Leave it
   exactly as-is — it renders to paper, not the themed UI.
❌ `verify-and-publish.ps1`, `find-emoji.js`, any `.env`, any config
❌ Do not run `next build` while the dev server holds `.next`
❌ Never add new color values to a component — only reference tokens from Part A

---

## PART A — Token foundation (do this FIRST, it unblocks everything)

The dark theme block is **missing** `--success`, `--warning`, `--info`, and no
`-bg` (tint) variants exist for any status color. Add them exactly as below.

### A.1 — In `@theme inline { … }`, after line 42 (`--color-risk-low-bg`), ADD:

```css
  --color-info: hsl(var(--info));
  --color-info-foreground: hsl(var(--info-foreground));
  --color-danger: hsl(var(--danger));
  --color-danger-foreground: hsl(var(--danger-foreground));
  --color-success-bg: hsl(var(--success-bg));
  --color-warning-bg: hsl(var(--warning-bg));
  --color-info-bg: hsl(var(--info-bg));
  --color-danger-bg: hsl(var(--danger-bg));
```

### A.2 — In `[data-theme="dark"] { … }`, before its closing `}` (line 85), ADD:

```css
  /* Status tokens — dark: vivid foreground hues, deep tinted backgrounds */
  --success: 142 65% 45%;
  --success-foreground: 222 47% 8%;
  --warning: 38 92% 55%;
  --warning-foreground: 222 47% 8%;
  --info: 210 90% 60%;
  --info-foreground: 222 47% 8%;
  --danger: 0 84% 62%;
  --danger-foreground: 210 40% 98%;
  --success-bg: 142 35% 12%;
  --warning-bg: 38 45% 13%;
  --info-bg: 210 45% 14%;
  --danger-bg: 0 40% 14%;
```

### A.3 — In `:root { … }` (light), before its closing `}` (line 120), ADD:

```css
  /* Status tokens — light (success/warning already defined above) */
  --info: 211 100% 50%;
  --info-foreground: 0 0% 100%;
  --danger: 0 85% 57%;
  --danger-foreground: 0 0% 100%;
  --success-bg: 142 76% 95%;
  --warning-bg: 43 100% 95%;
  --info-bg: 210 100% 96%;
  --danger-bg: 0 100% 97%;
```

After Part A, these utilities exist and resolve in BOTH themes:
`bg-success bg-warning bg-info bg-danger` · `text-success text-warning text-info text-danger`
· `bg-success-bg bg-warning-bg bg-info-bg bg-danger-bg` · `border-success border-warning border-info border-danger`
(and `/NN` opacity modifiers like `border-success/30`).

---

## PART B — Screen tokenization (the mapping)

Apply this table **literally**. Color family → semantic intent → token utility.
Replace `bg`/`text`/`border` prefix as in the original class.

### B.1 — Status color families

| Hardcoded family | Intent | Surface / tint (`-50`,`-100`) | Solid (`-400`…`-700`) | Text | Border (`-100`…`-300`) |
|---|---|---|---|---|---|
| `emerald`, `green` | success / approved / healthy | `bg-success-bg` | `bg-success` | `text-success` | `border-success/30` |
| `red`, `rose` | danger / critical / rejected | `bg-danger-bg` | `bg-danger` | `text-danger` | `border-danger/30` |
| `sky`, `blue` | info / neutral highlight | `bg-info-bg` | `bg-info` | `text-info` | `border-info/30` |
| `amber`, `yellow`, `orange` | warning / pending / caution | `bg-warning-bg` | `bg-warning` | `text-warning` | `border-warning/30` |

**Examples (exact):**
- `bg-emerald-50 border-emerald-200` → `bg-success-bg border-success/30`
- `text-red-600` → `text-danger`
- `text-red-700` → `text-danger` (collapse 400/500/600/700 → one `text-danger`)
- `bg-red-500` → `bg-danger`
- `bg-sky-50` → `bg-info-bg`
- `text-sky-600` → `text-info`
- `border-amber-200` → `border-warning/30`
- `text-rose-600` → `text-danger`

> Foreground-on-solid: if a solid status bg (e.g. `bg-success`) has white text
> like `text-white` on it, change that text to `text-success-foreground`
> (likewise `-warning/-info/-danger-foreground`). Only when it sits ON the solid.

### B.2 — Neutral families (gray / slate / zinc)

| Hardcoded | → Token |
|---|---|
| `bg-gray-50`, `bg-slate-50`, `bg-zinc-50/100` | `bg-secondary` |
| `bg-gray-200/300`, `bg-slate-200` | `bg-muted` |
| `text-gray-400/500`, `text-slate-500` | `text-muted-foreground` |
| `text-gray-700/800/900` | `text-foreground` |
| `border-gray-100/200`, `border-slate-200` | `border-border` |

### B.3 — Already-correct tokens (DO NOT change)

Leave these alone — they're already tokenized:
`bg-risk-*`, `bg-risk-*-bg`, `text-risk-*`, `border-risk-*`, `bg-card`,
`bg-background`, `bg-secondary`, `bg-muted`, `text-foreground`,
`text-muted-foreground`, `border-border`, `text-primary`, `destructive`.

### B.4 — Order of attack (by hardcoded count, highest first)

1. `doctor.tsx` (95)  2. `citizen.tsx` (88)  3. `ai-control.tsx` (88)
4. `insurance.tsx` (67)  5. `supply-chain.tsx` (66)  6. `pharmacy.tsx` (59 — **skip the print template**)
7. `family.tsx` (51)  8. `hospital.tsx` (50)  9. `research.tsx` (40)
10. `emergency.tsx` (35)  11. `lab.tsx` (12)  12. `admin.tsx` (12)
13. `login.tsx` (5)  14. `landing.tsx` (5)  15. `not-found.tsx` (4)

---

## CONSTRAINTS (hard rules)

1. **Never change a class that isn't a color utility.** If a class controls
   layout/size/radius/spacing, it stays byte-for-byte identical.
2. **Collapse shades, don't preserve them.** `text-red-500` and `text-red-700`
   both become `text-danger`. We trade shade granularity for theme-correctness.
   That is intentional.
3. **If a color's intent is genuinely ambiguous** (e.g. a brand-blue that isn't
   "info", or a decorative gradient), DO NOT guess — leave it and list it under
   "Ambiguous — needs reviewer" in your report.
4. **Gradients** (`from-emerald-500 to-sky-500` etc.): leave as-is and list them.
   We'll handle gradients separately — they don't map cleanly to single tokens.
5. **No new imports, no logic edits, no formatting/prettier passes** on untouched
   lines. Keep the diff to color strings only.

---

## VERIFICATION (run before reporting done)

```powershell
# 1. Foundation present in all three blocks (expect matches in each)
Select-String -Path artifacts/sanad/app/globals.css -Pattern "--success-bg|--info\b|--danger\b" 

# 2. Remaining hardcoded status colors should approach ZERO (print template excluded)
$pattern = '(bg|border|text)-(emerald|red|amber|sky|blue|green|yellow|orange|rose)-(50|100|200|300|400|500|600|700|800|900)'
Get-ChildItem artifacts/sanad/src/screens/*.tsx | ForEach-Object {
  $hits = (Select-String -Path $_.FullName -Pattern $pattern -AllMatches).Matches.Count
  if ($hits -gt 0) { "{0,4}  {1}" -f $hits, $_.Name }
} | Sort-Object -Descending

# 3. App must still compile — dev server should hot-reload with no error overlay.
#    Toggle dark mode and visually confirm status colors look right in BOTH themes.
```

Target for check #2: only `pharmacy.tsx` may show residual hits (the print
template hex/classes), plus anything you listed as Ambiguous/Gradient. Everything
else → 0.

---

## NOTES FOR REVIEWER (fill this in when done)

- [ ] Part A applied — token count added to dark/light/@theme
- [ ] Per-screen residual hardcoded count (paste the check #2 output)
- [ ] **Ambiguous — needs reviewer:** list `file:line` + the class you left
- [ ] **Gradients left as-is:** list `file:line`
- [ ] Did the dev server compile clean? Any overlay errors?
- [ ] Screenshot: one screen (suggest `doctor`) in BOTH light and dark after change

---

### Why this matters (context, not a task)
"سند" sells trust through consistency. A status pill that's a crisp green in
light mode but a washed-out mint smear in dark mode reads as *unfinished* to an
investor. Tokenizing these is what makes the dark theme feel designed rather than
auto-generated. This is the polish that separates a demo from a product.
