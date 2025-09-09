// backend/seedData.js
/*
 * 脚本用于初始化数据库，创建测试用户、医生、病人和预约
 * 运行命令: node backend/seedData.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

dotenv.config();

async function seed() {
  try {
    // 连接到 MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // 清理现有数据（可选）
    console.log('🧹 Cleaning existing data...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({})
    ]);

    // 创建多个医生
    console.log('👨‍⚕️ Creating doctors...');

    const doctors = [];
    const doctorData = [
      { name: 'Dr. Smith', email: 'smith@hospital.com', specialty: 'Cardiology' },
      { name: 'Dr. Johnson', email: 'johnson@hospital.com', specialty: 'General Medicine' },
      { name: 'Dr. Williams', email: 'williams@hospital.com', specialty: 'Neurology' },
      { name: 'Dr. Brown', email: 'brown@hospital.com', specialty: 'Pediatrics' },
      { name: 'Dr. Davis', email: 'davis@hospital.com', specialty: 'Orthopedics' }
    ];

    for (const data of doctorData) {
      const doctorUser = new User({
        name: data.name,
        email: data.email,
        password: 'doctor123', // 默认密码
        role: 'doctor'
      });
      await doctorUser.save();

      const doctor = new Doctor({
        user: doctorUser._id,
        specialty: data.specialty,
        licenseNumber: `LIC${Date.now()}${Math.floor(Math.random() * 1000)}`,
        phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        email: data.email
      });
      await doctor.save();
      doctors.push(doctor);
      console.log(`  ✓ Created ${data.name} (${data.specialty})`);
    }

    // 创建多个病人
    console.log('👥 Creating patients...');

    const patients = [];
    const patientData = [
      { name: 'John Doe', email: 'john@example.com', dob: '1990-05-15', gender: 'male' },
      { name: 'Jane Smith', email: 'jane@example.com', dob: '1985-08-22', gender: 'female' },
      { name: 'Bob Johnson', email: 'bob@example.com', dob: '1978-03-10', gender: 'male' },
      { name: 'Alice Williams', email: 'alice@example.com', dob: '1995-11-30', gender: 'female' },
      { name: 'Charlie Brown', email: 'charlie@example.com', dob: '2000-01-05', gender: 'male' }
    ];

    for (const data of patientData) {
      const patientUser = new User({
        name: data.name,
        email: data.email,
        password: 'patient123', // 默认密码
        role: 'patient'
      });
      await patientUser.save();

      const patient = new Patient({
        user: patientUser._id,
        name: data.name,
        dob: new Date(data.dob),
        gender: data.gender,
        email: data.email,
        phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        address: `${Math.floor(Math.random() * 999) + 1} Main St, City, State`,
        medicalHistory: getRandomMedicalHistory()
      });
      await patient.save();
      patients.push(patient);
      console.log(`  ✓ Created ${data.name}`);
    }

    // 创建预约
    console.log('📅 Creating appointments...');

    const appointmentReasons = [
      'Regular checkup',
      'Follow-up visit',
      'Consultation',
      'Annual physical',
      'Vaccination',
      'Blood test results',
      'Prescription renewal',
      'Health screening'
    ];

    // 为每个病人创建1-2个预约
    for (const patient of patients) {
      const numAppointments = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numAppointments; i++) {
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        const daysOffset = Math.floor(Math.random() * 30) + 1;
        const appointment = new Appointment({
          patient: patient._id,
          doctor: randomDoctor._id,
          appointmentDate: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
          reason: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)],
          status: i === 0 ? 'scheduled' : (Math.random() > 0.5 ? 'scheduled' : 'completed')
        });
        await appointment.save();
      }
    }

    console.log(`  ✓ Created ${patients.length * 1.5} appointments (average)`);

    // 创建管理员账号
    console.log('👤 Creating admin account...');
    const admin = new User({
      name: 'System Admin',
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('  ✓ Created admin account');

    // 打印登录信息
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database seeded successfully!');
    console.log('='.repeat(50));
    console.log('\n📝 Test Account Credentials:');
    console.log('────────────────────────────');
    console.log('Patient accounts:');
    patientData.forEach(p => {
      console.log(`  Email: ${p.email} | Password: patient123`);
    });
    console.log('\nDoctor accounts:');
    doctorData.forEach(d => {
      console.log(`  Email: ${d.email} | Password: doctor123`);
    });
    console.log('\nAdmin account:');
    console.log('  Email: admin@hospital.com | Password: admin123');
    console.log('='.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

function getRandomMedicalHistory() {
  const conditions = [
    'Hypertension',
    'Diabetes Type 2',
    'Asthma',
    'Allergies',
    'High Cholesterol',
    'Arthritis',
    'Migraine',
    'Anxiety',
    'Back Pain',
    'Seasonal Allergies'
  ];

  const numConditions = Math.floor(Math.random() * 3);
  const history = [];

  for (let i = 0; i < numConditions; i++) {
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    if (!history.includes(condition)) {
      history.push(condition);
    }
  }

  return history;
}

// 运行种子脚本
seed();