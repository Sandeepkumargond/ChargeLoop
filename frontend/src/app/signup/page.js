'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userType, setUserType] = useState('user');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      // Redirect to appropriate dashboard
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'host') {
        router.push('/host');
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user');
      }
    }
  }, [router]);

  if (!mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      phone: formData.get('phone'),
      userType: userType,
    };

    // Validate password match
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          userType: userType,
        }),
      });
        
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Signup failed');
      }
        
      const result = await response.json();
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error during signup:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    setLoading(true);
    setError('');
    
    try {
      if (!credentialResponse?.credential) {
        throw new Error('Google authentication failed - no credential received.');
      }

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

      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', result.user.email);
        
        window.dispatchEvent(new Event('authChange'));
        
        router.push('/');
      }
    } catch (error) {
      console.error('Error during Google signup:', error);
      setError(error.message || 'Failed to signup with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-green-950 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">I'm signing up as</label>
              <div className="flex gap-3">
                <label className="flex-1 relative cursor-pointer">
                  <input
                    type="radio"
                    value="user"
                    checked={userType === 'user'}
                    onChange={(e) => setUserType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 text-center rounded-lg border-2 transition-all ${
                    userType === 'user'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="text-lg mb-1">👤</div>
                    <div className="text-sm font-medium">User</div>
                  </div>
                </label>
                <label className="flex-1 relative cursor-pointer">
                  <input
                    type="radio"
                    value="host"
                    checked={userType === 'host'}
                    onChange={(e) => setUserType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 text-center rounded-lg border-2 transition-all ${
                    userType === 'host'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="text-lg mb-1">🏢</div>
                    <div className="text-sm font-medium">Host</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              suppressHydrationWarning
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m0-20a9.978 9.978 0 0110 10 9.978 9.978 0 01-10 10m0-20A9.978 9.978 0 002 12a9.978 9.978 0 0110-10" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Google Signup */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSignup}
              onError={() => {
                setError('Google signup failed. Please try again.');
              }}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300">
            Sign in here
          </a>
        </p>
      </div>
    </div>
    </>
  );
}
