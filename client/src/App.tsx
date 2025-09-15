import React, { useEffect, useMemo, useState } from "react";
import {
  smartAuthorize, getClient, getPatient, getEncounters, getConditions, getMedicationRequests,
  riskFromFactors, createCarePlan, createServiceRequest, createCommunicationToPatient,
  getUserInfo, getLaunchInfo
} from "./fhir";

import RiskFlags, { RiskSummary } from "./components/RiskFlags";
import MedicationPlanner from "./components/MedicationPlanner";
import FollowUpScheduler from "./components/FollowUpScheduler";
import ReferralWizard from "./components/ReferralWizard";
import MedicationCalendar from "./components/MedicationCalendar";
import ClinicianDashboard from "./components/ClinicianDashboard";
import NutritionPlanner from "./components/NutritionPlanner";
import AppointmentScheduler from "./components/AppointmentScheduler";

function useQueryParam(name: string) {
  const [val, setVal] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setVal(p.get(name));
  }, [name]);
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
  const [launchType, setLaunchType] = useState<'patient' | 'provider' | 'unknown'>('unknown');
  const [contextPatientIds, setContextPatientIds] = useState<string[]>([]);
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

        // Get launch information
        const launchInfo = await getLaunchInfo();
        setLaunchType(launchInfo.type);
        setContextPatientIds(launchInfo.patientIds);

        console.log("Launch Info:", launchInfo);

        // Get user information
        const user = await getUserInfo(c);
        if (user?.resourceType === "Practitioner" && user.id) {
          setPractitionerRef(`Practitioner/${user.id}`);
          setPractitionerId(user.id);
        }

        // For patient launch or when viewing patient view, get patient data
        if (launchInfo.type === 'patient' || view !== 'clinician') {
          const p = await getPatient(c);
          setPatient(p);

          const [es, cs, ms] = await Promise.all([
            getEncounters(c, p.id),
            getConditions(c, p.id),
            getMedicationRequests(c, p.id)
          ]);
          setEncounters(es);
          setConditions(cs);
          setMeds(ms);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [view]);

  const summary: RiskSummary | undefined = useMemo(() => {
    if (!patient) return undefined;
    const edCount = encounters.filter((e: any) => {
      const cls = e.class?.code || e.class?.display || "";
      const types = (e.type || []).map((t: any) => t.coding?.[0]?.code ?? "").join(",");
      return /emergency|ED|ER|urgent/i.test(`${cls} ${types}`);
    }).length;
    const chronic = conditions
      .map((c) => c.code?.text || c.code?.coding?.[0]?.display)
      .filter(Boolean) as string[];
    const hasOpioid = meds.some((m) =>
      /fentanyl|oxycodone|morphine|opioid/i.test(
        m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || ""
      )
    );
    const risk = riskFromFactors(edCount, chronic, hasOpioid);
    return { edCount12m: edCount, risk, conditions: chronic };
  }, [patient, encounters, conditions, meds]);

  if (error) return <>Error: {error}</>;

  const isClinicianView = (view === "clinician" || (launchType === 'provider' && view !== 'patient'));

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Emergency Intervention System</h1>

      <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f8ff", borderRadius: 8 }}>
        <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
          <div>
            <strong>Launch Type:</strong> {launchType === 'provider' ? 'Provider EHR Launch' :
                                          launchType === 'patient' ? 'Patient Launch' : 'Unknown'}
          </div>
          {contextPatientIds.length > 0 && (
            <div>
              <strong>Context Patients:</strong> {contextPatientIds.length} selected
            </div>
          )}
          {practitionerRef && (
            <div>
              <strong>Practitioner:</strong> {practitionerRef}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <a href="?view=patient" style={{
          padding: "8px 16px",
          marginRight: 8,
          backgroundColor: !isClinicianView ? "#007bff" : "#f0f0f0",
          color: !isClinicianView ? "white" : "#333",
          textDecoration: "none",
          borderRadius: 4
        }}>
          Patient View
        </a>
        <a href="?view=clinician" style={{
          padding: "8px 16px",
          backgroundColor: isClinicianView ? "#007bff" : "#f0f0f0",
          color: isClinicianView ? "white" : "#333",
          textDecoration: "none",
          borderRadius: 4
        }}>
          Clinician View
        </a>
      </div>

      {isClinicianView ? (
        <>
          {practitionerRef && practitionerId ? (
            <ClinicianDashboard
              practitionerRef={practitionerRef}
              practitionerId={practitionerId}
            />
          ) : (
            <div style={{
              padding: 20,
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: 8,
              marginTop: 20
            }}>
              <h3 style={{ marginTop: 0, color: "#856404" }}>Practitioner Access Required</h3>
              <p>Current user is not a Practitioner or missing ID. Please launch this application with a Practitioner context.</p>
              <p>If you are using SMART App Launcher, make sure to:</p>
              <ul>
                <li>Select "Provider EHR Launch" as the launch type</li>
                <li>Choose a Practitioner user</li>
                <li>Select one or more patients for the context</li>
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {!patient ? (
            <div>Loading patient data...</div>
          ) : (
            <>
              <div style={{ margin: "12px 0", padding: 12, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
                <strong>Patient:</strong> {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
                <span style={{ marginLeft: 12, color: "#666" }}>(ID: {patient.id})</span>
              </div>

              <RiskFlags summary={summary} />

              <MedicationPlanner meds={meds} />

              <MedicationCalendar
                patient={patient}
                meds={meds}
                practitionerRef={practitionerRef}
                riskLevel={summary?.risk ?? "LOW"}
              />

              <FollowUpScheduler
                onCreate={async (text) => {
                  if (!client) return;
                  await createCarePlan(client, patient, text, practitionerRef);
                }}
              />

              <ReferralWizard
                onCreate={async (sp) => {
                  if (!client) return;
                  await createServiceRequest(client, patient, sp, practitionerRef);
                }}
                onEducate={async (txt) => {
                  if (!client) return;
                  await createCommunicationToPatient(client, patient, txt);
                }}
              />

              <NutritionPlanner
                onCreate={async (instruction) => {
                  if (!client) return;
                  const { upsertNutritionOrder } = await import("./fhir");
                  await upsertNutritionOrder(client, patient, instruction, practitionerRef);
                }}
              />

              <AppointmentScheduler
                onCreate={async (title, startIso) => {
                  if (!client) return;
                  const { createAppointment, createCommunicationToPractitioner } = await import("./fhir");
                  await createAppointment(client, patient, title, startIso);
                  if (practitionerRef) {
                    await createCommunicationToPractitioner(
                      patient,
                      `Appointment booked: ${title} at ${startIso}`,
                      practitionerRef
                    );
                  }
                }}
              />
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 32, padding: 16, fontSize: 12, color: "#555", backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <strong>Important Notes:</strong>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>This prototype uses synthetic data and writes back to the sandbox (MedicationStatement, Communication, CarePlan, ServiceRequest, NutritionOrder, Appointment)</li>
          <li>Do not use real PHI (Protected Health Information)</li>
          <li>For Provider EHR Launch: Select multiple patients in SMART Launcher to see filtered communications</li>
          <li>All patient actions (medications, care plans, appointments) will notify the assigned practitioner</li>
        </ul>
      </div>
    </div>
  );
};

export default App;