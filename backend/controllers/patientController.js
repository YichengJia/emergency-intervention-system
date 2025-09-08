// backend/controllers/patientController.js
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ userId: patientId })
      .populate('userId', 'name email profile')
      .populate('assignedDoctors', 'name email')
      .populate('primaryCarePhysician', 'name email');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      error: 'Error fetching patient profile'
    });
  }
};

exports.updatePatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.medicalRecordNumber;
    delete updates._id;

    const patient = await Patient.findOneAndUpdate(
      { userId: patientId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    res.json(patient);
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      error: 'Error updating patient profile'
    });
  }
};

exports.getMedications = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ userId: patientId })
      .select('medications')
      .populate('medications.prescribedBy', 'name');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    // Filter active medications
    const activeMedications = patient.medications.filter(med => med.isActive);

    res.json(activeMedications);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({
      error: 'Error fetching medications'
    });
  }
};

exports.updateMedicationAdherence = async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    const { taken, time, notes } = req.body;

    const patient = await Patient.findOne({ userId: patientId });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    const medication = patient.medications.id(medicationId);
    if (!medication) {
      return res.status(404).json({
        error: 'Medication not found'
      });
    }

    medication.adherence.push({
      date: new Date(),
      taken,
      time,
      notes
    });

    await patient.save();

    res.json({
      success: true,
      message: 'Medication adherence updated'
    });
  } catch (error) {
    console.error('Update medication adherence error:', error);
    res.status(500).json({
      error: 'Error updating medication adherence'
    });
  }
};

exports.getVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const patient = await Patient.findOne({ userId: patientId })
      .select('vitals');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    // Filter vitals by date range
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const recentVitals = patient.vitals.filter(
      vital => vital.recordedAt >= dateLimit
    );

    res.json(recentVitals);
  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({
      error: 'Error fetching vitals'
    });
  }
};

exports.addVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const vitalsData = req.body;

    const patient = await Patient.findOne({ userId: patientId });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    patient.vitals.push({
      ...vitalsData,
      recordedBy: req.user._id,
      recordedAt: new Date()
    });

    // Update risk assessment based on vitals
    const latestVital = patient.vitals[patient.vitals.length - 1];
    if (latestVital.bloodPressure) {
      const { systolic, diastolic } = latestVital.bloodPressure;
      if (systolic > 180 || diastolic > 120) {
        patient.riskLevel = 'critical';
      } else if (systolic > 140 || diastolic > 90) {
        patient.riskLevel = 'high';
      }
    }

    await patient.save();

    res.json({
      success: true,
      message: 'Vitals recorded successfully',
      vitals: patient.vitals[patient.vitals.length - 1]
    });
  } catch (error) {
    console.error('Add vitals error:', error);
    res.status(500).json({
      error: 'Error recording vitals'
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, upcoming } = req.query;

    let query = { patientId };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name email')
      .sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      error: 'Error fetching appointments'
    });
  }
};

exports.getMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ userId: patientId })
      .select('medicalHistory allergies bloodType');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    res.json({
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      bloodType: patient.bloodType
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({
      error: 'Error fetching medical history'
    });
  }
};

exports.getRiskAssessment = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ userId: patientId })
      .select('riskLevel riskFactors vitals medications');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    // Calculate risk score based on various factors
    let riskScore = 0;
    const riskFactors = [];

    // Check latest vitals
    if (patient.vitals.length > 0) {
      const latestVital = patient.vitals[patient.vitals.length - 1];

      if (latestVital.bloodPressure) {
        const { systolic, diastolic } = latestVital.bloodPressure;
        if (systolic > 140 || diastolic > 90) {
          riskScore += 20;
          riskFactors.push('High blood pressure');
        }
      }

      if (latestVital.bloodGlucose && latestVital.bloodGlucose.value > 126) {
        riskScore += 15;
        riskFactors.push('Elevated blood glucose');
      }
    }

    // Check medication adherence
    const medicationAdherence = patient.medications.reduce((acc, med) => {
      if (med.isActive && med.adherence.length > 0) {
        const takenCount = med.adherence.filter(a => a.taken).length;
        return acc + (takenCount / med.adherence.length);
      }
      return acc;
    }, 0) / patient.medications.filter(m => m.isActive).length;

    if (medicationAdherence < 0.8) {
      riskScore += 10;
      riskFactors.push('Low medication adherence');
    }

    res.json({
      riskLevel: patient.riskLevel,
      riskScore,
      riskFactors,
      recommendations: generateRecommendations(riskScore, riskFactors)
    });
  } catch (error) {
    console.error('Get risk assessment error:', error);
    res.status(500).json({
      error: 'Error calculating risk assessment'
    });
  }
};

exports.getEmergencyProtocols = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ userId: patientId })
      .select('emergencyProtocols medicalHistory allergies')
      .populate('userId', 'profile');

    if (!patient) {
      return res.status(404).json({
        error: 'Patient record not found'
      });
    }

    res.json({
      emergencyProtocols: patient.emergencyProtocols,
      emergencyContact: patient.userId.profile?.emergencyContact,
      allergies: patient.allergies,
      criticalConditions: patient.medicalHistory.filter(h =>
        h.status === 'active' && ['Heart Disease', 'Diabetes', 'Hypertension'].includes(h.condition)
      )
    });
  } catch (error) {
    console.error('Get emergency protocols error:', error);
    res.status(500).json({
      error: 'Error fetching emergency protocols'
    });
  }
};

// Helper function
function generateRecommendations(riskScore, riskFactors) {
  const recommendations = [];

  if (riskScore > 30) {
    recommendations.push('Schedule immediate consultation with primary care physician');
  }

  if (riskFactors.includes('High blood pressure')) {
    recommendations.push('Monitor blood pressure daily');
    recommendations.push('Reduce sodium intake');
  }

  if (riskFactors.includes('Elevated blood glucose')) {
    recommendations.push('Monitor blood glucose levels regularly');
    recommendations.push('Follow diabetic diet plan');
  }

  if (riskFactors.includes('Low medication adherence')) {
    recommendations.push('Set medication reminders');
    recommendations.push('Discuss medication concerns with doctor');
  }

  return recommendations;
}