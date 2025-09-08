// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import configurations
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Custom request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.access(req, res, responseTime);
  });

  next();
});

// Sanitize input
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Privacy policy endpoint
app.get('/api/privacy/policy', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2024-01-01',
    content: {
      title: 'Privacy Policy & Data Protection Agreement',
      sections: [
        {
          heading: 'Data Collection',
          content: 'We collect personal health information (PHI) including medical history, vital signs, medications, and appointment records to provide comprehensive healthcare services.'
        },
        {
          heading: 'Data Usage',
          content: 'Your data is used exclusively for medical care coordination, treatment planning, and emergency intervention services. We adhere to HIPAA regulations.'
        },
        {
          heading: 'Data Sharing',
          content: 'Health information is shared only with authorized healthcare providers involved in your care. No data is sold or shared for marketing purposes.'
        },
        {
          heading: 'Security Measures',
          content: 'We implement industry-standard encryption, secure authentication, and regular security audits to protect your sensitive health information.'
        },
        {
          heading: 'Your Rights',
          content: 'You have the right to access, correct, or delete your personal data. You may also request data portability or restrict processing.'
        },
        {
          heading: 'Consent',
          content: 'By accepting this policy, you consent to the collection and processing of your health data as described above. You may withdraw consent at any time.'
        }
      ]
    }
  });
});

// FHIR metadata endpoint (framework only)
app.get('/api/fhir/metadata', (req, res) => {
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    software: {
      name: 'Emergency Intervention System',
      version: '1.0.0'
    },
    implementation: {
      description: 'FHIR Server for Emergency Intervention System',
      url: process.env.FHIR_SERVER_URL || 'https://api.example.com/fhir'
    },
    fhirVersion: '4.0.1',
    format: ['json', 'xml'],
    rest: [{
      mode: 'server',
      resource: [
        {
          type: 'Patient',
          profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
          interaction: [
            { code: 'read' },
            { code: 'vread' },
            { code: 'update' },
            { code: 'search-type' }
          ],
          searchParam: [
            {
              name: 'identifier',
              type: 'token',
              documentation: 'Search by patient identifier'
            },
            {
              name: 'name',
              type: 'string',
              documentation: 'Search by patient name'
            }
          ]
        },
        {
          type: 'Observation',
          profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ],
          searchParam: [
            {
              name: 'patient',
              type: 'reference',
              documentation: 'Search by patient reference'
            },
            {
              name: 'category',
              type: 'token',
              documentation: 'Search by observation category'
            },
            {
              name: 'date',
              type: 'date',
              documentation: 'Search by observation date'
            }
          ]
        },
        {
          type: 'Appointment',
          profile: 'http://hl7.org/fhir/StructureDefinition/Appointment',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'update' },
            { code: 'delete' },
            { code: 'search-type' }
          ],
          searchParam: [
            {
              name: 'patient',
              type: 'reference',
              documentation: 'Search appointments by patient'
            },
            {
              name: 'practitioner',
              type: 'reference',
              documentation: 'Search appointments by practitioner'
            },
            {
              name: 'date',
              type: 'date',
              documentation: 'Search appointments by date'
            },
            {
              name: 'status',
              type: 'token',
              documentation: 'Search appointments by status'
            }
          ]
        },
        {
          type: 'MedicationRequest',
          profile: 'http://hl7.org/fhir/StructureDefinition/MedicationRequest',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ],
          searchParam: [
            {
              name: 'patient',
              type: 'reference',
              documentation: 'Search medication requests by patient'
            },
            {
              name: 'status',
              type: 'token',
              documentation: 'Search by medication request status'
            }
          ]
        }
      ]
    }]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT
  });
  console.log(`
    ╔════════════════════════════════════════════╗
    ║                                            ║
    ║   Emergency Intervention System API        ║
    ║   Server running on port ${PORT}              ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
    ║                                            ║
    ╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', err);
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

module.exports = app;