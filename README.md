# 🔋 ChargeLoop - Peer-to-Peer EV Charging Platform

<div align="center">
  <img src="./public/chargeloop-premium-logo.svg" alt="ChargeLoop Logo" width="500"/>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  
  **Connect • Charge • Earn • Sustain**
  
  *The largest peer-to-peer electric vehicle charging network*
</div>

---

## 🌟 Overview

ChargeLoop is a revolutionary full-stack web application that connects EV owners with charging station hosts, creating a seamless peer-to-peer charging marketplace. Built with modern technologies, it features real-time location services, secure payment processing, and an intuitive user experience.

### 🎯 Problem Statement
With the rapid growth of electric vehicles, finding available charging stations has become a significant challenge. ChargeLoop solves this by:
- Creating a network of private charging stations available for public use
- Enabling hosts to monetize their charging infrastructure
- Providing real-time availability and booking system
- Offering transparent pricing and reliable service

---

## 🚀 Why Choose ChargeLoop?

<div align="center">
  <img src="./public/chargeloop-icon.svg" alt="ChargeLoop Benefits" width="80"/>
</div>

### **🌍 For EV Drivers**
- **🔍 Find Nearby Chargers**: Instantly locate available charging stations within your preferred radius
- **💰 Transparent Pricing**: No hidden fees - see exact costs before booking
- **📱 Easy Booking**: Reserve charging slots in advance with just a few taps
- **⚡ Real-time Updates**: Live availability status and charging progress tracking
- **🛡️ Secure Payments**: Digital wallet system with encrypted transactions

### **🏠 For Charging Station Hosts**
- **💵 Extra Income**: Monetize your private charging station when not in use
- **📊 Smart Dashboard**: Track earnings, bookings, and station performance
- **🎯 Flexible Pricing**: Set your own rates based on demand and location
- **👥 Build Community**: Connect with fellow EV enthusiasts in your area
- **🔧 Easy Management**: Simple tools to manage availability and bookings

### **🌱 For the Environment**
- **♻️ Maximize Utilization**: Reduce need for new charging infrastructure
- **🌿 Carbon Footprint**: Promote sustainable transportation adoption
- **🤝 Community Impact**: Build a collaborative charging ecosystem
- **📈 Scalable Solution**: Grows organically with the EV community

### **🏆 What Sets Us Apart**
- **🚀 Modern Technology**: Built with latest web technologies for optimal performance
- **📍 Intelligent Location**: Multi-tier location detection for accuracy
- **🔒 Bank-grade Security**: JWT authentication and encrypted data storage
- **📱 Mobile-first Design**: Responsive interface that works everywhere
- **⚡ Real-time Features**: Live updates and instant notifications

---

## ✨ Key Features

### 🗺️ **Interactive Map & Location Services**
- Real-time charger location discovery using Leaflet.js and OpenStreetMap
- Multi-tier location detection (GPS → Network → IP → Default)
- Dynamic search radius (1km - 10km)
- Live availability status with visual indicators

### 👤 **User Management**
- JWT-based secure authentication system
- User profiles with charging history
- Digital wallet with transaction management
- Role-based access control

### 🏠 **Host Portal**
- Comprehensive host registration system
- Charger listing with detailed specifications
- Dashboard for managing bookings and earnings
- Real-time availability management

### 💳 **Booking & Payments**
- Real-time charger booking system
- Digital wallet integration
- Transparent pricing structure
- Automated booking confirmations

### 📱 **Responsive Design**
- Mobile-first responsive UI
- Cross-platform compatibility
- Modern design with Tailwind CSS
- Intuitive user experience

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** Next.js 15.4.1 with App Router
- **UI Library:** React 19.1.0
- **Styling:** Tailwind CSS 4.0
- **Components:** Headless UI, Heroicons, Lucide React
- **Maps:** Leaflet.js with OpenStreetMap tiles
- **State Management:** React Hooks

### **Backend**
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with bcryptjs
- **API:** RESTful API architecture
- **Email Service:** EmailJS & Nodemailer

