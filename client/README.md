
## Refactor: DB-mediated patient–clinician flow

- Removed direct messaging features. No `Communication` send or inbox.
- Patient writes structured resources: `MedicationStatement`, `CarePlan` notes via `CarePlan`, `ServiceRequest` (referrals), optional `NutritionOrder`, and `Appointment`.
- Clinician reads these resources from the FHIR server. No point-to-point channel.
- Referral Wizard UI removed. ServiceRequest creation remains via existing forms or external EHR.
- Code limited to resources available in your sandbox capability list.

# Emergency Intervention System (SMART on FHIR Prototype)

This is a SMART on FHIR, FHIR R4 prototype to support delivery of interventions to reduce emergency department representations and avoidable readmissions.

## Features (MVP)
- SMART launch (patient-context) via `fhirclient`
- Read: Patient, Encounters (ED), Conditions, MedicationRequests
- Simple risk flags (e.g., ED >= 4 visits in last 12 months)
- One-click intervention:
  - Create CarePlan (education + follow-ups)
  - Create ServiceRequest (referrals to GP/community care)
  - Create Communication (patient education message)
- Patient-facing summary panel (medication/diet reminders simulated locally)

## Run locally
1. Copy `.env.example` to `.env` and set `VITE_SMART_CLIENT_ID`, `VITE_REDIRECT_URI`, and `VITE_FHIR_ISS` (SMART sandbox, MELD, or Cerner tutorial endpoint).
2. `cd client && npm install && npm run dev`
3. Launch the app from SMART Launcher (set redirect to your dev server URL), or visit `/launch.html` endpoint via launcher config.

## Build
- `npm run build` then serve `dist/` as static site.

## Docker
- `docker build -t emergency-intervention-system .`
- `docker run -p 5173:80 emergency-intervention-system`

## Notes
- Use only synthetic data (e.g., Synthea). Do not use real PHI.
- For MELD or SMART Launcher configuration, register your Client ID and redirect URI.