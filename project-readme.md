# Emergency Intervention System

A modern healthcare management platform with role-based access control, privacy compliance, and SMART on FHIR framework integration.

## Features

### Core Functionality
- **Role-Based Access Control**: Separate interfaces for patients and doctors
- **Privacy Compliance**: Built-in privacy consent management system
- **Modern UI**: Glassmorphism effects, gradients, and responsive design
- **SMART on FHIR Framework**: Ready for healthcare interoperability (framework implemented, API integration pending)

### Patient Features
- Personal health dashboard
- Medication tracking and reminders
- Appointment management
- Health metrics monitoring
- Access to health education resources

### Doctor Features
- Multi-patient management dashboard
- Risk level monitoring
- Appointment scheduling
- Patient health records access
- Analytics and reporting tools

## Technology Stack

### Frontend
- **React 19.1.1** - Core framework
- **Tailwind CSS** - Styling with modern effects
- **Lucide React** - Icon library
- **Web Vitals** - Performance monitoring

### Backend
- **Node.js & Express** - Server framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **FHIR R4** - Healthcare data standard (framework)

## Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/your-org/emergency-intervention-system.git

# Navigate to project directory
cd emergency-intervention-system

# Install dependencies
npm install

# Create environment file
cp .env.example.example .env.example

# Start development server
npm start
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example.example .env.example

# Configure MongoDB connection in .env.example
# MONGODB_URI=mongodb://localhost:27017/emergency-intervention

# Start backend server
npm run dev
```

## Project Structure

```
emergency-intervention-system/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Patient/
│   │   └── Doctor/
│   ├── services/
│   │   ├── api.js          # Backend API integration
│   │   └── fhir.js         # FHIR client (framework)
│   ├── App.js              # Main application
│   └── index.js            # Entry point
├── backend/
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & validation
│   └── server.js           # Express server
├── public/
└── package.json
```

## API Documentation

### Authentication Endpoints

```javascript
POST /api/auth/register
// Register new user (patient/doctor)
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "patient|doctor",
  "hasAcceptedPrivacy": true
}

POST /api/auth/login
// Login existing user
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Patient Endpoints

```javascript
GET /api/patients/:id
// Get patient information

GET /api/patients/:id/medications
// Get patient medications

POST /api/patients/:id/vitals
// Submit vital signs
```

### Doctor Endpoints

```javascript
GET /api/doctors/patients
// Get all assigned patients

GET /api/doctors/appointments
// Get doctor's appointments

POST /api/doctors/patients/:id/notes
// Add patient notes
```

## Security Features

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **HTTPS**: Enforced in production
- **JWT Tokens**: Secure authentication with expiration
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation

### Privacy Compliance
- **Consent Management**: Explicit user consent tracking
- **Data Access Logs**: Audit trail for data access
- **User Rights**: Data export, deletion, and correction
- **HIPAA Considerations**: Framework for compliance

## SMART on FHIR Integration

### Current Status
The application includes a complete SMART on FHIR framework ready for integration with FHIR servers.

### Framework Components
```javascript
// Authorization flow
fhirService.authorize()

// Resource access
fhirService.getPatient(patientId)
fhirService.getObservations(patientId)
fhirService.getMedicationRequests(patientId)

// Data transformation
fhirService.toFHIRPatient(internalData)
fhirService.fromFHIRPatient(fhirData)
```

### Future Implementation
To connect to a real FHIR server:
1. Configure FHIR server URL in `.env`
2. Register application for SMART credentials
3. Implement OAuth2 callback handler
4. Enable real-time data synchronization

## Deployment

### Production Build

```bash
# Frontend build
npm run build

# Backend production mode
NODE_ENV=production npm start
```

### Environment Variables

```env
# Frontend (.env)
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_FHIR_SERVER=https://fhir.your-domain.com

# Backend (.env)
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-secret-key
```

### Docker Support

```dockerfile
# Dockerfile.backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend && npm test

# E2E testing
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Development Guidelines

### Code Style
- ESLint configuration for consistent code
- Prettier for formatting
- Husky for pre-commit hooks

### Component Structure
```javascript
// Functional components with hooks
const Component = () => {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return <div>...</div>;
};
```

### API Integration Pattern
```javascript
// Use async/await with error handling
try {
  const data = await apiService.getData();
  // Handle success
} catch (error) {
  // Handle error
}
```

## Performance Optimization

- **Code Splitting**: Dynamic imports for large components
- **Lazy Loading**: Images and non-critical resources
- **Caching**: API response caching
- **Bundle Optimization**: Tree shaking and minification

## Monitoring

- **Error Tracking**: Integration with Sentry (optional)
- **Performance Metrics**: Web Vitals tracking
- **User Analytics**: Privacy-compliant usage tracking
- **Health Checks**: API endpoint monitoring

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-org/emergency-intervention-system/issues)
- Documentation: [Wiki](https://github.com/your-org/emergency-intervention-system/wiki)
- Email: support@emergency-intervention.example.com

## Roadmap

### Phase 1 (Current)
- ✅ User authentication and authorization
- ✅ Role-based access control
- ✅ Privacy consent management
- ✅ Basic patient/doctor dashboards

### Phase 2 (Q2 2024)
- [ ] Real FHIR server integration
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Telemedicine features

### Phase 3 (Q3 2024)
- [ ] AI-powered risk assessment
- [ ] Predictive health analytics
- [ ] Integration with wearable devices
- [ ] Multi-language support

## Acknowledgments

- Healthcare professionals who provided domain expertise
- Open source community for excellent libraries
- SMART Health IT for FHIR standards