# SANAD — Gemini Sprint 9: Final Release Preparation

**Branch to create:** `release/v2`  
**Base:** `main` (after ALL previous sprints are merged)  
**Repo:** `https://github.com/hossam2111/sanad-final`

---

## Overview

This is the final sprint before publication. No new features — only:
1. Merge all feature branches to `main`
2. Update `DEMO_PLAYBOOK.md` to cover new scenarios
3. Update `verify-and-publish.ps1` assertion counts if changed
4. Tag `demo-ready-v2`
5. Final green gate run

---

## Step 1 — Merge all branches to main

```bash
git checkout main
git merge --ff-only feature/family-relationship-model   # Sprint 2
git merge --ff-only feature/hospital-scoping            # Sprint 3
git merge --ff-only feature/dark-mode                   # Sprint 4
git merge --ff-only feature/audit-dashboard             # Sprint 5
git merge --ff-only feature/error-ux                    # Sprint 6
git merge --ff-only feature/supply-pharmacy             # Sprint 7
git merge --ff-only feature/insurance-ai-control        # Sprint 8
```

If any fast-forward fails (due to ordering), use `git merge --no-ff` with a merge commit instead. Resolve any conflicts by keeping the newer sprint's version.

---

## Step 2 — Update DEMO_PLAYBOOK.md

File: `docs/DEMO_PLAYBOOK.md` (or wherever it lives — check `docs/`)

Add or update these scenarios to reflect what was built in Sprints 2-8:

### New Scenarios to Document

**S-FAM-DB (Sprint 2):** Family portal uses explicit relationships
> "محمد الغامدي's family list shows خالد and نورة with their correct relationship types (Sibling, Child) — not random patients from nearby IDs. Patient يوسف, who has no family links, returns an empty family list."

**S-HOSP (Sprint 3):** Hospital scoping
> "Dr. Rashidi logs in and sees only KAMC-RYD patients in the patient list. Individual lookup by nationalId is still available for cross-hospital referrals. Admin sees all patients — unaffected."

**S-DARK (Sprint 4):** Dark mode
> "Click the Moon icon in the top-right — all screens flip to dark mode including Arabic RTL. Risk badges remain readable. Click Sun to return to light mode."

**S-AUDIT (Sprint 5):** Isnād audit trail
> "In the Admin portal, click the 'Audit Trail' tab. Filter by role='doctor' to see only Dr. Rashidi's accesses. Every access shows: who, role, action, what, timestamp, IP."

**S-CONSENT (Sprint 5):** Consent revoke confirmation
> "In the Citizen portal, revoke insurance consent. A confirmation dialog appears in Arabic asking 'هل أنت متأكد؟'. Accepting shows a green toast for 3 seconds."

**S-ERROR (Sprint 6):** Graceful error state
> "Stop the API server. Refresh the Doctor portal. Skeleton cards pulse for 2 seconds then show an error banner with a Retry button. Restarting the server and clicking Retry restores normal view."

**S-PO (Sprint 7):** Purchase order flow
> "In the Supply Chain portal, create a new PO for 'Warfarin 5mg Tablets — 500 units — Urgent'. It appears as pending. Click Approve — status changes to approved."

**S-INS (Sprint 8):** Insurance claim with AI recommendation
> "Open claim from لطيفة الحربي. Click 'AI Recommendation'. Badge shows 'Manual Review' with flag 'Multiple visits — possible overutilization'. Click Deny."

**S-AI (Sprint 8):** AI control toggles
> "In the AI Control panel, toggle 'drug_interaction' off. Return to Doctor portal and attempt a drug interaction check — it should fail or return a disabled message. Toggle back on."

---

## Step 3 — Update verify-and-publish.ps1 counts

After all sprints merge, recount assertions:

```powershell
(Select-String -Path "scripts\harnesses\scenario-tests.mjs" -Pattern "^\s*check\(|^check\(").Count
(Select-String -Path "scripts\harnesses\ownership-tests.mjs" -Pattern "^check\(").Count
```

Update the two Step lines and two Pass lines in `verify-and-publish.ps1` to match the new totals.

Also update the tag reference from `demo-ready-v1` to `demo-ready-v2`:

```powershell
# Line ~151 — change:
Write-Host "    git push sanad-final demo-ready-v1" -ForegroundColor Cyan
# To:
Write-Host "    git push sanad-final demo-ready-v2" -ForegroundColor Cyan
```

---

## Step 4 — Run the full gate

With the API server running on port 8080 and DB seeded:

```powershell
.\verify-and-publish.ps1 -DryRun
```

All 5 steps must pass before continuing.

---

## Step 5 — Tag v2 and push

```bash
# Delete old tag if it exists locally
git tag -d demo-ready-v1 2>/dev/null; true

# Create v2 annotated tag
git tag -a demo-ready-v2 -m "SANAD demo-ready-v2 — 9 sprints complete: RTL, DB relationships, hospital scoping, dark mode, audit trail, error UX, supply chain, insurance review, AI control"

# Push main and new tag
git push -u sanad-final main
git push sanad-final demo-ready-v2
```

Do NOT delete `demo-ready-v1` from the remote — it marks the previous baseline.

---

## Step 6 — Post-publication checklist

After push, verify on GitHub:
- [ ] `sanad-final/main` shows all 9 sprint commits in history
- [ ] Tag `demo-ready-v2` appears in GitHub Releases
- [ ] `docs/DEMO_PLAYBOOK.md` is visible and up to date
- [ ] All feature branches appear under "Branches" (for audit trail)

---

## Acceptance Criteria

- [ ] `git log --oneline main` shows commits from all 9 sprints
- [ ] `.\verify-and-publish.ps1 -DryRun` exits 0 (ALL CHECKS PASSED)
- [ ] `DEMO_PLAYBOOK.md` has entries for S-FAM-DB, S-HOSP, S-DARK, S-AUDIT, S-CONSENT, S-ERROR, S-PO, S-INS, S-AI
- [ ] Tag `demo-ready-v2` exists on GitHub
- [ ] `git push sanad-final main` completes (no `--force` used)

---

## Do NOT

- Force-push to main or any protected branch
- Delete remote feature branches (keep them for the audit record)
- Amend any existing commits
- Run `git push --force` under any circumstances

---

## Git Instructions

```bash
# All on main
git checkout main
# Merge each branch (see Step 1 above)
# Edit DEMO_PLAYBOOK.md (Step 2)
git commit -m "docs: update DEMO_PLAYBOOK for Sprints 2-8 scenarios"
# Update verify-and-publish.ps1 (Step 3)
git commit -m "chore: update assertion counts and tag reference to demo-ready-v2"
# Run gate (Step 4)
.\verify-and-publish.ps1 -DryRun
# Tag and push (Step 5)
git tag -a demo-ready-v2 -m "..."
git push -u sanad-final main
git push sanad-final demo-ready-v2
```
