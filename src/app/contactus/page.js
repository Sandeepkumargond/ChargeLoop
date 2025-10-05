'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';

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
  const [copied, setCopied] = useState(false);

  // Initialize EmailJS
  React.useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'VaTgb3L5VwKqMKX2E';
    emailjs.init(publicKey);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowModal(false);
    setModalContent({ status: '', message: '' });
    
    // Validate form data
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setModalContent({ 
        status: 'error', 
        message: "Please fill in all required fields." 
      });
      setShowModal(true);
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalContent({ 
        status: 'error', 
        message: "Please enter a valid email address." 
      });
      setShowModal(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // EmailJS configuration - you can use these public demo credentials or set up your own
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_8k1hn2i';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_ry7w8vh';
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'VaTgb3L5VwKqMKX2E';

      // Prepare template parameters
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        to_email: 'errorincode404@gmail.com',
        subject: formData.subject,
        message: formData.message,
        inquiry_type: formData.type,
        reply_to: formData.email
      };

      // Send email using EmailJS
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      if (response.status === 200) {
        // Success
        setModalContent({ 
          status: 'success', 
          message: `Message sent successfully! 🎉\n\nYour message has been delivered to our team. We'll get back to you within 24 hours at ${formData.email}.\n\nThank you for contacting ChargeLoop!` 
        });
        
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'general'
        });
      } else {
        throw new Error('Failed to send email');
      }
      
      setShowModal(true);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Fallback to mailto if EmailJS fails
      const mailtoLink = `mailto:errorincode404@gmail.com?subject=${encodeURIComponent(`ChargeLoop Contact: ${formData.subject}`)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nType: ${formData.type}\n\nMessage:\n${formData.message}`)}`;
      
      setModalContent({ 
        status: 'error', 
        message: `Direct email sending failed. We've opened your email client as a backup.\n\nAlternatively, send your message manually to: errorincode404@gmail.com\n\nYour message details:\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nType: ${formData.type}\nMessage: ${formData.message}\n\nWe apologize for the inconvenience!` 
      });
      
      // Open email client as fallback
      try {
        window.open(mailtoLink, '_blank');
      } catch (mailtoError) {
        console.error('Mailto fallback also failed:', mailtoError);
      }
      
      setShowModal(true);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 ${modalContent.status === 'success' ? 'border-green-400' : 'border-red-400'}`}>
            <div className="mb-4">
              {modalContent.status === 'success' ? (
                <span className="text-green-500 text-4xl">✅</span>
              ) : (
                <span className="text-red-500 text-4xl">❌</span>
              )}
            </div>
            <h3 className={`text-xl font-bold mb-4 ${modalContent.status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {modalContent.status === 'success' ? 'Success' : 'Error'}
            </h3>
            <div className="mb-6 text-gray-700 dark:text-gray-200 text-left max-h-60 overflow-y-auto">
              {modalContent.message.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0 break-words">
                  {line}
                </p>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {modalContent.status === 'success' && (
                <button
                  onClick={() => copyToClipboard(modalContent.message)}
                  className="bg-blue-500 dark:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy Info'}
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="bg-green-500 dark:bg-green-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 dark:hover:bg-green-800 transition-all duration-300"
              >
                Close
              </button>
            </div>
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
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Have a question or suggestion? We'd love to hear from you.
            </p>
            
            {/* Direct Contact Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a 
                href="mailto:errorincode404@gmail.com" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us Directly
              </a>
              <a 
                href="https://github.com/Sandeepkumargond" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Or use the form below to send your message directly to our team
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
