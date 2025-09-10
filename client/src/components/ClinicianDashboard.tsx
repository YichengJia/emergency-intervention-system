// client/src/components/ClinicianDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listMyCommunications,
  listPanelPatients,
  addPatientToPanel,
  searchPatientsByName,
  listPatientMedicationStatements
} from "../fhir";

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
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([
        listMyCommunications(practitionerRef),
        listPanelPatients(practitionerId)
      ]);
      setInbox(i);
      setPatients(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [practitionerRef, practitionerId]);
  useInterval(loadAll, 15000); // poll every 15s

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
    setStatements(await listPatientMedicationStatements(pid));
  };

  const groupedInbox = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const c of inbox) {
      const pid = c.subject?.reference?.split("/")[1] || "unknown";
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(c);
    }
    return map;
  }, [inbox]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Clinician Inbox</h3>
        {loading && <div>Loading...</div>}
        {[...groupedInbox.entries()].map(([pid, items]) => (
          <div key={pid} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Patient/{pid}</strong>
              <button onClick={() => onSelectPatient(pid)}>Open Med Adherence</button>
            </div>
            <ul style={{ margin: "8px 0 0 16px" }}>
              {items.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span style={{ fontSize: 12, color: "#666", marginRight: 6 }}>
                    {c.sent ? new Date(c.sent).toLocaleString() : ""}
                  </span>
                  {c.payload?.[0]?.contentString || "(no text)"}
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
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", border: "1px solid #eee", padding: 6, borderRadius: 6, marginBottom: 6 }}>
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
            <h4>Medication Statements — Patient/{selectedPatientId}</h4>
            <ul>
              {statements.map((s) => (
                <li key={s.id}>
                  <strong>{s.medicationCodeableConcept?.text ?? "Medication"}</strong>{" "}
                  — {s.note?.[0]?.text ?? ""}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
                    {s.dateAsserted ? new Date(s.dateAsserted).toLocaleString() : ""}
                  </span>
                </li>
              ))}
              {statements.length === 0 && <li>No statements yet.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianDashboard;
