// backend/controllers/doctorController.js
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.getAssignedPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const patients = await Patient.find({
      assignedDoctors: doctorId
    })
    .populate('userId', 'name email profile lastLogin')
    .sort({ riskLevel: -1, 'userId.name': 1 });

    // Format patient data with latest vitals
    const formattedPatients = patients.map(patient => {
      const latestVital = patient.vitals[patient.vitals.length - 1];
      return {
        id: patient.userId._id,
        patientRecordId: patient._id,
        name: patient.userId.name,
        email: patient.userId.email,
        age: patient.userId.profile?.age,
        riskLevel: patient.riskLevel,
        conditions: patient.medicalHistory.filter(h => h.status === 'active'),
        latestVitals: latestVital || null,
        lastVisit: patient.userId.lastLogin,
        medicationCount: patient.medications.filter(m => m.isActive).length
      };
    });

    res.json(formattedPatients);
  } catch (error) {
    console.error('Get assigned patients error:', error);
    res.status(500).json({
      error: 'Error fetching assigned patients'
    });
  }
};

exports.getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    const patient = await Patient.findOne({
      userId: patientId,
      assignedDoctors: doctorId
    })
    .populate('userId', 'name email profile')
    .populate('medications.prescribedBy', 'name')
    .populate('primaryCarePhysician', 'name email');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found or not assigned to you'
      });
    }

    // Get recent appointments
    const appointments = await Appointment.find({
      patientId,
      doctorId
    })
    .sort({ date: -1 })
    .limit(5);

    res.json({
      patient,
      appointments,
      statistics: {
        totalVisits: appointments.length,
        missedAppointments: appointments.filter(a => a.status === 'no-show').length,
        medicationAdherence: calculateMedicationAdherence(patient.medications)
      }
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({
      error: 'Error fetching patient details'
    });
  }
};

exports.addPatientNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { notes, category } = req.body;
    const doctorId = req.user._id;

    const patient = await Patient.findOne({
      userId: patientId,
      assignedDoctors: doctorId
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found or not assigned to you'
      });
    }

    // Add notes to medical history
    patient.medicalHistory.push({
      condition: category || 'Clinical Note',
      diagnosedDate: new Date(),
      status: 'active',
      notes: `${new Date().toISOString()} - Dr. ${req.user.name}: ${notes}`
    });

    await patient.save();

    res.json({
      success: true,
      message: 'Notes added successfully'
    });
  } catch (error) {
    console.error('Add patient notes error:', error);
    res.status(500).json({
      error: 'Error adding patient notes'
    });
  }
};

exports.updateRiskLevel = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { riskLevel, reason } = req.body;
    const doctorId = req.user._id;

    const patient = await Patient.findOne({
      userId: patientId,
      assignedDoctors: doctorId
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found or not assigned to you'
      });
    }

    patient.riskLevel = riskLevel;

    if (reason) {
      patient.riskFactors.push({
        factor: reason,
        severity: riskLevel === 'critical' ? 'high' : riskLevel,
        dateIdentified: new Date()
      });
    }

    await patient.save();

    res.json({
      success: true,
      message: 'Risk level updated successfully'
    });
  } catch (error) {
    console.error('Update risk level error:', error);
    res.status(500).json({
      error: 'Error updating risk level'
    });
  }
};

exports.prescribeMedication = async (req, res) => {
  try {
    const { patientId } = req.params;
    const medicationData = req.body;
    const doctorId = req.user._id;

    const patient = await Patient.findOne({
      userId: patientId,
      assignedDoctors: doctorId
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found or not assigned to you'
      });
    }

    patient.medications.push({
      ...medicationData,
      prescribedBy: doctorId,
      startDate: new Date(),
      isActive: true
    });

    await patient.save();

    res.json({
      success: true,
      message: 'Medication prescribed successfully'
    });
  } catch (error) {
    console.error('Prescribe medication error:', error);
    res.status(500).json({
      error: 'Error prescribing medication'
    });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { date } = req.query;

    let query = { doctorId };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    } else {
      // Default to next 7 days
      query.date = {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      error: 'Error fetching schedule'
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status, timeframe } = req.query;

    let query = { doctorId };

    if (status) {
      query.status = status;
    }

    if (timeframe === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (timeframe === 'upcoming') {
      query.date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      error: 'Error fetching appointments'
    });
  }
};

exports.updateAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes, prescription } = req.body;
    const doctorId = req.user._id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    appointment.doctorNotes = notes;

    if (prescription) {
      appointment.prescription = prescription;
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment notes updated'
    });
  } catch (error) {
    console.error('Update appointment notes error:', error);
    res.status(500).json({
      error: 'Error updating appointment notes'
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Get all assigned patients
    const patients = await Patient.find({
      assignedDoctors: doctorId
    });

    // Get appointments statistics
    const appointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    const analytics = {
      totalPatients: patients.length,
      riskDistribution: {
        critical: patients.filter(p => p.riskLevel === 'critical').length,
        high: patients.filter(p => p.riskLevel === 'high').length,
        medium: patients.filter(p => p.riskLevel === 'medium').length,
        low: patients.filter(p => p.riskLevel === 'low').length
      },
      appointmentStats: {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        noShow: appointments.filter(a => a.status === 'no-show').length
      },
      medicationAdherence: calculateAverageAdherence(patients),
      recentActivity: await getRecentActivity(doctorId)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: 'Error fetching analytics'
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Get critical patients
    const criticalPatients = await Patient.find({
      assignedDoctors: doctorId,
      riskLevel: { $in: ['critical', 'high'] }
    }).populate('userId', 'name');

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctorId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('patientId', 'name');

    const notifications = [
      ...criticalPatients.map(p => ({
        type: 'alert',
        priority: 'high',
        message: `${p.userId.name} requires immediate attention (${p.riskLevel} risk)`,
        timestamp: new Date()
      })),
      ...todayAppointments.map(a => ({
        type: 'appointment',
        priority: 'normal',
        message: `Appointment with ${a.patientId.name} at ${a.startTime}`,
        timestamp: a.date
      }))
    ];

    res.json(notifications.sort((a, b) => b.timestamp - a.timestamp));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Error fetching notifications'
    });
  }
};

// Helper functions
function calculateMedicationAdherence(medications) {
  if (!medications || medications.length === 0) return 100;

  const activeMeds = medications.filter(m => m.isActive);
  if (activeMeds.length === 0) return 100;

  const totalAdherence = activeMeds.reduce((acc, med) => {
    if (med.adherence && med.adherence.length > 0) {
      const taken = med.adherence.filter(a => a.taken).length;
      return acc + (taken / med.adherence.length) * 100;
    }
    return acc;
  }, 0);

  return Math.round(totalAdherence / activeMeds.length);
}

function calculateAverageAdherence(patients) {
  if (patients.length === 0) return 0;

  const totalAdherence = patients.reduce((acc, patient) => {
    return acc + calculateMedicationAdherence(patient.medications);
  }, 0);

  return Math.round(totalAdherence / patients.length);
}

async function getRecentActivity(doctorId) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentAppointments = await Appointment.find({
    doctorId,
    updatedAt: { $gte: oneDayAgo }
  })
  .populate('patientId', 'name')
  .sort({ updatedAt: -1 })
  .limit(10);

  return recentAppointments.map(a => ({
    type: 'appointment',
    description: `Appointment with ${a.patientId.name}`,
    status: a.status,
    timestamp: a.updatedAt
  }));
}