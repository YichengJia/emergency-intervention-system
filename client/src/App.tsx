// client/src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  smartAuthorize, getClient, getPatient, getEncounters, getConditions, getMedicationRequests,
  computeEdCount, riskFromCount, createCarePlan, createServiceRequest, createCommunicationToPatient,
  getUserInfo, createFlagHighRisk
} from "./fhir";
import RiskFlags, { RiskSummary } from "./components/RiskFlags";
import MedicationPlanner from "./components/MedicationPlanner";
import FollowUpScheduler from "./components/FollowUpScheduler";
import ReferralWizard from "./components/ReferralWizard";
import MedicationCalendar from "./components/MedicationCalendar";
import ClinicianDashboard from "./components/ClinicianDashboard";

function useQueryParam(name: string) {
  const [val, setVal] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setVal(p.get(name));
  }, []);
  return val;
}

const App: React.FC = () => {
  const [client, setClient] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [practitionerRef, setPractitionerRef] = useState<string | undefined>(undefined);
  const [practitionerId, setPractitionerId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>("");

  const view = useQueryParam("view"); // "patient" | "clinician" | null

  useEffect(() => {
    (async () => {
      try {
        const c = await getClient().catch(async () => {
          await smartAuthorize();
          return null;
        });
        if (!c) return;
        setClient(c);

        const user = await getUserInfo(c);
        if (user?.resourceType === "Practitioner" && user.id) {
          setPractitionerRef(`Practitioner/${user.id}`);
          setPractitionerId(user.id);
        }

        const p = await getPatient(c);
        setPatient(p);

        const [es, cs, ms] = await Promise.all([
          getEncounters(c, p.id),
          getConditions(c, p.id),
          getMedicationRequests(c, p.id)
        ]);
        setEncounters(es); setConditions(cs); setMeds(ms);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, []);

  const summary: RiskSummary | undefined = useMemo(() => {
    if (!patient) return undefined;
    const edCount = computeEdCount(encounters);
    let risk = riskFromCount(edCount);
    const chronic = conditions
      .map((c) => c.code?.text || c.code?.coding?.[0]?.display)
      .filter(Boolean) as string[];
    const hasCardiac = chronic.some((x) => /cardiac|coronary|heart/i.test(x)) ? 1 : 0;
    const hasOpioid = meds.some((m) =>
      /fentanyl|oxycodone|morphine|opioid/i.test(
        m.medicationCodeableConcept?.text ||
        m.medicationCodeableConcept?.coding?.[0]?.display || ""
      )
    ) ? 1 : 0;
    const bump = hasCardiac + hasOpioid;
    if (bump > 0) {
      if (risk === "LOW") risk = "MODERATE";
      else if (risk === "MODERATE") risk = "HIGH";
    }
    return { edCount12m: edCount, risk, conditions: chronic };
  }, [patient, encounters, conditions, meds]);

  useEffect(() => {
    (async () => {
      try {
        if (patient && summary?.risk === "HIGH" && client) {
          await createFlagHighRisk(patient, "High risk per ED count & comorbidity.");
        }
      } catch {}
    })();
  }, [patient, summary?.risk, client]);

  if (error) return <div style={{ padding: 16 }}><h3>Error</h3><pre>{error}</pre></div>;
  if (!patient) return <div style={{ padding: 16 }}>Loading SMART session...</div>;

  const name = patient.name?.[0];
  const displayName = name ? `${name.given?.[0] ?? ""} ${name.family ?? ""}`.trim() : patient.id;

  const isClinicianView = (view === "clinician");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2>Emergency Intervention System</h2>
      <div style={{ marginBottom: 12, fontSize: 12 }}>
        <a href={`${location.pathname}?view=patient`}>Patient View</a> |{" "}
        <a href={`${location.pathname}?view=clinician`}>Clinician View</a>
      </div>

      {isClinicianView ? (
        <>
          <p><strong>User:</strong> {practitionerRef ?? "(not a Practitioner)"} </p>
          {practitionerRef && practitionerId ? (
            <ClinicianDashboard
              practitionerRef={practitionerRef}
              practitionerId={practitionerId}
            />
          ) : (
            <p>Current user is not a Practitioner or missing id.</p>
          )}
        </>
      ) : (
        <>
          <p><strong>Patient:</strong> {displayName} (ID: {patient.id})</p>
          <RiskFlags summary={summary} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <MedicationPlanner meds={meds} />
            <FollowUpScheduler onCreate={async (text) => {
              if (!client) return; await createCarePlan(client, patient, text);
            }} />
          </div>

          <div style={{ marginTop: 12 }}>
            <ReferralWizard
              onCreate={async (sp) => { if (!client) return; await createServiceRequest(client, patient, sp); }}
              onEducate={async (txt) => { if (!client) return; await createCommunicationToPatient(client, patient, txt); }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <MedicationCalendar
              patient={patient}
              meds={meds}
              practitionerRef={practitionerRef}
              riskLevel={summary?.risk ?? "LOW"}
            />
          </div>
        </>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        <p>
          * This prototype uses synthetic data and writes back to the sandbox
          (MedicationStatement, Communication, CarePlan, ServiceRequest, optional Flag).
        </p>
      </div>
    </div>
  );
};

export default App;
