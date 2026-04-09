import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';
import OtpInput from '../components/OtpInput';

export default function Register() {
  const [step, setStep] = useState(1); // 1=form, 2=email-sent, 3=phone-otp
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [resending, setResending] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setUserId(data.userId);
      setStep(2);
      toast.success('Verification email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      toast.success('Verification email resent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">InvenTrack</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {step === 1 ? 'Create your account' : step === 2 ? 'Check your email' : 'Verify phone'}
          </p>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <>
            <GoogleAuthButton />
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">or register with email</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input className="input-field" value={form.name} onChange={set('name')} placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min 6 characters"
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {/* STEP 2: Email Verification Sent */}
        {step === 2 && (
          <div className="text-center space-y-4">
            <div className="text-6xl">📧</div>
            <h3 className="text-lg font-bold">Verify your email</h3>
            <p className="text-gray-500 text-sm">
              We sent a verification link to <span className="font-semibold text-gray-800 dark:text-gray-200">{form.email}</span>.
              Click the link to activate your account.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              After verifying your email, you can log in.
            </div>
            <button onClick={handleResend} disabled={resending} className="btn-secondary w-full text-sm">
              {resending ? 'Sending...' : '🔄 Resend verification email'}
            </button>
            <Link to="/login" className="block text-sm text-blue-600 hover:underline">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
