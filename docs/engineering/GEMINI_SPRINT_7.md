# SANAD — Gemini Sprint 7: Supply Chain + Pharmacy Dispensing Flow

**Branch to create:** `feature/supply-pharmacy`  
**Base:** `main` (after Sprint 6 merges)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Problem

The Supply Chain and Pharmacy portals exist but the end-to-end flow is incomplete:

1. **Supply Chain**: Shows purchase orders read-only. A reviewer cannot create a new PO or approve a pending one through the UI — they must hit the API directly.
2. **Pharmacy**: Shows the medication list but dispensing (marking a medication as dispensed) is not wired to the backend. "Dispense" button exists in the UI but fires no API call.
3. **Stock alerts**: The `alertsTable` has `LOW_STOCK` alert type but the Supply Chain screen doesn't surface them distinctly.

---

## Feature A — Supply Chain: Create PO + Approve PO

### A1 — Backend check

File: `artifacts/api-server/src/routes/supply_chain.ts`

Read this file first. Identify whether these endpoints already exist:
- `POST /api/supply-chain/orders` — create purchase order
- `PATCH /api/supply-chain/orders/:id/approve` — approve a PO
- `PATCH /api/supply-chain/orders/:id/reject` — reject a PO

If they exist, proceed to A2. If they don't, add them:

```typescript
// POST /api/supply-chain/orders
router.post("/orders", async (req, res) => {
  const { item, quantity, supplier, urgency } = req.body as {
    item: string; quantity: number; supplier: string; urgency: "routine" | "urgent" | "critical";
  };
  const [order] = await db.insert(purchaseOrdersTable).values({
    item, quantity, supplier, urgency,
    requestedBy: req.userId ?? "unknown",
    status: "pending",
  }).returning();
  res.status(201).json(order);
});

// PATCH /api/supply-chain/orders/:id/approve
router.patch("/orders/:id/approve", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [order] = await db.update(purchaseOrdersTable)
    .set({ status: "approved", approvedAt: new Date(), approvedBy: req.userId ?? "unknown" })
    .where(eq(purchaseOrdersTable.id, id))
    .returning();
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(order);
});

// PATCH /api/supply-chain/orders/:id/reject
router.patch("/orders/:id/reject", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [order] = await db.update(purchaseOrdersTable)
    .set({ status: "rejected" })
    .where(eq(purchaseOrdersTable.id, id))
    .returning();
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(order);
});
```

Check `lib/db/src/schema/purchase_orders.ts` for exact column names before writing.

### A2 — Frontend: Create PO form

File: `artifacts/sanad/src/screens/supply-chain.tsx`

Add a "New Purchase Order" button that opens an inline form (no modal library needed — just a conditional render):

```tsx
const [showCreateForm, setShowCreateForm] = React.useState(false);
const [newPO, setNewPO] = React.useState({ item: "", quantity: 1, supplier: "", urgency: "routine" as "routine" | "urgent" | "critical" });

// The form (show below the PO list header):
{showCreateForm && (
  <Card dir={dir} className="border-primary/30 bg-primary/5">
    <CardContent className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder={text("Item name", "اسم المادة")} value={newPO.item}
          onChange={e => setNewPO(p => ({...p, item: e.target.value}))}
          className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" />
        <input type="number" placeholder={text("Quantity", "الكمية")} value={newPO.quantity}
          onChange={e => setNewPO(p => ({...p, quantity: parseInt(e.target.value) || 1}))}
          className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" dir="ltr" />
        <input placeholder={text("Supplier", "المورد")} value={newPO.supplier}
          onChange={e => setNewPO(p => ({...p, supplier: e.target.value}))}
          className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" />
        <select value={newPO.urgency} onChange={e => setNewPO(p => ({...p, urgency: e.target.value as "routine" | "urgent" | "critical"}))}
          className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm">
          <option value="routine">{text("Routine", "اعتيادي")}</option>
          <option value="urgent">{text("Urgent", "عاجل")}</option>
          <option value="critical">{text("Critical", "حرج")}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCreatePO}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          {text("Submit Order", "إرسال الطلب")}
        </button>
        <button onClick={() => setShowCreateForm(false)}
          className="rounded-md border border-border text-foreground px-4 py-2 text-sm hover:bg-muted">
          {text("Cancel", "إلغاء")}
        </button>
      </div>
    </CardContent>
  </Card>
)}
```

### A3 — Frontend: Approve/Reject pending POs

In the PO list, add Approve/Reject buttons for `status === "pending"` orders:

```tsx
{order.status === "pending" && (
  <div className="flex gap-2 mt-2">
    <button onClick={() => handleApprove(order.id)}
      className="text-xs rounded bg-primary/10 text-primary px-2 py-1 hover:bg-primary/20">
      {text("Approve", "اعتماد")}
    </button>
    <button onClick={() => handleReject(order.id)}
      className="text-xs rounded bg-destructive/10 text-destructive px-2 py-1 hover:bg-destructive/20">
      {text("Reject", "رفض")}
    </button>
  </div>
)}
```

---

## Feature B — Pharmacy: Wire Dispense Button

### B1 — Backend check

File: `artifacts/api-server/src/routes/pharmacy.ts`

