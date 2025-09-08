const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');

router.use(authenticate);

// GET /api/doctors - list doctors (admin and doctors themselves)
router.get('/', authorize('admin', 'doctor'), doctorController.getAllDoctors);

// POST /api/doctors - create a doctor (admin only)
router.post('/', authorize('admin'), doctorController.createDoctor);

// GET /api/doctors/:id - get doctor
router.get('/:id', doctorController.getDoctorById);

// PUT /api/doctors/:id - update doctor
router.put('/:id', doctorController.updateDoctor);

// DELETE /api/doctors/:id - delete doctor
router.delete('/:id', authorize('admin'), doctorController.deleteDoctor);

module.exports = router;