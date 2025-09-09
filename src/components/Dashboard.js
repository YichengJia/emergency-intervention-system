import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Pill, Activity, Users } from 'lucide-react';
import { calculateRiskScore } from '../utils/riskCalculator';

export default function Dashboard({ client, patient }) {
  const [encounters, setEncounters] = useState([]);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [riskLevel, setRiskLevel] = useState('low');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent emergency encounters
        const encounterBundle = await client.request(
          `Encounter?patient=${patient.id}&class=EMER&_sort=-date&_count=10`
        );

        // Fetch active medications
        const medBundle = await client.request(
          `MedicationRequest?patient=${patient.id}&status=active`
        );

        // Fetch upcoming appointments
        const apptBundle = await client.request(
          `Appointment?patient=${patient.id}&status=booked,pending&date=ge${new Date().toISOString().split('T')[0]}`
        );

        setEncounters(encounterBundle.entry?.map(e => e.resource) || []);
        setMedications(medBundle.entry?.map(e => e.resource) || []);
        setAppointments(apptBundle.entry?.map(e => e.resource) || []);

        // Calculate risk score based on ED visits
        const risk = calculateRiskScore(encounterBundle.entry || []);
        setRiskLevel(risk);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [client, patient.id]);

  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getPatientName = () => {
    if (patient.name && patient.name[0]) {
      const name = patient.name[0];
      return `${name.given?.join(' ')} ${name.family}`;
    }
    return 'Patient';
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
          Welcome back, {getPatientName()}
        </h1>
        <p className="text-gray-600">
          Emergency Department Visit Prevention Dashboard
        </p>

        {/* Risk Alert */}
        {riskLevel !== 'low' && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${getRiskColor(riskLevel)}`}>
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {riskLevel === 'high' ? 'High Risk Alert' : 'Medium Risk Alert'}
              </p>
              <p className="text-sm">
                You have had {encounters.length} emergency visits recently.
                Let's work together to manage your health better.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">ED Visits (Last Year)</p>
              <p className="text-2xl font-bold text-gray-800">
                {encounters.length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Medications</p>
              <p className="text-2xl font-bold text-gray-800">
                {medications.length}
              </p>
            </div>
            <Pill className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-800">
                {appointments.length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Risk Level</p>
              <p className="text-2xl font-bold capitalize text-gray-800">
                {riskLevel}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Next Steps to Reduce ED Visits
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <p className="font-medium">Schedule Primary Care Visit</p>
                <p className="text-sm text-gray-600">
                  Regular checkups prevent emergency situations
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <p className="font-medium">Take Medications as Prescribed</p>
                <p className="text-sm text-gray-600">
                  Set reminders to never miss a dose
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <p className="font-medium">Monitor Your Symptoms</p>
                <p className="text-sm text-gray-600">
                  Track changes and report to your care team
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Emergency Visits
          </h2>
          {encounters.length === 0 ? (
            <p className="text-gray-600">No recent emergency visits. Great job!</p>
          ) : (
            <ul className="space-y-2">
              {encounters.slice(0, 3).map((encounter, idx) => (
                <li key={idx} className="border-b pb-2">
                  <p className="font-medium">
                    {new Date(encounter.period?.start).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reason: {encounter.reasonCode?.[0]?.text || 'Not specified'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}