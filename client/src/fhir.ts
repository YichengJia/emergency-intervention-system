// client/src/fhir.ts
import FHIR from "fhirclient";

/** SMART auth */
export async function smartAuthorize(): Promise<void> {
  await FHIR.oauth2.authorize({
    clientId: import.meta.env.VITE_SMART_CLIENT_ID || "emergency-intervention-system",
    scope:
      "launch launch/patient launch/encounter patient/*.* user/*.* openid fhirUser profile offline_access",
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin + "/",
    // 允许从 SMART Launcher 传入 iss
    iss: (new URLSearchParams(location.search).get("iss") || undefined) as any,
  });
}

/** Get SMART client */
export async function getClient(): Promise<any> {
  return FHIR.oauth2.ready();
}

/** fhirUser reference like "Practitioner/123" */
export async function getUserInfo(): Promise<{ fhirUser?: string }> {
  const c = await getClient();
  return { fhirUser: (c as any)?.state?.tokenResponse?.fhirUser };
}

/** Basic reads helpers */
export async function getPatient(): Promise<any | null> {
  try {
    const c = await getClient();
    return c.patient.read();
  } catch {
    return null;
  }
}

export async function getEncounters(patientId: string): Promise<any[]> {
  const c = await getClient();
  try {
    return (await c.request(`Encounter?subject=Patient/${patientId}&_sort=-date`, {
      flat: true,
    })) as any[];
  } catch {
    return [];
  }
}

export async function getConditions(patientId: string): Promise<any[]> {
  const c = await getClient();
  try {
    return (await c.request(`Condition?subject=Patient/${patientId}&_sort=-_lastUpdated`, {
      flat: true,
    })) as any[];
  } catch {
    return [];
  }
}

export async function getMedicationRequests(patientId: string): Promise<any[]> {
  const c = await getClient();
  try {
    return (await c.request(
      `MedicationRequest?subject=Patient/${patientId}&status=active&_sort=-_lastUpdated`,
      { flat: true }
    )) as any[];
  } catch {
    return [];
  }
}

/** Simple demo risk estimation */
export function riskFromFactors(conditions: any[] = [], meds: any[] = []): "LOW" | "MODERATE" | "HIGH" {
  const chronic = conditions.length;
  const complexity = meds.length;
  const score = chronic + complexity;
  if (score >= 6) return "HIGH";
  if (score >= 3) return "MODERATE";
  return "LOW";
}

/* ---------------- Medication Adherence ---------------- */

export async function createMedicationStatement(
  patient: any,
  medicationText: string,
  taken: boolean,
  timestamp: string, // ISO
  doseSlot: "AM" | "PM",
  practitionerRef?: string
): Promise<any> {
  const client = await getClient();
  const date = timestamp.slice(0, 10);
  const slotTag = `slot:${date}:${doseSlot}`;

  const existing = (await client
    .request(
      `MedicationStatement?subject=Patient/${patient.id}&_count=50&date=${date}&_sort=-_lastUpdated`,
      { flat: true }
    )
    .catch(() => [])) as any[];

  const already = existing.find((s) =>
    (s.note || []).some((n: any) => typeof n.text === "string" && n.text.includes(slotTag))
  );
  if (already) return already;

  const ms = {
    resourceType: "MedicationStatement",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    effectiveDateTime: timestamp,
    dateAsserted: new Date().toISOString(),
    medicationCodeableConcept: { text: medicationText },
    taken: taken ? "y" : "n",
    note: [{ text: `${slotTag}; taken=${taken}` }],
    ...(practitionerRef
      ? { informationSource: { reference: practitionerRef } }
      : { informationSource: { reference: `Patient/${patient.id}` } }),
  };
  return client.create(ms as any);
}

export async function listPatientMedicationStatements(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `MedicationStatement?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=50`,
      { flat: true }
    )) as any[];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const s of r) {
      const key =
        (s.note || [])
          .map((n: any) => (n.text || "").match(/slot:\d{4}-\d{2}-\d{2}:(AM|PM)/)?.[0])
          .find(Boolean) || s.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out;
  } catch {
    return [];
  }
}

/* ---------------- CarePlan ---------------- */

export async function createCarePlan(
  patient: any,
  description: string,
  end?: string
): Promise<any> {
  const client = await getClient();
  const existing = (await client.request(
    `CarePlan?subject=Patient/${patient.id}&status=active&_sort=-_lastUpdated`,
    { flat: true }
  )) as any[];
  for (const cp of existing) {
    try {
      await client.update({ ...cp, status: "revoked" });
    } catch {}
  }
  const carePlan = {
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    subject: { reference: `Patient/${patient.id}` },
    period: { start: new Date().toISOString(), end },
    description,
    title: "Care Plan",
    activity: [],
  };
  return client.create(carePlan as any);
}

export async function listCarePlans(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `CarePlan?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=10`,
      { flat: true }
    )) as any[];
    const active = r.find((cp) => cp.status === "active");
    return active ? [active] : r.slice(0, 1);
  } catch {
    return [];
  }
}

/* ---------------- ServiceRequest (Referrals) ---------------- */

