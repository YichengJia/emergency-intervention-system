import React, { useEffect, useState } from 'react';
import FHIR from 'fhirclient';

function App() {
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    FHIR.oauth2.ready()
      .then(client => {
        return Promise.all([
          client.patient.read(),
          client.request(`MedicationRequest?patient=${client.patient.id}`),
          client.request(`Appointment?patient=${client.patient.id}`)
        ]).then(([patient, meds, appts]) => {
          setPatient(patient);
          setMedications(meds.entry || []);
          setAppointments(appts.entry || []);
          setLoading(false);
        });
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading FHIR data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Emergency Intervention System
      </h1>

      {patient && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
          <p>Name: {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}</p>
          <p>Birth Date: {patient.birthDate}</p>
          <p>Gender: {patient.gender}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Medications</h2>
          {medications.length === 0 ? (
            <p>No medications found</p>
          ) : (
            <ul className="space-y-2">
              {medications.map((med, index) => (
                <li key={index} className="border-b pb-2">
                  {med.resource.medicationCodeableConcept?.text ||
                   med.resource.medicationReference?.display ||
                   'Unknown medication'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Appointments</h2>
          {appointments.length === 0 ? (
            <p>No appointments scheduled</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((appt, index) => (
                <li key={index} className="border-b pb-2">
                  <p className="font-medium">{appt.resource.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appt.resource.start).toLocaleString()}
                  </p>
                  <p className="text-sm">Status: {appt.resource.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Emergency Department Visit Tracker
        </h2>
        <p className="mb-4">
          This system helps reduce unnecessary emergency visits through:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Medication reminders and adherence tracking</li>
          <li>Follow-up appointment coordination</li>
          <li>Connection to primary care providers</li>
          <li>Health education resources</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
