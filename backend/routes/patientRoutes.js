const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePatient, handleValidation } = require('../middleware/validation');

// All endpoints require authentication
router.use(authenticate);

// GET /api/patients - doctors and admins can view all patients
router.get('/', authorize('doctor', 'admin'), patientController.getAllPatients);

// POST /api/patients - create a new patient record
router.post('/', validatePatient(), handleValidation, patientController.createPatient);

// GET /api/patients/:id - view a specific patient
router.get('/:id', patientController.getPatientById);

// PUT /api/patients/:id - update a patient record
router.put('/:id', validatePatient(), handleValidation, patientController.updatePatient);

// DELETE /api/patients/:id - delete a patient
router.delete('/:id', patientController.deletePatient);

module.exports = router;