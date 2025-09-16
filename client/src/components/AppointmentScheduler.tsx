// client/src/components/AppointmentScheduler.tsx
// Smart appointment scheduling system for follow-up care coordination

import React, { useState, useMemo } from "react";

interface Props {
  onCreate: (title: string, startIso: string) => Promise<void>;
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
  },
  "Imaging Study": {
    icon: "📷",
    defaultDays: 10,
    recommendedTimeframe: "1-2 weeks",
    duration: 60,
    description: "X-ray, CT, MRI, or ultrasound",
    priority: "medium",
    preparations: [
      "Wear comfortable clothing",
      "Remove metal objects",
      "Arrive 15 minutes early",
      "Bring prior imaging if available"
    ]
  },
  "Telehealth Check-in": {
    icon: "💻",
    defaultDays: 2,
    recommendedTimeframe: "1-3 days",
    duration: 15,
    description: "Virtual follow-up visit",
    priority: "high",
    preparations: [
      "Test video connection",
      "Find quiet, private space",
      "Have medications ready to show",
      "Prepare list of questions"
    ]
  },
  "Physical Therapy": {
    icon: "🏃",
    defaultDays: 5,
    recommendedTimeframe: "3-7 days",
    duration: 60,
    description: "Initial PT evaluation and treatment",
    priority: "medium",
    preparations: [
      "Wear comfortable clothes",
      "Bring prescription/referral",
      "List movement limitations",
      "Pain diary if applicable"
    ]
  },
  "Mental Health": {
    icon: "🧠",
    defaultDays: 3,
    recommendedTimeframe: "1-5 days",
    duration: 50,
    description: "Psychiatric or counseling appointment",
    priority: "high",
    preparations: [
      "List of current medications",
      "Mood/symptom diary",
      "Emergency contacts",
      "Insurance information"
    ]
  }
};

// Time slots for appointments
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