export async function createServiceRequest(
  patient: any,
  specialty: string,
  reason?: string,
  priority: "routine" | "urgent" | "asap" = "routine"
): Promise<any> {
  const client = await getClient();
  const existing = (await client.request(
    `ServiceRequest?subject=Patient/${patient.id}&status=active&_sort=-_lastUpdated`,
    { flat: true }
  )) as any[];
  const dup = existing.find((sr) => sr.code?.text === specialty);
  if (dup) return dup;
  const sr = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    subject: { reference: `Patient/${patient.id}` },
    code: { text: specialty },
    priority,
    authoredOn: new Date().toISOString(),
    reasonCode: reason ? [{ text: reason }] : undefined,
  };
  return client.create(sr as any);
}

export async function listServiceRequests(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `ServiceRequest?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=50`,
      { flat: true }
    )) as any[];
    const seen = new Set<string>(),
      out: any[] = [];
    for (const sr of r) {
      const k = sr.code?.text || "unknown";
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(sr);
    }
    return out;
  } catch {
    return [];
  }
}

/* ---------------- NutritionOrder ---------------- */

export async function createNutritionOrder(patient: any, instruction: string): Promise<any> {
  const client = await getClient();
  const existing = (await client.request(
    `NutritionOrder?subject=Patient/${patient.id}&_sort=-_lastUpdated`,
    { flat: true }
  )) as any[];
  for (const no of existing.filter((x) => x.status === "active")) {
    try {
      await client.update({ ...no, status: "completed" });
    } catch {}
  }
  const order = {
    resourceType: "NutritionOrder",
    status: "active",
    intent: "order",
    dateTime: new Date().toISOString(),
    patient: { reference: `Patient/${patient.id}` },
    oralDiet: { instruction: instruction || "Dietary instructions" },
    note: [{ text: "single-active" }],
  } as any;
  return client.create(order);
}

export async function listNutritionOrders(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `NutritionOrder?subject=Patient/${patientId}&_sort=-_lastUpdated&_count=10`,
      { flat: true }
    )) as any[];
    return r?.length ? [r[0]] : [];
  } catch {
    return [];
  }
}

/* ---------------- Appointment ---------------- */

export async function createAppointment(
  patient: any,
  title: string,
  startIso: string
): Promise<any> {
  const client = await getClient();
  const existing = await listAppointments(patient.id);
  const future = existing.find((a) => a.start && new Date(a.start) > new Date());
  if (future) return future;
  const appt = {
    resourceType: "Appointment",
    status: "booked",
    start: startIso,
    end: new Date(new Date(startIso).getTime() + 30 * 60000).toISOString(),
    participant: [{ actor: { reference: `Patient/${patient.id}` }, status: "accepted" }],
    description: title || "Follow-up appointment",
  };
  return client.create(appt as any);
}

export async function listAppointments(patientId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `Appointment?participant=Patient/${patientId}&_sort=-_lastUpdated&_count=10`,
      { flat: true }
    )) as any[];
    return r?.length ? [r[0]] : [];
  } catch {
    return [];
  }
}

/* ---------------- Panel (CareTeam) ---------------- */

export async function listPanelPatients(practitionerId: string): Promise<any[]> {
  const client = await getClient();
  try {
    const teams = (await client.request(
      `CareTeam?participant=Practitioner/${practitionerId}&_include=CareTeam:subject`,
      { flat: true }
    )) as any[];
    const patients: any[] = [];
    for (const r of teams) {
      if (r.resourceType === "Patient") patients.push(r);
      if (r.subject?.reference?.startsWith("Patient/")) {
        const p = await client.request(r.subject.reference);
        patients.push(p);
      }
    }
    const seen = new Set<string>();
    return patients.filter((p) => p.id && !seen.has(p.id) && seen.add(p.id));
  } catch {
    return [];
  }
}

export async function addPatientToPanel(practitionerId: string, patientId: string): Promise<any> {
  const client = await getClient();
  const existing = (await client.request(
    `CareTeam?participant=Practitioner/${practitionerId}&subject=Patient/${patientId}`,
    { flat: true }
  )) as any[];
  if (existing?.length) return existing[0];
  const ct = {
    resourceType: "CareTeam",
    status: "active",
    subject: { reference: `Patient/${patientId}` },
    participant: [{ member: { reference: `Practitioner/${practitionerId}` } }],
    name: "Panel Enrollment",
    category: [{ text: "panel" }],
  };
  return client.create(ct as any);
}

export async function searchPatientsByName(name: string): Promise<any[]> {
  const client = await getClient();
  const r = (await client.request(`Patient?name=${encodeURIComponent(name)}&_count=20`, {
    flat: true,
  })) as any[];
  return r || [];
}

/* ---------------- Communication ---------------- */

export async function createCommunicationToPatient(
  patient: any,
  text: string,
  practitionerRef?: string
): Promise<any> {
  const client = await getClient();
  const comm = {
    resourceType: "Communication",
    status: "completed",
    subject: { reference: `Patient/${patient.id}` },
    sent: new Date().toISOString(),
    payload: [{ contentString: text }],
    recipient: [{ reference: `Patient/${patient.id}` }],
    ...(practitionerRef ? { sender: { reference: practitionerRef } } : {}),
  };
  return client.create(comm as any);
}

export async function listMyCommunications(practitionerRef: string): Promise<any[]> {
  const client = await getClient();
  try {
    const r = (await client.request(
      `Communication?sender=${encodeURIComponent(practitionerRef)}&_sort=-sent&_count=50`,
      { flat: true }
    )) as any[];
    return r || [];
  } catch {
    return [];
  }
}
