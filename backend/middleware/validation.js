const { body, validationResult, param } = require('express-validator');

/**
 * Returns an array of validation chains for registering a new user.
 */
function validateRegistration() {
  return [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role')
  ];
}

/**
 * Returns validation chains for logging in.
 */
function validateLogin() {
  return [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ];
}

/**
 * Returns validation chains for creating or updating a patient.
 */
function validatePatient() {
  return [
    body('name').notEmpty().withMessage('Name is required'),
    body('dob').notEmpty().withMessage('Date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female or other'),
    body('email').optional().isEmail().withMessage('Invalid email')
  ];
}

/**
 * Returns validation chains for creating an appointment.
 */
function validateAppointment() {
  return [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Appointment date must be a valid ISO 8601 string'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ];
}

/**
 * Middleware to handle validation result. If there are validation errors
 * it returns a 400 response with details; otherwise it calls next().
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validatePatient,
  validateAppointment,
  handleValidation
};