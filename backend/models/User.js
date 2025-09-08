// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
    default: 'patient'
  },
  hasAcceptedPrivacy: {
    type: Boolean,
    required: true,
    default: false
  },
  privacyAcceptedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profile: {
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    profilePicture: String
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

// backend/models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  medicalRecordNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    reactions: [String]
  }],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['active', 'resolved', 'managed', 'chronic']
    },
    notes: String
  }],
  medications: [{
    name: String,
    genericName: String,
    dosage: String,
    frequency: String,
    route: {
      type: String,
      enum: ['oral', 'injection', 'topical', 'inhalation', 'other']
    },
    startDate: Date,
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    sideEffects: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    adherence: [{
      date: Date,
      taken: Boolean,
      time: String,
      notes: String
    }]
  }],
  vitals: [{
    recordedAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },
    height: {
      value: Number,
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm'
      }
    },
    bloodGlucose: {
      value: Number,
      unit: {
        type: String,
        enum: ['mg/dL', 'mmol/L'],
        default: 'mg/dL'
      },
      testType: {
        type: String,
        enum: ['fasting', 'random', 'postprandial']
      }
    },
    notes: String
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskFactors: [{
    factor: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    dateIdentified: Date
  }],
  assignedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  primaryCarePhysician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    validUntil: Date
  },
  emergencyProtocols: [{
    condition: String,
    protocol: String,
    medications: [String],
    contacts: [{
      name: String,
      phone: String,
      role: String
    }]
  }]
}, {
  timestamps: true
});

// Calculate BMI virtual property
patientSchema.virtual('bmi').get(function() {
  const latestVital = this.vitals[this.vitals.length - 1];
  if (latestVital && latestVital.weight && latestVital.height) {
    const weight = latestVital.weight.unit === 'kg' ?
      latestVital.weight.value : latestVital.weight.value * 0.453592;
    const height = latestVital.height.unit === 'cm' ?
      latestVital.height.value / 100 : latestVital.height.value * 0.0254;
    return (weight / (height * height)).toFixed(2);
  }
  return null;
});

module.exports = mongoose.model('Patient', patientSchema);

// backend/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup',
           'vaccination', 'lab-test', 'procedure', 'telemedicine']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed',
           'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  reason: String,
  symptoms: [String],
  notes: String,
  doctorNotes: String,
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  videoCallLink: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  billing: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'insurance-processing', 'denied'],
      default: 'pending'
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed']
    }
  }]
}, {
  timestamps: true
});

// Add index for efficient querying
appointmentSchema.index({ date: 1, doctorId: 1 });
appointmentSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

// backend/models/PrivacyConsent.js
const mongoose = require('mongoose');

const privacyConsentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: String,
    required: true
  },
  acceptedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  consentDetails: {
    dataCollection: {
      type: Boolean,
      required: true
    },
    dataSharing: {
      type: Boolean,
      required: true
    },
    emergencyAccess: {
      type: Boolean,
      required: true
    },
    researchUse: {
      type: Boolean,
      default: false
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  withdrawnAt: Date,
  withdrawalReason: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Index for finding latest consent
privacyConsentSchema.index({ userId: 1, acceptedAt: -1 });

module.exports = mongoose.model('PrivacyConsent', privacyConsentSchema);