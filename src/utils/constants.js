// src/utils/constants.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const FHIR_SERVER_URL = process.env.REACT_APP_FHIR_SERVER || 'https://fhir.example.com';

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

export const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow-up',
  EMERGENCY: 'emergency',
  ROUTINE_CHECKUP: 'routine-checkup',
  VACCINATION: 'vaccination',
  LAB_TEST: 'lab-test',
  PROCEDURE: 'procedure',
  TELEMEDICINE: 'telemedicine'
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  RESCHEDULED: 'rescheduled'
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RISK_LEVEL_COLORS = {
  [RISK_LEVELS.LOW]: 'green',
  [RISK_LEVELS.MEDIUM]: 'yellow',
  [RISK_LEVELS.HIGH]: 'orange',
  [RISK_LEVELS.CRITICAL]: 'red'
};
