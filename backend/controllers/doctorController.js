const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * Get all doctors. Only admins or doctors themselves should be allowed.
 */
async function getAllDoctors(req, res, next) {
  try {
    const doctors = await Doctor.find().populate('user', '-password');
    res.json(doctors);
  } catch (err) {
    next(err);
  }
}

/**
 * Get a doctor by id.
 */
async function getDoctorById(req, res, next) {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).populate('user', '-password');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // Doctors may only view their own record unless admin
    if (req.user.role === 'doctor' && doctor.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new doctor record. Only admins should be allowed.
 */
async function createDoctor(req, res, next) {
  try {
    const { name, email, password, specialty, licenseNumber, phone } = req.body;
    // Create associated user with doctor role
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const user = new User({ name, email, password, role: 'doctor' });
    await user.save();
    const doctor = new Doctor({ user: user._id, specialty, licenseNumber, phone, email });
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

/**
 * Update a doctor record.
 */
async function updateDoctor(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body;
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // Doctors may only update their own record unless admin
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(doctor, update);
    await doctor.save();
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a doctor record. Only admin can perform.
 */
async function deleteDoctor(req, res, next) {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await doctor.remove();
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};