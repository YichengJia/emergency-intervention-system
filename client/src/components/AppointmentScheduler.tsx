// client/src/components/AppointmentScheduler.tsx
import React, { useState } from "react";

type Props = {
  onCreate: (title: string, startIso: string) => Promise<void>;
};

const APPOINTMENT_TEMPLATES: Record<
  string,
  { icon: string; defaultDays: number; recommendedTimeframe: string; duration: number; description: string; priority: "normal" | "high" }
> = {
  "Primary Care Follow-up": {
    icon: "👨‍⚕️",
    defaultDays: 5,
    recommendedTimeframe: "3-7 days",
    duration: 30,
    description: "General health check and medication review",
    priority: "high",
  },
  "Specialist Consultation": {
    icon: "🏥",
    defaultDays: 10,
    recommendedTimeframe: "1-2 weeks",
    duration: 30,
    description: "Specialist evaluation",
    priority: "normal",
  },
  "Medication Review": {
    icon: "💊",
    defaultDays: 3,
    recommendedTimeframe: "2-5 days",
    duration: 30,
    description: "Pharmacist or clinician medication review",
    priority: "high",
  },
  "Lab Work": {
    icon: "🔬",
    defaultDays: 7,
    recommendedTimeframe: "5-10 days",
    duration: 20,
    description: "Blood tests or other labs",
    priority: "normal",
  },
  "Telehealth Check-in": {
    icon: "💻",
    defaultDays: 2,
    recommendedTimeframe: "1-3 days",
    duration: 20,
    description: "Virtual follow-up",
    priority: "high",
  },
  "Mental Health": {
    icon: "🧠",
    defaultDays: 3,
    recommendedTimeframe: "1-5 days",
    duration: 50,
    description: "Psychiatric or counseling follow-up",
    priority: "high",
  },
};

const AppointmentScheduler: React.FC<Props> = ({ onCreate }) => {
  const [title, setTitle] = useState<string>("Primary Care Follow-up");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("09:00");
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState("");

  function todayPlus(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  React.useEffect(() => {
    // default date suggestion by template
    setDate(todayPlus(APPOINTMENT_TEMPLATES[title].defaultDays));
  }, [title]);

  async function schedule() {
    const startIso = new Date(`${date}T${time}:00`).toISOString();
    await onCreate(title, startIso);
    setLocked(true);
    setMsg("An appointment already exists, cannot create a new one.");
  }

  return (
    <div>
      <h3>Schedule Follow-up Appointment</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>Type:</label>
        <select disabled={locked} value={title} onChange={(e) => setTitle(e.target.value)}>
          {Object.keys(APPOINTMENT_TEMPLATES).map((k) => (
            <option key={k} value={k}>
              {APPOINTMENT_TEMPLATES[k].icon} {k}
            </option>
          ))}
        </select>
        <label>Date:</label>
        <input disabled={locked} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label>Time:</label>
        <input disabled={locked} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <button disabled={locked || !date} onClick={schedule}>
          Schedule Appointment
        </button>
      </div>
      <div style={{ marginTop: 6, color: "#2f6" }}>{msg}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        ⏱️ Duration: {APPOINTMENT_TEMPLATES[title].duration} minutes · 📅 Recommended:{" "}
        {APPOINTMENT_TEMPLATES[title].recommendedTimeframe}
      </div>
    </div>
  );
};

export default AppointmentScheduler;
