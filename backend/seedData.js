/*
 * Script to seed the MongoDB database with some default users, doctors,
 * patients and appointments. This can be run with `npm run seed` after
 * configuring your .env with a valid MONGODB_URI.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to database');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({})
  ]);

  // Create admin
  const admin = new User({ name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' });
  await admin.save();

  // Create doctor
  const doctorUser = new User({ name: 'Dr. Smith', email: 'drsmith@example.com', password: 'password', role: 'doctor' });
  await doctorUser.save();
  const doctor = new Doctor({ user: doctorUser._id, specialty: 'Cardiology', licenseNumber: 'DOC12345', phone: '123456789', email: doctorUser.email });
  await doctor.save();

  // Create patient
  const patientUser = new User({ name: 'John Doe', email: 'johndoe@example.com', password: 'password', role: 'patient' });
  await patientUser.save();
  const patient = new Patient({ user: patientUser._id, name: 'John Doe', dob: new Date('1990-01-01'), gender: 'male', email: patientUser.email, phone: '987654321' });
  await patient.save();

  // Create an appointment
  const appointment = new Appointment({ patient: patient._id, doctor: doctor._id, appointmentDate: new Date(Date.now() + 86400000), reason: 'Checkup' });
  await appointment.save();

  console.log('Database seeded successfully');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});