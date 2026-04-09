import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md text-center space-y-4">
        {status === 'loading' && <><div className="text-5xl">⏳</div><p className="text-gray-500">Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-green-600">Email Verified!</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl">❌</div>
            <h2 className="text-xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <Link to="/login" className="btn-secondary inline-block">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
