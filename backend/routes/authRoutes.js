// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { userValidationRules, validate } = require('../middleware/validation');
const { authenticateToken, sensitiveOperationLimiter } = require('../middleware/auth');

// Public routes
router.post('/register',
  userValidationRules.register,
  validate,
  authController.register
);

router.post('/login',
  userValidationRules.login,
  validate,
  sensitiveOperationLimiter(),
  authController.login
);

router.post('/forgot-password',
  sensitiveOperationLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  authController.forgotPassword
);

router.post('/reset-password/:token',
  authController.resetPassword
);

// Protected routes
router.get('/verify',
  authenticateToken,
  authController.verifyToken
);

router.post('/logout',
  authenticateToken,
  authController.logout
);

router.post('/refresh-token',
  authController.refreshToken
);

router.put('/change-password',
  authenticateToken,
  authController.changePassword
);

module.exports = router;