// client/src/components/AppointmentScheduler.tsx
// Smart appointment scheduling system for follow-up care coordination

import React, { useState, useEffect, useMemo } from "react";

interface Props {
  onCreate: (title: string, startIso: string) => Promise<void>;
  patient?: any; // Add patient prop to check existing appointments
}

// Evidence-based follow-up timing recommendations
const APPOINTMENT_TEMPLATES = {
  "Primary Care Follow-up": {
    icon: "👨‍⚕️",
    defaultDays: 7,
    recommendedTimeframe: "3-7 days",
    duration: 30,
    description: "General health check and medication review",
    priority: "high",
    preparations: [
      "Bring all current medications",
      "List of symptoms or concerns",
      "Recent test results",
      "Insurance cards"
    ]
  },
  "Specialist Consultation": {
    icon: "🏥",
    defaultDays: 14,
    recommendedTimeframe: "1-2 weeks",
    duration: 45,
    description: "Detailed evaluation by specialist",
    priority: "medium",
    preparations: [
      "Medical records from ED visit",
      "List of current medications",
      "Previous test results",
      "Referral letter if available"
    ]
  },
  "Medication Review": {
    icon: "💊",
    defaultDays: 3,
    recommendedTimeframe: "2-5 days",
    duration: 20,
    description: "Pharmacy consultation for medication optimization",
    priority: "high",
    preparations: [
      "All current medications",
      "List of allergies",
      "Insurance information",
      "Questions about medications"
    ]
  },
  "Lab Work": {
    icon: "🔬",
    defaultDays: 7,
    recommendedTimeframe: "5-10 days",
    duration: 15,
    description: "Blood tests and other laboratory work",
    priority: "medium",
    preparations: [
      "Fast if required",
      "Insurance card",
      "Lab orders from provider",
      "Previous lab results"
    ]
  }
};

// Time slots for appointments
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

