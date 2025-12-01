import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = VITE_API_URL.replace('/api', ''); // Remove /api for auth endpoints

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Google authentication was cancelled or failed');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Exchange code for token
        const response = await axios.post(`${AUTH_BASE_URL}/auth/google`, {
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`
        });

        const { access_token, user } = response.data;

        // Store token with consistent key
        localStorage.setItem('access_token', access_token); // ✅ Fixed: was 'token'

        // Update auth context
        if (setAuthState) {
          setAuthState(access_token, user);
        }

        // Redirect to home
        navigate('/', { replace: true });
      } catch (err: any) {
        console.error('Google auth error:', err);
        setError(err.response?.data?.detail || 'Authentication failed');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authenticating with Google
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we sign you in...
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