### **DevOps & Tools**
- **Package Manager:** npm
- **Development:** Hot reload with Next.js dev server
- **Build:** Next.js production build
- **Deployment:** Ready for Vercel/Netlify deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- npm or yarn package manager

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sandeepkumargond/ChargeLoop.git
   cd ChargeLoop
   ```

2. **Install frontend dependencies**
   ```bash
   cd my-app
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` files in both frontend and backend directories:
   
   **Frontend (.env)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
   
   **Backend (.env)**
   ```env
   MONGO_URI=mongodb://localhost:27017/chargeloop
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

5. **Start the development servers**
   
   **Backend Server (Terminal 1)**
   ```bash
   cd backend
   npm start
   ```
   
   **Frontend Server (Terminal 2)**
   ```bash
   cd my-app
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 📁 Project Structure

```
ChargeLoop/
├── my-app/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── about/         # About page
│   │   │   ├── api/           # API routes
│   │   │   ├── charging-history/ # Charging history
│   │   │   ├── contactus/     # Contact page
│   │   │   ├── host/          # Host-related pages
│   │   │   ├── login/         # Authentication
│   │   │   ├── map/           # Interactive map
│   │   │   ├── profile/       # User profile
│   │   │   ├── signup/        # User registration
│   │   │   └── wallet/        # Digital wallet
│   │   ├── components/        # Reusable components
│   │   │   ├── Footer.js
│   │   │   ├── MapView.js     # Interactive map component
│   │   │   └── Navbar.js      # Navigation component
│   │   └── lib/               # Utility functions
│   ├── public/                # Static assets
│   └── package.json
│
└── backend/                   # Node.js Backend
    ├── controllers/           # Business logic
    ├── middleware/           # Authentication middleware
    ├── models/               # MongoDB schemas
    │   ├── ChargingSession.js
    │   ├── Host.js
    │   ├── Transaction.js
    │   └── User.js
    ├── routes/               # API endpoints
    │   ├── auth.js
    │   ├── charging.js
    │   ├── host.js
    │   └── wallet.js
    ├── server.js             # Entry point
    └── package.json
```

---

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### **Host Management**
- `POST /api/host/register` - Register as host
- `GET /api/host/nearby` - Find nearby chargers
- `GET /api/host/dashboard` - Host dashboard data

### **Charging & Booking**
- `POST /api/charging/book` - Book a charging session
- `GET /api/charging/history` - Get charging history
- `PUT /api/charging/status` - Update charging status

### **Wallet & Transactions**
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/recharge` - Add funds to wallet
- `GET /api/wallet/transactions` - Transaction history

---

## 🎨 Screenshots

<div align="center">
  <img src="./public/image1.png" alt="Homepage" width="300"/>
  <img src="./public/image2.png" alt="Map View" width="300"/>
  <img src="./public/image3.png" alt="Host Dashboard" width="300"/>
</div>

---

## 🌐 Live Demo

- **Live Application:** [ChargeLoop Demo](https://chargeloop-frontend.vercel.app)
- **Backend API:** [API Documentation](https://chargeloop-backend.onrender.com)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### 📋 Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sandeep Kumar Gond**
- GitHub: [@Sandeepkumargond](https://github.com/Sandeepkumargond)
- LinkedIn: [Connect with me](https://linkedin.com/in/sandeepkumargond)
- Email: sandeepkumargond@gmail.com

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [MongoDB](https://www.mongodb.com/) for the flexible database solution
- [Leaflet](https://leafletjs.com/) for the interactive maps
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [OpenStreetMap](https://www.openstreetmap.org/) for the map tiles
- The open-source community for inspiration and resources

---

## 🔮 Future Enhancements

- [ ] Real-time notifications system
- [ ] Integration with payment gateways (Razorpay, Stripe)
- [ ] Mobile app development (React Native)
- [ ] AI-powered charger recommendations
- [ ] Carbon footprint tracking
- [ ] Integration with smart charging stations
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

<div align="center">
  <strong>⚡ Power Your Journey with ChargeLoop ⚡</strong>
  
  <br><br>
  
  Made with ❤️ for a sustainable future
</div>
