// client/src/fhir.ts
// Core FHIR service for SMART on FHIR flows and clinical resources.

import FHIR from "fhirclient";
import Client from "fhirclient/lib/Client";

// ---------- SMART Authorization ----------

/** Start SMART on FHIR authorization (Standalone or EHR launch). */
export async function smartAuthorize(): Promise<void> {
  await FHIR.oauth2.authorize({
    clientId: import.meta.env.VITE_SMART_CLIENT_ID || "emergency-intervention-system",
    scope:
      "launch launch/patient launch/encounter patient/*.* user/*.* openid fhirUser profile offline_access",
    redirectUri: import.meta.env.VITE_REDIRECT_URI || (window.location.origin + window.location.pathname),
    iss:
      import.meta.env.VITE_FHIR_ISS ||
      "https://launch.smarthealthit.org/v/r4/sim/eyJrIjoiMSIsImoiOiIxIn0/fhir",
    pkce: true,
  });
}

/**
 * Convert UTC to local time for display
 */
export function toLocalTime(utcString: string): string {
  const date = new Date(utcString);
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get current time in Brisbane timezone
 */
export function getBrisbaneTime(): Date {
  const now = new Date();
  const brisbaneTime = new Date(now.toLocaleString("en-US", {timeZone: "Australia/Brisbane"}));
  return brisbaneTime;
}

/** Get an authenticated FHIR client from the current session. */
export async function getClient(): Promise<Client> {
  return await FHIR.oauth2.ready();
}

// ---------- Identity & Context ----------

/** Read the currently logged-in user (Practitioner/Patient) via id_token or user.read(). */
export async function getUserInfo(client: Client): Promise<any> {
  try {
    const token = (client as any).state?.tokenResponse;
    if (token?.id_token) {
      const payload = JSON.parse(atob(token.id_token.split(".")[1]));
      if (payload.profile) return await client.request(payload.profile);
    }
    return await (client as any).user.read();
  } catch {
    return null;
  }
}

/** Current patient (Standalone Patient launch), else use EHR context in App. */
export async function getPatient(client: Client): Promise<any> {
  return await (client as any).patient.read();
}

// ---------- Read helpers ----------

export async function getEncounters(client: Client, patientId: string): Promise<any[]> {
  try {
    const r = await client.request(
      `Encounter?patient=${patientId}&_sort=-date&_count=100`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

export async function getConditions(client: Client, patientId: string): Promise<any[]> {
  try {
    const r = await client.request(
      `Condition?patient=${patientId}&clinical-status=active,recurrence,remission`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

export async function getMedicationRequests(client: Client, patientId: string): Promise<any[]> {
  try {
    const r = await client.request(
      `MedicationRequest?patient=${patientId}&status=active,completed&_sort=-authoredon&_count=50`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

// ---------- Risk ----------

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

// ---------- Write helpers (idempotent/overwrite semantics where needed) ----------

/** Create a CarePlan, revoking existing active ones to keep only the latest. */
export async function upsertCarePlan(
  client: Client,
  patient: any,
  description: string,
  practitionerRef?: string
): Promise<any> {
  // Find and revoke ALL existing active CarePlans
  const existing = (await client
    .request(
      `CarePlan?subject=Patient/${patient.id}&status=active,on-hold,draft&_count=100`,
      { flat: true }
    )
    .catch(() => [])) as any[];

  // Revoke all existing plans
  for (const cp of existing) {
    try {
      const updated = {
        ...cp,
        status: "revoked",
        period: {
          ...cp.period,
          end: new Date().toISOString()
        }
      };
      await client.update(updated);
    } catch (err) {
      console.error(`Error revoking CarePlan ${cp.id}:`, err);
    }
  }

  // Create new CarePlan
  const carePlan = {
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    subject: { reference: `Patient/${patient.id}` },
    period: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    description,
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/careplan-category",
            code: "assess-plan",
            display: "Assessment and Plan of Treatment",
          },
        ],
      },
    ],
    activity: [
      {
        detail: {
          status: "scheduled",
          description: description
        }
      }
    ]
  };

  const res = await client.create(carePlan);

  // Notify practitioner if provided
  if (practitionerRef && res?.id) {
    await client.create({
      resourceType: "Communication",
      status: "completed",
      subject: { reference: `Patient/${patient.id}` },
      recipient: [{ reference: practitionerRef }],
      payload: [{ contentString: `New CarePlan created: ${description} [ID: ${res.id}]` }],
      sent: new Date().toISOString(),
    });
  }

  return res;
}

/** Legacy alias used by App; forwards to upsertCarePlan to keep only latest. */
export async function createCarePlan(
  client: Client,
  patient: any,
  description: string,
  practitionerRef?: string
): Promise<any> {
  return upsertCarePlan(client, patient, description, practitionerRef);
}

/** Create a ServiceRequest (referral) and notify clinician (optional). */
export async function createServiceRequest(
  client: Client,
  patient: any,
  specialty: string,
  reason?: string,
  urgency?: string,
  practitionerRef?: string
): Promise<any> {
  const serviceRequest = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    priority: urgency || "routine",
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id,
    },
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: specialty === "GP" ? "103696004" : "183524004",
        display: specialty === "GP" ? "Primary care referral" : "Specialist referral",
      }],
      text: `Referral to ${specialty}`,
    },
    authoredOn: new Date().toISOString(),
    reasonCode: [{ text: reason || "Reduce ED utilization through coordinated care" }],
    note: reason ? [{ text: `Reason: ${reason}` }] : undefined
  };

  const res = await client.create(serviceRequest);

  if (practitionerRef && res?.id) {
    const commPayload = {
      resourceType: "Communication",
      status: "completed",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/communication-category",
          code: "notification"
        }]
      }],
      subject: { reference: `Patient/${patient.id}` },
      sender: { reference: `Patient/${patient.id}` },
      recipient: [{ reference: practitionerRef }],
      payload: [{
        contentString: `New Referral Created:
Specialty: ${specialty}
Priority: ${urgency || 'routine'}
Reason: ${reason || 'Not specified'}
Time: ${toLocalTime(new Date().toISOString())}`
      }],
      sent: new Date().toISOString()
    };

    await client.create(commPayload);
  }

  return res;
}

