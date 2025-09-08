// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get fresh user data from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please login again.'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Server error during authentication.'
    });
  }
};

// Check for specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Check if user can access patient data
const canAccessPatientData = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Admins can access all data
    if (req.user.role === 'admin') {
      return next();
    }

    // Patients can only access their own data
    if (req.user.role === 'patient') {
      if (req.user._id.toString() !== patientId) {
        return res.status(403).json({
          error: 'Access denied. You can only access your own data.'
        });
      }
      return next();
    }

    // Doctors can access their assigned patients
    if (req.user.role === 'doctor') {
      const Patient = require('../models/Patient');
      const patient = await Patient.findOne({ userId: patientId });

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found.'
        });
      }

      const isAssigned = patient.assignedDoctors.some(
        doctorId => doctorId.toString() === req.user._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          error: 'Access denied. You are not assigned to this patient.'
        });
      }

      return next();
    }

    res.status(403).json({
      error: 'Access denied.'
    });
  } catch (error) {
    console.error('Access control error:', error);
    res.status(500).json({
      error: 'Server error during access control.'
    });
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.user ? req.user._id : 'anonymous'}`;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key).filter(
      timestamp => now - timestamp < windowMs
    );

    if (userAttempts.length >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.'
      });
    }

    userAttempts.push(now);
    attempts.set(key, userAttempts);

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  canAccessPatientData,
  sensitiveOperationLimiter
};

// backend/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware wrapper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
const userValidationRules = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('role')
      .isIn(['patient', 'doctor'])
      .withMessage('Role must be either patient or doctor'),
    body('hasAcceptedPrivacy')
      .isBoolean()
      .equals('true')
      .withMessage('Privacy policy must be accepted')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('profile.age')
      .optional()
      .isInt({ min: 0, max: 150 })
      .withMessage('Age must be between 0 and 150'),
    body('profile.phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Please provide a valid phone number')
  ]
};

// Appointment validation rules
const appointmentValidationRules = {
  create: [
    body('patientId')
      .isMongoId()
      .withMessage('Invalid patient ID'),
    body('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    body('date')
      .isISO8601()
      .toDate()
      .withMessage('Invalid date format')
      .custom((value) => value > new Date())
      .withMessage('Appointment date must be in the future'),
    body('startTime')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Start time must be in HH:MM format'),
    body('endTime')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('End time must be in HH:MM format'),
    body('type')
      .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup',
             'vaccination', 'lab-test', 'procedure', 'telemedicine'])
      .withMessage('Invalid appointment type')
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid appointment ID'),
    body('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'in-progress', 'completed',
             'cancelled', 'no-show', 'rescheduled'])
      .withMessage('Invalid status')
  ]
};

// Patient data validation rules
const patientValidationRules = {
  updateVitals: [
    body('bloodPressure.systolic')
      .optional()
      .isInt({ min: 60, max: 250 })
      .withMessage('Systolic pressure must be between 60 and 250'),
    body('bloodPressure.diastolic')
      .optional()
      .isInt({ min: 40, max: 150 })
      .withMessage('Diastolic pressure must be between 40 and 150'),
    body('heartRate')
      .optional()
      .isInt({ min: 30, max: 250 })
      .withMessage('Heart rate must be between 30 and 250'),
    body('temperature.value')
      .optional()
      .isFloat({ min: 30, max: 45 })
      .withMessage('Temperature must be between 30 and 45'),
    body('oxygenSaturation')
      .optional()
      .isInt({ min: 50, max: 100 })
      .withMessage('Oxygen saturation must be between 50 and 100')
  ],

  updateMedication: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Medication name is required'),
    body('dosage')
      .trim()
      .notEmpty()
      .withMessage('Dosage is required'),
    body('frequency')
      .trim()
      .notEmpty()
      .withMessage('Frequency is required'),
    body('startDate')
      .isISO8601()
      .toDate()
      .withMessage('Invalid start date')
  ]
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and other potentially harmful content
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  validate,
  userValidationRules,
  appointmentValidationRules,
  patientValidationRules,
  sanitizeInput
};

// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;