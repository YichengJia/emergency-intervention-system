// Core FHIR service for managing patient data and interventions
// Notes:
// - Uses SMART on FHIR via `fhirclient`
// - Adds optional clinician notifications (Communication) after key writes
// - Provides list* helpers so clinician UI can fetch CarePlan/ServiceRequest/etc.

import * as FHIR from "fhirclient";
import type Client from "fhirclient/lib/Client";

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

// Get launch context patients (for Provider EHR Launch)
export async function getLaunchContextPatients(): Promise<string[]> {
  const client = await getClient();
  const state = (client as any).state;
  const patientIds: string[] = [];

  // 1. Check token response for patient parameter
  if (state?.tokenResponse?.patient) {
    const patientParam = state.tokenResponse.patient;
    if (patientParam.includes(',')) {
      return patientParam.split(',');
    } else {
      return [patientParam];
    }
  }

  // 2. Check launch context
  if (state?.launchContext?.patient) {
    if (Array.isArray(state.launchContext.patient)) {
      return state.launchContext.patient;
    } else if (typeof state.launchContext.patient === 'string') {
      return state.launchContext.patient.split(',');
    }
  }

  // 3. Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const patientParam = urlParams.get('patient');
  if (patientParam) {
    return patientParam.split(',');
  }

  // 4. Check state for patient scope
  if (state?.scope?.includes('patient/')) {
    // Extract patient ID from scope if exists
    const scopeMatch = state.scope.match(/patient\/([^\s]+)/);
    if (scopeMatch && scopeMatch[1]) {
      return [scopeMatch[1]];
    }
  }

  // 5. For patient launch, get current patient
  if (state?.tokenResponse?.patient || state?.patient?.id) {
    const patientId = state?.tokenResponse?.patient || state?.patient?.id;
    if (patientId) {
      return [patientId];
    }
  }

  return patientIds;
}

// Get patients by IDs
export async function getPatientsByIds(patientIds: string[]): Promise<any[]> {
  const client = await getClient();
  const patients: any[] = [];

  for (const id of patientIds) {
    try {
      const patient = await client.request(`Patient/${id}`);
      patients.push(patient);
    } catch (error) {
      console.error(`Failed to fetch patient ${id}:`, error);
    }
  }

  return patients;
}

// Check if current launch is Provider Launch
export async function isProviderLaunch(): Promise<boolean> {
  try {
    const client = await getClient();
    const state = (client as any).state;

    // Check for practitioner scope
    if (state?.scope?.includes('user/Practitioner')) {
      return true;
    }

    // Check user type
    const user = await getUserInfo(client);
    return user?.resourceType === 'Practitioner';
  } catch {
    return false;
  }
}

// Get launch information
export async function getLaunchInfo(): Promise<{
  type: 'patient' | 'provider' | 'unknown';
  patientIds: string[];
  practitionerId?: string;
}> {
  try {
    const client = await getClient();
    const user = await getUserInfo(client);
    const patientIds = await getLaunchContextPatients();

    if (user?.resourceType === 'Practitioner') {
      return {
        type: 'provider',
        patientIds,
        practitionerId: user.id
      };
    } else if (patientIds.length > 0) {
      return {
        type: 'patient',
        patientIds
      };
    }

    return {
      type: 'unknown',
      patientIds: []
    };
  } catch {
    return {
      type: 'unknown',
      patientIds: []
    };
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

// List communications for practitioner inbox (with optional patient filtering)
export async function listMyCommunications(
  practitionerRef: string,
  patientIds?: string[]
): Promise<any[]> {
  const client = await getClient();
  try {
    const response = await client.request(
      `Communication?recipient=${practitionerRef}&_sort=-sent&_count=100`,
      { flat: true }
    );

    const allCommunications = (response as any[]) || [];

    // Filter by patient IDs if provided
    if (patientIds && patientIds.length > 0) {
      return allCommunications.filter((comm: any) => {
        const patientId = comm.subject?.reference?.split("/")?.[1];
        return patientIds.includes(patientId);
      });
    }

    return allCommunications;
  } catch {
    return [];
  }
}

// Get patients on practitioner's panel (filtered by launch context)
export async function listPanelPatients(
  practitionerId: string,
  contextPatientIds?: string[]
): Promise<any[]> {
  const client = await getClient();

  // If context patient IDs provided, fetch those patients directly
  if (contextPatientIds && contextPatientIds.length > 0) {
    return await getPatientsByIds(contextPatientIds);
  }

  // Otherwise, use CareTeam approach
  try {
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

// List patient medication statements
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
      `Nutrition plan saved: ${instruction}`,
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
      `CarePlan?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=20`,
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