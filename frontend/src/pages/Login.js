import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';
import OtpInput from '../components/OtpInput';

export default function Login() {
  const { login, loginWithPhone } = useAuth();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ email: '', password: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresEmailVerification) {
        setUnverifiedEmail(data.email || form.email);
        toast.error('Please verify your email first');
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.phone) return toast.error('Enter phone number');
    setSendingOtp(true);
    try {
      await api.post('/auth/send-phone-otp', { phone: form.phone });
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      await loginWithPhone(form.phone, otp);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email resent!');
    } catch (err) {
      toast.error('Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">InvenTrack</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <GoogleAuthButton />

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
          <button onClick={() => { setMode('email'); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'email' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}>
            📧 Email
          </button>
          <button onClick={() => { setMode('phone'); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'phone' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}>
            📱 Phone OTP
          </button>
        </div>

        {/* Email unverified warning */}
        {unverifiedEmail && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4 text-sm">
            <p className="text-yellow-800 dark:text-yellow-300 font-medium">Email not verified</p>
            <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">Check your inbox or resend the link.</p>
            <button onClick={handleResendVerification} disabled={resending}
              className="mt-2 text-xs text-blue-600 hover:underline">
              {resending ? 'Sending...' : '🔄 Resend verification email'}
            </button>
          </div>
        )}

        {/* EMAIL LOGIN */}
        {mode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                  value={form.password} onChange={set('password')} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* PHONE OTP LOGIN */}
        {mode === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <div className="flex gap-2">
                <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" required />
                <button type="button" onClick={handleSendOtp} disabled={sendingOtp || otpSent}
                  className="btn-secondary text-sm whitespace-nowrap px-3">
                  {sendingOtp ? '...' : otpSent ? '✓ Sent' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Enter OTP</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                <button type="button" onClick={handleSendOtp} disabled={sendingOtp}
                  className="text-xs text-blue-600 hover:underline">
                  {sendingOtp ? 'Sending...' : '🔄 Resend OTP'}
                </button>
                <button type="submit" className="btn-primary w-full" disabled={loading || otp.length < 6}>
                  {loading ? 'Verifying...' : 'Login with OTP'}
                </button>
              </>
            )}
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium mb-1">Demo credentials:</p>
          <p>Admin: admin@inventory.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
