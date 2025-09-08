import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Pill, User, Phone, AlertTriangle, CheckCircle, FileText, Heart, Activity } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: '张小明',
      age: 65,
      condition: 'Chronic Heart Disease',
      lastVisit: '2025-08-15',
      visitCount: 6,
      riskLevel: 'high',
      medications: [
        { name: 'Aspirin', time: '08:00', taken: true },
        { name: 'Metoprolol', time: '20:00', taken: false }
      ]
    },
    {
      id: 2,
      name: '李阿姨',
      age: 58,
      condition: 'Diabetes',
      lastVisit: '2025-08-10',
      visitCount: 4,
      riskLevel: 'medium',
      medications: [
        { name: 'Metformin', time: '12:00', taken: true },
        { name: 'Insulin', time: '18:00', taken: false }
      ]
    }
  ]);
  
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientId: 1,
      type: 'Primary Care Visit',
      date: '2025-08-20',
      time: '14:00',
      provider: 'Dr. Johnson',
      status: 'scheduled'
    },
    {
      id: 2,
      patientId: 2,
      type: 'Follow-up Check',
      date: '2025-08-22',
      time: '10:30',
      provider: 'Dr. Smith',
      status: 'pending'
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'medication',
      message: 'Zhang Xiaoming needs to take Metoprolol',
      time: '20:00',
      urgent: true
    },
    {
      id: 2,
      type: 'followup',
      message: "Ms. Li's follow-up appointment is due tomorrow",
      time: '10:30',
      urgent: false
    }
  ]);

  // Dashboard
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">High-Risk Patients</p>
              <p className="text-2xl font-bold text-red-800">
                {patients.filter(p => p.riskLevel === 'high').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Medium-Risk Patients</p>
              <p className="text-2xl font-bold text-yellow-800">
                {patients.filter(p => p.riskLevel === 'medium').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Today’s Appointments</p>
              <p className="text-2xl font-bold text-green-800">
                {appointments.filter(a => a.date === '2025-08-18').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Urgent Alerts
        </h3>
        <div className="space-y-3">
          {notifications.map(notification => (
            <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
              notification.urgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
            }`}>
              <p className="font-medium">{notification.message}</p>
              <p className="text-sm text-gray-600">{notification.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Patients
  const PatientManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient List
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {patients.map(patient => (
            <div key={patient.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        patient.riskLevel === 'high' ? 'bg-red-500' : 
                        patient.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-lg font-medium">{patient.name}</p>
                      <p className="text-gray-600">{patient.age} yrs | {patient.condition}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Last Visit: {patient.lastVisit}</span>
                    <span>Total Visits: {patient.visitCount}</span>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Medications
  const MedicationManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <Pill className="h-5 w-5 mr-2" />
            Medication Reminders
          </h3>
        </div>
        <div className="p-6">
          {patients.map(patient => (
            <div key={patient.id} className="mb-6 last:mb-0">
              <h4 className="font-semibold text-gray-800 mb-3">{patient.name}</h4>
              <div className="space-y-3">
                {patient.medications.map((med, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                    med.taken ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        med.taken ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {med.taken && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">Scheduled Time: {med.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        med.taken ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {med.taken ? 'Taken' : 'Pending'}
                      </span>
                      <button 
                        onClick={() => {
                          setPatients(prev => prev.map(p => 
                            p.id === patient.id ? {
                              ...p,
                              medications: p.medications.map((m, i) => 
                                i === index ? { ...m, taken: !m.taken } : m
                              )
                            } : p
                          ));
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Appointments
  const AppointmentManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointment Management
            </h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              New Appointment
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {appointments.map(appointment => {
            const patient = patients.find(p => p.id === appointment.patientId);
            return (
              <div key={appointment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-semibold">{patient?.name} - {appointment.type}</p>
                        <p className="text-gray-600">{appointment.date} {appointment.time}</p>
                        <p className="text-sm text-gray-500">Provider: {appointment.provider}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Health Education
  const HealthEducation = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Health Education Resources
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Heart className="h-6 w-6 text-red-500 mr-2" />
                <h4 className="font-semibold">Heart Disease Management</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• How to monitor blood pressure and heart rate</li>
                <li>• Heart-healthy diet guidelines</li>
                <li>• Recommended moderate exercise</li>
                <li>• Recognizing and handling emergencies</li>
              </ul>
              <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                View full guide →
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Activity className="h-6 w-6 text-green-500 mr-2" />
                <h4 className="font-semibold">Diabetes Management</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Blood glucose monitoring tips</li>
                <li>• Diet planning and nutrition</li>
                <li>• Insulin usage guidance</li>
                <li>• Complications prevention</li>
              </ul>
              <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                View full guide →
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-800 mb-3">Emergency Handling Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-3">
            <h5 className="font-medium text-red-600 mb-2">Chest Pain</h5>
            <p className="text-sm">Call 000 immediately, stay calm, and take nitroglycerin if prescribed.</p>
          </div>
          <div className="bg-white rounded p-3">
            <h5 className="font-medium text-red-600 mb-2">Breathing Difficulty</h5>
            <p className="text-sm">Sit upright, use rescue inhaler if available, and seek help.</p>
          </div>
          <div className="bg-white rounded p-3">
            <h5 className="font-medium text-red-600 mb-2">Abnormal Blood Glucose</h5>
            <p className="text-sm">Check blood glucose and take glucose or insulin as appropriate.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Emergency Intervention System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Queensland Health System | 2025-08-18</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                User Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white rounded-lg shadow mr-8">
            <div className="p-6">
              <ul className="space-y-2">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: Activity },
                  { id: 'patients', name: 'Patients', icon: User },
                  { id: 'medications', name: 'Medications', icon: Pill },
                  { id: 'appointments', name: 'Appointments', icon: Calendar },
                  { id: 'education', name: 'Health Education', icon: FileText }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'patients' && <PatientManagement />}
            {activeTab === 'medications' && <MedicationManagement />}
            {activeTab === 'appointments' && <AppointmentManagement />}
            {activeTab === 'education' && <HealthEducation />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
