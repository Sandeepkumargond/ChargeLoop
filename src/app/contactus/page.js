'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
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
      const response = await fetch('/api/contact', {
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
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    } catch (error) {
      setModalContent({ status: 'error', message: "Failed to send message! Please try again or contact us directly at errorincode404@gmail.com" });
      setShowModal(true);
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

 
  const faqItems = [
    {
      question: "How do I find charging stations near me?",
      answer: "Use our interactive map feature to locate available charging stations in real-time. You can filter by charger type, price, and availability."
    },
    {
      question: "How do I become a host?",
      answer: "Sign up for a ChargeLoop account and register your charging station through our host portal. We'll verify your setup and list it on our platform."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI, and our integrated wallet system. All transactions are secure and encrypted."
    },
    {
      question: "Is there a cancellation policy?",
      answer: "Yes, you can cancel bookings up to 1 hour before your scheduled time for a full refund. Last-minute cancellations may incur a small fee."
    }
  ];



  return (
    <>
      {/* Modal Pop-up for status */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-2 ${modalContent.status === 'success' ? 'border-green-400' : 'border-red-400'}`}>
            <div className="mb-4">
              {modalContent.status === 'success' ? (
                <span className="text-green-500 text-4xl">✅</span>
              ) : (
                <span className="text-red-500 text-4xl">❌</span>
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
      {/* Hero Section */}
      <div className="relative dark:bg-gray-900  w-full h-[400px] lg:h-[500px] overflow-hidden">
        <Image
          src="/contact.png"
          alt="Contact Us"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Get in <span className="text-green-400">Touch</span>
            </h1>
            <p className="text-xl lg:text-2xl opacity-90">
              We're here to help you with any questions about ChargeLoop
            </p>
          </div>
        </div>
      </div>

  
      {/* Contact Form */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Send Us a Message
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Have a question or suggestion? We'd love to hear from you.
            </p>
          </div>

          {/* Status pop-up is now handled by modal above. */}

          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
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
                className="bg-green-600 hover:bg-green-700 text-white dark:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                suppressHydrationWarning
              >
                {isSubmitting ? (
                  <div className="flex items-center">
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

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
          
        </div>
      </div>

 

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your EV Journey?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Join ChargeLoop today and experience the future of electric vehicle charging
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/signup')}
              className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              suppressHydrationWarning
            >
              Get Started Free
            </button>
            <button 
              onClick={() => router.push('/map')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-300"
              suppressHydrationWarning
            >
              Explore Chargers
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
