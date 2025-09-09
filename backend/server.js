const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import database config
const { connectDatabase } = require('./config/database');

const app = express();

// Connect to MongoDB
connectDatabase().catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Docker request and local development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://frontend:80',
      'http://localhost:80'
    ];

    // Non-original request(such as postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware should be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});