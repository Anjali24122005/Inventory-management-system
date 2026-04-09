const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

const sendVerificationEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"InvenTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email - InvenTrack',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#2563eb">InvenTrack</h2>
        <p>Your email verification OTP:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;margin:20px 0;text-align:center">${otp}</div>
        <p style="color:#6b7280;font-size:13px">This OTP expires in 10 minutes. Do not share it with anyone.</p>
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
