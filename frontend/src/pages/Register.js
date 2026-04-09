import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import OtpInput from '../components/OtpInput';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email OTP
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  // Phone OTP
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // Step 1: Register → sends email OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password)
      return toast.error('All fields are required');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setEmailOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify email OTP
  const handleVerifyEmail = async () => {
    if (emailOtp.length < 6) return toast.error('Enter 6-digit OTP');
    setVerifyingEmail(true);
    try {
      await api.post('/auth/verify-email-otp', { email: form.email, otp: emailOtp });
      setEmailVerified(true);
      toast.success('Email verified!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      toast.success('OTP resent!');
    } catch (err) {
      toast.error('Failed to resend');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Send phone OTP
  const handleSendPhoneOtp = async () => {
    if (!form.phone) return toast.error('Enter phone number');
    setSendingPhoneOtp(true);
    try {
      await api.post('/auth/send-phone-otp', { phone: form.phone });
      setPhoneOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  // Step 4: Verify phone OTP
  const handleVerifyPhone = async () => {
    if (phoneOtp.length < 6) return toast.error('Enter 6-digit OTP');
    setVerifyingPhone(true);
    try {
      await api.post('/auth/verify-phone-otp', { phone: form.phone, otp: phoneOtp });
      setPhoneVerified(true);
      toast.success('Phone verified! Registration complete.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingPhone(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">InvenTrack</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create your account</p>
        </div>

        <GoogleAuthButton />
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">or register with email</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input className="input-field" value={form.name} onChange={set('name')}
              placeholder="John Doe" required disabled={emailOtpSent} />
          </div>

          {/* Email + inline verify */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="flex gap-2">
              <input type="email" className="input-field" value={form.email} onChange={set('email')}
                placeholder="you@example.com" required disabled={emailOtpSent} />
              {emailVerified && <span className="text-green-500 text-xl self-center">✅</span>}
            </div>

            {/* Email OTP box */}
            {emailOtpSent && !emailVerified && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">Enter the 6-digit OTP sent to <strong>{form.email}</strong></p>
                <OtpInput value={emailOtp} onChange={setEmailOtp} />
                <div className="flex gap-2">
                  <button type="button" onClick={handleVerifyEmail} disabled={verifyingEmail || emailOtp.length < 6}
                    className="btn-primary text-sm py-1.5 flex-1">
                    {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                  </button>
                  <button type="button" onClick={handleResendEmail} disabled={resending}
                    className="btn-secondary text-sm py-1.5 px-3">
                    {resending ? '...' : 'Resend'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Phone + inline verify */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <div className="flex gap-2">
              <input className="input-field" value={form.phone} onChange={set('phone')}
                placeholder="+91 9876543210" required disabled={phoneOtpSent} />
              {phoneVerified
                ? <span className="text-green-500 text-xl self-center">✅</span>
                : emailVerified && (
                  <button type="button" onClick={handleSendPhoneOtp} disabled={sendingPhoneOtp}
                    className="btn-secondary text-sm whitespace-nowrap px-3">
                    {sendingPhoneOtp ? '...' : 'Send OTP'}
                  </button>
                )
              }
            </div>

            {/* Phone OTP box */}
            {phoneOtpSent && !phoneVerified && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
                <p className="text-xs text-green-700 dark:text-green-300">Enter the 6-digit OTP sent to <strong>{form.phone}</strong></p>
                <OtpInput value={phoneOtp} onChange={setPhoneOtp} />
                <div className="flex gap-2">
                  <button type="button" onClick={handleVerifyPhone} disabled={verifyingPhone || phoneOtp.length < 6}
                    className="btn-primary text-sm py-1.5 flex-1">
                    {verifyingPhone ? 'Verifying...' : 'Verify Phone'}
                  </button>
                  <button type="button" onClick={handleSendPhoneOtp} disabled={sendingPhoneOtp}
                    className="btn-secondary text-sm py-1.5 px-3">
                    {sendingPhoneOtp ? '...' : 'Resend'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                value={form.password} onChange={set('password')}
                placeholder="Min 6 characters" required minLength={6} disabled={emailOtpSent} />
              <button type="button" onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          {!emailOtpSent && (
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Create Account'}
            </button>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
