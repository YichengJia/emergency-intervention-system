import FHIR from "fhirclient";

const CLIENT_ID = import.meta.env.VITE_SMART_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
const FHIR_ISS = import.meta.env.VITE_FHIR_ISS as string | undefined;

export async function smartAuthorize() {
  if (!CLIENT_ID || !REDIRECT_URI) throw new Error("Missing env variables.");
  if (!FHIR_ISS) {
    throw new Error("No server url found. Provide iss in URL or set VITE_FHIR_ISS.");
  }
  await FHIR.oauth2.authorize({
    clientId: CLIENT_ID,
    scope: "launch/patient patient/*.read patient/*.write openid fhirUser offline_access",
    redirectUri: REDIRECT_URI,
    iss: FHIR_ISS
  } as any);
}

export async function getClient() {
  return FHIR.oauth2.ready();
}

export async function getUserInfo(client?: any) {
  const c = client ?? (await getClient());
  try { return await c.user.read(); } catch { return null; }
}

export async function getPatient(c?: any) {
  const client = c ?? (await getClient());
  return client.patient.read();
}

export async function getEncounters(client: any, patientId: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const ge = twelveMonthsAgo.toISOString();
  const bundle = await client.request(`Encounter?patient=${patientId}&date=ge${ge}&_count=200`, { flat: true });
  return Array.isArray(bundle) ? bundle : [];
}

export async function getConditions(client: any, patientId: string) {
  const bundle = await client.request(`Condition?patient=${patientId}&_count=200`, { flat: true });
  return Array.isArray(bundle) ? bundle : [];
}

export async function getMedicationRequests(client: any, patientId: string) {
  const bundle = await client.request(`MedicationRequest?patient=${patientId}&_count=200`, { flat: true });
  return Array.isArray(bundle) ? bundle : [];
}

export function computeEdCount(encounters: any[]): number {
  return encounters.filter((e: any) => {
    const cls = e.class?.code || e.class?.display || "";
    const types = (e.type || []).map((t: any) => t.coding?.[0]?.code ?? "").join(",");
    return /emergency|ED|ER|urgent/i.test(`${cls} ${types}`);
  }).length;
}

export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export function riskFromFactors(edCount: number, conditions: string[], opioid: boolean): RiskLevel {
  let risk: RiskLevel = edCount >= 4 ? "HIGH" : edCount >= 2 ? "MODERATE" : "LOW";
  const hasCardiac = conditions.some((x) => /cardiac|coronary|heart/i.test(x));
  const bump = (hasCardiac ? 1 : 0) + (opioid ? 1 : 0);
  if (bump > 0) {
    if (risk === "LOW") risk = "MODERATE";
    else if (risk === "MODERATE") risk = "HIGH";
  }
  return risk;
}

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

export async function createServiceRequest(client: any, patient: any, specialtyText: string) {
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

export async function createCommunicationToPatient(client: any, patient: any, text: string) {
  const comm = {
    resourceType: "Communication",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    sent: new Date().toISOString(),
    payload: [{ contentString: text }]
  };
  return client.create(comm);
}

export async function createCommunicationToPractitioner(patient: any, text: string, practitionerRef: string) {
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

export async function createMedicationStatement(patient: any, medText: string, taken: boolean, isoTime: string) {
  const client = await getClient();
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

export async function listMyCommunications(practitionerRef: string) {
  const client = await getClient();
  const bundle = await client.request(
    `Communication?recipient=${encodeURIComponent(practitionerRef)}&_sort=-sent&_count=20`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
}

export async function upsertNutritionOrder(client: any, patient: any, instruction: string) {
  const no = {
    resourceType: "NutritionOrder",
    status: "active",
    intent: "order",
    subject: { reference: `Patient/${patient.id}` },
    dateTime: new Date().toISOString(),
    oralDiet: { note: [{ text: instruction }] }
  };
  return client.create(no);
}

export async function createAppointment(client: any, patient: any, title: string, startIso: string) {
  const appt = {
    resourceType: "Appointment",
    status: "booked",
    description: title,
    start: startIso,
    participant: [{ actor: { reference: `Patient/${patient.id}` }, status: "accepted" }]
  };
  return client.create(appt);
}