// backend/controllers/authController.js
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');

/**
 * Generate a JWT for the provided user id.
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

/**
 * Register a new user and automatically create corresponding profile.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, specialty, licenseNumber, dob, gender, phone } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Create user account
    const user = new User({ name, email, password, role });
    await user.save();

    // Automatically create corresponding profile based on role
    if (role === 'patient') {
      // Create patient profile
      const patient = new Patient({
        user: user._id,
        name: name,
        dob: dob || new Date('1990-01-01'), // Default DOB if not provided
        gender: gender || 'other',
        email: email,
        phone: phone || '',
        address: '',
        medicalHistory: []
      });
      await patient.save();

    } else if (role === 'doctor') {
      // Create doctor profile
      const doctor = new Doctor({
        user: user._id,
        specialty: specialty || 'General Medicine',
        licenseNumber: licenseNumber || `DOC${Date.now()}`, // Generate unique license if not provided
        phone: phone || '',
        email: email
      });
      await doctor.save();
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      user: safeUser,
      token,
      message: 'Registration successful! Profile created automatically.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log a user in and include profile information.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get profile based on role
    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({
      user: safeUser,
      token,
      profile
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};