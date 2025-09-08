const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAppointment, handleValidation } = require('../middleware/validation');

router.use(authenticate);

// GET /api/appointments - list appointments relevant to user
router.get('/', appointmentController.getAllAppointments);

// POST /api/appointments - create new appointment
router.post('/', validateAppointment(), handleValidation, appointmentController.createAppointment);

// GET /api/appointments/:id - get appointment
router.get('/:id', appointmentController.getAppointmentById);

// PUT /api/appointments/:id - update appointment
router.put('/:id', validateAppointment(), handleValidation, appointmentController.updateAppointment);

// DELETE /api/appointments/:id - delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;