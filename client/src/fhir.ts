// client/src/fhir.ts
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
    // pkce: true
  } as any);
}

export async function getClient() {
  return FHIR.oauth2.ready();
}

export async function searchPatientsByName(q: string) {
  const client = await getClient();
  const bundle = await client.request(`Patient?name=${encodeURIComponent(q)}&_summary=true&_count=20`, { flat: true });
  return Array.isArray(bundle) ? bundle : [];
}

/** ----- Panel management using List ----- */
function panelTitleFor(practId: string) {
  return `EIS-Panel-${practId}`;
}

export async function upsertPanelList(practitionerId: string) {
  const client = await getClient();
  const title = panelTitleFor(practitionerId);
  const existing = await client
    .request(`List?title=${encodeURIComponent(title)}&_count=1`, { flat: true })
    .catch(() => []);
  if (Array.isArray(existing) && existing.length > 0) return existing[0];

  const list = {
    resourceType: "List",
    status: "current",
    mode: "working",
    title,
    subject: undefined
  };
  return client.create(list);
}

export async function addPatientToPanel(practitionerId: string, patientId: string) {
  const client = await getClient();
  const panel = await upsertPanelList(practitionerId);
  const full = await client.read({ resourceType: "List", id: panel.id });
  const entries = full.entry || [];
  const exists = entries.some((e: any) => e.item?.reference === `Patient/${patientId}`);
  if (!exists) {
    entries.push({ item: { reference: `Patient/${patientId}` } });
    full.entry = entries;
    return client.update(full);
  }
  return full;
}

export async function listPanelPatients(practitionerId: string) {
  const client = await getClient();
  const panel = await upsertPanelList(practitionerId);
  const full = await client.read({ resourceType: "List", id: panel.id });
  const ids = (full.entry || [])
    .map((e: any) => e.item?.reference)
    .filter((r: string) => r?.startsWith("Patient/"))
    .map((r: string) => r.split("/")[1]);
  if (ids.length === 0) return [];
  // Batch fetch patients
  const results: any[] = [];
  for (const id of ids) {
    try { results.push(await client.read({ resourceType: "Patient", id })); } catch {}
  }
  return results;
}

export async function listPatientMedicationStatements(patientId: string) {
  const client = await getClient();
  const bundle = await client.request(
    `MedicationStatement?patient=${encodeURIComponent(patientId)}&_sort=-dateAsserted&_count=50`,
    { flat: true }
  );
  return Array.isArray(bundle) ? bundle : [];
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
