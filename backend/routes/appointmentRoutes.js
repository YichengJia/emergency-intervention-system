// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { appointmentValidationRules, validate } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get appointments
router.get('/',
  appointmentController.getAppointments
);

// Get appointment by ID
router.get('/:id',
  appointmentController.getAppointmentById
);

// Create new appointment
router.post('/',
  appointmentValidationRules.create,
  validate,
  appointmentController.createAppointment
);

// Update appointment
router.put('/:id',
  appointmentValidationRules.update,
  validate,
  appointmentController.updateAppointment
);

// Cancel appointment
router.delete('/:id',
  appointmentController.cancelAppointment
);

// Reschedule appointment
router.post('/:id/reschedule',
  appointmentController.rescheduleAppointment
);

// Get available slots
router.get('/slots/available',
  appointmentController.getAvailableSlots
);

// Send appointment reminder
router.post('/:id/reminder',
  appointmentController.sendReminder
);

module.exports = router;