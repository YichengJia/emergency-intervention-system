import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Plus } from 'lucide-react';

export default function AppointmentManager({ client, patient }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrimaryCareInfo, setShowPrimaryCareInfo] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [client, patient.id]);

  const fetchAppointments = async () => {
    try {
      const bundle = await client.request(
        `Appointment?patient=${patient.id}&_sort=date&status=booked,pending,arrived`
      );

      const appts = bundle.entry?.map(entry => entry.resource) || [];
      setAppointments(appts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getAppointmentType = (appointment) => {
    if (appointment.serviceType && appointment.serviceType[0]) {
      return appointment.serviceType[0].text ||
             appointment.serviceType[0].coding?.[0]?.display ||
             'General Consultation';
    }
    return 'General Consultation';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'booked': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'arrived': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
          Appointment Management
        </h1>
        <p className="text-gray-600">
          Manage your healthcare appointments and follow-ups
        </p>
      </div>

      {/* Schedule Primary Care Button */}
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Primary Care is Your First Stop
            </h2>
            <p className="text-green-700 text-sm">
              Regular primary care visits prevent emergency situations
            </p>
          </div>
          <button
            onClick={() => setShowPrimaryCareInfo(!showPrimaryCareInfo)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Schedule Primary Care
          </button>
        </div>

        {showPrimaryCareInfo && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              How to Schedule with Primary Care:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Call your primary care office during business hours</span>
              </li>
              <li className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Use the patient portal to request appointments online</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Ask about same-day appointments for urgent needs</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Upcoming Appointments
        </h2>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No upcoming appointments scheduled</p>
            <p className="text-sm text-gray-500">
              Schedule regular check-ups with your primary care provider to stay healthy
            </p>
          </div>
        ) : (
          appointments.map((appointment, idx) => {
            const { date, time } = formatDateTime(appointment.start);
            return (
              <div key={appointment.id || idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {getAppointmentType(appointment)}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{date} at {time}</span>
                      </div>

                      {appointment.participant && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            Provider: {
                              appointment.participant.find(p => p.actor?.display)?.actor?.display ||
                              'To be assigned'
                            }
                          </span>
                        </div>
                      )}

                      {appointment.description && (
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <p className="text-gray-700">{appointment.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Duration: {appointment.minutesDuration || 30} minutes
                    </p>
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Add to Calendar
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-sm text-red-600 hover:text-red-700">
                        Cancel/Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Follow-up Reminders */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Follow-up Care Guidelines
        </h2>
        <ul className="space-y-3 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <div>
              <p className="font-medium">After Emergency Department Visit</p>
              <p className="text-sm">Schedule follow-up within 48-72 hours with primary care</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <div>
              <p className="font-medium">Chronic Condition Management</p>
              <p className="text-sm">Regular appointments every 3-6 months as recommended</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <div>
              <p className="font-medium">Preventive Care</p>
              <p className="text-sm">Annual wellness visits and recommended screenings</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}