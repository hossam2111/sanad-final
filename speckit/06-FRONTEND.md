# 06 — Frontend (Next.js 15 App Router + React 19)

## Structure

- `app/<portal>/page.tsx` — THIN wrappers only (`"use client"; export default` re-exporting the screen).
  Real UI lives in `src/screens/<portal>.tsx`. Never put logic in app/ pages.
- Screens (15): landing, login, admin, doctor, citizen, emergency, family, hospital, insurance,
  lab, pharmacy, research, supply-chain, ai-control, not-found.
- `src/components/layout.tsx` — shared portal chrome: sidebar, role badge, alerts bell
  (every role reads /api/alerts), language toggle, logout.
- `src/components/shared.tsx` — design system: Card/CardHeader/CardTitle/CardBody, Badge,
  Input, Tabs/TabsList/TabsTrigger/TabsContent, KpiCard, PageHeader, SkeletonCard, ErrorBanner.
  **Always reuse these — do not invent new card/tab primitives.**
- `src/lib/api.ts` — `apiFetch(path, init?)`: prefixes base URL, injects JWT from storage,
  throws on 401 → login redirect. ALL requests go through it (never raw fetch).
- `src/contexts/language-context.tsx` — `useLanguage() → {text, dir, locale, toggleLocale}`.
- `src/hooks/` — React Query wrappers (e.g. `useGetAdminStats`, `useNationalIntelligence`).
  Pattern: `useQuery({queryKey, queryFn: () => apiFetch(...).then(r=>r.json()), refetchInterval})`.

## i18n / RTL — hard rules

1. Every user-visible string: `text("English", "العربية")`. Both languages ALWAYS.
2. Locale persisted in `localStorage.sanad_locale`; `document.documentElement.dir` set globally.
3. Direction-safe utilities only: `ms-* me-* ps-* pe-* text-start text-end` — never bare
   `ml-/mr-/pl-/pr-/text-left/text-right` (breaks RTL).
4. **No `font-mono` on Arabic text** (renders badly). Latin-only values (IDs, keys, URLs, code)
   may be mono + `dir="ltr"`.
5. Numbers/IDs/keys inside RTL layouts: wrap with `dir="ltr"` so they don't flip.
6. Landing page: careful with absolutely-positioned decorative blobs — historically caused
   horizontal overflow on mobile RTL (fixed with overflow-x-hidden; don't reintroduce).

## Styling tokens (Tailwind)

Semantic tokens, not raw colors: `bg-card text-foreground text-muted-foreground border-border
bg-muted bg-primary text-primary-foreground` + status pairs `text-danger/bg-danger-bg`,
`text-warning/bg-warning-bg`, `text-success/bg-success-bg`, `text-info/bg-info-bg`,
risk tokens `text-risk-high/bg-risk-high-bg`. Rounded: cards `rounded-2xl`, controls `rounded-xl`.
Charts: recharts inside `ResponsiveContainer` with **fixed pixel heights** (unbounded heights
broke admin charts before — keep explicit `h-[300px]`-style wrappers) and `overflow-x-hidden`
on main containers.

## Admin screen anatomy (src/screens/admin.tsx — the biggest screen)

8 tabs: dashboard · population (Population Health) · intelligence (AI Governance) ·
users (User Registry, demo-mode toggles) · health (System Health) · maintenance (Maintenance) ·
audit (Isnād Audit Trail) · compliance (Data Sovereignty).
- Maintenance tab contains: **AiBrainCard** (AI model/key management — provider select, model
  input, password key input, custom baseUrl, Test Connection / Save & Activate / Remove Key,
  status chip Demo Mode vs provider·model, masked key display), Reset Demo card,
  Audit Export card, System Info card.
- Compliance tab renders `ComplianceDashboard` fetching `/api/admin/compliance` —
  field names are `class`/`note` (NOT tier/description — was a real bug, keep aligned with API).
- Patient wizard (doctor screen): 3 steps — demographics → meds+labs (suggested meds) →
  AI assessment. Demo national IDs 10000000xx.

## Login / credentials

Credential-based login (username+password against users table) — NOT role-picker.
The login screen must never list credentials; they live in DEMO_RUNBOOK.md only.

## Adding a screen — checklist

1. `src/screens/<name>.tsx` with `useLanguage()`, Layout wrapper, shared components.
2. Thin `app/<name>/page.tsx` wrapper.
3. Role: add path to ROLE_PERMISSIONS if it calls new API prefixes; add sidebar entry in layout.
4. Both languages, RTL check (toggle Arabic — nothing overflows or flips wrongly).
5. Loading state (SkeletonCard) + error state (ErrorBanner) for every fetch.
6. `npx tsc -p tsconfig.json --noEmit` in artifacts/sanad must stay clean.
