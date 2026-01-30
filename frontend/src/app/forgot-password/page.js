'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotification } from '../../contexts/NotificationContext';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();
  const { showSuccess, showError: showErrorToast } = useNotification();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('OTP sent successfully to your email');
        showSuccess('OTP sent to your email');
        setStep(2);
      } else {
        setError(data.msg || 'Failed to send OTP');
        showErrorToast(data.msg || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      showErrorToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('OTP verified successfully');
        showSuccess('OTP verified successfully');
        setStep(3);
      } else {
        setError(data.msg || 'Failed to verify OTP');
        showErrorToast(data.msg || 'Failed to verify OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      showErrorToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Password reset successfully!');
        showSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.msg || 'Failed to reset password');
        showErrorToast(data.msg || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      showErrorToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center py-12 px-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg dark:shadow-2xl p-8 w-full max-w-md">
        {}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Reset Password</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">Recover your account access</p>
        </div>

        {}
        <div className="flex justify-between mb-8">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              1
            </div>
            <span className="text-xs mt-2 dark:text-neutral-400">Email</span>
          </div>
          <div className={`flex-1 h-1 mx-2 mt-5 ${step >= 2 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              2
            </div>
            <span className="text-xs mt-2 dark:text-neutral-400">OTP</span>
          </div>
          <div className={`flex-1 h-1 mx-2 mt-5 ${step >= 3 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              3
            </div>
            <span className="text-xs mt-2 dark:text-neutral-400">Password</span>
          </div>
        </div>

        {}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-6">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
                disabled={loading}
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2">We'll send you an OTP to verify your email</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold">Email:</span> {email}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-2">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500 text-center text-2xl tracking-widest"
                disabled={loading}
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2">Check your email for the OTP</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex-1 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-6">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
                disabled={loading}
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2">Minimum 6 characters</p>
            </div>
            <div className="mb-6">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
                disabled={loading}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex-1 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {}
        <div className="mt-8 text-center border-t dark:border-neutral-700 pt-6">
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
