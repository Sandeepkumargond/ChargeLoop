'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithFriendlyError } from '@/utils/fetchWithFriendlyError';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleAutofill = () => {
    setEmail('chargeloop@gmail.com');
    setPassword('chargeloop@123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithFriendlyError(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {

        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name || data.user.email?.split('@')[0] || 'Admin');
        localStorage.setItem('userRole', 'admin');

        window.dispatchEvent(new Event('authChange'));

        setError('');
        setSuccess(true);

        setTimeout(() => {

          router.push('/admin/dashboard');
        }, 1000);

      } else {
        if (response.status === 401 || response.status === 400) {
          setError('Email or password is wrong. Please try again.');
        } else {
          setError(data.message || 'Admin login failed');
        }
      }
    } catch (error) {
      setError(error.message || 'Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex flex-col justify-center px-3 sm:px-6 lg:px-8 py-12 sm:py-0">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-lg opacity-30"></div>
              <img 
                src="/logo.png" 
                alt="ChargeLoop" 
                className="h-16 w-16 rounded-full object-cover relative"
              />
            </div>
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-2">
            Admin Login
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Manage and review <span className="font-semibold">Charge</span><span className="font-semibold text-green-600">Loop</span> operations
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800/80 backdrop-blur-sm py-8 px-6 sm:py-10 sm:px-8 shadow-2xl rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
                User ID (Email Address)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-white text-neutral-900 transition-all text-sm sm:text-base"
                placeholder="admin@chargeloop.com"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-white text-neutral-900 transition-all text-sm sm:text-base"
                suppressHydrationWarning
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 rounded-md border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  Demo
                </button>
                <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3.5">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">⚠️ {error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3.5">
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium">✓ Login successful! Redirecting...</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                suppressHydrationWarning
              >
                {success ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Redirecting...</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Access Admin Dashboard'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
