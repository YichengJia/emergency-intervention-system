// Core FHIR service for managing patient data and interventions
// Notes:
// - Uses SMART on FHIR via `fhirclient`
// - Adds optional clinician notifications (Communication) after key writes
// - Provides list* helpers so clinician UI can fetch CarePlan/ServiceRequest/etc.

import * as FHIR from "fhirclient";
import Client from "fhirclient/lib/Client";

// SMART on FHIR Authorization
export async function smartAuthorize(): Promise<void> {
  await FHIR.oauth2.authorize({
    clientId: import.meta.env.VITE_SMART_CLIENT_ID || "emergency-intervention-system",
    scope: "launch/patient patient/*.read patient/*.write openid fhirUser offline_access",
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin + "/",
    iss: import.meta.env.VITE_FHIR_ISS || "https://launch.smarthealthit.org/v/r4/sim/eyJrIjoiMSIsImoiOiIxIn0/fhir"
  });
}

// Get authenticated FHIR client
export async function getClient(): Promise<Client> {
  return await (FHIR as any).oauth2.ready();
}

// Get user information from token
export async function getUserInfo(client: Client): Promise<any> {
  try {
    const token = (client as any).state.tokenResponse;
    if (token?.id_token) {
      // Parse JWT to get user info
      const payload = JSON.parse(atob(token.id_token.split(".")[1]));
      if (payload.profile) {
        return await client.request(payload.profile);
      }
    }
    // Fallback to user endpoint
    return await (client as any).user.read();
  } catch {
    return null;
  }
}

// Get current patient
export async function getPatient(client: Client): Promise<any> {
  return await (client as any).patient.read();
}

