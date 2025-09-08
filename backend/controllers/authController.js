const User = require('../models/User');
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
 * Register a new user.
 * Expects name, email, password and role in req.body.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

/**
 * Log a user in.
 * Expects email and password in req.body.
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
    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};