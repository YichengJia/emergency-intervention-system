import React, { useEffect, useMemo, useState } from "react";
import {
  listMyCommunications,
  listPanelPatients,
  addPatientToPanel,
  searchPatientsByName,
  listPatientMedicationStatements,
  listCarePlans,
  listServiceRequests,
  listNutritionOrders,
  listAppointments,
} from "../fhir";

// Simple polling hook
function useInterval(cb: () => void, ms: number) {
  useEffect(() => {
    const id = setInterval(cb, ms);
    return () => clearInterval(id);
  }, [cb, ms]);
}

interface Props {
  practitionerRef: string; // "Practitioner/{id}"
  practitionerId: string;
}

const ClinicianDashboard: React.FC<Props> = ({ practitionerRef, practitionerId }) => {
  const [inbox, setInbox] = useState<any[]>([]);
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([
        listMyCommunications(practitionerRef),
        listPanelPatients(practitionerId),
      ]);
      setInbox(i);
      setPatients(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [practitionerRef, practitionerId]);

  // Poll the inbox/panel every 5s
  useInterval(loadAll, 5000);

  // Poll the selected patient's details every 5s
  useInterval(() => {
    if (!selectedPatientId) return;
    Promise.all([
      listPatientMedicationStatements(selectedPatientId),
      listCarePlans(selectedPatientId),
      listServiceRequests(selectedPatientId),
      listNutritionOrders(selectedPatientId),
      listAppointments(selectedPatientId),
    ])
      .then(([s, cps, srs, nos, appts]) => {
        setStatements(s); setCarePlans(cps); setServiceRequests(srs);
        setNutritionOrders(nos); setAppointments(appts);
      })
      .catch(() => {});
  }, 5000);

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

  // Group communications by patient id using Communication.subject.reference
  const groupedInbox = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const c of inbox) {
      const pid = c.subject?.reference?.split("/")?.[1] || "unknown";
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(c);
    }
    return map;
  }, [inbox]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Clinician Inbox</h3>
        {loading && <div>Loading...</div>}
        {[...groupedInbox.entries()].map(([pid, items]) => (
          <div key={pid} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Patient/{pid}</div>
            <button
              type="button"
              onClick={() => onSelectPatient(String(pid))}
              style={{ marginTop: 6 }}
            >
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
        ))}
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

        {selectedPatientId && (
          <div style={{ marginTop: 12 }}>
            <h3>Medication Adherence · Patient/{selectedPatientId}</h3>
            <ul>
              {statements.map((s: any) => (
                <li key={s.id || s.meta?.versionId}>
                  {s.medicationCodeableConcept?.text ?? "Medication"} · {s.status} ·
                  {" "}
                  {(s.dateAsserted || s.effectiveDateTime || s.meta?.lastUpdated || "")}
                </li>
              ))}
              {statements.length === 0 && <li>No statements yet.</li>}
            </ul>

            <h4 style={{ marginTop: 12 }}>Care Plans</h4>
            <ul>
              {carePlans.map((cp: any) => (
                <li key={cp.id}>{cp.description ?? "(no description)"} · {cp.status}</li>
              ))}
              {carePlans.length === 0 && <li>No care plans.</li>}
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

            <h4 style={{ marginTop: 12 }}>Nutrition Orders</h4>
            <ul>
              {nutritionOrders.map((no: any) => (
                <li key={no.id}>
                  {no.oralDiet?.instruction ?? "Nutrition order"} · {no.status}
                </li>
              ))}
              {nutritionOrders.length === 0 && <li>No nutrition orders.</li>}
            </ul>

            <h4 style={{ marginTop: 12 }}>Appointments</h4>
            <ul>
              {appointments.map((a: any) => (
                <li key={a.id}>
                  {a.description ?? "Appointment"} · {a.start ?? ""} → {a.end ?? ""}
                </li>
              ))}
              {appointments.length === 0 && <li>No appointments.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianDashboard;
