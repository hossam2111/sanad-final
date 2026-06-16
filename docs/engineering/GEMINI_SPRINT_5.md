# SANAD — Gemini Sprint 5: AI Audit Dashboard + Consent UX

**Branch to create:** `feature/audit-dashboard`  
**Base:** `main` (after Sprints 3 & 4 are merged)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Overview

Two features that close the last visible demo gaps:

| Feature | Why it matters | Scope |
|---|---|---|
| **A — AI Audit Dashboard** | Demo can't yet show the Isnād chain visually — auditors must query raw DB | New admin tab: timeline of every AI decision + who triggered it |
| **B — Consent UX Hardening** | Consent revocation has no confirmation dialog; revoke fires immediately | Add confirm dialog + success/error toast on consent toggle |

---

## Feature A — AI Audit Dashboard

### A1 — Backend: Audit feed endpoint

File: `artifacts/api-server/src/routes/admin.ts`

Add a new route at the **bottom** of the admin router (do NOT touch existing routes):

```typescript
// GET /api/admin/audit-feed?limit=50&role=doctor
// Returns the most recent audit log entries, optionally filtered by role.
// Admin-only — auth middleware already enforces this.
router.get("/audit-feed", async (req, res) => {
  const limit = Math.min(parseInt((req.query["limit"] as string) || "50"), 200);
  const roleFilter = req.query["role"] as string | undefined;

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(roleFilter ? eq(auditLogTable.whoRole, roleFilter) : undefined)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(limit);

  res.json({ entries: rows, total: rows.length });
});
```

