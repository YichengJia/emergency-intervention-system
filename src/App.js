import React, { useEffect, useState } from "react";
import FHIR from "fhirclient";

// Utility: format patient name
function formatHumanName(names) {
  if (!Array.isArray(names) || names.length === 0) return "Unknown";
  const n = names[0];
  const given = Array.isArray(n.given) ? n.given.join(" ") : (n.given || "");
  const family = n.family || "";
  return `${given} ${family}`.trim() || "Unknown";
}

// Utility: calculate age
function getAge(birthDate) {
  if (!birthDate) return "Unknown";
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/* -------------------- Doctor View -------------------- */
function DoctorView({ patient, doctor, medications, carePlans, appointments, risks, reminders, today }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">👨‍⚕️ Clinician View</h2>

      {patient && (
        <div className="mb-4 bg-blue-50 p-3 rounded">
          <h3 className="font-semibold">Patient Info</h3>
          <p>Name: {formatHumanName(patient.name)}</p>
          <p>Gender: {patient.gender}</p>
          <p>Birth Date: {patient.birthDate}</p>
          <p>ID: {patient.id}</p>
        </div>
      )}

      {doctor && (
        <div className="mb-4 bg-yellow-50 p-3 rounded">
          <h3 className="font-semibold">General Practitioner</h3>
          <p>Name: {formatHumanName(doctor.name)}</p>
          <p>Gender: {doctor.gender}</p>
          <p>Phone: {doctor.telecom?.find(t => t.system === "phone")?.value || "N/A"}</p>
          <p>Email: {doctor.telecom?.find(t => t.system === "email")?.value || "N/A"}</p>
        </div>
      )}

      {medications.length > 0 && (
        <div className="mb-4 bg-gray-50 p-3 rounded">
          <h3 className="font-semibold">Medications</h3>
          <ul className="list-disc pl-6">
            {medications.map((m, idx) => {
              const freq = m.dosageInstruction?.[0]?.timing?.repeat?.frequency || 1;
              const todayRecords = Array.isArray(m.takenRecords?.[today])
                ? m.takenRecords[today]
                : Array(freq).fill(false);

              return (
                <li key={idx} className="mb-2">
                  <p><strong>Name:</strong> {m.medicationCodeableConcept?.text || "Unknown"}</p>
                  <p><strong>Status:</strong> {m.status}</p>
                  <p><strong>Intent:</strong> {m.intent}</p>
                  <p><strong>Today Taken:</strong> {todayRecords.filter(v => v).length}/{freq}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {carePlans.length > 0 ? (
        carePlans.map((c, idx) => (
          <div key={idx} className="mb-2 p-2 bg-white rounded shadow">
            <p><strong>Category:</strong> {c.category?.[0]?.text || "N/A"}</p>
            <p><strong>Status:</strong> {c.status}</p>
            <p><strong>Period:</strong> 
              {c.period?.start ? new Date(c.period.start).toLocaleDateString() : "N/A"} - 
              {c.period?.end ? new Date(c.period.end).toLocaleDateString() : "Ongoing"}
            </p>
            {c.activity?.length > 0 && (
              <div className="ml-4 mt-2">
                <p><strong>Activities:</strong></p>
                <ul className="list-disc pl-6">
                  {c.activity.map((a, i) => (
                    <li key={i}>{a.detail?.description || "No description"}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No active Care Plans</p>
      )}

      {appointments.length > 0 && (
        <div className="mb-4 bg-purple-50 p-3 rounded">
          <h3 className="font-semibold">Appointments</h3>
          {appointments.map((a, idx) => (
            <p key={idx}>
              {a.start ? new Date(a.start).toLocaleString() : "Unknown"} — {a.description || "N/A"}
            </p>
          ))}
        </div>
      )}

      {risks.length > 0 && (
        <div className="mb-4 bg-red-50 p-3 rounded">
          <h3 className="font-semibold">Risks</h3>
          <ul className="list-disc pl-6">
            {risks.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mb-4 bg-pink-50 p-3 rounded">
          <h3 className="font-semibold">Reminders</h3>
          <ul className="list-disc pl-6">
            {reminders.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------- Patient View -------------------- */
function PatientView({ patient, doctor, medications, carePlans, appointments, reminders, today, onTakeMedication }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">👤 Patient View</h2>

      {patient && (
        <div className="mb-4 bg-blue-50 p-3 rounded">
          <h3 className="font-semibold">My Profile</h3>
          <p>Name: {formatHumanName(patient.name)}</p>
          <p>Age: {getAge(patient.birthDate)} years</p>
          <p>Gender: {patient.gender === "male" ? "Male" : "Female"}</p>
        </div>
      )}

      {doctor && (
        <div className="mb-4 bg-yellow-50 p-3 rounded">
          <h3 className="font-semibold">My Doctor</h3>
          <p>Name: {formatHumanName(doctor.name)}</p>
          <p>Phone: {doctor.telecom?.find(t => t.system === "phone")?.value || "N/A"}</p>
          <p>Email: {doctor.telecom?.find(t => t.system === "email")?.value || "N/A"}</p>
        </div>
      )}

      {medications.length > 0 && (
        <div className="mb-4 bg-green-50 p-3 rounded">
          <h3 className="text-xl font-semibold mb-2">💊 My Medications</h3>
          <ul className="space-y-2">
            {medications.map((m, idx) => {
              const freq = m.dosageInstruction?.[0]?.timing?.repeat?.frequency || 1;
              const todayRecords = Array.isArray(m.takenRecords?.[today])
                ? m.takenRecords[today]
                : Array(freq).fill(false);

              return (
                <li key={idx} className="bg-white p-3 rounded shadow-sm">
                  <p>Medication: {m.medicationCodeableConcept?.text || "Unknown"}</p>
                  <p>How to take: {m.dosageInstruction?.[0]?.text || "Follow doctor’s advice"}</p>
                  <p>Today Taken: {todayRecords.filter(v => v).length}/{freq}</p>
                  <div className="flex space-x-2 mt-2">
                    {todayRecords.map((taken, i) => (
                      <button
                        key={i}
                        onClick={() => onTakeMedication(idx, i, freq)}
                        disabled={taken}
                        className={`px-3 py-1 rounded ${taken ? "bg-gray-400" : "bg-green-600 text-white"}`}
                      >
                        {taken ? "✅" : `Dose ${i+1}`}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {carePlans.length > 0 ? (
        carePlans.map((c, idx) => (
          <div key={idx} className="mb-2 p-2 bg-white rounded shadow">
            <p><strong>Category:</strong> {c.category?.[0]?.text || "N/A"}</p>
            <p><strong>Status:</strong> {c.status}</p>
            <p><strong>Period:</strong> 
              {c.period?.start ? new Date(c.period.start).toLocaleDateString() : "N/A"} - 
              {c.period?.end ? new Date(c.period.end).toLocaleDateString() : "Ongoing"}
            </p>
            {c.activity?.length > 0 && (
              <div className="ml-4 mt-2">
                <p><strong>Activities:</strong></p>
                <ul className="list-disc pl-6">
                  {c.activity.map((a, i) => (
                    <li key={i}>{a.detail?.description || "No description"}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No active Care Plans</p>
      )}

      {appointments.length > 0 && (
        <div className="mb-4 bg-purple-50 p-3 rounded">
          <h3 className="font-semibold">📅 My Appointments</h3>
          {appointments.map((a, idx) => (
            <p key={idx}>
              {a.start ? new Date(a.start).toLocaleString() : "Unknown"} — {a.description || "Follow-up"}
            </p>
          ))}
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mb-4 bg-pink-50 p-3 rounded">
          <h3 className="font-semibold">🔔 Reminders</h3>
          <ul className="list-disc pl-6">
            {reminders.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------- Main App -------------------- */
export default function App() {
  const [role, setRole] = useState("doctor");
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [medications, setMedications] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [risks, setRisks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [err, setErr] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    FHIR.oauth2.ready().then(async (client) => {
      try {
        const p = await client.patient.read();
        setPatient(p);

        // --- 获取 General Practitioner ---
        if (p.generalPractitioner && p.generalPractitioner.length > 0) {
          const gpRef = p.generalPractitioner[0].reference;
          const gp = await client.request(gpRef);
          setDoctor(gp);
        } else {
          const encounters = await client.request(`Encounter?patient=${p.id}`);
          if (encounters.entry && encounters.entry.length > 0) {
            const practitionerRef = encounters.entry[0].resource?.participant?.[0]?.individual?.reference;
            if (practitionerRef) {
              const gp = await client.request(practitionerRef);
              setDoctor(gp);
            }
          }
        }

        const meds = await client.request(`MedicationRequest?patient=${p.id}`);
        let medList = meds.entry ? meds.entry.map(e => ({ ...e.resource, takenRecords: {} })) : [];
        setMedications(medList);

        // 生成用药提醒
        generateMedicationReminders(medList);

        const plans = await client.request(`CarePlan?patient=${p.id}`);
        if (plans.entry) {
          const activePlans = plans.entry
            .map(e => e.resource)
            .filter(c => c.status === "active");
          setCarePlans(activePlans);
        }

        const appts = await client.request(`Appointment?patient=${p.id}`);
        let apptList = appts.entry ? appts.entry.map(e => e.resource) : [];
        setAppointments(apptList);

        let detectedRisks = [];
        medList.forEach(m => {
          if (m.status === "stopped") {
            detectedRisks.push(`Medication ${m.medicationCodeableConcept?.text} was stopped`);
          }
        });
        setRisks(detectedRisks);

      } catch (e) {
        setErr(e);
      }
    });
  }, []);

  // handle medication taken
  const handleTakeMedication = (medIndex, doseIndex, freq) => {
    setMedications((prev) => {
      const newMeds = [...prev];
      const todayKey = today;
      if (!newMeds[medIndex].takenRecords) newMeds[medIndex].takenRecords = {};
      if (!Array.isArray(newMeds[medIndex].takenRecords[todayKey])) {
        newMeds[medIndex].takenRecords[todayKey] = Array(freq).fill(false);
      }
      newMeds[medIndex].takenRecords[todayKey][doseIndex] = true;
      return newMeds;
    });
  };

  // --- 新增：生成用药提醒 ---
  const generateMedicationReminders = (medList) => {
    let reminderList = [];
    medList.forEach(m => {
      const name = m.medicationCodeableConcept?.text || "Medication";
      const freq = m.dosageInstruction?.[0]?.timing?.repeat?.frequency || 1;

      if (freq === 1) {
        reminderList.push(`Take ${name} today at 12:00 PM`);
        scheduleReminder(`Time to take ${name}`, 12, 0);
      } else if (freq === 2) {
        reminderList.push(`Take ${name} at 8:00 AM`);
        reminderList.push(`Take ${name} at 8:00 PM`);
        scheduleReminder(`Time to take ${name}`, 8, 0);
        scheduleReminder(`Time to take ${name}`, 20, 0);
      } else if (freq >= 3) {
        reminderList.push(`Take ${name} at 8:00 AM, 12:00 PM, 8:00 PM`);
        scheduleReminder(`Time to take ${name}`, 8, 0);
        scheduleReminder(`Time to take ${name}`, 12, 0);
        scheduleReminder(`Time to take ${name}`, 20, 0);
      }
    });
    setReminders(reminderList);
  };

  // --- 新增：定时提醒函数 ---
  const scheduleReminder = (msg, hour, minute) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);

    const timeout = target.getTime() - now.getTime();
    setTimeout(() => {
      alert(msg);
    }, timeout);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Emergency Intervention System</h1>

      {/* Role Switch */}
      <div className="mb-6">
        <button
          onClick={() => setRole("doctor")}
          className={`px-4 py-2 mr-2 rounded ${role === "doctor" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Doctor View
        </button>
        <button
          onClick={() => setRole("patient")}
          className={`px-4 py-2 rounded ${role === "patient" ? "bg-green-600 text-white" : "bg-gray-200"}`}
        >
          Patient View
        </button>
      </div>

      {/* Content */}
      {err && <p className="text-red-600">Error: {String(err)}</p>}
      {role === "doctor" ? (
        <DoctorView
          patient={patient}
          doctor={doctor}
          medications={medications}
          carePlans={carePlans}
          appointments={appointments}
          risks={risks}
          reminders={reminders}
          today={today}
        />
      ) : (
        <PatientView
          patient={patient}
          doctor={doctor}
          medications={medications}
          carePlans={carePlans}
          appointments={appointments}
          reminders={reminders}
          today={today}
          onTakeMedication={handleTakeMedication}
        />
      )}
    </div>
  );
}
