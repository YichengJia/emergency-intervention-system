const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter object using SMTP transport.
 * The credentials are read from environment variables for flexibility.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send an email using the configured transporter. Accepts the recipient,
 * subject and HTML/text content. Returns a promise that resolves when the
 * email has been sent.
 */
async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
  console.log(`✉️  Email sent: ${info.messageId}`);
  return info;
}

module.exports = {
  sendEmail
};