/** Patient education communication (patient recipient). */
export async function createCommunicationToPatient(
  client: Client,
  patient: any,
  message: string
): Promise<any> {
  const communication = {
    resourceType: "Communication",
    status: "completed",
    category: [
      {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/communication-category",
            code: "instruction",
            display: "Instruction",
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patient.id}` },
    recipient: [{ reference: `Patient/${patient.id}` }],
    payload: [{ contentString: message }],
    sent: new Date().toISOString(),
  };

  return await client.create(communication);
}

/** Clinician alert communication (practitioner recipient). */
export async function createCommunicationToPractitioner(
  patient: any,
  message: string,
  practitionerRef: string
): Promise<any> {
  const client = await getClient();
  const communication = {
    resourceType: "Communication",
    status: "completed",
    category: [
      {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/communication-category",
            code: "alert",
            display: "Alert",
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patient.id}` },
    recipient: [{ reference: practitionerRef }],
    payload: [{ contentString: message }],
    sent: new Date().toISOString(),
  };

  return await client.create(communication);
}

/**
 * Create or overwrite a MedicationStatement for a dose slot (AM/PM) for that day.
 * Adds a slot tag into note for idempotency and optional clinician notification.
 */
export async function createMedicationStatement(
  patient: any,
  medicationText: string,
  taken: boolean,
  timestamp: string,
  doseSlot: "AM" | "PM",
  practitionerRef?: string
): Promise<any> {
  const client = await getClient();
  const date = timestamp.slice(0, 10);

  // 查找现有记录
  const existing = await client
    .request(
      `MedicationStatement?subject=Patient/${patient.id}&_sort=-dateasserted&_count=50`,
      { flat: true }
    )
    .catch(() => []) as any[];

  const match = existing.find(
    (s) =>
      ((s.effectiveDateTime ?? s.dateAsserted ?? "") as string).startsWith(date) &&
      (s.note?.[0]?.text ?? "").includes(`[slot:${doseSlot}]`) &&
      (s.medicationCodeableConcept?.text ?? "") === medicationText
  );

  const payload: any = {
    resourceType: "MedicationStatement",
    status: taken ? "active" : "on-hold",
    medicationCodeableConcept: { text: medicationText },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name?.[0]?.text || patient.id,
    },
    effectiveDateTime: timestamp,
    dateAsserted: timestamp,
    note: [{ text: `${taken ? "taken" : "missed"} [slot:${doseSlot}]` }],
  };

  let res;
  if (match?.id) {
    payload.id = match.id;
    res = await client.update(payload);
  } else {
    res = await client.create(payload);
  }

  // 关键修复：确保创建Communication通知医生
  if (practitionerRef && res) {
    const commPayload = {
      resourceType: "Communication",
      status: "completed",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/communication-category",
          code: "notification"
        }]
      }],
      subject: {
        reference: `Patient/${patient.id}`,
        display: patient.name?.[0]?.text || patient.id
      },
      sender: {
        reference: `Patient/${patient.id}`,
        display: patient.name?.[0]?.text || patient.id
      },
      recipient: [{
        reference: practitionerRef
      }],
      payload: [{
        contentString: `Medication Update [${toLocalTime(timestamp)}]:
Patient: ${patient.name?.[0]?.text || patient.id}
Medication: ${medicationText}
Slot: ${doseSlot}
Status: ${taken ? "TAKEN ✓" : "MISSED ✗"}`
      }],
      sent: new Date().toISOString(),
      received: new Date().toISOString()
    };

    try {
      await client.create(commPayload);
      console.log("Communication created for medication statement");
    } catch (err) {
      console.error("Failed to create communication:", err);
    }
  }

  return res;
}