const AppointmentScheduler: React.FC<Props> = ({ onCreate }) => {
  const [appointmentType, setAppointmentType] = useState("Primary Care Follow-up");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [reminderPreference, setReminderPreference] = useState({
    email: true,
    sms: true,
    phone: false
  });
  const [transportationNeeded, setTransportationNeeded] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreparations, setShowPreparations] = useState(false);

  // Calculate recommended date based on appointment type
  const recommendedDate = useMemo(() => {
    const template = APPOINTMENT_TEMPLATES[appointmentType as keyof typeof APPOINTMENT_TEMPLATES];
    if (!template) return "";

    const date = new Date();
    date.setDate(date.getDate() + template.defaultDays);

    // Skip weekends
    if (date.getDay() === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
    if (date.getDay() === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday

    return date.toISOString().split('T')[0];
  }, [appointmentType]);

  // Get minimum and maximum dates for scheduling
  const getDateConstraints = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1); // Tomorrow minimum

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60); // 60 days maximum

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  const { min: minDate, max: maxDate } = getDateConstraints();

  // Check if selected date is urgent (within 3 days)
  const isUrgentAppointment = useMemo(() => {
    if (!selectedDate) return false;
    const daysDiff = Math.ceil((new Date(selectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3;
  }, [selectedDate]);

  const handleScheduleAppointment = async () => {
    if (!selectedDate) {
      setMessage("Please select a date for the appointment");
      return;
    }

    if (!selectedTime) {
      setMessage("Please select a time for the appointment");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const title = customTitle || appointmentType;
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      await onCreate(title, startDateTime);

      setMessage(`✅ ${title} scheduled for ${new Date(startDateTime).toLocaleString()}`);

      // Reset form after success
      setTimeout(() => {
        setCustomTitle("");
        setSelectedDate("");
        setNotes("");
        setMessage("");
      }, 5000);

    } catch (error: any) {
      setMessage(`❌ Error: ${error?.message || "Failed to schedule appointment"}`);
    } finally {
      setBusy(false);
    }
  };

  const template = APPOINTMENT_TEMPLATES[appointmentType as keyof typeof APPOINTMENT_TEMPLATES];

  return (
    <div style={{
      border: "1px solid #9C27B0",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#faf5fb"
    }}>
      {/* Header */}
      <h3 style={{ margin: "0 0 16px 0", color: "#6A1B9A" }}>
        📅 Schedule Follow-up Appointment
      </h3>

      {/* Urgency Alert */}
      {isUrgentAppointment && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: 4,
          padding: 10,
          marginBottom: 16,
          fontSize: 13
        }}>
          ⚡ <strong>Urgent Appointment:</strong> This appointment is within 3 days.
          Consider calling the office directly to ensure availability.
        </div>
      )}

      {/* Appointment Type Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Select Appointment Type:
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 8
        }}>
          {Object.entries(APPOINTMENT_TEMPLATES).map(([type, info]) => (
            <div
              key={type}
              onClick={() => setAppointmentType(type)}
              style={{
                padding: 10,
                border: `2px solid ${appointmentType === type ? "#9C27B0" : "#e0e0e0"}`,
                borderRadius: 6,
                cursor: "pointer",
                backgroundColor: appointmentType === type ? "#f3e5f5" : "white",
                transition: "all 0.2s",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{info.icon}</div>
              <div style={{
                fontSize: 12,
                fontWeight: appointmentType === type ? "bold" : "normal",
                color: appointmentType === type ? "#6A1B9A" : "#333"
              }}>
                {type}
              </div>
              <div style={{
                fontSize: 10,
                color: "#666",
                marginTop: 2
              }}>
                {info.recommendedTimeframe}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Appointment Details */}
      {template && (
        <div style={{
          backgroundColor: "white",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #ce93d8"
        }}>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: "#6A1B9A" }}>{template.icon} {appointmentType}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
            {template.description}
          </div>
          <div style={{
            display: "flex",
            gap: 16,
            fontSize: 12,
            color: "#333"
          }}>
            <span>⏱️ Duration: {template.duration} minutes</span>
            <span>📊 Priority: {template.priority}</span>
            <span>📅 Schedule within: {template.recommendedTimeframe}</span>
          </div>
        </div>
      )}

      {/* Custom Title (Optional) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontSize: 14
        }}>
          Custom Appointment Title (Optional):
        </label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={`e.g., "${appointmentType} with Dr. Smith"`}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: 13
          }}
        />
      </div>

      {/* Date and Time Selection */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 16
      }}>
        <div>
          <label style={{
            display: "block",
            marginBottom: 6,
            fontSize: 14,
            fontWeight: "bold"
          }}>
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            max={maxDate}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ddd",
              fontSize: 13
            }}
          />
          {recommendedDate && !selectedDate && (
            <button
              onClick={() => setSelectedDate(recommendedDate)}
              style={{
                marginTop: 6,
                padding: "4px 8px",
                backgroundColor: "#f3e5f5",
                border: "1px solid #ce93d8",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11
              }}
            >
              Use recommended date ({new Date(recommendedDate).toLocaleDateString()})
            </button>
          )}
        </div>

        <div>
          <label style={{
            display: "block",
            marginBottom: 6,
            fontSize: 14,
            fontWeight: "bold"
          }}>
            Select Time:
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ddd",
              fontSize: 13
            }}
          >
            <optgroup label="Morning">
              {TIME_SLOTS.filter(t => parseInt(t) < 12).map(time => (
                <option key={time} value={time}>
                  {time.replace(/(\d{2}):(\d{2})/, (_, h, m) => {
                    const hour = parseInt(h);
                    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
                  })}
                </option>
              ))}
            </optgroup>
            <optgroup label="Afternoon">
              {TIME_SLOTS.filter(t => parseInt(t) >= 12).map(time => (
                <option key={time} value={time}>
                  {time.replace(/(\d{2}):(\d{2})/, (_, h, m) => {
                    const hour = parseInt(h);
                    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
                  })}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Transportation Needs */}
      <div style={{
        backgroundColor: "#fff9c4",
        padding: 10,
        borderRadius: 6,
        marginBottom: 16,
        border: "1px solid #fbc02d"
      }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={transportationNeeded}
            onChange={(e) => setTransportationNeeded(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <span>
            🚗 <strong>I need transportation assistance</strong>
          </span>
        </label>
        {transportationNeeded && (
          <div style={{
            marginTop: 8,
            marginLeft: 24,
            fontSize: 12,
            color: "#666"
          }}>
            Transportation services will be arranged. You will receive a call 24 hours before your appointment.
          </div>
        )}
      </div>

      {/* Reminder Preferences */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Reminder Preferences:
        </label>
        <div style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap"
        }}>
          {Object.entries(reminderPreference).map(([method, enabled]) => (
            <label key={method} style={{
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setReminderPreference(prev => ({
                  ...prev,
                  [method]: e.target.checked
                }))}
                style={{ marginRight: 6 }}
              />
              <span style={{ textTransform: "capitalize" }}>
                {method === "sms" ? "📱 Text Message" :
                 method === "email" ? "📧 Email" :
                 "☎️ Phone Call"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Preparation Checklist */}
      {template && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowPreparations(!showPreparations)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e1bee7",
              border: "1px solid #ba68c8",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13
            }}
          >
            📋 {showPreparations ? "Hide" : "Show"} Preparation Checklist
          </button>

          {showPreparations && (
            <div style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: "#f3e5f5",
              borderRadius: 4,
              border: "1px solid #ce93d8"
            }}>
              <strong style={{ fontSize: 13, color: "#6A1B9A" }}>
                What to bring/prepare:
              </strong>
              <ul style={{
                margin: "8px 0 0 20px",
                padding: 0,
                fontSize: 12
              }}>
                {template.preparations.map((prep, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {prep}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Additional Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontSize: 14
        }}>
          Additional Notes or Special Requests:
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special accommodations needed, specific concerns to discuss, etc."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: 13,
            minHeight: 60
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center"
      }}>
        <button
          onClick={handleScheduleAppointment}
          disabled={busy || !selectedDate || !selectedTime}
          style={{
            padding: "10px 20px",
            backgroundColor: selectedDate && selectedTime ? "#9C27B0" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: selectedDate && selectedTime ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: "bold"
          }}
        >
          {busy ? "Scheduling..." : "Schedule Appointment"}
        </button>

        {selectedDate && selectedTime && (
          <span style={{ fontSize: 12, color: "#666" }}>
            📅 {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: message.includes("Error") || message.includes("❌") ? "#ffebee" : "#e8f5e9",
          borderRadius: 4,
          color: message.includes("Error") || message.includes("❌") ? "#c62828" : "#2e7d32",
          fontSize: 13
        }}>
          {message}
        </div>
      )}

      {/* Important Reminders */}
      <div style={{
        marginTop: 16,
        padding: 10,
        backgroundColor: "#e8eaf6",
        borderRadius: 4,
        border: "1px solid #9fa8da",
        fontSize: 11
      }}>
        <strong>Important Reminders:</strong>
        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
          <li>Arrive 15 minutes early for paperwork</li>
          <li>Bring insurance cards and photo ID</li>
          <li>Cancel 24 hours in advance if needed</li>
          <li>Call 911 for any emergency symptoms</li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
        padding: "8px 0",
        borderTop: "1px solid #e0e0e0"
      }}>
        Timely follow-up appointments are crucial for preventing emergency department returns.
        Keep all scheduled appointments and contact your provider with any concerns.
      </div>
    </div>
  );
};

export default AppointmentScheduler;