const AppointmentScheduler: React.FC<Props> = ({ onCreate, patient }) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState("");
  const [existingAppointment, setExistingAppointment] = useState<any>(null);
  const [hasAppointmentLimit, setHasAppointmentLimit] = useState(false);

  // Check for existing appointments
  useEffect(() => {
    if (!patient?.id) return;

    (async () => {
      try {
        const { getClient } = await import("../fhir");
        const client = await getClient();
        const nowISO = new Date().toISOString();

        const appointments = await client
          .request(
            `Appointment?participant=Patient/${patient.id}&date=ge${nowISO}&_sort=start&_count=5`,
            { flat: true }
          )
          .catch(() => []) as any[];

        if (appointments.length > 0) {
          setExistingAppointment(appointments[0]);
          setHasAppointmentLimit(true);
          setMessage("You already have an upcoming appointment. Please cancel it first to schedule a new one.");
        }
      } catch (err) {
        console.error("Error checking appointments:", err);
      }
    })();
  }, [patient]);

  // Calculate minimum date (tomorrow)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Calculate default date based on selected type
  useEffect(() => {
    if (selectedType && APPOINTMENT_TEMPLATES[selectedType as keyof typeof APPOINTMENT_TEMPLATES]) {
      const template = APPOINTMENT_TEMPLATES[selectedType as keyof typeof APPOINTMENT_TEMPLATES];
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + template.defaultDays);
      setSelectedDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [selectedType]);

  const handleSchedule = async () => {
    if (!selectedType || !selectedDate || !selectedTime) {
      setMessage("Please select appointment type, date, and time.");
      return;
    }

    if (hasAppointmentLimit) {
      setMessage("You already have an appointment scheduled. Please contact your provider to reschedule.");
      return;
    }

    setIsScheduling(true);
    setMessage("");

    try {
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      const description = `${selectedType}${additionalNotes ? ` - ${additionalNotes}` : ""}`;

      await onCreate(description, startDateTime);

      setMessage("✅ Appointment scheduled successfully! You will receive a confirmation.");
      setSelectedType("");
      setSelectedDate("");
      setSelectedTime("09:00");
      setAdditionalNotes("");
      setHasAppointmentLimit(true);

      // Refresh appointment status
      // removed full page reload; rely on polling or parent state to refresh
    } catch (error: any) {
      if (error.message?.includes("already has a future appointment")) {
        setMessage("⚠️ You already have an appointment scheduled. Please contact your provider to reschedule.");
        setHasAppointmentLimit(true);
      } else {
        setMessage(`❌ Error scheduling appointment: ${error.message || "Please try again."}`);
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const template = selectedType ?
    APPOINTMENT_TEMPLATES[selectedType as keyof typeof APPOINTMENT_TEMPLATES] : null;

  return (
    <div style={{
      border: "1px solid #2196F3",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#f8f9fa"
    }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#1976D2" }}>
        📅 Schedule Follow-up Appointment
      </h3>

      {/* Display existing appointment if any */}
      {existingAppointment && (
        <div style={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #90caf9",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16
        }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#1565c0" }}>
            ✓ You have an upcoming appointment:
          </h4>
          <div style={{ fontSize: 14 }}>
            <strong>{existingAppointment.description || "Follow-up Appointment"}</strong>
            <br />
            <span style={{ color: "#666" }}>
              📍 Date & Time: {new Date(existingAppointment.start).toLocaleString()}
            </span>
            <br />
            <span style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>
              Duration: {existingAppointment.end ?
                Math.round((new Date(existingAppointment.end).getTime() -
                new Date(existingAppointment.start).getTime()) / 60000) + " minutes"
                : "30 minutes"}
            </span>
          </div>
          <div style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: "#fff3cd",
            borderRadius: 4,
            fontSize: 12
          }}>
            <strong>Note:</strong> To schedule a different appointment, please contact your healthcare provider
            or cancel this appointment first.
          </div>
        </div>
      )}

      {/* Appointment type selection */}
      {!hasAppointmentLimit && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Appointment Type *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ddd"
              }}
              disabled={isScheduling}
            >
              <option value="">Select appointment type...</option>
              {Object.entries(APPOINTMENT_TEMPLATES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {key} (Recommended: {value.recommendedTimeframe})
                </option>
              ))}
            </select>
          </div>

          {/* Template details */}
          {template && (
            <div style={{
              backgroundColor: "#e8f5e9",
              padding: 12,
              borderRadius: 6,
              marginBottom: 12
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{template.icon} {selectedType}</strong>
              </div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
                {template.description}
              </div>
              <div style={{ fontSize: 12 }}>
                <strong>Please bring:</strong>
                <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                  {template.preparations.map((prep, idx) => (
                    <li key={idx}>{prep}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Date and time selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ddd"
                }}
                disabled={isScheduling || !selectedType}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Time *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ddd"
                }}
                disabled={isScheduling || !selectedType}
              >
                <option value="09:00">9:00 AM</option>
                <option value="09:30">9:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="16:30">4:30 PM</option>
              </select>
            </div>
          </div>

          {/* Additional notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific concerns or requirements..."
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ddd",
                minHeight: 60
              }}
              disabled={isScheduling}
            />
          </div>

          {/* Schedule button */}
          <button
            onClick={handleSchedule}
            disabled={isScheduling || !selectedType || !selectedDate || !selectedTime}
            style={{
              backgroundColor: isScheduling || !selectedType ? "#ccc" : "#4CAF50",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: 4,
              fontSize: 16,
              cursor: isScheduling || !selectedType ? "not-allowed" : "pointer",
              width: "100%"
            }}
          >
            {isScheduling ? "Scheduling..." : "Schedule Appointment"}
          </button>
        </>
      )}

      {/* Status message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: message.includes("✅") ? "#d4edda" :
                          message.includes("⚠️") ? "#fff3cd" : "#f8d7da",
          color: message.includes("✅") ? "#155724" :
                message.includes("⚠️") ? "#856404" : "#721c24",
          borderRadius: 4,
          fontSize: 14
        }}>
          {message}
        </div>
      )}

      {/* Important notice */}
      <div style={{
        marginTop: 12,
        padding: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 4,
        fontSize: 11,
        color: "#666"
      }}>
        <strong>Important:</strong> This schedules a follow-up appointment with your healthcare provider.
        You can only have one appointment at a time. For urgent medical needs, please call 911 or visit your nearest emergency department.
      </div>
    </div>
  );
};

export default AppointmentScheduler;