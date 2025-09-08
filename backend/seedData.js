// backend/seedData.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const PrivacyConsent = require('./models/PrivacyConsent');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency-intervention', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await PrivacyConsent.deleteMany({});
    console.log('Cleared existing data');

    // Create sample doctors
    const doctors = await User.create([
      {
        email: 'dr.johnson@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Dr. Sarah Johnson',
        role: 'doctor',
        hasAcceptedPrivacy: true,
        privacyAcceptedAt: new Date(),
        profile: {
          age: 45,
          gender: 'female',
          phone: '+1-555-0101',
          address: {
            street: '123 Medical Center Dr',
            city: 'Brisbane',
            state: 'QLD',
            zipCode: '4000',
            country: 'Australia'
          }
        }
      },
      {
        email: 'dr.smith@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Dr. Michael Smith',
        role: 'doctor',
        hasAcceptedPrivacy: true,
        privacyAcceptedAt: new Date(),
        profile: {
          age: 52,
          gender: 'male',
          phone: '+1-555-0102',
          address: {
            street: '456 Hospital Ave',
            city: 'Brisbane',
            state: 'QLD',
            zipCode: '4001',
            country: 'Australia'
          }
        }
      }
    ]);

    console.log('Created doctors');

    // Create sample patients
    const patients = await User.create([
      {
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        role: 'patient',
        hasAcceptedPrivacy: true,
        privacyAcceptedAt: new Date(),
        profile: {
          age: 65,
          gender: 'male',
          phone: '+1-555-0201',
          address: {
            street: '789 Oak Street',
            city: 'Brisbane',
            state: 'QLD',
            zipCode: '4005',
            country: 'Australia'
          },
          emergencyContact: {
            name: 'Jane Doe',
            phone: '+1-555-0202',
            relationship: 'Spouse'
          }
        }
      },
      {
        email: 'mary.wilson@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Mary Wilson',
        role: 'patient',
        hasAcceptedPrivacy: true,
        privacyAcceptedAt: new Date(),
        profile: {
          age: 58,
          gender: 'female',
          phone: '+1-555-0203',
          address: {
            street: '321 Pine Avenue',
            city: 'Brisbane',
            state: 'QLD',
            zipCode: '4006',
            country: 'Australia'
          },
          emergencyContact: {
            name: 'Robert Wilson',
            phone: '+1-555-0204',
            relationship: 'Husband'
          }
        }
      },
      {
        email: 'robert.brown@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Robert Brown',
        role: 'patient',
        hasAcceptedPrivacy: true,
        privacyAcceptedAt: new Date(),
        profile: {
          age: 72,
          gender: 'male',
          phone: '+1-555-0205',
          address: {
            street: '654 Elm Road',
            city: 'Brisbane',
            state: 'QLD',
            zipCode: '4007',
            country: 'Australia'
          },
          emergencyContact: {
            name: 'Susan Brown',
            phone: '+1-555-0206',
            relationship: 'Daughter'
          }
        }
      }
    ]);

    console.log('Created patients');

    // Create patient medical records
    const patientRecords = await Promise.all(patients.map(async (patient, index) => {
      const record = await Patient.create({
        userId: patient._id,
        medicalRecordNumber: `MRN-${Date.now()}-${index}`,
        bloodType: ['A+', 'B+', 'O+'][index],
        allergies: index === 0 ? [{
          allergen: 'Penicillin',
          severity: 'severe',
          reactions: ['Rash', 'Difficulty breathing']
        }] : [],
        medicalHistory: [
          {
            condition: ['Hypertension', 'Diabetes Type 2', 'Heart Disease'][index],
            diagnosedDate: new Date(2020, 0, 15),
            status: 'managed',
            notes: 'Regular monitoring required'
          }
        ],
        medications: [
          {
            name: ['Lisinopril', 'Metformin', 'Atorvastatin'][index],
            genericName: ['Lisinopril', 'Metformin', 'Atorvastatin'][index],
            dosage: ['10mg', '500mg', '20mg'][index],
            frequency: 'Once daily',
            route: 'oral',
            startDate: new Date(2023, 0, 1),
            prescribedBy: doctors[0]._id,
            reason: ['Blood pressure control', 'Blood sugar control', 'Cholesterol management'][index],
            isActive: true
          },
          {
            name: 'Aspirin',
            genericName: 'Acetylsalicylic acid',
            dosage: '81mg',
            frequency: 'Once daily',
            route: 'oral',
            startDate: new Date(2023, 0, 1),
            prescribedBy: doctors[0]._id,
            reason: 'Cardiovascular protection',
            isActive: true
          }
        ],
        vitals: [
          {
            recordedAt: new Date(),
            recordedBy: doctors[0]._id,
            bloodPressure: {
              systolic: 130 + (index * 5),
              diastolic: 80 + (index * 2)
            },
            heartRate: 72 + (index * 3),
            temperature: {
              value: 36.6,
              unit: 'celsius'
            },
            respiratoryRate: 16,
            oxygenSaturation: 98 - index,
            weight: {
              value: 75 + (index * 5),
              unit: 'kg'
            },
            height: {
              value: 170 + (index * 5),
              unit: 'cm'
            },
            bloodGlucose: {
              value: 95 + (index * 10),
              unit: 'mg/dL',
              testType: 'fasting'
            }
          }
        ],
        riskLevel: ['high', 'medium', 'high'][index],
        assignedDoctors: [doctors[0]._id, doctors[1]._id],
        primaryCarePhysician: doctors[0]._id,
        insuranceInfo: {
          provider: 'Queensland Health Insurance',
          policyNumber: `QHI-${100000 + index}`,
          groupNumber: 'GRP-001',
          validUntil: new Date(2025, 11, 31)
        }
      });
      return record;
    }));

    console.log('Created patient medical records');

    // Create sample appointments
    const appointments = await Appointment.create([
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        startTime: '10:00',
        endTime: '10:30',
        type: 'routine-checkup',
        status: 'scheduled',
        priority: 'normal',
        reason: 'Regular blood pressure check',
        symptoms: []
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[0]._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startTime: '14:00',
        endTime: '14:45',
        type: 'consultation',
        status: 'confirmed',
        priority: 'normal',
        reason: 'Diabetes management review',
        symptoms: ['Fatigue', 'Increased thirst']
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[1]._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        startTime: '09:00',
        endTime: '09:30',
        type: 'follow-up',
        status: 'scheduled',
        priority: 'high',
        reason: 'Post-procedure follow-up',
        symptoms: []
      }
    ]);

    console.log('Created appointments');

    // Create privacy consents
    const consents = await PrivacyConsent.create([
      ...patients.map(patient => ({
        userId: patient._id,
        version: '1.0',
        acceptedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        consentDetails: {
          dataCollection: true,
          dataSharing: true,
          emergencyAccess: true,
          researchUse: false,
          marketing: false
        }
      })),
      ...doctors.map(doctor => ({
        userId: doctor._id,
        version: '1.0',
        acceptedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        consentDetails: {
          dataCollection: true,
          dataSharing: true,
          emergencyAccess: true,
          researchUse: true,
          marketing: false
        }
      }))
    ]);

    console.log('Created privacy consents');

    console.log('\n=== Seed Data Created Successfully ===');
    console.log('\nSample Login Credentials:');
    console.log('------------------------');
    console.log('Doctors:');
    console.log('  Email: dr.johnson@example.com | Password: password123');
    console.log('  Email: dr.smith@example.com | Password: password123');
    console.log('\nPatients:');
    console.log('  Email: john.doe@example.com | Password: password123');
    console.log('  Email: mary.wilson@example.com | Password: password123');
    console.log('  Email: robert.brown@example.com | Password: password123');
    console.log('------------------------\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();