/** Upsert NutritionOrder and keep only the latest active. */
export async function upsertNutritionOrder(
  client: Client,
  patient: any,
  instruction: string,
  dietType?: string,
  symptoms?: string,
  practitionerRef?: string
): Promise<any> {
  // 撤销现有订单
  const existing = await client
    .request(
      `NutritionOrder?patient=Patient/${patient.id}&status=active&_count=100`,
      { flat: true }
    )
    .catch(() => []) as any[];

  for (const n of existing) {
    try {
      await client.update({ ...n, status: "entered-in-error" });
    } catch {}
  }

  const fullInstruction = `
Diet Type: ${dietType || 'General diet'}
Instructions: ${instruction}
${symptoms ? `Symptoms to Monitor: ${symptoms}` : ''}`.trim();

  const nutritionOrder = {
    resourceType: "NutritionOrder",
    status: "active",
    patient: { reference: `Patient/${patient.id}` },
    dateTime: new Date().toISOString(),
    intent: "order",
    oralDiet: {
      type: [{
        text: dietType || "General diet"
      }],
      instruction: fullInstruction
    }
  };

  const res = await client.create(nutritionOrder);

  if (practitionerRef && res?.id) {
    const commPayload = {
      resourceType: "Communication",
      status: "completed",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/communication-category",
          code: "notification"
        }]
      }],
      subject: { reference: `Patient/${patient.id}` },
      sender: { reference: `Patient/${patient.id}` },
      recipient: [{ reference: practitionerRef }],
      payload: [{
        contentString: `Nutrition Order Created:
Diet Type: ${dietType || 'General diet'}
Instructions: ${instruction}
${symptoms ? `Monitoring: ${symptoms}` : ''}
Time: ${toLocalTime(new Date().toISOString())}`
      }],
      sent: new Date().toISOString()
    };

    await client.create(commPayload);
  }

  return res;
}


/** Create an appointment if no future appointment exists; 30-minute default. */
export async function createAppointment(
  client: Client,
  patient: any,
  description: string,
  startTime: string,
  practitionerRef?: string
): Promise<any> {
  const nowISO = new Date().toISOString();

  // 检查现有预约
  const future = await client
    .request(
      `Appointment?participant=Patient/${patient.id}&date=ge${nowISO}&_count=10`,
      { flat: true }
    )
    .catch(() => []) as any[];

  if (future.length > 0) {
    throw new Error("Patient already has a future appointment.");
  }

  const appointment = {
    resourceType: "Appointment",
    status: "booked",
    description,
    start: startTime,
    end: new Date(new Date(startTime).getTime() + 30 * 60 * 1000).toISOString(),
    participant: [{
      actor: { reference: `Patient/${patient.id}` },
      required: "required",
      status: "accepted",
    }]
  };

  const result = await client.create(appointment);

  if (practitionerRef && result?.id) {
    const commPayload = {
      resourceType: "Communication",
      status: "completed",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/communication-category",
          code: "notification"
        }]
      }],
      subject: { reference: `Patient/${patient.id}` },
      sender: { reference: `Patient/${patient.id}` },
      recipient: [{ reference: practitionerRef }],
      payload: [{
        contentString: `Appointment Scheduled:
Description: ${description}
Date/Time: ${toLocalTime(startTime)}
Duration: 30 minutes
ID: ${result.id}`
      }],
      sent: new Date().toISOString()
    };

    await client.create(commPayload);
  }

  return result;
}

// ---------- Clinician inbox & patient lists ----------

/** Communications to this practitioner (optionally filter by patient via dashboard). */
export async function listMyCommunications(
  practitionerRef: string
): Promise<any[]> {
  const client = await getClient();
  try {
    const queries = [
      `Communication?recipient=${encodeURIComponent(practitionerRef)}&_sort=-sent&_count=100`,
      `Communication?_sort=-sent&_count=100`
    ];

    let allComms: any[] = [];

    for (const query of queries) {
      try {
        const results = await client.request(query, { flat: true });
        if (results && Array.isArray(results)) {
          allComms = [...allComms, ...results];
          console.log('Querying communications for:', practitionerRef);
          console.log('Results:', results);
        }
      } catch (err) {
        console.error(`Query failed: ${query}`, err);
      }
    }

    // 去重和过滤
    const uniqueComms = new Map();
    for (const comm of allComms) {
      if (!uniqueComms.has(comm.id) &&
          comm.recipient?.some((r: any) => r.reference === practitionerRef)) {
        uniqueComms.set(comm.id, comm);
      }
    }

    return Array.from(uniqueComms.values()).sort((a, b) =>
      new Date(b.sent || 0).getTime() - new Date(a.sent || 0).getTime()
    );
  } catch (err) {
    console.error("Error fetching communications:", err);
    return [];
  }
}

