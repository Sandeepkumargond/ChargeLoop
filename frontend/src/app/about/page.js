'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function AboutPage() {
  const router = useRouter();

  const features = [
    {
      title: "Smart Map Search",
      desc: "Explore our interactive map with real-time charger availability, pricing, and booking status across cities.",
      icon: "/map.png",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Instant Booking",
      desc: "Book chargers instantly with live availability updates and instant confirmation notifications.",
      icon: "/charger.png",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Earn as Host",
      desc: "Monetize your private charger and join thousands of hosts earning passive income daily.",
      icon: "/host.png",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Secure Payments",
      desc: "Pay safely through our integrated wallet system with bank-grade security and instant transactions.",
      icon: "/upi.png",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const impact = [
    {
      title: "Zero Emission Transport",
      desc: "Electric vehicles produce zero direct emissions, contributing to cleaner urban air quality and reduced carbon footprint.",
      icon: "Eco",
      stat: "80% Less Pollution"
    },
    {
      title: "Renewable Energy Integration",
      desc: "Our network prioritizes charging stations powered by solar, wind, and other renewable energy sources.",
      icon: "Energy",
      stat: "60% Green Energy"
    },
    {
      title: "Cleaner Cities",
      desc: "By promoting EV adoption, we're helping reduce harmful emissions that pollute our cities and communities.",
      icon: "Urban",
      stat: "50+ Cities Covered"
    },
    {
      title: "Economic Empowerment",
      desc: "Homeowners and businesses can generate income by sharing their charging infrastructure with the community.",
      icon: "Income",
      stat: "₹50K+ Monthly Earnings"
    }
  ];

  const team = [
    {
      name: "Sandeep",
      role: "Developer",
      image: "/sandeep.jpg",
      bio: "Passionate about sustainable technology and clean energy solutions"
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
            We're revolutionizing EV charging through a peer-to-peer network connecting owners with private charging stations.
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
                To accelerate EV adoption by creating the world's most accessible peer-to-peer charging network.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Make EV charging accessible everywhere</span>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Build a community-driven network</span>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">Contribute to a sustainable future</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-neutral-700 rounded-lg p-6 sm:p-8 border border-neutral-200 dark:border-neutral-600 transition-colors font-semibold">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Our Vision</h3>
                <p className="text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                  A world where every EV owner has instant access to charging, powered by a community of hosts believing in sustainable transportation.
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
              Discover the features that make ChargeLoop the preferred choice
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-neutral-200 dark:border-neutral-700 hover:border-green-200 dark:hover:border-green-700 transition-colors duration-300">
                <div className="bg-green-100 dark:bg-green-900/20 rounded-lg w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Image src={item.icon} alt={item.title} width={32} height={32} className="opacity-70" />
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
              Environmental Impact
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto px-2">
              Together, we're building a cleaner, sustainable future through innovative charging solutions
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
            Ready to Be Part of the Change?
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mb-6 sm:mb-8 px-2">
            Join thousands of EV owners and hosts shaping the future of transportation
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <button
              onClick={() => router.push('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 w-full sm:w-auto"
            >
              Join ChargeLoop
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