Look for a `PATCH /api/pharmacy/dispense/:medicationId` or `POST /api/pharmacy/dispense` endpoint.

If it doesn't exist, add:

```typescript
router.post("/dispense", async (req, res) => {
  const { medicationId } = req.body as { medicationId: number };
  const [med] = await db.update(medicationsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(medicationsTable.id, medicationId))
    .returning();
  if (!med) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ dispensed: true, medication: med });
});
```

### B2 — Frontend: Wire the existing Dispense button

File: `artifacts/sanad/src/screens/pharmacy.tsx`

Find the existing Dispense button (search for `Dispense` or `dispense` — it likely exists as a `<button>` with no onClick). Add the handler:

```tsx
async function handleDispense(medicationId: number) {
  await api("/api/pharmacy/dispense", {
    method: "POST",
    body: JSON.stringify({ medicationId }),
  });
  // Re-fetch the medication list to reflect the change
  fetchMedications();
}
```

---

## Feature C — Low Stock Alert Banner

File: `artifacts/sanad/src/screens/supply-chain.tsx`

Fetch alerts of type `LOW_STOCK` and show a banner at the top of the screen:

```tsx
React.useEffect(() => {
  api("/api/alerts?type=LOW_STOCK&limit=10")
    .then(r => r.json())
    .then(data => setLowStockAlerts(data.alerts ?? []));
}, []);

// In JSX, above the PO list:
{lowStockAlerts.length > 0 && (
  <div className="rounded-lg border border-[hsl(var(--risk-high)/0.4)] bg-[hsl(var(--risk-high)/0.08)] p-3 flex items-start gap-2" dir={dir}>
    <AlertTriangle className="h-4 w-4 text-[hsl(var(--risk-high))] flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-foreground">
        {text(`${lowStockAlerts.length} low-stock alerts`, `${lowStockAlerts.length} تنبيه مخزون منخفض`)}
      </p>
      <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
        {lowStockAlerts.map(a => <li key={a.id}>{a.message}</li>)}
      </ul>
    </div>
  </div>
)}
```

---

## Seed: Add demo purchase orders

File: `scripts/src/seed.ts`

After the medications insert, add demo POs so the Supply Chain portal has data immediately after seed:

```typescript
import { purchaseOrdersTable } from "@workspace/db/schema";

const purchaseOrders = [
  { item: "Warfarin 5mg Tablets",       quantity: 500, supplier: "Al-Dawaa Pharmacies", urgency: "urgent" as const,   requestedBy: "supply.ibrahim", status: "pending" as const },
  { item: "Insulin Glargine (Lantus)",   quantity: 200, supplier: "Saudi Pharma Co.",   urgency: "critical" as const, requestedBy: "supply.ibrahim", status: "pending" as const },
  { item: "Surgical Masks (Type IIR)",   quantity: 10000, supplier: "MedSupply KSA",    urgency: "routine" as const,  requestedBy: "supply.ibrahim", status: "approved" as const },
  { item: "Amiodarone 200mg Tablets",    quantity: 300, supplier: "Al-Dawaa Pharmacies", urgency: "urgent" as const,  requestedBy: "supply.ibrahim", status: "approved" as const },
  { item: "IV Fluid NaCl 0.9% 500ml",   quantity: 1000, supplier: "MedSupply KSA",     urgency: "routine" as const,  requestedBy: "supply.ibrahim", status: "rejected" as const },
];

await db.insert(purchaseOrdersTable).values(purchaseOrders).onConflictDoNothing();
```

Check `lib/db/src/schema/purchase_orders.ts` for exact column names.

---

## Acceptance Criteria

- [ ] `pnpm --filter @workspace/api-server typecheck` → 0 errors
- [ ] `pnpm --filter @workspace/sanad typecheck` → 0 errors
- [ ] `POST /api/supply-chain/orders` as `supply.ibrahim` → 201
- [ ] `PATCH /api/supply-chain/orders/1/approve` as `supply.ibrahim` → 200, status becomes `"approved"`
- [ ] Supply Chain screen shows "New Purchase Order" button → form opens → submit creates a PO → list refreshes
- [ ] Pending POs show Approve/Reject buttons; clicking updates status immediately
- [ ] Low stock alert banner appears if `LOW_STOCK` alerts exist in DB
- [ ] `POST /api/pharmacy/dispense` as `pharm.hassan` → 200, medication `isActive` becomes false
- [ ] Pharmacy screen Dispense button fires the API and the item disappears from active list
- [ ] Seed runs without error, creates 5 demo POs

---

## Do NOT Touch

- `lib/db/` schema — `purchase_orders` table already exists
- Other route files
- Harnesses — no new assertions needed (supply chain is not in the BOLA boundary tests)

---

## Git Instructions

```bash
git checkout -b feature/supply-pharmacy
pnpm install

git commit -m "feat(supply-chain): create PO + approve/reject endpoints and UI"
git commit -m "feat(pharmacy): wire dispense button to API"
git commit -m "feat(supply-chain): low-stock alert banner"
git commit -m "feat(seed): add demo purchase orders"

pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/sanad typecheck

git push -u origin feature/supply-pharmacy
```
