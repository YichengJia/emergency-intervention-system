// client/src/fhir.ts

import FHIR from "fhirclient";

/** Env */
const CLIENT_ID = import.meta.env.VITE_SMART_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
const FHIR_ISS = import.meta.env.VITE_FHIR_ISS as string | undefined;

/**
 * If we are not coming from the SMART launcher (no ?iss & ?launch),
 * this will initiate a SMART EHR launch-like authorization using env ISS.
 */
export async function smartAuthorize() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error("Missing CLIENT_ID or REDIRECT_URI env variables.");
  }
  // If you don't have ISS in URL and not provided in env, you cannot proceed
  if (!FHIR_ISS) {
    throw new Error(
      "No server url found. Provide iss in URL via SMART Launcher or set VITE_FHIR_ISS in .env."
    );
  }
  await FHIR.oauth2.authorize({
    clientId: CLIENT_ID,
    scope:
      "launch/patient patient/*.read patient/*.write openid fhirUser offline_access",
    redirectUri: REDIRECT_URI,
    iss: FHIR_ISS,
    pkce: true
  });
}

/** Returns a ready SMART client or throws */
export async function getClient() {
  return FHIR.oauth2.ready();
}

/** Convenience helpers to read common resources */
export async function getPatient(client?: any) {
  const c = client ?? (await getClient());
  return c.patient.read();
}

export async function getEncounters(client: any, patientId: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const ge = twelveMonthsAgo.toISOString();
  const bundle = await client.request(
    `Encounter?patient=${patientId}&date=ge${ge}&_count=200`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
}

export async function getConditions(client: any, patientId: string) {
  const bundle = await client.request(
    `Condition?patient=${patientId}&_count=200`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
}

export async function getMedicationRequests(client: any, patientId: string) {
  const bundle = await client.request(
    `MedicationRequest?patient=${patientId}&_count=200`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
}

/** Simple ED count & risk helpers */
export function computeEdCount(encounters: any[]): number {
  return encounters.filter((e: any) => {
    const cls = e.class?.code || e.class?.display || "";
    const types = (e.type || [])
      .map((t: any) => t.coding?.[0]?.code ?? "")
      .join(",");
    return /emergency|ED|ER|urgent/i.test(`${cls} ${types}`);
  }).length;
}

export function riskFromCount(count: number): "LOW" | "MODERATE" | "HIGH" {
  if (count >= 4) return "HIGH";
  if (count >= 2) return "MODERATE";
  return "LOW";
}

/** Create basic CarePlan (follow-up + education) */
export async function createCarePlan(client: any, patient: any, summary: string) {
  const now = new Date().toISOString();
  const carePlan = {
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    title: "Post-ED Follow-up and Self-Management Plan",
    subject: { reference: `Patient/${patient.id}` },
    period: { start: now },
    description: summary,
    activity: [
      { detail: { kind: "ServiceRequest", code: { text: "GP follow-up within 7 days" } } },
      { detail: { kind: "ServiceRequest", code: { text: "Dietitian consultation (as needed)" } } },
      { detail: { kind: "CommunicationRequest", code: { text: "Medication adherence reminders" } } }
    ]
  };
  return client.create(carePlan);
}

/** Create referral-like ServiceRequest */
export async function createServiceRequest(
  client: any,
  patient: any,
  specialtyText: string
) {
  const sr = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    subject: { reference: `Patient/${patient.id}` },
    code: { text: `Referral to ${specialtyText}` },
    priority: "routine"
  };
  return client.create(sr);
}

/** Patient education as Communication to the patient record */
export async function createCommunicationToPatient(
  client: any,
  patient: any,
  text: string
) {
  const comm = {
    resourceType: "Communication",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    sent: new Date().toISOString(),
    payload: [{ contentString: text }]
  };
  return client.create(comm);
}

/** Utility to read the user (Practitioner) */
export async function getUserInfo(client?: any) {
  const c = client ?? (await getClient());
  try {
    const user = await c.user.read();
    return user; // Practitioner or Person, depending on the server
  } catch {
    return null;
  }
}

/** Create a Communication to a specific Practitioner (doctor) */
export async function createCommunicationToPractitioner(
  patient: any,
  text: string,
  practitionerRef: string // e.g. "Practitioner/123"
) {
  const client = await getClient();
  const comm = {
    resourceType: "Communication",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    recipient: [{ reference: practitionerRef }],
    sent: new Date().toISOString(),
    payload: [{ contentString: text }]
  };
  return client.create(comm);
}

/** Self-reported medication intake (taken or missed) */
export async function createMedicationStatement(
  patient: any,
  medText: string,
  taken: boolean,
  isoTime: string
) {
  const client = await getClient();
  // R4 has limited adherence modeling; we use note to mark missed.
  const ms = {
    resourceType: "MedicationStatement",
    status: taken ? "completed" : "active",
    subject: { reference: `Patient/${patient.id}` },
    dateAsserted: isoTime,
    effectiveDateTime: isoTime,
    medicationCodeableConcept: { text: medText },
    note: [{ text: taken ? "Self-reported taken" : "Self-reported missed" }]
  };
  return client.create(ms);
}

/** Optionally list latest communications for the practitioner inbox */
export async function listMyCommunications(practitionerRef: string) {
  const client = await getClient();
  const bundle = await client.request(
    `Communication?recipient=${encodeURIComponent(practitionerRef)}&_sort=-sent&_count=20`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
}

/** Raise a high-risk flag on the patient */
export async function createFlagHighRisk(patient: any, reason: string) {
  const client = await getClient();
  const flag = {
    resourceType: "Flag",
    status: "active",
    category: [{ text: "safety" }],
    code: { text: "High-risk medication adherence" },
    subject: { reference: `Patient/${patient.id}` },
    period: { start: new Date().toISOString() },
    note: [{ text: reason }]
  };
  return client.create(flag);
}
