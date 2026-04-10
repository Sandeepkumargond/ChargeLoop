'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function AboutPage() {
  const router = useRouter();

  const features = [
    {
      title: "Smart Map Search",
      desc: "Explore nearby chargers in real-time with live availability updates, pricing information, and location details on our interactive map.",
      icon: "🗺️",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Easy Booking",
      desc: "Browse available chargers, select your preferred time slot, and book instantly with confirmation emails.",
      icon: "⚡",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Host Your Charger",
      desc: "Register your charger, manage bookings, accept requests from users, and earn money from your charging infrastructure.",
      icon: "🏠",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Wallet System",
      desc: "Secure wallet for storing funds, tracking transactions, and paying for charging services seamlessly.",
      icon: "💳",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const impact = [
    {
      title: "Peer-to-Peer Network",
      desc: "Connect directly with charger owners in your community, making EV charging more accessible and affordable.",
      icon: "🌍",
      stat: "Community Powered"
    },
    {
      title: "Real-time Availability",
      desc: "Get live updates on charger availability and pricing, making it easier to find and book the best options.",
      icon: "📍",
      stat: "Live Map Updates"
    },
    {
      title: "Flexible Hosting",
      desc: "List your charger whenever you want, set your own rates, and manage bookings from your dashboard.",
      icon: "💡",
      stat: "Full Control"
    },
    {
      title: "Simple Transactions",
      desc: "Manage all your payments through our secure wallet system. Track earnings and spending in one place.",
      icon: "💰",
      stat: "Easy Payments"
    }
  ];

  const team = [
    {
      name: "Sandeep",
      role: "Founder & Full Stack Developer",
      image: "/sandeep.jpg",
      bio: "Building ChargeLoop to revolutionize EV charging through peer-to-peer technology"
    }
  ];

  return (
    <>
      {}
      <div className="bg-white dark:bg-neutral-800 py-12 sm:py-16 lg:py-24 transition-colors px-4 sm:px-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-6xl mx-auto w-full text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
            About <span className="text-green-600 dark:text-green-400">ChargeLoop</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
            ChargeLoop is a peer-to-peer charging platform that connects EV owners with nearby charger hosts. Book chargers instantly through our map or monetize your charger and earn income by hosting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <button
              onClick={() => router.push('/map')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 w-full sm:w-auto"
            >
              Explore Network
            </button>
            <button
              onClick={() => router.push('/host/register')}
              className="bg-white dark:bg-neutral-700 text-green-600 dark:text-green-400 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 w-full sm:w-auto"
            >
              Become a Host
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-neutral-800 transition-colors px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">Our Mission</h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mb-4 sm:mb-6 leading-relaxed">
                To make EV charging accessible and convenient by connecting EV owners with nearby charger hosts in a community-driven peer-to-peer network.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Make EV charging easily accessible through a mobile app</span>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Enable charger owners to monetize their infrastructure</span>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Build a transparent, community-powered ecosystem</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-neutral-700 rounded-lg p-6 sm:p-8 border border-neutral-200 dark:border-neutral-600 transition-colors font-semibold">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Our Vision</h3>
                <p className="text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                  A thriving community where EV owners can always find a nearby charger, and charger owners earn sustainable income by sharing their infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-12 sm:py-16 lg:py-20 transition-colors px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-neutral-900 dark:text-white mb-3 sm:mb-4">
              Platform Features
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto px-2">
              Everything you need to find chargers or host your own
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-neutral-200 dark:border-neutral-700 hover:border-green-200 dark:hover:border-green-700 transition-colors duration-300">
                <div className={`bg-gradient-to-br ${item.color} rounded-lg w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 text-3xl sm:text-4xl`}>
                  {item.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-white">{item.title}</h3>
                <p className="leading-relaxed text-neutral-600 dark:text-neutral-300 text-sm sm:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-neutral-800 transition-colors px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
              Why Choose ChargeLoop
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto px-2">
              Key benefits that make ChargeLoop the best choice for EV owners and charger hosts
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {impact.map((item, index) => (
              <div key={index} className="text-center bg-neutral-50 dark:bg-neutral-700 rounded-lg p-6 sm:p-8 border border-neutral-200 dark:border-neutral-600">
                <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{item.icon}</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{item.stat}</div>
                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-neutral-900 dark:text-white">{item.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-neutral-800 py-12 sm:py-16 lg:py-20 transition-colors px-4 sm:px-6 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto text-center w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
            Ready to Join ChargeLoop?
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mb-6 sm:mb-8 px-2">
            Start using ChargeLoop today. Whether you're looking for a charger or want to host one, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <button
              onClick={() => router.push('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 w-full sm:w-auto"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push('/contactus')}
              className="bg-white dark:bg-neutral-700 text-green-600 dark:text-green-400 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 w-full sm:w-auto"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
