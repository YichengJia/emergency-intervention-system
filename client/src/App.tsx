import React, { useEffect, useMemo, useState } from "react";
import {
  smartAuthorize, getClient, getPatient, getEncounters, getConditions, getMedicationRequests,
  riskFromFactors, createCarePlan, createServiceRequest, createCommunicationToPatient,
  getUserInfo
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
  const [contextPatientId, setContextPatientId] = useState<string | undefined>(undefined); // SMART EHR context
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

        // Try EHR-injected patient context first
        let pid: string | undefined;
        try {
          if (typeof (c as any).getPatientId === "function") {
            pid = await (c as any).getPatientId();
          }
        } catch {}

        let p: any;
        if (pid) {
          setContextPatientId(pid);
          p = await c.request(`Patient/${pid}`);
        } else {
          p = await getPatient(c);
          pid = p?.id;
          if (pid) setContextPatientId(pid);
        }
        setPatient(p);

        if (p?.id) {
          const [es, cs, ms] = await Promise.all([
            getEncounters(c, p.id),
            getConditions(c, p.id),
            getMedicationRequests(c, p.id),
          ]);
          setEncounters(es);
          setConditions(cs);
          setMeds(ms);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, []);

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
  if (!patient) return <>Loading SMART session...</>;

  const name = patient.name?.[0];
  const displayName = name ? `${name.given?.[0] ?? ""} ${name.family ?? ""}`.trim() : patient.id;
  const isClinicianView = view === "clinician";

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h1>Emergency Intervention System</h1>
      <div style={{ marginBottom: 8 }}>
        <a href="?view=patient">Patient View</a> | <a href="?view=clinician">Clinician View</a>
      </div>

      {isClinicianView ? (
        <>
          <div style={{ margin: "8px 0", fontSize: 12 }}>
            <b>User:</b> {practitionerRef ?? "(not a Practitioner)"}{" "}
            {contextPatientId ? (
              <span style={{ marginLeft: 8, color: "#555" }}>
                <b>Context Patient:</b> Patient/{contextPatientId}
              </span>
            ) : null}
          </div>
          {practitionerRef && practitionerId ? (
            <ClinicianDashboard
              practitionerRef={practitionerRef}
              practitionerId={practitionerId}
              contextPatientId={contextPatientId}
            />
          ) : (
            <div>Current user is not a Practitioner or missing id.</div>
          )}
        </>
      ) : (
        <>
          <div style={{ margin: "8px 0" }}>
            <b>Patient:</b> {displayName} (ID: {patient.id})
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
              const { upsertCarePlan } = await import("./fhir");
              await upsertCarePlan(client, patient, text, practitionerRef);
            }}
          />
          <ReferralWizard
            onCreate={async (sp, reason, urgency) => {  // 添加reason和urgency参数
              if (!client) return;
              const { createServiceRequest } = await import("./fhir");
              await createServiceRequest(client, patient, sp, reason, urgency, practitionerRef);
            }}
            onEducate={async (txt) => {
              if (!client) return;
              await createCommunicationToPatient(client, patient, txt);
            }}
          />
          <NutritionPlanner
            onCreate={async (instruction, dietType, symptoms) => {  // 添加dietType和symptoms参数
              if (!client) return;
              const { upsertNutritionOrder } = await import("./fhir");
              await upsertNutritionOrder(client, patient, instruction, dietType, symptoms, practitionerRef);
            }}
          />

          <AppointmentScheduler
            patient={patient}
            onCreate={async (title, startIso) => {
              if (!client) return;
              const { createAppointment } = await import("./fhir");

              try {
                const appt = await createAppointment(client, patient, title, startIso, practitionerRef);

                console.log("Appointment created successfully:", appt);

                // setAppointmentCreated(true); # This function remains to be done.

              } catch (err: any) {
                console.error("Error creating appointment:", err);
                throw err;
              }
            }}
          />
        </>
      )}

      <div style={{ marginTop: 24, fontSize: 12, color: "#555" }}>
        * This prototype uses synthetic data and writes back to the sandbox (MedicationStatement, Communication, CarePlan,
        ServiceRequest, optional NutritionOrder/Appointment). Do not use real PHI.
      </div>
    </div>
  );
};

export default App;
