// backend/utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // In production, use real email service
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: `"Emergency Intervention System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(appointment, patient) {
    const subject = 'Appointment Reminder';
    const html = `
      <h2>Appointment Reminder</h2>
      <p>Dear ${patient.name},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      <ul>
        <li><strong>Date:</strong> ${appointment.date.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.startTime}</li>
        <li><strong>Type:</strong> ${appointment.type}</li>
        <li><strong>Doctor:</strong> ${appointment.doctorId.name}</li>
      </ul>
      <p>Please arrive 10 minutes early for check-in.</p>
      <p>If you need to reschedule, please contact us as soon as possible.</p>
      <br>
      <p>Best regards,<br>Emergency Intervention System</p>
    `;

    const text = `
      Appointment Reminder
      
      Dear ${patient.name},
      
      This is a reminder about your upcoming appointment:
      - Date: ${appointment.date.toLocaleDateString()}
      - Time: ${appointment.startTime}
      - Type: ${appointment.type}
      - Doctor: ${appointment.doctorId.name}
      
      Please arrive 10 minutes early for check-in.
      If you need to reschedule, please contact us as soon as possible.
      
      Best regards,
      Emergency Intervention System
    `;

    return this.sendEmail(patient.email, subject, html, text);
  }

  async sendMedicationReminder(patient, medication) {
    const subject = 'Medication Reminder';
    const html = `
      <h2>Medication Reminder</h2>
      <p>Dear ${patient.name},</p>
      <p>This is a reminder to take your medication:</p>
      <ul>
        <li><strong>Medication:</strong> ${medication.name}</li>
        <li><strong>Dosage:</strong> ${medication.dosage}</li>
        <li><strong>Time:</strong> ${medication.time}</li>
      </ul>
      <p>Please take your medication as prescribed.</p>
      <br>
      <p>Best regards,<br>Emergency Intervention System</p>
    `;

    const text = `
      Medication Reminder
      
      Dear ${patient.name},
      
      This is a reminder to take your medication:
      - Medication: ${medication.name}
      - Dosage: ${medication.dosage}
      - Time: ${medication.time}
      
      Please take your medication as prescribed.
      
      Best regards,
      Emergency Intervention System
    `;

    return this.sendEmail(patient.email, subject, html, text);
  }

  async sendPasswordReset(email, resetLink) {
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset</h2>
      <p>You have requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Emergency Intervention System</p>
    `;

    const text = `
      Password Reset
      
      You have requested to reset your password.
      
      Click the link below to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      If you did not request this, please ignore this email.
      
      Best regards,
      Emergency Intervention System
    `;

    return this.sendEmail(email, subject, html, text);
  }
}

module.exports = new EmailService();