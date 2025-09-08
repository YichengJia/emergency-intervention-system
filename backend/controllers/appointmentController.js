const Appointment = require('../models/Appointment');

/**
 * Get all appointments for the authenticated user.
 * Doctors see appointments where they are the doctor, patients see their own appointments, admins see all.
 */
async function getAllAppointments(req, res, next) {
  try {
    let filter = {};
    if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    } else if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    }
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name')
      .populate('doctor', 'name');
    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

/**
 * Get a specific appointment by id. Only participants or admin may view it.
 */
async function getAppointmentById(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'name')
      .populate('doctor', 'name');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

/**
 * Create an appointment. Patients create appointments with doctors.
 */
async function createAppointment(req, res, next) {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;
    // Only patients can create their own appointments or doctors/admin schedule for them
    let finalPatientId = patientId;
    if (req.user.role === 'patient') {
      finalPatientId = req.user._id;
    }
    const appointment = new Appointment({
      patient: finalPatientId,
      doctor: doctorId,
      appointmentDate,
      reason
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

/**
 * Update an appointment. Only participants or admin can update.
 */
async function updateAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(appointment, req.body);
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an appointment. Only participants or admin.
 */
async function deleteAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await appointment.remove();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};