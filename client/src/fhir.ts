import FHIR from "fhirclient";

const CLIENT_ID = import.meta.env.VITE_SMART_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
const FHIR_ISS = import.meta.env.VITE_FHIR_ISS as string;

export async function smartAuthorize() {
  await FHIR.oauth2.authorize({
    clientId: CLIENT_ID,
    scope: "launch/patient patient/*.read patient/*.write openid fhirUser offline_access",
    redirectUri: REDIRECT_URI,
    iss: FHIR_ISS,
    pkce: true,
  });
}

export async function getClient() {
  return FHIR.oauth2.ready();
}

export async function getPatient(client: any) {
  return client.patient.read();
}

export async function getEncounters(client: any, patientId: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const dateStr = twelveMonthsAgo.toISOString();
  const bundle = await client.request(
    `Encounter?patient=${patientId}&date=ge${dateStr}&_count=100`,
    { flat: true },
  );
  return Array.isArray(bundle) ? bundle : [];
}

export async function getConditions(client: any, patientId: string) {
  const bundle = await client.request(
    `Condition?patient=${patientId}&_count=100`,
    { flat: true },
  );
  return Array.isArray(bundle) ? bundle : [];
}

export async function getMedicationRequests(client: any, patientId: string) {
  const bundle = await client.request(
    `MedicationRequest?patient=${patientId}&_count=100`,
    { flat: true },
  );
  return Array.isArray(bundle) ? bundle : [];
}

export function computeEdCount(encounters: any[]): number {
  return encounters.filter((e) => {
    const cls = e.class?.code || e.class?.display || "";
    const types = (e.type || [])
      .map((t: any) => t.coding?.[0]?.code ?? "")
      .join(",");
    return /emergency|ED|ER|urgent/i.test(cls + " " + types);
  }).length;
}

export function riskFromCount(count: number) {
  if (count >= 4) return "HIGH";
  if (count >= 2) return "MODERATE";
  return "LOW";
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
      { detail: { kind: "CommunicationRequest", code: { text: "Medication adherence reminders" } } },
    ],
  };
  return client.create(carePlan);
}

export async function createServiceRequest(
  client: any,
  patient: any,
  specialtyText: string,
) {
  const sr = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    subject: { reference: `Patient/${patient.id}` },
    code: { text: `Referral to ${specialtyText}` },
    priority: "routine",
  };
  return client.create(sr);
}

export async function createCommunication(
  client: any,
  patient: any,
  text: string,
) {
  const comm = {
    resourceType: "Communication",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    sent: new Date().toISOString(),
    payload: [{ contentString: text }],
  };
  return client.create(comm);
}