const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Get a list of all patients. Only doctors or admins should be allowed.
 */
async function getAllPatients(req, res, next) {
  try {
    const patients = await Patient.find().populate('user', '-password');
    res.json(patients);
  } catch (err) {
    next(err);
  }
}

/**
 * Get details for a single patient by ID.
 */
async function getPatientById(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id).populate('user', '-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Patients may only access their own record, unless doctor or admin
    if (req.user.role === 'patient' && patient.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(patient);
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new patient record. Associates the record with the authenticated user.
 */
async function createPatient(req, res, next) {
  try {
    // Only allow patient role to create their own record, or doctor/admin to create on behalf of patient
    const { name, dob, gender, email, phone, address, medicalHistory } = req.body;
    let userId;
    if (req.user.role === 'patient') {
      userId = req.user._id;
    } else {
      // For doctors/admins allow specifying a user id; if none specified create new user with patient role
      userId = req.body.userId;
      if (!userId) {
        // create new user
        const user = new User({ name, email, role: 'patient', password: 'temp1234' });
        await user.save();
        userId = user._id;
      }
    }
    const patient = new Patient({ user: userId, name, dob, gender, email, phone, address, medicalHistory });
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing patient record.
 */
async function updatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body;
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Patients may only update their own record, unless doctor/admin
    if (req.user.role === 'patient' && patient.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(patient, update);
    await patient.save();
    res.json(patient);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a patient record.
 */
async function deletePatient(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Patients may only delete their own record, unless doctor/admin
    if (req.user.role === 'patient' && patient.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await patient.remove();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};