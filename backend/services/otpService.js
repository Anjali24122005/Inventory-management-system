// OTP Service - Simulated (swap with Twilio for production)
// To use Twilio: npm install twilio, then uncomment Twilio code below

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendPhoneOtp = async (phone, otp) => {
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    // REAL Twilio integration
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    await client.messages.create({
      body: `Your InvenTrack OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
  } else {
    // Simulation — log to console
    console.log(`[PHONE OTP SIMULATION] Phone: ${phone} | OTP: ${otp}`);
  }
};

module.exports = { generateOtp, sendPhoneOtp };
