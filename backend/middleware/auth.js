const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using a JSON Web Token (JWT).
 * The token is expected to be provided in the Authorization header as "Bearer <token>".
 * If valid, the decoded user will be attached to req.user for downstream handlers.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Authorization middleware to restrict endpoints to specific user roles.
 * Accepts one or more allowed roles (e.g. 'doctor', 'patient', 'admin') and
 * checks whether the authenticated user has one of the required roles.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};