// Get patient encounters with focus on ED visits
export async function getEncounters(client: Client, patientId: string): Promise<any[]> {
  try {
    const response = await client.request(
      `Encounter?patient=${patientId}&_sort=-date&_count=100`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// Get patient conditions for risk assessment
export async function getConditions(client: Client, patientId: string): Promise<any[]> {
  try {
    const response = await client.request(
      `Condition?patient=${patientId}&clinical-status=active,recurrence,remission`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// Get medication requests
export async function getMedicationRequests(client: Client, patientId: string): Promise<any[]> {
  try {
    const response = await client.request(
      `MedicationRequest?patient=${patientId}&status=active,completed&_sort=-authoredon&_count=50`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// Calculate risk level based on ED visits, chronic conditions, and medications
export function riskFromFactors(
  edVisitsLast12m: number,
  chronicConditions: string[],
  hasOpioidMeds: boolean
): "LOW" | "MODERATE" | "HIGH" {
  let score = 0;
  if (edVisitsLast12m >= 8) score += 4;
  else if (edVisitsLast12m >= 4) score += 3;
  else if (edVisitsLast12m >= 2) score += 1;

  if (chronicConditions.length >= 3) score += 2;
  else if (chronicConditions.length >= 2) score += 1;

  if (hasOpioidMeds) score += 1;

  if (score >= 5) return "HIGH";
  if (score >= 2) return "MODERATE";
  return "LOW";
}

// ----- Write helpers (optionally notify clinician via Communication) -----

// Notify clinician (no invalid 'high' priority)
export async function createCommunicationToPractitioner(
  patient: any,
  message: string,
  practitionerRef: string
): Promise<any> {
  const client = await getClient();

  const communication = {
    resourceType: "Communication",
    status: "completed",
    // priority can be "routine" | "urgent" | "asap" | "stat"
    // omit if you don't need it to avoid server rejections
    // priority: "urgent",
    category: [{
      coding: [{
        system: "https://terminology.hl7.org/CodeSystem/communication-category",
        code: "alert",
        display: "Alert"
      }]
    }],
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    recipient: [{ reference: practitionerRef }],
    payload: [{ contentString: message }],
    sent: new Date().toISOString()
  };

  return await client.create(communication);
}

// Create the care plan for follow-up interventions
export async function createCarePlan(
  client: Client,
  patient: any,
  description: string,
  practitionerRef?: string
): Promise<any> {
  const carePlan = {
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    period: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    },
    description,
    category: [{
      coding: [{
        system: "https://hl7.org/fhir/us/core/CodeSystem/careplan-category",
        code: "assess-plan",
        display: "Assessment and Plan of Treatment"
      }]
    }],
    activity: [{
      detail: {
        kind: "Task",
        code: {
          coding: [{
            system: "https://snomed.info/sct",
            code: "385864009",
            display: "Medication review"
          }]
        },
        status: "scheduled",
        description: "Review medication adherence and optimize therapy"
      }
    }]
  };

  const res = await client.create(carePlan);
  // Optional clinician notification
  if (practitionerRef) {
    await createCommunicationToPractitioner(
      patient,
      `CarePlan created: "${description}"`,
      practitionerRef
    );
  }
  return res;
}

// Create service request (referral)
export async function createServiceRequest(
  client: Client,
  patient: any,
  specialty: string,
  practitionerRef?: string
): Promise<any> {
  const serviceRequest = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    priority: "routine",
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    code: {
      coding: [{
        system: "https://snomed.info/sct",
        code: specialty === "GP" ? "103696004" : "183524004",
        display: specialty === "GP" ? "Primary care referral" : "Specialist referral"
      }],
      text: `Referral to ${specialty}`
    },
    authoredOn: new Date().toISOString(),
    reasonCode: [{ text: "Reduce emergency department utilization through coordinated care" }]
  };

  const res = await client.create(serviceRequest);
  if (practitionerRef) {
    await createCommunicationToPractitioner(
      patient,
      `Referral to ${specialty} created`,
      practitionerRef
    );
  }
  return res;
}

// Create communication to patient for education
export async function createCommunicationToPatient(
  client: Client,
  patient: any,
  message: string
): Promise<any> {
  const communication = {
    resourceType: "Communication",
    status: "completed",
    category: [{
      coding: [{
        system: "https://terminology.hl7.org/CodeSystem/communication-category",
        code: "instruction",
        display: "Instruction"
      }]
    }],
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    recipient: [{
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    }],
    payload: [{ contentString: message }],
    sent: new Date().toISOString()
  };

  return await client.create(communication);
}

// Create medication statement for adherence tracking
export async function createMedicationStatement(
  patient: any,
  medicationText: string,
  taken: boolean,
  timestamp: string,
  practitionerRef?: string
): Promise<any> {
  const client = await getClient();

  const statement = {
    resourceType: "MedicationStatement",
    status: taken ? "active" : "on-hold",
    medicationCodeableConcept: { text: medicationText },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    dateAsserted: timestamp,
    note: [{ text: taken ? "Medication taken as prescribed" : "Medication dose missed" }]
  };

  const res = await client.create(statement);

  // Optional clinician notification
  if (practitionerRef) {
    await createCommunicationToPractitioner(
      patient,
      `${taken ? "Took" : "Missed"} ${medicationText} @ ${timestamp}`,
      practitionerRef
    );
  }
  return res;
}

// Create communication to practitioner for alerts (already defined above)

// List communications for practitioner inbox
export async function listMyCommunications(practitionerRef: string): Promise<any[]> {
  const client = await getClient();
  try {
    const response = await client.request(
      `Communication?recipient=${practitionerRef}&_sort=-sent&_count=50`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// Get patients on practitioner's panel
export async function listPanelPatients(practitionerId: string): Promise<any[]> {
  const client = await getClient();

  try {
    // Use CareTeam or List resource to manage panels
    const response = await client.request(
      `CareTeam?participant=${practitionerId}&status=active`,
      { flat: true }
    );

    // Extract unique patients from care teams
    const patientRefs = new Set<string>();
    for (const team of (response as any[]) || []) {
      if (team.subject?.reference) {
        patientRefs.add(team.subject.reference);
      }
    }

    // Fetch patient details
    const patients: any[] = [];
    for (const ref of patientRefs) {
      try {
        const patient = await client.request(ref);
        patients.push(patient);
      } catch {
        // Skip if patient not accessible
      }
    }

    return patients;
  } catch {
    return [];
  }
}

// Add patient to practitioner's panel
export async function addPatientToPanel(practitionerId: string, patientId: string): Promise<any> {
  const client = await getClient();

  const careTeam = {
    resourceType: "CareTeam",
    status: "active",
    subject: { reference: `Patient/${patientId}` },
    participant: [{
      role: [{
        coding: [{
          system: "https://snomed.info/sct",
          code: "59058001",
          display: "General physician"
        }]
      }],
      member: { reference: `Practitioner/${practitionerId}` }
    }],
    reasonCode: [{ text: "ED frequent user intervention program" }]
  };

  return await client.create(careTeam);
}

// Search patients by name
export async function searchPatientsByName(query: string): Promise<any[]> {
  const client = await getClient();

  try {
    const response = await client.request(
      `Patient?name:contains=${encodeURIComponent(query)}&_count=10`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// List patient medication statements (use _sort=-date instead of non-standard -dateasserted)
export async function listPatientMedicationStatements(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const response = await client.request(
      `MedicationStatement?subject=Patient/${patientId}&_sort=-date&_count=20`,
      { flat: true }
    );
    return (response as any[]) || [];
  } catch {
    return [];
  }
}

// Create nutrition order for dietary interventions
export async function upsertNutritionOrder(
  client: Client,
  patient: any,
  instruction: string,
  practitionerRef?: string
): Promise<any> {
  const nutritionOrder = {
    resourceType: "NutritionOrder",
    status: "active",
    patient: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    dateTime: new Date().toISOString(),
    oralDiet: {
      type: [{ text: "Cardiac diet" }],
      instruction
    }
  };

  const res = await client.create(nutritionOrder);
  if (practitionerRef) {
    await createCommunicationToPractitioner(
      patient,
      `Nutrition plan saved`,
      practitionerRef
    );
  }
  return res;
}

// Create appointment for follow-up scheduling
export async function createAppointment(
  client: Client,
  patient: any,
  description: string,
  startTime: string
): Promise<any> {
  const appointment = {
    resourceType: "Appointment",
    status: "proposed",
    description,
    start: startTime,
    end: new Date(new Date(startTime).getTime() + 30 * 60 * 1000).toISOString(), // 30 min default
    participant: [{
      actor: {
        reference: `Patient/${patient.id}`,
        display: patient.name?.[0]?.text || patient.id
      },
      required: "required",
      status: "accepted"
    }],
    serviceType: [{
      coding: [{
        system: "https://snomed.info/sct",
        code: "408443003",
        display: "General medical practice"
      }]
    }]
  };

  return await client.create(appointment);
}

// ----- Clinician-side list helpers for selected patient -----

export async function listCarePlans(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const res = await client.request(
      `CarePlan?subject=Patient/${patientId}&/_sort=-_lastUpdated&_count=20`.replace("/_", ""),
      { flat: true }
    );
    return (res as any[]) || [];
  } catch { return []; }
}

export async function listServiceRequests(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const res = await client.request(
      `ServiceRequest?subject=Patient/${patientId}&_sort=-authored&_count=20`,
      { flat: true }
    );
    return (res as any[]) || [];
  } catch { return []; }
}

export async function listNutritionOrders(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const res = await client.request(
      `NutritionOrder?patient=Patient/${patientId}&_sort=-date&_count=20`,
      { flat: true }
    );
    return (res as any[]) || [];
  } catch { return []; }
}

export async function listAppointments(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const res = await client.request(
      `Appointment?participant=Patient/${patientId}&_sort=-start&_count=20`,
      { flat: true }
    );
    return (res as any[]) || [];
  } catch { return []; }
}
