// Frontend constants

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
export const FHIR_BASE_URL = process.env.REACT_APP_FHIR_BASE_URL || 'https://fhirserver.example.com';

// User roles supported by the application
export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};