# SANAD Design System Audit

Read-only audit date: 2026-06-15. Localization and RTL work is in flight in the frontend, so this plan should land after that branch merges. Do not reintroduce physical-direction utilities while applying it.

## Findings

| Severity | Area | File:line | Issue | Fix |
|---|---|---:|---|---|
| P0 | RTL shared primitives | `artifacts/sanad/src/components/ui/dialog.tsx:39`, `:45` | Dialog positioning and close button use physical `left`, `right`, and left-slide animations. | Convert shared overlay primitives to logical placement (`start/end`, `translate` helpers) and direction-aware animation variants. |
| P0 | RTL shared primitives | `artifacts/sanad/src/components/ui/dropdown-menu.tsx:37`, `:103`, `:109`, `:127`, `:132`, `:178` | Menu chevrons, checkbox indicators, inset padding, and shortcut alignment are left/right-specific. | Add RTL-aware menu item anatomy: `ps-*`, `pe-*`, `start-*`, `end-*`, and chevron mirroring. |
| P0 | RTL shared primitives | `artifacts/sanad/src/components/ui/select.tsx:121`, `:126` | Select item reserves `pr-8` and positions selected icon at `right-2`, which flips incorrectly in RTL. | Use `pe-8` and `end-2`; verify Radix content alignment under both `dir` values. |
| P0 | RTL shared primitives | `artifacts/sanad/src/components/ui/table.tsx:76` and `app/globals.css:137` | Table headers still use `text-left`; global `.data-table` uses physical text alignment and raw HSL borders. | Standardize tables on `text-start`, logical checkbox spacing, and tokenized table surfaces. |
| P0 | RTL component tokens | `artifacts/sanad/src/components/ui/vital-stat.tsx:50`, `:60` | `VitalStat` uses `border-l-4` and `ml-1`, so status rails and unit spacing are wrong in RTL. | Replace with `border-s-4` and `ms-1`; keep numeric values `dir="ltr"` only where needed. |
| P0 | Typography/i18n | `artifacts/sanad/src/components/shared.tsx:205`, `:290`; `layout.tsx:252` | Uppercase, letter-spaced microcopy is used by shared components that can receive Arabic. | Gate uppercase/tracking styles by locale or create `Eyebrow` with Arabic-safe styling: no forced uppercase, no wide tracking for Arabic. |
| P0 | Component duplication | `artifacts/sanad/src/components/shared.tsx:10`, `src/components/ui/card.tsx:5`; `shared.tsx:47`, `ui/button.tsx:8`; `shared.tsx:140`, `ui/badge.tsx:9` | Two primitive systems exist: bespoke `shared.tsx` and shadcn-style `components/ui/*`, with divergent sizing, radius, color, and focus rules. | Pick a single public primitive layer and make `shared.tsx` role-specific composites consume it rather than redefining Card/Button/Badge/Input/Tabs. |
| P0 | Dark mode | `artifacts/sanad/src/components/shared.tsx:14`, `:66`, `:106`, `:123`, `:152`, `:266-270` | Shared primitives hardcode `bg-white`, `border-black/*`, and light-only red/amber/sky chip colors. | Replace with semantic tokens (`bg-card`, `border-border`, `bg-destructive/10`, etc.) and test dark mode. |
| P1 | Design tokens | `artifacts/sanad/app/globals.css:43-49`, `shared.tsx:72-74`, `layout.tsx:161` | Radii are partly tokenized, but components still use arbitrary `rounded-[9px]`, `[10px]`, `[12px]`, `[20px]`, `[26px]`. | Define component radius aliases: `radius.control`, `radius.card`, `radius.pill`, `radius.brand`, then replace arbitrary radii. |
| P1 | Shadows | `artifacts/sanad/src/components/shared.tsx:15`, `app/globals.css:133` | Card shadows are duplicated as raw CSS values. | Add elevation tokens (`shadow-card`, `shadow-popover`, `shadow-focus`) and consume them in both primitive systems. |
| P1 | Risk colors | `artifacts/sanad/app/globals.css:35-42`, `src/components/ui/risk-badge.tsx:15-18` | Risk foreground/background tokens exist, but contrast is not documented and shared `Badge` reimplements risk-like red/amber/emerald chips outside the risk scale. | Add WCAG-checked risk token pairs and consolidate all clinical severity badges through `RiskBadge`/severity variants. |
| P1 | Accessibility | `artifacts/sanad/src/components/shared.tsx:81`, `ui/button.tsx:8` | Focus styles differ between bespoke and UI primitives (`focus:ring` vs `focus-visible:ring`), producing inconsistent keyboard behavior. | Standardize focus-visible ring tokens and apply to all interactive primitives. |
| P1 | Motion accessibility | `artifacts/sanad/app/globals.css:151-164`, `shared.tsx:220`, many screens with `animate-pulse` | Global motion has partial reduced-motion handling, but shared status pulses and screen spinners are not centralized. | Add motion tokens/classes that no-op under `prefers-reduced-motion`; use them for pulse/spinner/status indicators. |
| P1 | Responsive | `src/screens/admin.tsx:212`, `ai-control.tsx:136`, `pharmacy.tsx:494`, `research.tsx:210`, `supply-chain.tsx:140` | Representative screens use fixed `grid-cols-4` KPI rows without mobile fallback. | After localization, migrate screen layouts to `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` or an app `KpiGrid` composite. |
| P1 | Responsive | `src/screens/hospital.tsx:442`, `research.tsx:680`, `:687` | Fixed widths and `text-right` appear in data rows, which can overflow and misalign in RTL. | Use logical alignment and `minmax(0,1fr)` patterns; require `min-w-0` near truncating text. |
| P1 | Chart/SVG RTL | `src/components/ui/chart.tsx:180-242`; sampled Recharts screens | Tooltip/legend anatomy is mostly neutral, but chart axes, SVG arrows, and Recharts labels are not governed by a direction policy. | Add chart direction guidance: keep numeric axes LTR, localize labels, avoid mirroring data semantics unless explicitly spatial. |
| P2 | Typography scale | `shared.tsx:174`, `:205-207`, `layout.tsx:235-236`, many screens | Arbitrary text sizes (`text-[10px]`, `[11px]`, `[13px]`, `[22px]`, `[26px]`) are pervasive. | Define type roles (`label`, `body-sm`, `body`, `title`, `metric`) and migrate gradually. |
| P2 | Component inventory | `src/components/ui/empty.tsx:10`, `spinner.tsx:8`, `shared.tsx:47-96` | Empty/loading primitives exist but screens often render ad-hoc spinner/error blocks. | Create app-level `LoadingState`, `ErrorState`, `EmptyState`, `Toolbar`, `KpiGrid`, and `DataTable` composites. |

