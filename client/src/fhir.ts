// client/src/fhir.ts
// Core FHIR service for managing patient data and interventions

import FHIR from "fhirclient";
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
  return await FHIR.oauth2.ready();
}

// Get user information from token
export async function getUserInfo(client: Client): Promise<any> {
  try {
    const token = client.state.tokenResponse;
    if (token?.id_token) {
      // Parse JWT to get user info
      const payload = JSON.parse(atob(token.id_token.split('.')[1]));
      if (payload.profile) {
        return await client.request(payload.profile);
      }
    }
    // Fallback to user endpoint
    return await client.user.read();
  } catch {
    return null;
  }
}

// Get current patient
export async function getPatient(client: Client): Promise<any> {
  return await client.patient.read();
}

// Get patient encounters with focus on ED visits
export async function getEncounters(client: Client, patientId: string): Promise<any[]> {
  try {
    const response = await client.request(
      `Encounter?patient=${patientId}&_sort=-date&_count=100`,
      { flat: true }
    );
    return response || [];
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
    return response || [];
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
    return response || [];
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
  // Risk scoring algorithm based on evidence-based factors
  let score = 0;

  // ED visit frequency (major factor)
  if (edVisitsLast12m >= 8) score += 4;
  else if (edVisitsLast12m >= 4) score += 3;
  else if (edVisitsLast12m >= 2) score += 1;

  // Chronic condition burden
  if (chronicConditions.length >= 3) score += 2;
  else if (chronicConditions.length >= 2) score += 1;

  // High-risk medications
  if (hasOpioidMeds) score += 1;

  // Determine risk level
  if (score >= 5) return "HIGH";
  if (score >= 2) return "MODERATE";
  return "LOW";
}

// Create the care plan for follow-up interventions
export async function createCarePlan(
  client: Client,
  patient: any,
  description: string
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
    description: description,
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

  return await client.create(carePlan);
}

// Create service request for referrals
export async function createServiceRequest(
  client: Client,
  patient: any,
  specialty: string
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
    reasonCode: [{
      text: "Reduce emergency department utilization through coordinated care"
    }]
  };

  return await client.create(serviceRequest);
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
    payload: [{
      contentString: message
    }],
    sent: new Date().toISOString()
  };

  return await client.create(communication);
}

// Create medication statement for adherence tracking
export async function createMedicationStatement(
  patient: any,
  medicationText: string,
  taken: boolean,
  timestamp: string
): Promise<any> {
  const client = await getClient();

  const statement = {
    resourceType: "MedicationStatement",
    status: taken ? "active" : "on-hold",
    medicationCodeableConcept: {
      text: medicationText
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id
    },
    dateAsserted: timestamp,
    note: [{
      text: taken ? "Medication taken as prescribed" : "Medication dose missed"
    }]
  };

  return await client.create(statement);
}

// Create communication to practitioner for alerts
export async function createCommunicationToPractitioner(
  patient: any,
  message: string,
  practitionerRef: string
): Promise<any> {
  const client = await getClient();

  const communication = {
    resourceType: "Communication",
    status: "completed",
    priority: "high",
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
    recipient: [{
      reference: practitionerRef
    }],
    payload: [{
      contentString: message
    }],
    sent: new Date().toISOString()
  };

  return await client.create(communication);
}

// List communications for practitioner inbox
export async function listMyCommunications(practitionerRef: string): Promise<any[]> {
  const client = await getClient();

  try {
    const response = await client.request(
      `Communication?recipient=${practitionerRef}&_sort=-sent&_count=50`,
      { flat: true }
    );
    return response || [];
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
    for (const team of response || []) {
      if (team.subject?.reference) {
        patientRefs.add(team.subject.reference);
      }
    }

    // Fetch patient details
    const patients = [];
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
    subject: {
      reference: `Patient/${patientId}`
    },
    participant: [{
      role: [{
        coding: [{
          system: "https://snomed.info/sct",
          code: "59058001",
          display: "General physician"
        }]
      }],
      member: {
        reference: `Practitioner/${practitionerId}`
      }
    }],
    reasonCode: [{
      text: "ED frequent user intervention program"
    }]
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
    return response || [];
  } catch {
    return [];
  }
}

// List patient medication statements
export async function listPatientMedicationStatements(patientId: string): Promise<any[]> {
  const client = await getClient();

  try {
    const response = await client.request(
      `MedicationStatement?subject=Patient/${patientId}&_sort=-dateasserted&_count=20`,
      { flat: true }
    );
    return response || [];
  } catch {
    return [];
  }
}

// Create nutrition order for dietary interventions
export async function upsertNutritionOrder(
  client: Client,
  patient: any,
  instruction: string
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
      type: [{
        text: "Cardiac diet"
      }],
      instruction: instruction
    }
  };

  return await client.create(nutritionOrder);
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
    description: description,
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