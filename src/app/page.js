'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailSection, setShowEmailSection] = useState(false);

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

  const stats = [
    { number: "1000+", label: "Active Chargers", icon: "⚡" },
    { number: "50+", label: "Cities Covered", icon: "🏙️" },
    { number: "10,000+", label: "Happy Users", icon: "😊" },
    { number: "24/7", label: "Support Available", icon: "🔧" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      text: "ChargeLoop made finding a charger so easy! I saved 2 hours on my weekend trip.",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi",
      text: "Earning extra income by hosting my charger has been amazing. Great platform!",
      rating: 5
    },
    {
      name: "Sarah Williams",
      location: "Bangalore",
      text: "The booking process is seamless and the hosts are very friendly.",
      rating: 5
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="relative w-full h-[600px] lg:h-[700px] overflow-hidden">
        <Image
          src="/image.png"
          alt="EV Charging"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Power Your Journey with <span className="text-green-400">ChargeLoop</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Connect, Charge, and Earn in the largest peer-to-peer EV charging network
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/map')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                🗺️ Find Chargers
              </button>
              <button 
                onClick={handleJoinChargeLoop}
                className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300"
              >
                Join ChargeLoop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Resume Section */}
      {showEmailSection && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mx-auto max-w-md">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Join Our Team!</h2>
              <div className="text-6xl mb-6">📧</div>
              <p className="text-lg text-gray-600 mb-6">
                Interested in joining ChargeLoop? Send us your resume!
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-gray-700 font-semibold">Email your resume to:</p>
                <p className="text-green-600 font-bold text-xl">errorincode404@gmail.com</p>
              </div>
              <button 
                onClick={() => setShowEmailSection(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index} className="transform hover:scale-110 transition-all duration-300">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Revolutionizing EV Charging
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Join our peer-to-peer network of private chargers, viewable on a real-time map. 
            Our mission is to promote EV adoption by expanding charging access everywhere you go.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center text-gray-700">
              <span className="text-green-500 text-2xl mr-2">✓</span>
              Real-time availability
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-green-500 text-2xl mr-2">✓</span>
              Secure payments
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-green-500 text-2xl mr-2">✓</span>
              24/7 support
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Feature Cards Section */}
      <div className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          Why Choose ChargeLoop?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Save Time */}
          <div className="group bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-green-500">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500 transition-all duration-300">
              <Image src="/image1.png" alt="Save Time" width={40} height={40} className="group-hover:brightness-0 group-hover:invert transition-all duration-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-green-600">Save Time</h3>
            <p className="text-gray-600 leading-relaxed">
              Your time is valuable. Keep your electric vehicle charged anywhere you go with our 
              extensive network of available chargers. Find the nearest one in seconds.
            </p>
            <button 
              onClick={() => router.push('/map')}
              className="mt-6 bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-all duration-300"
            >
              Find Now
            </button>
          </div>

          {/* Go Green */}
          <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-lg p-8 text-center text-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
            <div className="bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Image src="/image2.png" alt="Go Green" width={40} height={40} className="brightness-0 invert" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Go Green</h3>
            <p className="leading-relaxed opacity-95">
              Support other electric vehicle owners and join our growing eco-friendly community. 
              Together, we're building a sustainable future for transportation.
            </p>
            <button 
              onClick={() => router.push('/about')}
              className="mt-6 bg-white text-green-600 px-6 py-2 rounded-full hover:bg-gray-100 transition-all duration-300 font-semibold"
            >
              Learn More
            </button>
          </div>

          {/* Earn Cash */}
          <div className="group bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-green-500">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500 transition-all duration-300">
              <Image src="/image3.png" alt="Earn Cash" width={40} height={40} className="group-hover:brightness-0 group-hover:invert transition-all duration-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-green-600">Earn Cash</h3>
            <p className="text-gray-600 leading-relaxed">
              Offer your home charger on the ChargeLoop network and start earning extra income. 
              Help fellow EV owners while monetizing your charging station.
            </p>
            <button 
              onClick={() => router.push('/host/register')}
              className="mt-6 bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-all duration-300"
            >
              Become Host
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            How ChargeLoop Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Sign Up</h3>
              <p className="text-gray-600">Create your free ChargeLoop account in minutes</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Find & Book</h3>
              <p className="text-gray-600">Locate nearby chargers and book your slot instantly</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Charge & Pay</h3>
              <p className="text-gray-600">Charge your vehicle and pay securely through the app</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">4</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Rate & Review</h3>
              <p className="text-gray-600">Share your experience to help the community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3 font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the EV Revolution?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Start your ChargeLoop journey today and experience the future of EV charging
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              {isLoggedIn ? 'View Profile' : 'Get Started Free'}
            </button>
            <button 
              onClick={() => router.push('/map')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-300"
            >
              Explore Map
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