## Component Inventory

Current bespoke primitives in `shared.tsx`: `cn`, `Card`, `CardHeader`, `CardTitle`, `CardBody`, `Button`, `Input`, `Select`, `Badge`, `PageHeader`, `KpiCard`, `StatusDot`, `Tabs`, `AlertBanner`, and `DataLabel`.

Current shadcn-style primitives in `components/ui/*`: `button`, `badge`, `card`, `input`, `select`, `tabs`, `table`, `dialog`, `sheet`, `dropdown-menu`, `command`, `popover`, `tooltip`, `toast`, `spinner`, `empty`, `risk-badge`, `vital-stat`, and others.

Primary duplication to resolve after localization: `Card`, `Button`, `Badge`, `Input`, `Select`, and `Tabs` exist in both systems; screens also reimplement status chips, KPI grids, loading spinners, and table shells.

## Tokenization Proposal

Standardize tokens in Tailwind v4 theme and consume only semantic classes in app code:

| Token group | Proposed tokens |
|---|---|
| Surfaces | `background`, `foreground`, `card`, `card-muted`, `popover`, `sidebar`, `overlay` |
| Borders/rings | `border`, `border-subtle`, `input`, `ring`, `focus-ring` |
| Brand/status | `primary`, `success`, `warning`, `destructive`, `info`, each with `foreground`, `surface`, `border` |
| Clinical risk | `risk.low`, `risk.medium`, `risk.high`, `risk.critical`, each with foreground/background/border pairs validated for light/dark contrast |
| Radius | `radius.control`, `radius.card`, `radius.panel`, `radius.pill`, `radius.brand` |
| Elevation | `shadow.card`, `shadow.popover`, `shadow.raised`, `shadow.focus` |
| Typography | `type.eyebrow`, `type.label`, `type.body-sm`, `type.body`, `type.title`, `type.metric`, with Arabic-safe variants that avoid uppercase/wide tracking |
| Motion | `motion.fast`, `motion.base`, `motion.enter`, `motion.pulse`, all disabled or softened under reduced motion |

## Prioritized Implementation Plan

P0, 3-5 days after localization merges:

1. Freeze the post-localization baseline and run an RTL lint/search pass for `left/right/ml/mr/pl/pr/text-left/text-right/border-l/border-r`.
2. Choose the canonical primitive API. Recommended: keep `components/ui/*` as base primitives and refactor `shared.tsx` into SANAD composites.
3. Convert shared primitives and UI overlays/menus/select/table/vital-stat to logical-direction classes only.
4. Remove light-only `bg-white`, `border-black/*`, and raw status chips from shared primitives.
5. Add Arabic-safe typography helpers and update shared `KpiCard`, `DataLabel`, layout workspace label, and badges.

P1, 5-8 days:

1. Add semantic token aliases for clinical severity, card surfaces, shadows, focus rings, and radii.
2. Introduce shared `KpiGrid`, `DataTable`, `StatusChip`, `LoadingState`, `EmptyState`, and `ErrorState`.
3. Migrate representative screens by role, verifying mobile breakpoints and dark mode after each cluster.
4. Add visual regression snapshots for LTR/RTL, light/dark, and mobile/desktop around shared layout and primitives.

P2, 3-5 days:

1. Normalize typography scale and reduce arbitrary font sizes.
2. Create chart direction guidelines and Recharts wrapper defaults.
3. Add stylelint or custom `rg` CI checks preventing physical-direction utilities in shared code.

## Parallelization Guidance

Safe now: documentation, token naming discussion, and non-editing audits. Wait for localization merge before touching frontend source, especially `shared.tsx`, `layout.tsx`, `globals.css`, `components/ui/*`, and screens. Backend-only production hardening can proceed in a separate branch as long as it does not touch frontend error boundaries or shared UI.
