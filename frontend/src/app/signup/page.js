'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useNotification } from '../../contexts/NotificationContext';

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userType, setUserType] = useState('user');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { showSuccess: showSuccessToast, showError: showErrorToast } = useNotification();

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem('token');

    if (token) {

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

    if (!otpVerified) {
      setError('Please verify your email with OTP first');
      showErrorToast('Please verify your email with OTP first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.target);
    const phone = formData.get('phone');
    const data = {
      name: formData.get('name'),
      email: email,
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      phone: phone,
      userType: userType,
    };

    if (data.password !== data.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      showErrorToast(errorMsg);
      setLoading(false);
      return;
    }

    if (!data.phone || data.phone.trim().length === 0) {
      const errorMsg = 'Mobile number is required';
      setError(errorMsg);
      showErrorToast(errorMsg);
      setLoading(false);
      return;
    }

    if (data.phone.includes('@') || data.phone === email) {
      const errorMsg = 'Please enter a valid mobile number';
      setError(errorMsg);
      showErrorToast(errorMsg);
      setLoading(false);
      return;
    }

    try {
      const payloadData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        userType: userType,
        verificationToken,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.msg || 'Signup failed';
        setError(errorMsg);
        showErrorToast(errorMsg);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userRole', result.user.role);

        window.dispatchEvent(new Event('authChange'));

        setSuccess('Account created successfully!');
        showSuccessToast('Account created successfully!');

        if (result.user.role === 'host') {
          setTimeout(() => router.push('/host'), 1500);
        } else {
          setTimeout(() => router.push('/user'), 1500);
        }
      }
    } catch (error) {
      setError(error.message);
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.trim()) {
      setError('Email is required');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send OTP');
      }

      setOtpSent(true);
      setOtpTimer(300);
      showSuccessToast('OTP sent to your email!');
    } catch (error) {
      setError(error.message);
      showErrorToast(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length === 0) {
      setError('OTP is required');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'OTP verification failed');
      }

      setVerificationToken(data.verificationToken);
      setOtpVerified(true);
      showSuccessToast('Email verified successfully!');
      setError('');
    } catch (error) {
      setError(error.message);
      showErrorToast(error.message);
    } finally {
      setOtpLoading(false);
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
          credential: credentialResponse.credential,
          loginType: userType
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
        localStorage.setItem('userRole', result.user.role);

        window.dispatchEvent(new Event('authChange'));

        showSuccessToast('Signup successful! Redirecting...');

        if (result.user.role === 'host') {
          router.push('/host');
        } else {
          router.push('/user');
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to signup with Google.';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-green-950 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {}

        {}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 border border-neutral-100 dark:border-neutral-700">

          {}
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

          {}
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

          {}
          <div className="mb-8 flex gap-2 bg-neutral-100 dark:bg-neutral-700 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                userType === 'user'
                  ? 'bg-white dark:bg-neutral-800 text-green-600 dark:text-green-400 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setUserType('host')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                userType === 'host'
                  ? 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Host
            </button>
          </div>

          {}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Email Address <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                  required
                  disabled={otpSent}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpSent}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {otpLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m0-20a9.978 9.978 0 0110 10 9.978 9.978 0 01-10 10m0-20A9.978 9.978 0 002 12a9.978 9.978 0 0110-10" />
                    </svg>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </div>

            {}
            {otpSent && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Enter OTP <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-center tracking-widest font-mono text-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpVerified}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {otpLoading ? 'Verifying...' : otpVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
                {otpTimer > 0 && !otpVerified && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                    Expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                  </p>
                )}
                {otpVerified && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ Email verified successfully
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
                disabled={!otpVerified}
                autoComplete="tel"
                onChange={(e) => {
                  if (e.target.value.includes('@')) {
                    e.target.value = '';
                    setError('Phone number cannot contain @');
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
                disabled={!otpVerified}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">Confirm Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors text-sm"
                suppressHydrationWarning
                required
                disabled={!otpVerified}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !otpVerified}
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

          {}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-600"></div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-600"></div>
          </div>

          {}
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

        {}
        <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm mt-6">
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
