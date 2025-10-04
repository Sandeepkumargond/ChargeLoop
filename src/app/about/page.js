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
      icon: "🌱",
      stat: "80% Less Pollution"
    },
    {
      title: "Renewable Energy Integration",
      desc: "Our network prioritizes charging stations powered by solar, wind, and other renewable energy sources.",
      icon: "⚡",
      stat: "60% Green Energy"
    },
    {
      title: "Cleaner Cities",
      desc: "By promoting EV adoption, we're helping reduce harmful emissions that pollute our cities and communities.",
      icon: "🏙️",
      stat: "50+ Cities Covered"
    },
    {
      title: "Economic Empowerment",
      desc: "Homeowners and businesses can generate income by sharing their charging infrastructure with the community.",
      icon: "💰",
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
      {/* Hero Section */}
  <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-16 lg:py-24 transition-colors">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            About <span className="text-green-600">ChargeLoop</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-800 dark:text-gray-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            We're revolutionizing electric vehicle charging through a peer-to-peer network that connects EV owners with private charging stations, making sustainable transportation accessible to everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/map')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Explore Network
            </button>
            <button 
              onClick={() => router.push('/host/register')}
              className="bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
            >
              Become a Host
            </button>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
  <div className="py-16 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
                To accelerate the adoption of electric vehicles by creating the world's most accessible and reliable peer-to-peer charging network. We believe that by connecting EV owners with private charging infrastructure, we can solve the charging anxiety that holds back EV adoption.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-4">
                    <span className="text-green-600 text-xl">🎯</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-semibold">Make EV charging accessible everywhere</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-4">
                    <span className="text-green-600 text-xl">🤝</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-semibold">Build a community-driven network</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-4">
                    <span className="text-green-600 text-xl">🌍</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-semibold">Contribute to a sustainable future</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-blue-500 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 text-white dark:text-white transition-colors font-semibold">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-lg leading-relaxed">
                  A world where every electric vehicle owner has instant access to charging infrastructure, 
                  powered by a community of hosts who believe in sustainable transportation and shared prosperity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
  <div className="dark:bg-gray-950 py-16 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl  text-center text-gray-900 dark:text-white mb-4">
            Platform Features
          </h2>
          <p className="text-xl text-gray-900 dark:text-white text-center mb-12 max-w-3xl mx-auto ">
            Discover the powerful features that make ChargeLoop the preferred choice for EV owners and hosts
          </p>
          <div className="grid text-gray-900 dark:text-white md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, index) => (
              <div key={index} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl  duration-500 transform ">
                <div className={`bg-gradient-to-r ${item.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300`}>
                  <Image src={item.icon} alt={item.title} width={32} height={32} className="brightness-0 invert" />
                </div>
                <h3 className="text-xl  mb-4 text-gray-900 dark:text-white group-hover:text-green-400 transition-colors duration-300">{item.title}</h3>
                <p className="leading-relaxed text-gray-900 dark:text-white">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
  <div className="py-16 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Environmental Impact
            </h2>
            <p className="text-xl text-gray-900 dark:text-white max-w-3xl mx-auto">
              Together, we're building a cleaner, more sustainable future through innovative charging solutions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impact.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500 transition-all duration-300 text-3xl">
                  <span className="group-hover:scale-110 transition-all duration-300">{item.icon}</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-2">{item.stat}</div>
                <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

     
      {/* Team Section */}
  <div className="py-16 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-boldtext-gray-800 dark:text-gray-100 mb-4">
            Meet Our Team
          </h2>
            <p className="text-xl text-gray-800 dark:text-gray-100 mb-12 max-w-3xl mx-auto">
            Passionate individuals working together to revolutionize the EV charging experience
          </p>
          <div className="flex justify-center">
            {team.map((member, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <Image 
                    src={member.image} 
                    alt={member.name} 
                    width={150} 
                    height={150} 
                    className="rounded-full mx-auto shadow-lg group-hover:scale-105 transition-all duration-300" 
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{member.name}</h3>
                <p className="text-green-600 dark:text-green-400 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-800 dark:text-gray-100 leading-relaxed font-semibold">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
  <div className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-gray-900 dark:to-gray-800 py-16 transition-colors">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl  text-white dark:text-white mb-6">
            Ready to Be Part of the Change?
          </h2>
          <p className="text-xl text-white dark:text-gray-100 opacity-90 mb-8 ">
            Join thousands of EV owners and hosts who are already shaping the future of transportation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/signup')}
              className="bg-white text-green-600 px-8 py-4 rounded-full text-lg  hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              Join ChargeLoop
            </button>
            <button 
              onClick={() => router.push('/contactus')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-300"
            >
              Contact Us
            </button>
          </div> 
        </div>
      </div>
    </>
  );
}
