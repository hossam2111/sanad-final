# 11 — Region Profile Audit

Purpose: document where SANAD currently demonstrates deployment-profile configurability, and where
KSA-specific content is intentionally the reference demo dataset. This prevents accidental rebranding
of the product per audience.

## Summary

SANAD's product identity is global. The UI has configurable deployment profiles for country/ministry
labels, ID labels, currency, and some portal copy. The clinical seed data, sovereignty evidence, and
some national metrics remain KSA reference data by design.

## Correctly Region-Aware Today

| Area | Evidence | Notes |
|------|----------|-------|
| Admin header / command center | `admin.tsx` uses `useRegionStore()` for ministry name and region selector | Good primary proof of deployment-profile configurability. |
| Login screen | `login.tsx` uses `useRegionStore()` | Good pre-login profile signal. |
| Doctor portal | `doctor.tsx` uses region ID label in search/register copy | Good clinical workflow proof. Validation still expects 10 digits because demo national IDs are KSA reference data. |
| Citizen portal | `citizen.tsx` uses region ID label in login/record display | Good patient-facing proof. |
| Emergency portal | `emergency.tsx` imports region config | Good proof area; verify visually during deeper rehearsal if this portal is used live. |
| Lab portal | `lab.tsx` imports region config | Good proof area; verify visually during deeper rehearsal if this portal is used live. |
| Pharmacy portal | `pharmacy.tsx` imports region config | Good proof area; printed/receipt copy still has KSA-specific lines to audit after Sunday. |
| Insurance portal | `insurance.tsx` imports region config | Currency/profile work exists; use if payer story is needed. |
| Supply Chain portal | `supply-chain.tsx` uses region currency | Good operational proof. |

## Intentionally KSA Reference Dataset

| Area | Why It Stays KSA Before Sunday |
|------|--------------------------------|
| Admin Data Sovereignty tab | Compliance copy describes KSA PDPL/SDAIA and KSA sovereign cloud evidence. Use it as reference deployment evidence, not proof of another country's production deployment. |
| National risk heatmap | `KSAHeatmap` and KSA regional coordinates are seeded demo evidence. Do not rename as Qatar/UAE without real data. |
| Demo patients and national IDs | Seeded scenarios use KSA-style 10-digit IDs and KSA names. Treat as reference demo data. |
| Research study examples | Some study/sponsor labels are KSA-specific reference content. |
| Pharmacy printed copy | Some print/receipt lines still say Ministry of Health / Kingdom of Saudi Arabia. Do not use print view as global proof until audited. |

## Meeting Guidance

Say:

- "The platform identity is global."
- "The region selector demonstrates deployment-profile configurability."
- "The clinical and sovereignty evidence you see today comes from the KSA reference demo dataset."
- "A production deployment generates its own sovereignty evidence after hosting, integration, and regulatory sign-off."

Do not say:

- "This is already a Qatar production deployment."
- "KSA sovereignty evidence proves another country's deployment."
- "SANAD changes identity based on the buyer."

## Post-Sunday Follow-Up

1. Add visible "Reference Dataset: KSA" labelling near Data Sovereignty and national heatmap when a
   non-KSA profile is selected.
2. Audit pharmacy print views and remove country-specific hardcoding where it is not reference-data
   evidence.
3. Add a small profile provenance chip to dashboards: `Profile: Qatar` / `Dataset: KSA Reference`.
4. Keep validation rules honest: profile labels can change now, but real country ID validation is a
   production integration task.

