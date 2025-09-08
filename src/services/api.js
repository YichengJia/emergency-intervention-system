// src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make authenticated requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Patient methods
  async getPatient(patientId) {
    return this.request(`/patients/${patientId}`);
  }

  async updatePatient(patientId, data) {
    return this.request(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getPatientMedications(patientId) {
    return this.request(`/patients/${patientId}/medications`);
  }

  async updateMedicationStatus(patientId, medicationId, taken) {
    return this.request(`/patients/${patientId}/medications/${medicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ taken })
    });
  }

  // Doctor methods
  async getDoctorPatients() {
    return this.request('/doctors/patients');
  }

  async getDoctorAppointments() {
    return this.request('/doctors/appointments');
  }

  async addPatientNote(patientId, note) {
    return this.request(`/doctors/patients/${patientId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  }

  // Appointment methods
  async getAppointments() {
    return this.request('/appointments');
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  }

  async updateAppointment(appointmentId, data) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelAppointment(appointmentId) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE'
    });
  }

  // Privacy and consent methods
  async getPrivacyPolicy() {
    return this.request('/privacy/policy');
  }

  async getUserConsent(userId) {
    return this.request(`/privacy/consent/${userId}`);
  }

  async updateConsent(userId, consentData) {
    return this.request(`/privacy/consent/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(consentData)
    });
  }

  // Notification methods
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // Health metrics
  async submitVitals(patientId, vitals) {
    return this.request(`/patients/${patientId}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vitals)
    });
  }

  async getVitalsHistory(patientId, days = 30) {
    return this.request(`/patients/${patientId}/vitals?days=${days}`);
  }

  // Reports and analytics
  async getPatientReport(patientId, type = 'summary') {
    return this.request(`/reports/patient/${patientId}?type=${type}`);
  }

  async getDoctorAnalytics(doctorId) {
    return this.request(`/reports/doctor/${doctorId}/analytics`);
  }
}

// Create singleton instance
const apiService = new ApiService();

// FHIR Client wrapper for future implementation
class FHIRService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_FHIR_SERVER || 'https://fhir.example.com';
    this.clientId = process.env.REACT_APP_SMART_CLIENT_ID;
  }

  // SMART on FHIR Authorization
  async authorize() {
    // This would implement the SMART authorization flow
    // Currently a placeholder for future implementation
    console.log('SMART on FHIR authorization would be implemented here');

    const authUrl = `${this.baseUrl}/auth/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: window.location.origin + '/callback',
      scope: 'patient/Patient.read patient/Observation.read launch',
      state: this.generateState(),
      aud: this.baseUrl
    });

    // In production, this would redirect to the authorization endpoint
    // window.location.href = `${authUrl}?${params}`;

    return Promise.resolve({
      authorized: false,
      message: 'FHIR integration not yet implemented'
    });
  }

  // Generate random state for OAuth
  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
    // Placeholder for token exchange
    return Promise.resolve({
      access_token: 'mock_token',
      patient: 'mock_patient_id'
    });
  }

  // FHIR Resource methods
  async getPatient(patientId) {
    // This would fetch a FHIR Patient resource
    return {
      resourceType: 'Patient',
      id: patientId,
      name: [{
        given: ['John'],
        family: 'Doe'
      }],
      gender: 'male',
      birthDate: '1960-01-01'
    };
  }

  async getObservations(patientId, code = null) {
    // This would fetch FHIR Observation resources
    const params = new URLSearchParams({
      patient: patientId
    });

    if (code) {
      params.append('code', code);
    }

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: []
    };
  }

  async getMedicationRequests(patientId) {
    // This would fetch FHIR MedicationRequest resources
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: []
    };
  }

  async getConditions(patientId) {
    // This would fetch FHIR Condition resources
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: []
    };
  }

  // Create FHIR resources
  async createObservation(observation) {
    // This would create a new FHIR Observation
    return {
      resourceType: 'Observation',
      id: 'new-observation-id',
      ...observation
    };
  }

  async createAppointment(appointment) {
    // This would create a new FHIR Appointment
    return {
      resourceType: 'Appointment',
      id: 'new-appointment-id',
      ...appointment
    };
  }

  // Utility method to convert internal data to FHIR format
  toFHIRPatient(internalPatient) {
    return {
      resourceType: 'Patient',
      id: internalPatient.id,
      identifier: [{
        system: 'http://emergency-intervention.example.com',
        value: internalPatient.id
      }],
      name: [{
        text: internalPatient.name,
        given: [internalPatient.name.split(' ')[0]],
        family: internalPatient.name.split(' ').slice(1).join(' ')
      }],
      telecom: [{
        system: 'email',
        value: internalPatient.email
      }],
      gender: internalPatient.gender || 'unknown',
      birthDate: internalPatient.birthDate
    };
  }

  // Utility method to convert FHIR data to internal format
  fromFHIRPatient(fhirPatient) {
    return {
      id: fhirPatient.id,
      name: fhirPatient.name?.[0]?.text ||
            `${fhirPatient.name?.[0]?.given?.join(' ')} ${fhirPatient.name?.[0]?.family}`,
      email: fhirPatient.telecom?.find(t => t.system === 'email')?.value,
      gender: fhirPatient.gender,
      birthDate: fhirPatient.birthDate
    };
  }
}

// Create singleton instances
const fhirService = new FHIRService();

// Export services
export { apiService, fhirService };
export default apiService;