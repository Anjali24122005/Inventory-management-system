const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');
const { generateOtp, sendPhoneOtp } = require('../services/otpService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const userResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  authProvider: user.authProvider,
  token,
});

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, password, phone, role } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });
    if (await User.findOne({ phone }))
      return res.status(400).json({ message: 'Phone number already registered' });

    const emailOtp = generateOtp();
    const user = await User.create({
      name, email, password, phone, role,
      emailVerifyToken: emailOtp,
      emailVerifyExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    // Send OTP email (non-blocking — don't await to avoid timeout)
    sendVerificationEmail(email, emailOtp).catch(console.error);

    res.status(201).json({
      message: 'OTP sent to your email. Please verify.',
      userId: user._id,
      requiresEmailVerification: true,
    });
  } catch (err) { next(err); }
});

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
router.post('/verify-email-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      emailVerifyToken: otp,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (err) { next(err); }
});

// ─── RESEND EMAIL OTP ─────────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    const emailOtp = generateOtp();
    user.emailVerifyToken = emailOtp;
    user.emailVerifyExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendVerificationEmail(email, emailOtp).catch(console.error);
    res.json({ message: 'OTP resent to your email' });
  } catch (err) { next(err); }
});

// ─── SEND PHONE OTP ───────────────────────────────────────────────────────────
router.post('/send-phone-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'No account with this phone number' });

    const otp = generateOtp();
    user.phoneOtp = otp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendPhoneOtp(phone, otp).catch(console.error);
    res.json({ message: 'OTP sent to your phone', simulated: !process.env.TWILIO_SID });
  } catch (err) { next(err); }
});

// ─── VERIFY PHONE OTP ─────────────────────────────────────────────────────────
router.post('/verify-phone-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({
      phone,
      phoneOtp: otp,
      phoneOtpExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Phone verified successfully!' });
  } catch (err) { next(err); }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified)
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true,
        email: user.email,
      });

    res.json(userResponse(user, generateToken(user._id)));
  } catch (err) { next(err); }
});

// ─── LOGIN PHONE OTP ──────────────────────────────────────────────────────────
router.post('/login-phone', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

    const user = await User.findOne({
      phone,
      phoneOtp: otp,
      phoneOtpExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(401).json({ message: 'Invalid or expired OTP' });
    if (!user.isEmailVerified)
      return res.status(403).json({ message: 'Please verify your email first' });

    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save();

    res.json(userResponse(user, generateToken(user._id)));
  } catch (err) { next(err); }
});

// ─── GOOGLE AUTH ──────────────────────────────────────────────────────────────
router.post('/google', async (req, res, next) => {
  try {
    const { googleId, email, name } = req.body;
    if (!googleId || !email) return res.status(400).json({ message: 'Google auth data missing' });

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) { user.googleId = googleId; user.isEmailVerified = true; await user.save(); }
    } else {
      user = await User.create({ name, email, googleId, authProvider: 'google', isEmailVerified: true });
    }

    res.json(userResponse(user, generateToken(user._id)));
  } catch (err) { next(err); }
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;
