import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { signIn } = useAuth();

  const [error, setError] = useState<string>('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signIn();
    } catch (error) {
      console.error('Failed to sign in:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-large">
              <span className="text-3xl">🏈</span>
            </div>
          </div>
          <h1 className="sport-header mb-3">
            Madden CFM Betting
          </h1>
          <p className="sport-subtitle">
            Sign in to make your picks and compete with friends
          </p>
        </div>
        
        <div className="card-sport p-8">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600 font-medium">
                Sign in with your Google account to continue
              </p>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-6 py-4 border border-gray-200 rounded-xl shadow-soft bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105 font-semibold"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
            
            {error && (
              <div className="error-message">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-destructive-500 flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                    ⚠️
                  </div>
                  <div>
                    <p className="font-semibold text-destructive-800">Configuration Error</p>
                    <p className="text-destructive-700 mt-1">{error}</p>
                    <p className="text-sm text-destructive-600 mt-2">
                      Please check your <code className="bg-destructive-200 px-2 py-1 rounded text-xs">.env.local</code> file and ensure Firebase credentials are properly configured.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">terms of service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">privacy policy</a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Ready to dominate the competition? 🏆
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 