// backend/routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication and doctor role
router.use(authenticateToken);
router.use(requireRole('doctor'));

// Get all assigned patients
router.get('/patients',
  doctorController.getAssignedPatients
);

// Get patient details
router.get('/patients/:patientId',
  doctorController.getPatientDetails
);

// Add patient notes
router.post('/patients/:patientId/notes',
  doctorController.addPatientNotes
);

// Update patient risk level
router.put('/patients/:patientId/risk-level',
  doctorController.updateRiskLevel
);

// Prescribe medication
router.post('/patients/:patientId/prescriptions',
  doctorController.prescribeMedication
);

// Get doctor's schedule
router.get('/schedule',
  doctorController.getSchedule
);

// Get doctor's appointments
router.get('/appointments',
  doctorController.getAppointments
);

// Update appointment notes
router.put('/appointments/:appointmentId/notes',
  doctorController.updateAppointmentNotes
);

// Get analytics dashboard
router.get('/analytics',
  doctorController.getAnalytics
);

// Get notifications
router.get('/notifications',
  doctorController.getNotifications
);

module.exports = router;