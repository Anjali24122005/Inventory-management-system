const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: `"InvenTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email - InvenTrack',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#2563eb">InvenTrack</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
};

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"InvenTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP - InvenTrack',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#2563eb">InvenTrack</h2>
        <p>Your OTP for verification:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;margin:20px 0">${otp}</div>
        <p style="color:#6b7280;font-size:13px">This OTP expires in 10 minutes.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendOtpEmail };
