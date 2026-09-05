# ChargeLoop - Peer-to-Peer EV Charging Platform

**Connect • Charge • Earn • Sustain**  

*The largest peer-to-peer electric vehicle charging network*

---

## Overview

ChargeLoop is a full-stack platform for discovering, booking, and hosting electric vehicle (EV) charging stations. It provides real-time location services, secure booking, host management, and a modern user interface for both EV owners and charging station hosts.

### Problem Statement

With the rapid growth of electric vehicles, finding available charging stations has become a significant challenge. ChargeLoop solves this by:  

- Creating a network of private charging stations available for public use  
- Enabling hosts to monetize their charging infrastructure  
- Providing real-time availability and booking system  
- Offering transparent pricing and reliable service  

---

## Why Choose ChargeLoop?

### For EV Drivers

- Find Nearby Chargers: Instantly locate available charging stations within your preferred radius  
- Transparent Pricing: No hidden fees, see exact costs before booking  
- Easy Booking: Reserve charging slots in advance  
- Real-time Updates: Live availability status and charging progress tracking  
- Secure Payments: Digital wallet system with encrypted transactions  

### For Charging Station Hosts

- Extra Income: Monetize your private charging station when not in use  
- Smart Dashboard: Track earnings, bookings, and station performance  
- Flexible Pricing: Set your own rates based on demand and location  
- Build Community: Connect with fellow EV enthusiasts  
- Easy Management: Tools to manage availability and bookings  

### For the Environment

- Maximize Utilization: Reduce need for new charging infrastructure  
- Carbon Footprint: Promote sustainable transportation adoption  
- Community Impact: Build a collaborative charging ecosystem  
- Scalable Solution: Grows organically with the EV community  

### What Sets Us Apart

- Modern Technology: Built with latest web technologies for optimal performance  
- Intelligent Location: Multi-tier location detection for accuracy  
- Bank-grade Security: JWT authentication and encrypted data storage  
- Mobile-first Design: Responsive interface that works everywhere  
- Real-time Features: Live updates and instant notifications  

---

## Key Features & Platform Capabilities

### 1. EV Driver (User) Experience

#### Interactive Map & Location Engine
- **Multi-Tier Geolocation**: Automatically determines user location through GPS Geolocation API -> Network cell tower triangulation -> IP Geolocation -> Graceful default fallback.
- **Interactive OpenStreetMap & Leaflet.js**: Rich map interface featuring custom SVG station markers with color-coded live availability badges (Available, In Use, Offline, Maintenance).
- **Dynamic Radius Discovery**: Custom search radius slider (1 km up to 10 km) to find stations within driver range.
- **Comprehensive Station Filtering**: Filter chargers by connector standard (Type 2, CCS2, CHAdeMO, GB/T, Standard 15A Socket), minimum charging speed (kW power rating), pricing, and host amenities (Restrooms, WiFi, Covered Parking, Cafes).
- **Turn-by-Turn Directions**: Direct integration with Google Maps and native navigation apps to route drivers straight to the host charger.

#### Smart Charger Booking System
- **Vehicle-Linked Reservations**: Select which vehicle from your saved garage is being charged to ensure connector and power compatibility.
- **Custom Time Slots**: Book instant charging or reserve scheduled time slots in advance.
- **Live Estimation Engine**: Calculates total estimated charge time and cost upfront based on vehicle battery capacity (kWh), current battery %, target %, and charger power output (kW).
- **Automated Booking Lifecycle**: Full status lifecycle tracking (`Pending` -> `Accepted` -> `In Progress` -> `Completed` or `Cancelled`/`Rejected`).
- **Auto-Expiry Protection**: Unanswered booking requests automatically time out and expire safely via BullMQ delayed queue workers without locking user funds.

#### Live Session Monitoring & Charging History
- **Real-Time Charging Dashboard**: Live session monitor tracking elapsed charging duration, power delivered (kW), total energy consumed (kWh), and dynamic accumulated cost in real-time.
- **Detailed History Logs**: Chronological log of all historical charging sessions including station name, location, charging duration, energy delivered, and invoice amounts.
- **Downloadable Digital Receipts**: Interactive session receipt modal displaying full tax breakdown, base energy cost, host fees, platform fee, and payment reference.

#### Digital Garage (Vehicle Management)
- **Multi-Vehicle Profiles**: Save multiple electric vehicles (Cars, 2-Wheelers, Commercial EVs).
- **Detailed EV Specs**: Record brand, model, battery pack capacity (kWh), maximum supported charging rate (kW), connector port type, and vehicle registration number.
- **Primary Vehicle Designation**: Set a default vehicle for one-click station booking.

#### In-App Digital Wallet & Payments
- **Secure Digital Wallet**: Built-in wallet balance system with instant top-up via Razorpay gateway.
- **Automated Settlement**: Seamless deduction upon session completion with automated host payout distribution.
- **Transparent Ledger**: Itemized transaction history tracking all top-ups, charging debits, cancellation refunds, and promotional credits.

---

### 2. Charging Station Host Portal

#### Host Onboarding & KYC Verification
- **Multi-Step Application Flow**: Easy registration form for property owners and commercial hosts.
- **Station Profiling**: Define charger brand, serial number, max power output (kW), voltage/amperage, and physical port count.
- **Location & Amenities Mapping**: Pinpoint exact station location on map, set operating hours, and list driver amenities (Waiting lounge, CCTV, Water, Restrooms).
- **Document & Image Verification**: Upload electricity bill / ownership documents and high-resolution station photos (stored securely on ImageKit CDN) for platform approval.
- **Application Status Tracking**: Live status updates on host dashboard (`Under Review`, `Approved`, `Denied` with feedback).

#### Station Management & Hardware Controls
- **Live Availability Toggle**: One-click status switcher for hosts to mark stations as `Available`, `Busy`, `Under Maintenance`, or `Offline`.
- **Flexible Pricing Strategy**: Hosts can configure their rate per kWh or hourly tariff.
- **Multiple Station Management**: Support for hosts operating more than one charging socket or location.

#### Booking Request Workflow
- **Real-Time Booking Alerts**: Instant audio/visual booking notifications delivered via Socket.io when a driver requests a charging slot.
- **Accept / Reject Controls**: Hosts can review driver details, vehicle model, and requested time slot before approving or declining.
- **Decline Reason Logging**: Mandatory reason prompt on rejection, automatically triggering an explanatory notification email to the user.
- **Session Controls**: Host can manually initiate, monitor, and conclude charging sessions.

#### Host Financial Analytics & Payouts
- **Earnings Dashboard**: Track gross revenue, net payout, monthly trends, and peak booking hours.
- **Station Performance Metrics**: Total charging sessions served, cumulative kilowatt-hours (kWh) delivered, and utilization rate.
- **Payout Management**: Automated withdrawal requests and payout transaction records.

---

### 3. Admin Portal & Platform Governance

#### Role-Based Admin Access
- Dedicated admin portal (`/admin/login` and `/admin/dashboard`) secured with administrative JWT tokens and strict route guards.

#### Host KYC Approval System
- Centralized queue of all pending host applications.
- Detailed inspection modal for viewing uploaded station photos, identity proofs, and physical charger specifications.
- **Approve Action**: One-click activation immediately registers the station on the public discovery map and fires a welcome email via BullMQ.
- **Deny Action**: Reject with structured feedback, notifying the applicant via automated email.

#### Platform-Wide Auditing
- Manage and monitor all registered users, hosts, and stations.
- Emergency override to suspend fraudulent stations or problematic accounts.
- Audit all platform financial transactions and platform commission collections.

#### Bull-Board Queue Monitoring Dashboard
- Integrated **Bull-Board** UI (`/admin/queues`) to visualize and control asynchronous queues in real time.
- Track active, waiting, completed, failed, and delayed jobs.
- Single-click job retry and failed queue clearing.

---

### 4. Real-Time & Backend Infrastructure

#### Real-Time WebSockets (Socket.io + Redis Adapter)
- **Instant Synchronization**: Station status toggles by hosts update immediately on all drivers' discovery maps without page refreshes.
- **Live Booking Sync**: Real-time push updates for booking acceptances, rejections, and session expirations.
- **Horizontal Scalability**: Backed by `@socket.io/redis-adapter` for multi-server broadcast support.

#### Asynchronous Job Queues (BullMQ + Redis)
- **`chargeloop-email` Queue**:
  - High-deliverability transactional email dispatching using Nodemailer.
  - Asynchronous sending for OTP verification, booking confirmations, host alerts, approval notices, and contact forms.
  - Rate-limited to 20 emails/minute with automatic retry and exponential backoff.
- **`chargeloop-booking-expiry` Queue**:
  - Delayed queue jobs created on every booking request.
  - Automatically expires requests if the host fails to respond within the designated time limit.

#### Enterprise-Grade Security
- **Authentication**: JWT access tokens with secure cookies/headers + Redis-backed 6-digit OTP verification + Google OAuth 2.0.
- **DDoS & Brute-Force Defense**: Tiered rate limiters via `express-rate-limit` with Redis storage across auth and booking endpoints.
- **Data Protection**: `helmet` security headers, `mongo-sanitize` for NoSQL injection prevention, `hpp` against HTTP parameter pollution, and strict input length validation.
- **Optimized Media Delivery**: Direct ImageKit integration for compressed, responsive image hosting.
- **Reliability**: MongoDB connection pooling and graceful server shutdown (draining active workers before process exit).

