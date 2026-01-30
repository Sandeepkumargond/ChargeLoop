'use client';

import Image from 'next/image';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  const handleJoinChargeLoop = () => {
    setShowEmailSection(true);
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      router.push('/signup');
    }
  };



  return (
    <>
      {/* Hero Section - Fully Responsive */}
      <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        <Image
          src="/image.png"
          alt="EV Charging"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 dark:bg-gray-900"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center text-white max-w-5xl w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in">
              Power Your Journey with <span className="text-green-400 dark:text-green-400 block sm:inline">ChargeLoop</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 dark:opacity-100 max-w-3xl mx-auto px-2">
              Connect with thousands of EV charging stations. Book, charge, and track your journey seamlessly
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <button 
                onClick={() => router.push('/map')}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg dark:bg-green-600 dark:hover:bg-green-700"
              >
                Find Chargers Now
              </button>
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-300 dark:border-gray-300 dark:hover:bg-gray-100 dark:hover:text-gray-900"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Join Free'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Resume Section
      {showEmailSection && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-gray-900 dark:to-gray-800 py-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 mx-auto max-w-md">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Join Our Team!</h2>
              <div className="text-6xl mb-6">📧</div>
              <p className="text-lg text-gray-600 dark:text-gray-200 mb-6">
                Interested in joining ChargeLoop? Send us your resume!
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-200 font-semibold">Email your resume to:</p>
                <p className="text-green-600 dark:text-green-400 font-bold text-xl">errorincode404@gmail.com</p>
              </div>
              <button 
                onClick={() => setShowEmailSection(false)}
                className="bg-gray-500 dark:bg-gray-700 text-white px-6 py-2 rounded-full hover:bg-gray-600 dark:hover:bg-gray-800 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}



      {/* Mission Statement */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Revolutionizing EV Charging
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-10">
            Join our peer-to-peer network connecting EV owners with charging stations everywhere. Find available chargers in real-time, book instantly, and enjoy seamless payment.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-2 font-bold">•</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Real-time Availability</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-2 font-bold">•</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Secure Payments</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-2 font-bold">•</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">24/7 Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Feature Cards Section */}
      <div className="py-16 px-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Choose ChargeLoop
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Save Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center hover:border-green-500 hover:shadow-lg transition-all duration-300">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Image src="/image1.png" alt="Save Time" width={40} height={40} className="opacity-80" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Save Time</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Keep your electric vehicle charged anywhere you go. Find the nearest charger in seconds and book instantly.
            </p>
            <button 
              onClick={() => router.push('/map')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              Find Now
            </button>
          </div>

          {/* Go Green */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center hover:border-green-500 hover:shadow-lg transition-all duration-300">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Image src="/image2.png" alt="Go Green" width={40} height={40} className="opacity-80" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Go Green</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Support the EV community and join our growing eco-friendly movement. Together, building a sustainable future.
            </p>
            <button 
              onClick={() => router.push('/about')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              Learn More
            </button>
          </div>

          {/* Earn Income */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center hover:border-green-500 hover:shadow-lg transition-all duration-300">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Image src="/image3.png" alt="Earn Income" width={40} height={40} className="opacity-80" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Earn Income</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Monetize your home charger and earn passive income. Help fellow EV owners while expanding the network.
            </p>
            <button 
              onClick={() => router.push('/host/register')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              Become Host
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Platform Overview
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">50K+</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Active Users</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">500+</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Charging Stations</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">100K+</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Charges Completed</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">₹5Cr+</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Total Transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Become User/Host Section */}
      <div className="py-16 px-4 sm:px-6 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            How to Get Started
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 text-base mb-12 max-w-2xl mx-auto">
            Join ChargeLoop as either a user finding chargers or a host earning income. Choose your path today.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* User Path */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-all duration-300">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg w-16 h-16 flex items-center justify-center mb-6 mx-auto text-2xl font-bold">U</div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">For Users</h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Find and book charging stations. Save vehicles for quick booking and enjoy seamless payments.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Sign Up</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Create account in seconds</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Add Vehicles</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Save your vehicle details</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Find Chargers</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Locate nearby stations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Book & Charge</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Quick booking and payment</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/signup')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Join as User
              </button>
            </div>

            {/* Host Path */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-all duration-300">
              <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg w-16 h-16 flex items-center justify-center mb-6 mx-auto text-2xl font-bold">H</div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">For Hosts</h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Monetize your charger. Manage bookings and earn passive income effortlessly.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">1.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Create Account</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Sign up as host</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">2.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Add Charger</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">List your charger details</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">3.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Set Pricing</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Define your rates</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">4.</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Start Earning</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Receive bookings and earnings</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/signup')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Join as Host
              </button>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
              Requirements & Benefits
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* User Requirements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Requirements</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    Must be 18 years or older
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    Valid email or Google account
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    Valid driver's license
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    Active payment method
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    Valid vehicle registration
                  </li>
                </ul>
              </div>

              {/* Host Requirements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Host Requirements</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    Must be 18 years or older
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    Valid email or Google account
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    Own a home or business charger
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    Bank account for payments
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    Valid ID and address proof
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Section */}
      <div className="py-16 px-4 sm:px-6 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-base mb-12 max-w-2xl mx-auto">
            Find answers to common questions about ChargeLoop
          </p>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">How do I sign up on ChargeLoop?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 1 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Sign up with your email or Google account, add your vehicle details, and you're ready to find chargers.
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">What payment methods are accepted?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 2 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 2 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  We accept credit cards, debit cards, digital wallets, and bank transfers for wallet top-ups.
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 3 ? null : 3)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">How do I book a charging slot?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 3 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 3 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Use our map to find nearby chargers, check availability, and book your preferred time slot. You'll receive a confirmation with all details.
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 4 ? null : 4)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">Can I become a host?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 4 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 4 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Yes! If you own a home or business charger, you can become a host. Register, verify your charger, set pricing, and start earning passive income.
                </div>
              )}
            </div>

            {/* FAQ Item 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 5 ? null : 5)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">How do hosts earn money?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 5 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 5 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Set your charging rates and availability. Earn per kWh or per session when users book. Earnings are transferred directly to your bank account.
                </div>
              )}
            </div>

            {/* FAQ Item 6 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 6 ? null : 6)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">Is my payment information secure?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 6 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 6 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  We use bank-grade encryption and PCI-DSS compliance. Your payment details are processed through secure gateways and never stored on our servers.
                </div>
              )}
            </div>

            {/* FAQ Item 7 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 7 ? null : 7)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">What if I have an issue during charging?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 7 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 7 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Our 24/7 support team is ready to help. Contact us via email, phone, or live chat and we'll quickly resolve any issues.
                </div>
              )}
            </div>

            {/* FAQ Item 8 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 8 ? null : 8)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">Do you offer customer support?</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${expandedFAQ === 8 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {expandedFAQ === 8 && (
                <div className="px-6 pb-6 pt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700">
                  Yes, we provide 24/7 customer support via email, phone, and live chat. Our team is dedicated to resolving your queries quickly and efficiently.
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Still have questions?</p>
            <button
              onClick={() => router.push('/contactus')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
