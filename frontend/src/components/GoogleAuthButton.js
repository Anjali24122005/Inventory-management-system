import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleAuthButton() {
  const { loginWithGoogle } = useAuth();
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          // Decode JWT from Google
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          await loginWithGoogle({
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          });
          toast.success('Signed in with Google!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google login failed');
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
    );
  }, [clientId, loginWithGoogle]);

  if (!clientId) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-400 cursor-not-allowed"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 opacity-50" />
        Continue with Google (not configured)
      </button>
    );
  }

  return (
    <>
      <script src="https://accounts.google.com/gsi/client" async defer />
      <div id="google-btn" className="w-full" />
    </>
  );
}
