import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (err) {
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">My Appointments</h2>
      {error && <div className="text-red-600">{error}</div>}
      {appointments.length === 0 ? (
        <p>You have no upcoming appointments.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b">Date</th>
              <th className="px-4 py-2 border-b">Doctor</th>
              <th className="px-4 py-2 border-b">Reason</th>
              <th className="px-4 py-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt._id} className="border-b">
                <td className="px-4 py-2">{formatDate(appt.appointmentDate)}</td>
                <td className="px-4 py-2">{appt.doctor?.name || 'N/A'}</td>
                <td className="px-4 py-2">{appt.reason || '—'}</td>
                <td className="px-4 py-2 capitalize">{appt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}