/** Get patients on practitioner's panel via CareTeam. */
export async function listPanelPatients(practitionerId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const teams = await client.request(
      `CareTeam?participant=Practitioner/${practitionerId}&status=active&_count=100`,
      { flat: true }
    );

    const patientRefs = new Set<string>();
    for (const t of (teams || []) as any[]) {
      if (t.subject?.reference) {
        patientRefs.add(t.subject.reference);
      }
    }

    const out: any[] = [];
    for (const ref of patientRefs) {
      try {
        const patient = await client.request(ref);
        if (patient) out.push(patient);
      } catch (err) {
        console.error(`Error fetching patient ${ref}:`, err);
      }
    }
    return out;
  } catch (err) {
    console.error("Error listing panel patients:", err);
    return [];
  }
}

/** Add patient to practitioner's panel via CareTeam. */
export async function addPatientToPanel(
  practitionerId: string,
  patientId: string
): Promise<any> {
  const client = await getClient();
  return await client.create({
    resourceType: "CareTeam",
    status: "active",
    subject: { reference: `Patient/${patientId}` },
    participant: [
      {
        role: [
          {
            coding: [
              {
                system: "https://snomed.info/sct",
                code: "59058001",
                display: "General physician",
              },
            ],
          },
        ],
        member: { reference: `Practitioner/${practitionerId}` },
      },
    ],
    reasonCode: [{ text: "ED frequent user intervention program" }],
  });
}

/** Simple patient search by name (broad compatibility). */
export async function searchPatientsByName(query: string): Promise<any[]> {
  const client = await getClient();
  try {
    // First check if query looks like a patient ID
    if (query && !query.includes(" ")) {
      try {
        // Try direct ID fetch
        const patient = await client.request(`Patient/${query}`);
        if (patient) {
          return [patient];
        }
      } catch {
        // Not a valid ID, proceed with name search
      }
    }

    // Search by name (includes given, family, and text)
    const results = await client.request(
      `Patient?name=${encodeURIComponent(query)}&_count=20`,
      { flat: true }
    );

    // Also search by identifier if no results
    if ((!results || results.length === 0) && query) {
      const idResults = await client.request(
        `Patient?identifier=${encodeURIComponent(query)}&_count=20`,
        { flat: true }
      ).catch(() => []);

      return idResults || [];
    }

    return results || [];
  } catch (err) {
    console.error("Error searching patients:", err);
    return [];
  }
}

// ---------- Clinician detail lists for a patient ----------

export async function listPatientMedicationStatements(
  patientId: string
): Promise<any[]> {
  const client = await getClient();
  try {
    // Get statements from last 30 days to avoid clutter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const r = await client.request(
      `MedicationStatement?subject=Patient/${patientId}&effective=ge${dateFilter}&_sort=-effective&_count=100`,
      { flat: true }
    );

    // If no results with date filter, try without
    if (!r || r.length === 0) {
      const allStatements = await client.request(
        `MedicationStatement?subject=Patient/${patientId}&_sort=-effective&_count=50`,
        { flat: true }
      );
      return allStatements || [];
    }

    return r || [];
  } catch (err) {
    console.error("Error fetching medication statements:", err);
    return [];
  }
}

export async function listCarePlans(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = await client.request(
      `CarePlan?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=20`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

export async function listServiceRequests(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = await client.request(
      `ServiceRequest?subject=Patient/${patientId}&_sort=-authored&_count=20`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

export async function listNutritionOrders(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = await client.request(
      `NutritionOrder?patient=Patient/${patientId}&_sort=-date&_count=20`,
      { flat: true }
    );
    return r || [];
  } catch {
    return [];
  }
}

export async function listAppointments(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    // Get all appointments (past and future)
    const r = await client.request(
      `Appointment?participant=Patient/${patientId}&_sort=-start&_count=20`,
      { flat: true }
    );

    // Filter to only show relevant appointments
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return (r || []).filter((apt: any) => {
      const aptDate = new Date(apt.start);
      return aptDate >= thirtyDaysAgo; // Show appointments from last 30 days and future
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    return [];
  }
}