Required imports (add only what's missing at the top of `admin.ts`):

```typescript
import { auditLogTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
```

Check `lib/db/src/schema/audit_log.ts` to confirm column names before writing the query.

---

### A2 — Frontend: Audit tab in admin screen

File: `artifacts/sanad/src/screens/admin.tsx`

The admin screen already has tabs. Add a new **"Audit"** tab:

**Step 1** — Add the tab trigger (find the existing `<TabsList>` and add):

```tsx
<TabsTrigger value="audit">
  {text("Audit Trail", "سجل التدقيق")}
</TabsTrigger>
```

**Step 2** — Add the tab content panel:

```tsx
<TabsContent value="audit">
  <AuditFeed />
</TabsContent>
```

**Step 3** — Create the `AuditFeed` component **inside `admin.tsx`** (do not create a separate file):

```tsx
function AuditFeed() {
  const { text, dir } = useLanguage();
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState<string>("");

  type AuditEntry = {
    id: number;
    who: string;
    whoName?: string;
    whoRole: string;
    action: string;
    what: string;
    createdAt: string;
    ipAddress?: string;
  };

  React.useEffect(() => {
    const params = roleFilter ? `?role=${roleFilter}` : "";
    api(`/api/admin/audit-feed${params}`)
      .then(r => r.json())
      .then(data => { setEntries(data.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter]);

  const ROLES = ["", "doctor", "citizen", "admin", "emergency", "lab", "pharmacy", "hospital", "insurance", "family"];

  return (
    <Card dir={dir}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{text("Isnād Audit Trail", "سجل إسناد التدقيق")}</CardTitle>
          <CardDescription>
            {text("Tamper-evident chain of every access and AI decision", "سلسلة غير قابلة للتلاعب لكل وصول وقرار ذكاء اصطناعي")}
          </CardDescription>
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setLoading(true); }}
          className="rounded-md border border-border bg-background text-foreground text-sm px-2 py-1"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r || text("All roles", "كل الأدوار")}</option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">{text("Loading...", "جاري التحميل...")}</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{text("No audit entries found", "لا توجد سجلات تدقيق")}</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {entries.map(entry => (
              <div key={entry.id} dir={dir}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border text-sm">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{entry.whoName ?? entry.who}</span>
                    <Badge variant="outline" className="text-xs">{entry.whoRole}</Badge>
                    <Badge variant="secondary" className="text-xs">{entry.action}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate">{entry.what}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5" dir="ltr">
                    {new Date(entry.createdAt).toLocaleString("en-SA")}
                    {entry.ipAddress && ` · ${entry.ipAddress}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

The `api()` helper function and `Badge`, `Card*` imports are already used elsewhere in `admin.tsx` — reuse them.

---

## Feature B — Consent UX Hardening

### B1 — Confirm dialog on consent revoke

File: `artifacts/sanad/src/screens/citizen.tsx`

Currently the consent toggle fires a PATCH request immediately. Add a confirmation step **only for revocation** (granting consent can remain immediate).

**Find the consent toggle handler** (search for `PATCH` or `/api/consent`) and wrap the revoke call:

```tsx
// Before — fires immediately:
async function toggleConsent(type: string, currentState: boolean) {
  await api(`/api/consent/${type}`, { method: "PATCH", body: JSON.stringify({ granted: !currentState }) });
  // refresh...
}

// After — confirm before revoking:
async function toggleConsent(type: string, currentState: boolean) {
  if (currentState) {
    // About to revoke — ask first
    const confirmed = window.confirm(
      text(
        `Revoking consent for "${type}" will immediately block access. Are you sure?`,
        `إلغاء الموافقة على "${type}" سيوقف الوصول فوراً. هل أنت متأكد؟`
      )
    );
    if (!confirmed) return;
  }
  await api(`/api/consent/${type}`, { method: "PATCH", body: JSON.stringify({ granted: !currentState }) });
  // refresh as before...
}
```

### B2 — Toast feedback on consent change

After the API call completes, show inline feedback instead of silent refresh:

```tsx
const [consentMsg, setConsentMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

// After the PATCH call:
setConsentMsg({ type: "success", text: text("Consent updated successfully", "تم تحديث الموافقة بنجاح") });
setTimeout(() => setConsentMsg(null), 3000);

// In JSX — add above the consent list:
{consentMsg && (
  <div className={`rounded-md px-4 py-2 text-sm mb-3 ${
    consentMsg.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
  }`} dir={dir}>
    {consentMsg.text}
  </div>
)}
```

---

## Acceptance Criteria

### AI Audit Dashboard
- [ ] `pnpm --filter @workspace/api-server typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] `GET /api/admin/audit-feed` as `admin.saad` → 200 with `entries` array
- [ ] `GET /api/admin/audit-feed?role=doctor` → filtered by `whoRole === "doctor"`
- [ ] `GET /api/admin/audit-feed` as `dr.rashidi` → 403 (admin-only route)
- [ ] Admin screen shows "Audit Trail" / "سجل التدقيق" tab
- [ ] Audit tab lists entries with: name, role badge, action badge, what text, timestamp
- [ ] Role filter dropdown works (selecting "doctor" shows only doctor entries)
- [ ] Works in Arabic RTL mode (dir={dir} on containers)

### Consent UX
- [ ] Clicking "Revoke" consent shows a confirm dialog with Arabic text in AR mode
- [ ] Clicking "Cancel" in the dialog leaves consent unchanged
- [ ] After granting OR revoking, a green/red toast message appears for 3 seconds
- [ ] Toast disappears automatically after 3 seconds
- [ ] Granting consent fires immediately (no confirm dialog)

---

## Do NOT Touch

- `lib/db/` — no schema changes needed; `audit_log` table already exists
- `scripts/harnesses/` — harnesses are up to date from Sprint 4
- `artifacts/api-server/src/routes/` other than adding to `admin.ts`
- All other screens except `admin.tsx` and `citizen.tsx`

---

## Git Instructions

```bash
git clone https://github.com/hossam2111/sanad-final.git
cd sanad-final

# Wait for Sprints 3 & 4 to merge into main
git pull origin main
git checkout -b feature/audit-dashboard

pnpm install

# Implement A1 → A2 → B1 → B2
git commit -m "feat(admin): GET /api/admin/audit-feed endpoint"
git commit -m "feat(admin-ui): Isnād audit trail tab with role filter"
git commit -m "feat(citizen): consent revoke confirm dialog + toast feedback"

# Verify
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/sanad typecheck

git push -u origin feature/audit-dashboard
```
