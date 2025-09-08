// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, canAccessPatientData } = require('../middleware/auth');
const { patientValidationRules, validate } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get patient profile
router.get('/:patientId',
  canAccessPatientData,
  patientController.getPatientProfile
);

// Update patient profile
router.put('/:patientId',
  canAccessPatientData,
  patientController.updatePatientProfile
);

// Get patient medications
router.get('/:patientId/medications',
  canAccessPatientData,
  patientController.getMedications
);

// Update medication adherence
router.post('/:patientId/medications/:medicationId/adherence',
  canAccessPatientData,
  patientController.updateMedicationAdherence
);

// Get patient vitals
router.get('/:patientId/vitals',
  canAccessPatientData,
  patientController.getVitals
);

// Add new vitals
router.post('/:patientId/vitals',
  canAccessPatientData,
  patientValidationRules.updateVitals,
  validate,
  patientController.addVitals
);

// Get patient appointments
router.get('/:patientId/appointments',
  canAccessPatientData,
  patientController.getAppointments
);

// Get medical history
router.get('/:patientId/medical-history',
  canAccessPatientData,
  patientController.getMedicalHistory
);

// Get risk assessment
router.get('/:patientId/risk-assessment',
  canAccessPatientData,
  patientController.getRiskAssessment
);

// Emergency protocols
router.get('/:patientId/emergency-protocols',
  canAccessPatientData,
  patientController.getEmergencyProtocols
);

module.exports = router;