const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegistration, validateLogin, handleValidation } = require('../middleware/validation');

// Register a new user
router.post('/register', validateRegistration(), handleValidation, register);

// Login a user
router.post('/login', validateLogin(), handleValidation, login);

module.exports = router;