'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useNotification } from '../../contexts/NotificationContext';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginType, setLoginType] = useState('user');
  const router = useRouter();
  const { showSuccess, showError: showErrorToast } = useNotification();

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token) {

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

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          loginType: loginType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.msg || 'Login failed');
        showErrorToast(errorData.msg || 'Login failed');
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', result.user.role);

        window.dispatchEvent(new Event('authChange'));

        showSuccess('Login successful! Redirecting...');

        if (result.user.role === 'host') {
          router.push('/host');
        } else if (result.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user');
        }
      }
    } catch (error) {
      setError(error.message);
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      if (!credentialResponse?.credential) {
        throw new Error('Google authentication failed - no credential received. Please ensure your Google Cloud Console is properly configured.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          loginType: loginType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          throw new Error('Invalid Google token. Please clear your browser cache and try again.');
        } else if (response.status === 500) {
          throw new Error('Server error during authentication. Please try again.');
        }
        throw new Error(errorData.error || 'Google login failed');
      }

      const result = await response.json();

      if (result.token) {

        const userEmail = result.user.email;
        let userType = 'user';

        try {
          const userTypeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-user-type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({ email: userEmail }),
          });

          if (userTypeResponse.ok) {
            const userTypeData = await userTypeResponse.json();
            userType = userTypeData.userType || 'user';
          }
        } catch (error) {
        }

        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userRole', userType);

        window.dispatchEvent(new Event('authChange'));

        showSuccess('Login successful! Redirecting...');

        if (userType === 'host') {
          router.push('/host');
        } else if (userType === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user');
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to login with Google. Check console for details.';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {}

        {}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 border border-neutral-100 dark:border-neutral-700">

          {}
          <div className="mb-8 flex gap-2 bg-neutral-100 dark:bg-neutral-700 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginType('user')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                loginType === 'user'
                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setLoginType('host')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                loginType === 'host'
                  ? 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Host
            </button>
          </div>

          {}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 dark:text-red-300 text-sm font-medium break-words">{error}</p>
              </div>
            </div>
          )}

          {}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 dark:bg-neutral-700"
                />
                <span className="ml-2.5 text-sm text-neutral-700 dark:text-neutral-300">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 mt-6 ${
                loginType === 'host'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-orange-600 disabled:to-orange-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-600 disabled:to-blue-700'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
              suppressHydrationWarning
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m0-20a9.978 9.978 0 0110 10 9.978 9.978 0 01-10 10m0-20A9.978 9.978 0 002 12a9.978 9.978 0 0110-10" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                `Sign In as ${loginType === 'host' ? 'Host' : 'User'}`
              )}
            </button>
          </form>

          {}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-600"></div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-600"></div>
          </div>

          {}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                setError('Google login failed. Please try again.');
              }}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        {}
        <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
            Sign up for free
          </a>
        </p>
      </div>
    </div>
  );
}
