
import React, { useState, useEffect } from "react";
import { createMedicationStatement } from "../fhir";

interface Props {
  patient: any;
  meds: any[];
  practitionerRef?: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

interface SlotState {
  locked: boolean;
  message: string;
  confirming: boolean;
  pendingAction: "taken" | "missed" | null;
}

/**
 * Enhanced AM/PM calendar with:
 * - Confirmation dialog before locking
 * - Independent slot states
 * - Persistent lock state
 * - MedicationStatement creation with practitioner notification
 */
const MedicationCalendar: React.FC<Props> = ({ patient, meds, practitionerRef, riskLevel }) => {
  const [amState, setAmState] = useState<SlotState>({
    locked: false,
    message: "",
    confirming: false,
    pendingAction: null
  });

  const [pmState, setPmState] = useState<SlotState>({
    locked: false,
    message: "",
    confirming: false,
    pendingAction: null
  });

  const [existingAppointment, setExistingAppointment] = useState<any>(null);

  // Load existing appointments on mount
  useEffect(() => {
    (async () => {
      try {
        const { getClient } = await import("../fhir");
        const client = await getClient();
        const nowISO = new Date().toISOString();
        const appointments = await client
          .request(
            `Appointment?participant=Patient/${patient.id}&date=ge${nowISO}&_sort=start&_count=1`,
            { flat: true }
          )
          .catch(() => []) as any[];

        if (appointments.length > 0) {
          setExistingAppointment(appointments[0]);
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
      }
    })();
  }, [patient.id]);

  const medName = meds?.[0]?.medicationCodeableConcept?.text
    || meds?.[0]?.medicationCodeableConcept?.coding?.[0]?.display
    || "Medication";

  // Handle initial action selection
  async function handleAction(slot: "AM" | "PM", action: "taken" | "missed") {
    if (slot === "AM") {
      setAmState(prev => ({
        ...prev,
        confirming: true,
        pendingAction: action
      }));
    } else {
      setPmState(prev => ({
        ...prev,
        confirming: true,
        pendingAction: action
      }));
    }
  }

  // Handle confirmation
  async function confirmDose(slot: "AM" | "PM", confirm: boolean) {
    const state = slot === "AM" ? amState : pmState;
    const setState = slot === "AM" ? setAmState : setPmState;

    if (!confirm || !state.pendingAction) {
      setState(prev => ({
        ...prev,
        confirming: false,
        pendingAction: null
      }));
      return;
    }

    const taken = state.pendingAction === "taken";
    const base = new Date();
    base.setMinutes(0, 0, 0);
    if (slot === "AM") base.setHours(8);
    else base.setHours(20);
    const iso = base.toISOString();

    try {
      await createMedicationStatement(
        patient,
        medName,
        taken,
        iso,
        slot,
        practitionerRef
      );

      setState({
        locked: true,
        message: taken ? "✓ Recorded as taken." : "✗ Recorded as missed.",
        confirming: false,
        pendingAction: null
      });
    } catch (err) {
      console.error("Error recording medication:", err);
      setState(prev => ({
        ...prev,
        message: "Error recording. Please try again.",
        confirming: false,
        pendingAction: null
      }));
    }
  }

  return (
    <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginTop: 12 }}>
      <h3>Medication Calendar (Today)</h3>

      {/* Show existing appointment if any */}
      {existingAppointment && (
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: 8,
          borderRadius: 6,
          marginBottom: 12,
          fontSize: 14
        }}>
          <strong>📅 Upcoming Appointment:</strong> {existingAppointment.description || "Follow-up"}
          <br />
          <span style={{ fontSize: 12, color: "#666" }}>
            {new Date(existingAppointment.start).toLocaleString()}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* AM slot */}
        <div style={{
          border: "1px solid #ddd",
          padding: 8,
          borderRadius: 6,
          backgroundColor: amState.locked ? "#f0f0f0" : "white"
        }}>
          <div style={{ fontWeight: 600 }}>08:00 AM</div>
          <div>{medName}</div>

          {!amState.locked && !amState.confirming && (
            <div style={{ marginTop: 6 }}>
              <button onClick={() => handleAction("AM", "taken")}>Taken</button>{" "}
              <button onClick={() => handleAction("AM", "missed")}>Missed</button>
            </div>
          )}

          {amState.confirming && (
            <div style={{ marginTop: 6, padding: 8, backgroundColor: "#fff3cd", borderRadius: 4 }}>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>
                Confirm: {amState.pendingAction === "taken" ? "Medication taken?" : "Medication missed?"}
              </div>
              <button
                onClick={() => confirmDose("AM", true)}
                style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}
              >
                Yes, Confirm
              </button>{" "}
              <button
                onClick={() => confirmDose("AM", false)}
                style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}
              >
                Cancel
              </button>
            </div>
          )}

          {amState.message && (
            <div style={{
              marginTop: 6,
              color: amState.message.includes("✓") ? "#28a745" : "#dc3545",
              fontWeight: 500
            }}>
              {amState.message}
            </div>
          )}
        </div>

        {/* PM slot */}
        <div style={{
          border: "1px solid #ddd",
          padding: 8,
          borderRadius: 6,
          backgroundColor: pmState.locked ? "#f0f0f0" : "white"
        }}>
          <div style={{ fontWeight: 600 }}>08:00 PM</div>
          <div>{medName}</div>

          {!pmState.locked && !pmState.confirming && (
            <div style={{ marginTop: 6 }}>
              <button onClick={() => handleAction("PM", "taken")}>Taken</button>{" "}
              <button onClick={() => handleAction("PM", "missed")}>Missed</button>
            </div>
          )}

          {pmState.confirming && (
            <div style={{ marginTop: 6, padding: 8, backgroundColor: "#fff3cd", borderRadius: 4 }}>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>
                Confirm: {pmState.pendingAction === "taken" ? "Medication taken?" : "Medication missed?"}
              </div>
              <button
                onClick={() => confirmDose("PM", true)}
                style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}
              >
                Yes, Confirm
              </button>{" "}
              <button
                onClick={() => confirmDose("PM", false)}
                style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}
              >
                Cancel
              </button>
            </div>
          )}

          {pmState.message && (
            <div style={{
              marginTop: 6,
              color: pmState.message.includes("✓") ? "#28a745" : "#dc3545",
              fontWeight: 500
            }}>
              {pmState.message}
            </div>
          )}
        </div>
      </div>

      {/* Risk-based reminder */}
      {riskLevel === "HIGH" && (
        <div style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: "#ffebee",
          borderRadius: 4,
          fontSize: 12
        }}>
          <strong>⚠️ High Risk Alert:</strong> Medication adherence is critical for your health.
          Please ensure you take medications as prescribed.
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
        * Once confirmed, selections cannot be changed. Your healthcare provider will be notified.
      </div>
    </div>
  );
};

export default MedicationCalendar;
