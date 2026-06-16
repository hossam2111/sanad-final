# SANAD — Gemini Sprint 6: Error Boundaries + Loading States

**Branch to create:** `feature/error-ux`  
**Base:** `main` (after Sprint 5 merges)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Problem

Every screen fetches data on mount but shows a blank white div when:
- The API is slow (no loading skeleton)
- The API returns an error (no user-facing message — just crashes or stays blank)
- The JWT expires mid-session (silent failure)

A Ministry reviewer who clicks a tab during a network hiccup sees nothing — the demo looks broken even when the code is fine.

---

## What To Build

### Step 1 — Shared Error + Skeleton components

File: `artifacts/sanad/src/components/shared.tsx`

Add these two exports at the bottom (keep everything already in the file):

```tsx
// ── Loading skeleton ─────────────────────────────────────────────────────────
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`h-4 rounded bg-muted ${i === 0 ? "w-1/2" : i % 2 === 0 ? "w-3/4" : "w-full"}`} />
        ))}
      </CardContent>
    </Card>
  );
}

// ── API error banner ─────────────────────────────────────────────────────────
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-destructive/80 underline mt-1 hover:text-destructive"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

Import `AlertTriangle` from `lucide-react` and `Card`, `CardContent` from the ui components (already in scope in `shared.tsx`).

---

### Step 2 — Apply to all 15 screens

**Pattern for every screen that fetches data:**

```tsx
// State additions:
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState<string | null>(null);

// In useEffect / fetch call:
setLoading(true);
setError(null);
try {
  const data = await api("/api/...").then(r => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });
  // set state...
} catch (e) {
  setError(text("Unable to load data. Check your connection.", "تعذّر تحميل البيانات. تحقق من اتصالك."));
} finally {
  setLoading(false);
}

// In JSX — replace the data rendering section:
{loading ? (
  <div className="space-y-4">
    <SkeletonCard rows={4} />
    <SkeletonCard rows={3} />
  </div>
) : error ? (
  <ErrorBanner message={error} onRetry={() => { /* re-trigger the effect */ }} />
) : (
  /* existing JSX */
)}
```

**Screens that need this pattern (in priority order):**

| Screen | Main data fetch | Notes |
|---|---|---|
| `doctor.tsx` | patient list + risk scores | Highest traffic in demo |
| `citizen.tsx` | own record + consent + labs | Citizen sees this first |
| `admin.tsx` | stats + audit feed | Already has loading in audit tab from Sprint 5 |
| `emergency.tsx` | patient + vitals on search | Search results must show skeleton |
| `lab.tsx` | pending tests queue | |
| `pharmacy.tsx` | dispense queue | |
| `hospital.tsx` | ward overview | |
| `insurance.tsx` | claim queue | |
| `family.tsx` | family members | |
| `supply-chain.tsx` | purchase orders | |
| `research.tsx` | cohort data | |
| `ai-control.tsx` | AI settings | |
| `landing.tsx` | (static — skip) | No data fetch |
| `login.tsx` | (static — skip) | No data fetch |
| `not-found.tsx` | (static — skip) | No data fetch |

---

### Step 3 — JWT expiry handling

File: `artifacts/sanad/src/contexts/auth-context.tsx`

Find where the API call returns 401 and redirect to login instead of silently failing:

```tsx
// In the global api() helper or in auth context:
if (response.status === 401) {
  // Token expired — clear auth and redirect
  clearAuth();        // whatever your logout function is called
  router.push("/");   // back to login
  return response;
}
```

Check how the existing auth context handles tokens and follow the same pattern. The goal: a 401 at any point kicks the user to the login screen with a clean state.

---

## Acceptance Criteria

- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad build` → 0 errors
- [ ] With API server OFF: every data screen shows `ErrorBanner` (not blank white)
- [ ] With API server ON but slow (add `await new Promise(r => setTimeout(r, 2000))` to test): `SkeletonCard` pulses for 2 s then data appears
- [ ] Clicking "Retry" in `ErrorBanner` re-fetches the data
- [ ] With expired JWT (manually set a 1-second JWT): app redirects to login instead of crashing
- [ ] No new `as any` introduced; no new hardcoded colors

---

## Do NOT Touch

- `artifacts/api-server/` — backend unchanged
- `lib/db/` — unchanged
- `scripts/harnesses/` — unchanged
- Any component not listed above

---

## Git Instructions

```bash
git checkout -b feature/error-ux
pnpm install

git commit -m "feat(shared): SkeletonCard and ErrorBanner components"
git commit -m "fix(screens): loading + error states across all data screens"
git commit -m "fix(auth): 401 redirect to login on token expiry"

pnpm --filter @workspace/sanad typecheck
pnpm --filter @workspace/sanad build

git push -u origin feature/error-ux
```
