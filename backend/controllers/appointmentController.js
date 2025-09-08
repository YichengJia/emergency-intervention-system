// backend/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'patient') {
      query.patientId = userId;
    } else if (userRole === 'doctor') {
      query.doctorId = userId;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
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

exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email profile')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check access rights
    if (userRole === 'patient' && appointment.patientId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (userRole === 'doctor' && appointment.doctorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      error: 'Error fetching appointment'
    });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate user can create this appointment
    if (userRole === 'patient' && appointmentData.patientId !== userId.toString()) {
      return res.status(403).json({
        error: 'You can only create appointments for yourself'
      });
    }

    // Check for conflicting appointments
    const conflict = await Appointment.findOne({
      doctorId: appointmentData.doctorId,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      status: { $nin: ['cancelled'] }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Time slot is already booked'
      });
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    await appointment.populate('patientId doctorId');

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      error: 'Error creating appointment'
    });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check permissions
    const canUpdate =
      appointment.patientId.toString() === userId.toString() ||
      appointment.doctorId.toString() === userId.toString();

    if (!canUpdate) {
      return res.status(403).json({
        error: 'You do not have permission to update this appointment'
      });
    }

    Object.assign(appointment, updates);
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      error: 'Error updating appointment'
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check permissions
    const canCancel =
      appointment.patientId.toString() === userId.toString() ||
      appointment.doctorId.toString() === userId.toString();

    if (!canCancel) {
      return res.status(403).json({
        error: 'You do not have permission to cancel this appointment'
      });
    }

    appointment.status = 'cancelled';
    appointment.notes = reason || 'Cancelled by user';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      error: 'Error cancelling appointment'
    });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check permissions
    const canReschedule =
      appointment.patientId.toString() === userId.toString() ||
      appointment.doctorId.toString() === userId.toString();

    if (!canReschedule) {
      return res.status(403).json({
        error: 'You do not have permission to reschedule this appointment'
      });
    }

    // Check for conflicts
    const conflict = await Appointment.findOne({
      _id: { $ne: id },
      doctorId: appointment.doctorId,
      date,
      startTime,
      status: { $nin: ['cancelled'] }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Time slot is already booked'
      });
    }

    appointment.date = date;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'rescheduled';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      error: 'Error rescheduling appointment'
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        error: 'Doctor ID and date are required'
      });
    }

    const requestedDate = new Date(date);
    const nextDay = new Date(requestedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get existing appointments
    const appointments = await Appointment.find({
      doctorId,
      date: {
        $gte: requestedDate,
        $lt: nextDay
      },
      status: { $nin: ['cancelled'] }
    });

    // Generate available slots (9 AM to 5 PM, 30-minute slots)
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = appointments.some(apt => apt.startTime === time);

        slots.push({
          time,
          available: !isBooked
        });
      }
    }

    res.json(slots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      error: 'Error fetching available slots'
    });
  }
};

exports.sendReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name');

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // In production, send actual email/SMS reminder
    // For now, just log and update reminder status
    console.log(`Reminder sent for appointment ${id}`);

    appointment.reminders.push({
      type: 'email',
      sentAt: new Date(),
      status: 'sent'
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      error: 'Error sending reminder'
    });
  }
};