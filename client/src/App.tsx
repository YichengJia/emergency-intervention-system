// client/src/App.tsx
import React, { useEffect, useState } from "react";
import {
  smartAuthorize,
  getClient,
  getPatient,
  getConditions,
  getMedicationRequests,
  riskFromFactors,
  createCarePlan,
  createServiceRequest,
  createCommunicationToPatient,
  createNutritionOrder,
  createAppointment,
  getUserInfo,
} from "./fhir";
import MedicationCalendar from "./components/MedicationCalendar";
import NutritionPlanner from "./components/NutritionPlanner";
import AppointmentScheduler from "./components/AppointmentScheduler";
import ReferralWizard from "./components/ReferralWizard";

import ClinicianDashboard from "./components/ClinicianDashboard";

const App: React.FC = () => {
  const [clientReady, setClientReady] = useState(false);
  const [patient, setPatient] = useState<any | null>(null);
  const [conditions, setConditions] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [risk, setRisk] = useState<"LOW" | "MODERATE" | "HIGH">("LOW");
  const [error, setError] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [practitionerRef, setPractitionerRef] = useState<string>("");

  // SMART ready
  useEffect(() => {
    (async () => {
      try {
        await getClient().catch(async () => {
          await smartAuthorize();
        });
        setClientReady(true);
      } catch (e: any) {
        setError(String(e?.message || e || "Auth error"));
      }
    })();
  }, []);

  // Load user info and patient context
  useEffect(() => {
    if (!clientReady) return;
    (async () => {
      try {
        const u = await getUserInfo();
        setPractitionerRef(u.fhirUser || "");
        const p = await getPatient();
        setPatient(p);
        if (p?.id) {
          const c = await getConditions(p.id);
          const mr = await getMedicationRequests(p.id);
          setConditions(c);
          setMeds(mr);
          setRisk(riskFromFactors(c, mr));
        }
      } catch (e: any) {
        setError(String(e?.message || e));
      }
    })();
  }, [clientReady]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!clientReady) return <div>Loading SMART…</div>;
  if (!patient) return <div>No patient in context.</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Emergency Intervention System
        </div>
        <div>
          Patient: {patient.name?.[0]?.text || `${patient.name?.[0]?.given?.[0] || ""} ${patient.name?.[0]?.family || ""}`}{" "}
          (ID: {patient.id}) · Risk: {risk}
        </div>
      </header>

      {/* Patient View */}
      <section style={{ display: "grid", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3>📋 Medication Planner</h3>
          <MedicationCalendar
            patient={patient}
            meds={meds}
            practitionerRef={practitionerRef}
            riskLevel={risk}
          />
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3>Follow-up Plan</h3>
          <div>Education on medication adherence and diet; GP follow-up in 7 days; review in 14/30 days.</div>
          <button
            onClick={async () => {
              await createCarePlan(
                patient,
                "Education on medication adherence and diet; GP follow-up in 7 days; review in 14/30 days."
              );
              setStatusMsg("CarePlan has been created and overwrote old version.");
              setTimeout(() => setStatusMsg(""), 3000);
            }}
          >
            Create CarePlan
          </button>
          {statusMsg && <div style={{ marginTop: 6, color: "#2f6" }}>{statusMsg}</div>}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <ReferralWizard
            onCreate={async (specialty) => {
              await createServiceRequest(patient, specialty);
              await createCommunicationToPatient(patient, `Referral created: ${specialty}`, practitionerRef);
            }}
            onEducate={() => alert("Educational resources placeholder")}
          />
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <NutritionPlanner
            onCreate={async (instruction) => {
              await createNutritionOrder(patient, instruction);
              setStatusMsg("Nutrition Order has been saved, old data has been recorded.");
              setTimeout(() => setStatusMsg(""), 3000);
            }}
          />
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <AppointmentScheduler
            onCreate={async (title, startIso) => {
              await createAppointment(patient, title, startIso);
              setStatusMsg("An appointment has been created.");
              setTimeout(() => setStatusMsg(""), 3000);
            }}
          />
        </div>
      </section>

      {/* Clinician View */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 16 }}>
        <h3>Clinician View</h3>
        <ClinicianDashboard practitionerRef={practitionerRef} />
      </section>
    </div>
  );
};

export default App;
