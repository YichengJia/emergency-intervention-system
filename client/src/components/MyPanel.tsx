/**
 * My Panel enrollment search that accepts name OR direct ID.
 */

import React, { useState } from "react";
import { searchPatientsByName } from "../fhir";

const MyPanel: React.FC = () => {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function onSearch() {
    const r = await searchPatientsByName(q.trim());
    setRows(r);
    setMessage(r.length ? "" : "No results.");
  }c

  return (
    <div>
      <h3>My Panel</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Search by name or ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={onSearch}>Search</button>
      </div>

      {message && <div style={{ marginTop: 8 }}>{message}</div>}

      <ul style={{ marginTop: 12 }}>
        {rows.map((p) => (
          <li key={p.id}>
            {(p.name?.[0]?.text ?? "(no name)")} · {p.gender} ·{" "}
            {p.birthDate} · ID {p.id}
            {/* Add your existing "Enroll" button here */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyPanel;