---

## Technology Stack

### Frontend

- Next.js 15.4.1 with App Router  
- React 19.1.0  
- Tailwind CSS 4.0 with PostCSS   
- Leaflet.js, React Leaflet, Google Maps API  
- Axios, NextAuth.js, EmailJS Browser  

### Backend

- Node.js with Express.js 5.1.0  
- MongoDB with Mongoose ODM  
- Redis (ioredis) & BullMQ (Background queues)  
- Bull-Board (Queue monitoring dashboard)  
- Socket.io (Real-time events)  
- JSON Web Tokens (JWT)  
- bcryptjs, cors, dotenv  
- Nodemailer, Nodemon  

### DevOps & Development

- Docker & Docker Compose (Redis & MongoDB services)  
- npm  
- Next.js dev server with hot reload  
- ESLint for code quality  
- Deployment-ready for Vercel, Netlify, Render  

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18.x or higher) & **npm**
- **Docker & Docker Compose** (for running Redis and local MongoDB)
- **Git**

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sandeepkumargond/ChargeLoop.git
cd ChargeLoop
```

---

### Step 2: Configure Environment Variables

#### Backend Environment
Create a `.env` file inside the `backend` directory (or copy from `.env.example`):
```bash
cp backend/.env.example backend/.env
```
Ensure the variables in `backend/.env` are populated:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chargeloop
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
IMAGEKIT_ID=your_imagekit_id
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Frontend Environment
Create a `.env` file inside the `frontend` directory (or copy from `.env.example`):
```bash
cp frontend/.env.example frontend/.env
```
Ensure the variables in `frontend/.env` are configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_id>/
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

---

### Step 3: Start Supporting Services (Redis)

BullMQ queues, rate limiting, and OTP flows require Redis. Start Redis via Docker Compose:

```bash
# Start Redis container in detached mode
docker-compose up -d redis
```

#### How to Check if Redis is Running:
```bash
# 1. Ping Redis directly inside the container (returns PONG if active):
docker exec -it chargeloop-redis redis-cli ping

# 2. Check running container status:
docker ps --filter "name=chargeloop-redis"
```

---

### Step 4: Install Dependencies and Start the Backend

Open a terminal and run:

```bash
cd backend

# Install dependencies
npm install

# Start backend server in development mode (with nodemon)
npm run dev
```

The backend starts at `http://localhost:5000`. You will see startup logs confirming:
- MongoDB connection
- Redis connection
- Socket.io initialization
- Email worker (`chargeloop-email`)
- Booking expiry worker (`chargeloop-booking-expiry`)

---

### Step 5: Install Dependencies and Start the Frontend

Open a second terminal and run:

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

---

## Application URLs & Dashboards

| Service / Interface | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Main user interface (Browse stations, Book, Host portal) |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | Express REST API |
| **API & Redis Health Check** | [http://localhost:5000/](http://localhost:5000/) | Live JSON status (`mongoStatus`, `redisStatus`, `uptime`) |
| **BullMQ Queue Dashboard** | [http://localhost:5000/admin/queues](http://localhost:5000/admin/queues) | Bull-Board UI for background jobs |

---

## Queue Monitoring Dashboard (Bull-Board)

ChargeLoop utilizes **BullMQ** for reliable, asynchronous background tasks and **Bull-Board** for visual monitoring.

Access the dashboard at:
**`http://localhost:5000/admin/queues`**

### Monitored Queues:
- **`chargeloop-email`**: Asynchronously dispatches OTP verification, booking confirmations, host alerts, and contact form emails.
- **`chargeloop-booking-expiry`**: Automatically processes delayed jobs to expire pending booking requests if left unanswered by hosts.

### Dashboard Capabilities:
- View job counts: Active, Waiting, Completed, Failed, Delayed, and Paused.
- Inspect job payloads, timestamps, and error stack traces.
- Retry failed jobs with a single click.

---

## Useful Commands Cheat Sheet

| Action | Command |
| :--- | :--- |
| **Start Redis** | `docker-compose up -d redis` |
| **Stop Redis** | `docker-compose stop redis` |
| **Ping Redis** | `docker exec -it chargeloop-redis redis-cli ping` |
| **Check Backend Health** | `curl http://localhost:5000/` |
| **Start Standalone Workers** | `cd backend && npm run start:worker` |
| **Start Everything in Docker** | `docker-compose --profile full up -d` |

