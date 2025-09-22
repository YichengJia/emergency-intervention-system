import React, { useEffect, useMemo, useState } from "react";
import {
  listPanelPatients,
  addPatientToPanel,
  searchPatientsByName,
  listPatientMedicationStatements,
  listCarePlans,
  listServiceRequests,
  listNutritionOrders,
  listAppointments,
} from "../fhir";
import { formatLocalTime } from "../utils/tz";

/** Simple polling hook */
function useInterval(cb: () => void, ms: number) {
  useEffect(() => {
    const id = setInterval(cb, ms);
    return () => clearInterval(id);
  }, [cb, ms]);
}

interface Props {
  practitionerRef: string; // "Practitioner/{id}"
  practitionerId: string;
  /** Patient context injected by EHR launch. If provided, UI will hard-filter to this patient. */
  contextPatientId?: string;
}

/** Narrow helper that lists Communications for a specific patient + recipient */
    );
    return (res as any[]) || [];
  } catch {
    return [];
  }
}

const POLL_MS = Number(import.meta.env.VITE_POLL_MS ?? 5000);

const ClinicianDashboard: React.FC<Props> = ({ practitionerRef, practitionerId, contextPatientId }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [statements, setStatements] = useState<any[]>([]);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [nutritionOrders, setNutritionOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /** Load inbox and panel; if patient context is present, filter inbox to that patient */
  const loadAll = async () => {
    setLoading(true);
    try {
      const inboxData = contextPatientId
        ? await listMyCommunicationsForPatient(practitionerRef, contextPatientId)
        : await listMyCommunications(practitionerRef); // fallback for non-EHR launches

      const panel = await listPanelPatients(practitionerId);
      setInbox(inboxData);
      setPatients(panel);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [practitionerRef, practitionerId, contextPatientId]);

  /** If we have patient context from EHR, select it and load all the patient resources */
  useEffect(() => {
    if (!contextPatientId) return;
    (async () => {
      setSelectedPatientId(contextPatientId);
      const [s, cps, srs, nos, appts] = await Promise.all([
        listPatientMedicationStatements(contextPatientId),
        listCarePlans(contextPatientId),
        listServiceRequests(contextPatientId),
        listNutritionOrders(contextPatientId),
        listAppointments(contextPatientId),
      ]);
      setStatements(s);
      setCarePlans(cps);
      setServiceRequests(srs);
      setNutritionOrders(nos);
      setAppointments(appts);
    })();
  }, [contextPatientId]);

  /** Poll both inbox and the selected patient's data */
  useInterval(() => {
    (async () => {
      if (contextPatientId) {
        const [i, s, cps, srs, nos, appts] = await Promise.all([
          listMyCommunicationsForPatient(practitionerRef, contextPatientId),
          listPatientMedicationStatements(contextPatientId),
          listCarePlans(contextPatientId),
          listServiceRequests(contextPatientId),
          listNutritionOrders(contextPatientId),
          listAppointments(contextPatientId),
        ]).catch(() => [[], [], [], [], [], []]) as any[];
        setInbox(i); setStatements(s); setCarePlans(cps);
        setServiceRequests(srs); setNutritionOrders(nos); setAppointments(appts);
      } else if (selectedPatientId) {
        const [s, cps, srs, nos, appts] = await Promise.all([
          listPatientMedicationStatements(selectedPatientId),
          listCarePlans(selectedPatientId),
          listServiceRequests(selectedPatientId),
          listNutritionOrders(selectedPatientId),
          listAppointments(selectedPatientId),
        ]).catch(() => [[], [], [], [], []]) as any[];
        setStatements(s); setCarePlans(cps);
        setServiceRequests(srs); setNutritionOrders(nos); setAppointments(appts);
      }
    })();
  }, POLL_MS);

  const onSearch = async () => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchResults(await searchPatientsByName(query.trim()));
  };

  const onEnroll = async (pid: string) => {
    await addPatientToPanel(practitionerId, pid);
    await loadAll();
  };

  const onSelectPatient = async (pid: string) => {
    setSelectedPatientId(pid);
    const [s, cps, srs, nos, appts] = await Promise.all([
      listPatientMedicationStatements(pid),
      listCarePlans(pid), listServiceRequests(pid),
      listNutritionOrders(pid), listAppointments(pid),
    ]);
    setStatements(s);
    setCarePlans(cps);
    setServiceRequests(srs);
    setNutritionOrders(nos);
    setAppointments(appts);
  };

  /** If patient context exists, only show messages for that patient */
  const filteredInbox = useMemo(() => {
    if (!contextPatientId) return inbox;
    return inbox.filter(c => (c.subject?.reference ?? "").endsWith(contextPatientId));
  }, [inbox, contextPatientId]);

  // Helper: render latest-only list
  const latestOnly = (arr: any[], getDate: (x: any) => string | undefined) => {
    if (!arr || arr.length === 0) return [];
    const sorted = [...arr].sort((a, b) =>
      new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime()
    );
    return sorted.slice(0, 1);
  };

  const latestCarePlan = latestOnly(carePlans, (x) => x.meta?.lastUpdated || x.period?.start);
  const latestNutritionOrder = latestOnly(nutritionOrders, (x) => x.meta?.lastUpdated || x.dateTime);
  const latestAppointment = latestOnly(appointments, (x) => x.start);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Clinician Inbox {contextPatientId ? "(filtered by context patient)" : ""}</h3>
        {loading && <div>Loading...</div>}

        {contextPatientId ? (
          <div style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Patient/{contextPatientId}</div>
            <button type="button" onClick={() => onSelectPatient(contextPatientId)} style={{ marginTop: 6 }}>
              Open Med Adherence
            </button>
            <ul style={{ marginTop: 8 }}>
              {filteredInbox.map((c: any) => (
                <li key={c.id || (c.meta?.lastUpdated ?? Math.random())}>
                  {c.payload?.[0]?.contentString ?? "(no content)"}
                </li>
              ))}
              {filteredInbox.length === 0 && <li>No messages.</li>}
            </ul>
          </div>
        ) : (
          (() => {
            const map = new Map<string, any[]>();
            for (const c of filteredInbox) {
              const pid = c.subject?.reference?.split("/")?.[1] || "unknown";
              if (!map.has(pid)) map.set(pid, []);
              map.get(pid)!.push(c);
            }
            return [...map.entries()].map(([pid, items]) => (
              <div key={pid} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>Patient/{pid}</div>
                <button type="button" onClick={() => onSelectPatient(String(pid))} style={{ marginTop: 6 }}>
                  Open Med Adherence
                </button>
                <ul style={{ marginTop: 8 }}>
                  {items.map((c: any) => (
                    <li key={c.id || (c.meta?.lastUpdated ?? Math.random())}>
                      {c.payload?.[0]?.contentString ?? "(no content)"}
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()
        )}

        {selectedPatientId && (
          <div style={{ marginTop: 12 }}>
            <h3>Medication Adherence · Patient/{selectedPatientId}</h3>
            <ul>
              {statements.map((s: any) => (
                <li key={s.id || s.meta?.versionId}>
                  {s.medicationCodeableConcept?.text ?? "Medication"} · {s.status} ·{" "}
                  {formatLocalTime(s.dateAsserted || s.effectiveDateTime || s.meta?.lastUpdated || "")}
                </li>
              ))}
              {statements.length === 0 && <li>No statements yet.</li>}
            </ul>

            <h4 style={{ marginTop: 12 }}>Care Plans (latest)</h4>
            <ul>
              {latestCarePlan.length > 0 ? (
                latestCarePlan.map((cp: any) => (
                  <li key={cp.id}>{cp.description ?? "(no description)"} · {cp.status}</li>
                ))
              ) : (
                <li>No care plans.</li>
              )}
            </ul>

            <h4 style={{ marginTop: 12 }}>Referrals (ServiceRequest)</h4>
            <ul>
              {serviceRequests.map((sr: any) => (
                <li key={sr.id}>
                  {sr.code?.text ?? sr.code?.coding?.[0]?.display ?? "Referral"} · {sr.status}
                </li>
              ))}
              {serviceRequests.length === 0 && <li>No referrals.</li>}
            </ul>

            <h4 style={{ marginTop: 12 }}>Nutrition Orders (latest)</h4>
            <ul>
              {latestNutritionOrder.length > 0 ? (
                latestNutritionOrder.map((no: any) => (
                  <li key={no.id}>{no.oralDiet?.instruction ?? "Nutrition order"} · {no.status}</li>
                ))
              ) : (
                <li>No nutrition orders.</li>
              )}
            </ul>

            <h4 style={{ marginTop: 12 }}>Appointments (latest)</h4>
            <ul>
              {latestAppointment.length > 0 ? (
                latestAppointment.map((a: any) => (
                  <li key={a.id}>{a.description ?? "Appointment"} · {formatLocalTime(a.start ?? "")} → {formatLocalTime(a.end ?? "")}</li>
                ))
              ) : (
                <li>No appointments.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginTop: 0 }}>My Panel</h3>
        <div style={{ marginBottom: 8 }}>
          {patients.length === 0 && <div>No enrolled patients yet.</div>}
          {patients.map((p) => {
            const n = p.name?.[0];
            const label = n ? `${n.given?.[0] ?? ""} ${n.family ?? ""}`.trim() : p.id;
            return (
              <div
                key={p.id}
                style={{ display: "flex", justifyContent: "space-between", border: "1px solid #eee", padding: 6, borderRadius: 6, marginBottom: 6 }}
              >
                <span>{label} (ID: {p.id})</span>
                <button onClick={() => onSelectPatient(p.id)}>Open Med Adherence</button>
              </div>
            );
          })}
        </div>

        <h4>Enroll Patient</h4>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name..." />
          <button onClick={onSearch}>Search</button>
        </div>
        <ul style={{ marginTop: 8 }}>
          {searchResults.map((p) => {
            const n = p.name?.[0];
            const label = n ? `${n.given?.[0] ?? ""} ${n.family ?? ""}`.trim() : p.id;
            return (
              <li key={p.id} style={{ marginBottom: 6 }}>
                {label} (ID: {p.id}){" "}
                <button onClick={() => onEnroll(p.id)}>Enroll</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ClinicianDashboard;
