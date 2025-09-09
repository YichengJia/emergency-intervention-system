import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FHIR from 'fhirclient';
import Dashboard from './components/Dashboard';
import MedicationManager from './components/MedicationManager';
import AppointmentManager from './components/AppointmentManager';
import EmergencyTracker from './components/EmergencyTracker';
import Navigation from './components/Navigation';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

function App() {
  const [client, setClient] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize SMART on FHIR client
    FHIR.oauth2.ready()
      .then(fhirClient => {
        setClient(fhirClient);
        // Get current patient
        return fhirClient.patient.read();
      })
      .then(patientData => {
        setPatient(patientData);
        setLoading(false);
      })
      .catch(err => {
        console.error('FHIR initialization error:', err);
        setError(err.message || 'Failed to connect to EHR system');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!client || !patient) return <ErrorScreen error="No patient context available" />;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation patient={patient} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard client={client} patient={patient} />} />
            <Route path="/medications" element={<MedicationManager client={client} patient={patient} />} />
            <Route path="/appointments" element={<AppointmentManager client={client} patient={patient} />} />
            <Route path="/emergency-tracker" element={<EmergencyTracker client={client} patient={patient} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;