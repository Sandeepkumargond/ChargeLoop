'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useNotification } from '../../contexts/NotificationContext';

export default function ContactPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ status: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowModal(false);
    setModalContent({ status: '', message: '' });
    try {
      // Use the backend API endpoint instead of client-side email service
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      setModalContent({ status: 'success', message: "Message sent successfully! We'll get back to you within 24 hours." });
      setShowModal(true);
      showSuccess("Message sent successfully! We'll get back to you within 24 hours.");
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    } catch (error) {
      const errorMsg = "Failed to send message! Please try again or contact us directly at errorincode404@gmail.com";
      setModalContent({ status: 'error', message: errorMsg });
      setShowModal(true);
      showError("Failed to send message. Please try again.");
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

 



  return (
    <>
      {/* Modal Pop-up for status */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-2 ${modalContent.status === 'success' ? 'border-green-400' : 'border-red-400'}`}>
            <div className="mb-4">
              {modalContent.status === 'success' ? (
                <div className="text-green-500 text-4xl font-bold">✓</div>
              ) : (
                <div className="text-red-500 text-4xl font-bold">✕</div>
              )}
            </div>
            <h3 className={`text-xl font-bold mb-2 ${modalContent.status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{modalContent.status === 'success' ? 'Success' : 'Error'}</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-200">{modalContent.message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-green-500 dark:bg-green-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 dark:hover:bg-green-800 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Contact Form */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16 px-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              We're Here to Help
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions about ChargeLoop? Reach out to our friendly support team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-12 lg:mb-16">
            {/* Contact Info Cards */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-4xl mb-4 font-bold text-green-600 dark:text-green-400">✉</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-all">support@chargeloop.com</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Response within 24h</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-4xl mb-4 font-bold text-green-600 dark:text-green-400">📱</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Phone</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">+91 1234-567-890</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">9 AM - 6 PM IST</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-600 sm:col-span-2 lg:col-span-1">
              <div className="text-4xl mb-4 font-bold text-green-600 dark:text-green-400">💬</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Live Chat</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Chat with us</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Available 24/7</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-xl">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="Enter your full name"
                  required
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="your@email.com"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Inquiry Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300"
                  suppressHydrationWarning
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="business">Business Partnership</option>
                  <option value="host">Become a Host</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 font-semibold"
                  placeholder="Brief subject of your message"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300 resize-none"
                placeholder="Tell us more about your inquiry..."
                required
                suppressHydrationWarning
              ></textarea>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Message...
                  </div>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
