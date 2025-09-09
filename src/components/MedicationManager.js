import React, { useEffect, useState } from 'react';
import { Pill, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function MedicationManager({ client, patient }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    fetchMedications();
  }, [client, patient.id]);

  const fetchMedications = async () => {
    try {
      const bundle = await client.request(
        `MedicationRequest?patient=${patient.id}&status=active,completed`
      );

      const meds = bundle.entry?.map(entry => entry.resource) || [];
      setMedications(meds);

      // Initialize reminders from localStorage
      const savedReminders = localStorage.getItem(`reminders_${patient.id}`);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setLoading(false);
    }
  };

  const toggleReminder = (medId) => {
    const newReminders = {
      ...reminders,
      [medId]: !reminders[medId]
    };
    setReminders(newReminders);
    localStorage.setItem(`reminders_${patient.id}`, JSON.stringify(newReminders));
  };

  const getMedicationName = (med) => {
    if (med.medicationCodeableConcept) {
      return med.medicationCodeableConcept.text ||
             med.medicationCodeableConcept.coding?.[0]?.display ||
             'Unknown medication';
    }
    if (med.medicationReference) {
      return med.medicationReference.display || 'Unknown medication';
    }
    return 'Unknown medication';
  };

  const getDosageInstructions = (med) => {
    if (med.dosageInstruction && med.dosageInstruction[0]) {
      const dosage = med.dosageInstruction[0];
      return dosage.text || `${dosage.timing?.repeat?.frequency || 1} times daily`;
    }
    return 'See prescription label';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Medication Management
        </h1>
        <p className="text-gray-600">
          Track your medications and set reminders to improve adherence
        </p>
      </div>

      {/* Adherence Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-blue-900">Medication Adherence Tips</h2>
        </div>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Take medications at the same time each day</li>
          <li>• Use a pill organizer to track daily doses</li>
          <li>• Set alarms or use reminder apps</li>
          <li>• Keep a medication diary</li>
          <li>• Never stop medications without consulting your doctor</li>
        </ul>
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {medications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active medications found</p>
          </div>
        ) : (
          medications.map((med, idx) => (
            <div key={med.id || idx} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Pill className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getMedicationName(med)}
                    </h3>
                    {med.status === 'active' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Dosage: {getDosageInstructions(med)}</span>
                    </p>

                    {med.reasonCode && med.reasonCode[0] && (
                      <p>Prescribed for: {med.reasonCode[0].text || med.reasonCode[0].coding?.[0]?.display}</p>
                    )}

                    {med.authoredOn && (
                      <p>Started: {new Date(med.authoredOn).toLocaleDateString()}</p>
                    )}

                    {med.note && med.note[0] && (
                      <p className="italic">Note: {med.note[0].text}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleReminder(med.id)}
                  className={`ml-4 p-3 rounded-lg transition-colors ${
                    reminders[med.id] 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={reminders[med.id] ? 'Reminder set' : 'Set reminder'}
                >
                  {reminders[med.id] ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </button>
              </div>

              {reminders[med.id] && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Reminder is active for this medication
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Refill Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Refill Information
        </h2>
        <p className="text-gray-600 mb-4">
          Contact your pharmacy or primary care provider for refills:
        </p>
        <div className="space-y-2 text-sm">
          <p><strong>Primary Care:</strong> Contact through patient portal or call during office hours</p>
          <p><strong>Pharmacy:</strong> Most prescriptions can be refilled directly through your pharmacy</p>
          <p><strong>Emergency Supply:</strong> If you run out, contact your pharmacy for an emergency supply</p>
        </div>
      </div>
    </div>
  );
}