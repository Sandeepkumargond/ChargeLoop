'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useNotification } from '../../contexts/NotificationContext';

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ valid: null, message: '' });
  const [emailTimeout, setEmailTimeout] = useState(null);
  const router = useRouter();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const validateEmailRealTime = async (email) => {
    if (!email || email.length < 3) {
      setEmailValidation({ valid: null, message: '' });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      setEmailValidation({
        valid: result.valid,
        message: result.reason
      });
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidation({ valid: false, message: 'Unable to verify email' });
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    
    // Clear previous timeout
    if (emailTimeout) {
      clearTimeout(emailTimeout);
    }

    // Set new timeout for real-time validation
    const timeout = setTimeout(() => {
      validateEmailRealTime(email);
    }, 500); // 500ms delay after user stops typing

    setEmailTimeout(timeout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Check email validation before submitting
    if (emailValidation.valid === false) {
      showError(emailValidation.message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.msg === 'Email already exists') {
          showError('Email already exists. Please use a different email.');
        } else {
          showError(result.msg || 'Signup failed');
        }
        return;
      }
      
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', data.email);
        
        // Dispatch auth change event to update navbar
        window.dispatchEvent(new Event('authChange'));
        
        showSuccess('Account created successfully!');
        // Navigate to profile or home
        router.push('/profile');
      } else {
        showSuccess('Signup successful! You can now log in.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Signup error:', error.message);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google signup failed');
      }

      const result = await response.json();

      // Store the token and user info
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', result.user.email);
        
        // Dispatch auth change event to update navbar
        window.dispatchEvent(new Event('authChange'));
        
        showSuccess('Successfully signed up with Google!');
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error during Google signup:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black dark:text-white flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm transition-colors"
      >
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900 dark:text-gray-100">Sign Up</h2>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            type="text"
            name="name"
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            name="email"
            onChange={handleEmailChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              emailValidation.valid === null 
                ? 'focus:ring-green-500 border-gray-300 dark:border-gray-600'
                : emailValidation.valid 
                  ? 'focus:ring-green-500 border-green-300 bg-green-50 dark:bg-green-900'
                  : 'focus:ring-red-500 border-red-300 bg-red-50 dark:bg-red-900'
            }`}
            required
          />
          {emailValidation.valid !== null && (
            <div className={`mt-1 text-sm flex items-center ${emailValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span className="mr-1">
                {emailValidation.valid ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              {emailValidation.message}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || emailValidation.valid === false}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-600  dark:text-gray-400 mb-3">Or continue with</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                showError('Google signup failed. Please try again.');
              }}
              theme="outline"
              size="large"
              width="300"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-green-600 dark:text-green-400 hover:underline">
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
