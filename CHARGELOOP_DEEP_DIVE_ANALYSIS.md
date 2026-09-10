# ChargeLoop — Comprehensive Engineering Deep Dive & System Architecture Guide

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level Design (HLD) & Architectural Overview](#2-high-level-design-hld--architectural-overview)
3. [Technology Stack Selection & Deep Trade-Off Analysis](#3-technology-stack-selection--deep-trade-off-analysis)
4. [Low-Level Design (LLD) & Micro-Architecture](#4-low-level-design-lld--micro-architecture)
5. [Database Schema & Data Modeling Deep Dive](#5-database-schema--data-modeling-deep-dive)
6. [Concurrency, Distributed Queues & Async State](#6-concurrency-distributed-queues--async-state)
7. [Real-Time & Event-Driven Engine (Socket.IO + Redis)](#7-real-time--event-driven-engine-socketio--redis)
8. [Core Business Logic & Algorithms Deep Dive](#8-core-business-logic--algorithms-deep-dive)
9. [Complete API Reference & Route Audit](#9-complete-api-reference--route-audit)
10. [Authentication, Authorization & Security Architecture](#10-authentication-authorization--security-architecture)
11. [End-to-End System Workflows & Sequence Diagrams](#11-end-to-end-system-workflows--sequence-diagrams)
12. [Failure Modes, Resilience & Circuit Breakers](#12-failure-modes-resilience--circuit-breakers)
13. [Production Deployment, Kubernetes & DevOps Topology](#13-production-deployment-kubernetes--devops-topology)
14. [Scalability Bottlenecks & Optimization Strategies](#14-scalability-bottlenecks--optimization-strategies)
15. [Frontend Architecture & Client-Side Engineering](#15-frontend-architecture--client-side-engineering)
16. [Interview Defense & Mastery Guide](#16-interview-defense--mastery-guide)

---

## 1. Executive Summary & Problem Statement

### 1.1 Market Context & The "Charging Desert" Problem
The rapid acceleration of Electric Vehicle (EV) adoption across emerging economies—specifically India—faces an infrastructure bottleneck known as the **Public Charging Deficit**:
1. **Capital Expenditure Barrier:** Installing commercial Fast DC chargers requires high capital expenditure ($15,000–$50,000+), dedicated high-voltage sub-stations, and municipal zoning permits.
2. **Geographical Distribution Gaps:** Commercial charging stations cluster around highways and high-density commercial hubs, leaving suburban, residential, and rural transit corridors with zero coverage ("charging deserts").
3. **Residential Grid Constraint:** Over 60% of urban apartment residents lack dedicated private parking spots equipped with high-amperage charging points.
4. **Underutilized Private Infrastructure:** Tens of thousands of private EV owners, independent homestays, and small commercial establishments possess dedicated 3.3 kW–22 kW AC charging sockets that remain idle for 18–22 hours every day.

### 1.2 The ChargeLoop Peer-to-Peer (P2P) Solution
**ChargeLoop** is a decentralized, peer-to-peer (P2P) electric vehicle charging ecosystem that turns any private EV charger, home 16A/32A socket, or commercial facility into a monetizable, publicly discoverable charging hub.

```
+-------------------------------------------------------------------------+
|                                CHARGELOOP                                |
|                        Decentralized P2P EV Grid                        |
+--------------------+-------------------------------+--------------------+
                     |                               |
                     v                               v
          +--------------------+           +--------------------+
          |     EV Drivers     |           |     Host Network   |
          |  (Demand Partner)  |           |  (Supply Partner)  |
          +--------------------+           +--------------------+
          | - Real-time Map    |           | - Monetize Socket  |
          | - Safety Matching  |           | - Dynamic Rates    |
          | - Advance Booking  |           | - Auto-Verification|
          | - Integrated Pay   |           | - Live Payouts     |
          +--------------------+           +--------------------+
```

### 1.3 Core Business Mechanics
* **Three-Sided Marketplace:** EV Drivers (Consumers), Hosts (Suppliers), and System Administrators (Compliance & KYC Governors).
* **Electrical Safety Verification:** Real-time safety validation preventing vehicle charger damage or home grid tripping by comparing EV on-board charger (OBC) ratings against socket physical circuit limits.
* **Platform Monetization Model:** Flat ₹10 transaction fee per successful charging session + optional dynamic convenience fee set by hosts.
* **Real-Time Booking Loop:** Immediate notification to hosts via WebSockets and email, with an automated 15-minute countdown auto-expiry worker to release stalled reservations.

---

## 2. High-Level Design (HLD) & Architectural Overview

### 2.1 Architectural Pattern: Modular Decoupled Monolith (Microservices-Ready)
ChargeLoop employs an asynchronous, event-driven layered architecture. It cleanly decouples:
1. **Stateless Web/API Layer:** Express.js REST API handling HTTP/JSON, JWT auth, and validation.
2. **Persistent Real-Time Sync Layer:** Socket.IO clustered across instances using Redis Pub/Sub adapter.
3. **Background Distributed Task Layer:** BullMQ worker fleet operating in independent processes or containers.
4. **Storage & Caching Layer:** Primary MongoDB document store alongside an in-memory Redis cluster.

```
                              [ User Client ]          [ Host Client ]          [ Admin Client ]
                                     |                        |                        |
                                     +------------------------+------------------------+
                                                              |
                                                    HTTPS / WSS via Port 443
                                                              |
                                                              v
+-----------------------------------------------------------------------------------------------------------------------+
|                                             KUBERNETES INGRESS / NGINX REVERSE PROXY                                   |
|                                    - SSL Termination (Let's Encrypt TLS)                                              |
|                                    - CORS Policy Enforcement                                                          |
|                                    - Ingress-Level Rate Limiting (50 RPS)                                             |
+-----------------------------------------------------------------------------------------------------------------------+
                                        |                                        |
                          Path: /       |                          Path: /api/*  |
                                        v                                        v
                    +-----------------------+                        +-----------------------+
                    |  Next.js 16 Frontend  |                        |  Express.js API Node  |
                    |  (App Router, SSR/CSR)|                        |  (Stateless Cluster)  |
                    +-----------------------+                        +-----------------------+
                                                                                 |
                         +-------------------------------------------------------+-----------------------+
                         |                           |                           |                       |
                         v                           v                           v                       v
               +-------------------+       +-------------------+       +-------------------+   +-------------------+
               |  MongoDB Atlas    |       |   Redis Cluster   |       | External Services |   | BullMQ Background |
               | (Mongoose Engine) |       | (PubSub + Cache)  |       | - Razorpay Gate   |   |   Worker Fleet    |
               +-------------------+       +-------------------+       | - ImageKit CDN    |   | - Email Worker    |
               | - Users           |       | - Socket Adapter  |       | - SendGrid / SMTP |   | - Auto-Expiry     |
               | - Hosts           |       | - Cache (30s TTL) |       | - Google OAuth    |   +-------------------+
               | - Bookings        |       | - Rate Limit Store|       +-------------------+
               | - Transactions    |       | - BullMQ Storage  |
               +-------------------+       +-------------------+
```

### 2.2 System Component Topology

| Component | Technology | Responsibility | Scalability Strategy |
|---|---|---|---|
| **Frontend Web App** | Next.js 16 (React 19), Tailwind CSS, Leaflet | Client presentation, live maps, client-side pricing calculators, authenticated dashboards | Scaled via Docker / Vercel Edge CDN |
| **API Server Cluster** | Node.js 20+, Express.js | Core domain logic, authentication, booking state machine, payment processing | Horizontal Pod Autoscaling (HPA) 2→10 pods based on CPU/Memory |
| **Real-Time Gateway** | Socket.IO Server + Redis Adapter | Push notifications for booking lifecycle, live payment confirmation | Horizontally scaled via Redis Pub/Sub backplane |
| **Background Workers** | BullMQ, Node.js (`standalone.js`) | Asynchronous email dispatch, automated booking timeout cancellation | Independent container scaling per queue backlog depth |
| **Primary Database** | MongoDB Atlas 7.0+ | Persistent transactional data, user profiles, GeoJSON geospatial queries | Replica set (Primary-Secondary), Read Preferences |
| **Cache & Message Broker** | Redis 7.0+ | Session storage, Socket.IO adapter, distributed rate limiting, queue persistence | Redis Sentinel / Cluster with persistence (AOF/RDB) |
| **Media & CDN** | ImageKit.io API | Storage of host KYC documents, vehicle photos, and dynamic thumbnails | Cloud-managed external CDN |
| **Payment Gateway** | Razorpay Node SDK | Payment order creation, webhook verification, SHA256 HMAC signature validation | High-availability financial gateway with sandbox fallback |

---

## 3. Technology Stack Selection & Deep Trade-Off Analysis

### 3.1 Backend: Node.js & Express.js
* **Why Chosen:** EV charging systems are inherently I/O-heavy (database reads, external payment APIs, geospatial queries, email dispatch, WebSocket messages). Node's single-threaded event loop utilizing `libuv` efficiently manages high concurrency without thread-per-connection memory bloat.
* **Alternative Considered: Go (Golang) / Python (FastAPI):**
  * *Go:* Offers superior CPU performance and lower memory footprint, but lacks the rapid iteration speed and universal JavaScript ecosystem sharing between frontend and backend models.
  * *Python (FastAPI):* Excellent for data science/ML, but lower raw asynchronous throughput compared to Node's V8 engine when orchestrating concurrent network streams.
* **Trade-Off:** Node.js can be CPU-bound on heavy cryptographic hashing or massive math loops. ChargeLoop mitigates this by offloading password hashing (`bcrypt`) to worker threads in C++ bindings and running background jobs via separate BullMQ processes.

### 3.2 Database: MongoDB (Mongoose ODM)
* **Why Chosen:** 
  1. **Polymorphic Host & Charger Data:** Different chargers have radically different connector standards (CCS-2, Type 2, GB/T, 16A 3-Pin Socket), operating rules, dynamic pricing models, and unstructured KYC documents.
  2. **Native Geospatial Indexing:** MongoDB provides native `$near` spatial operators over GeoJSON `Point` geometries (`2dsphere` indexes), enabling sub-millisecond radial distance queries.
* **Alternative Considered: PostgreSQL + PostGIS:**
  * *PostgreSQL:* Standard relational database with the world's most powerful spatial engine (PostGIS) and strict ACID constraints.
  * *Why Not Used:* Rapid prototyping of dynamic charger metadata and nested JSON documents (such as telemetry, booking snapshots, and transaction metadata) benefited from document-oriented storage.
* **Trade-Off & Mitigation:** Lack of strict foreign-key integrity. ChargeLoop enforces referential integrity through Mongoose middleware, programmatic validation, and atomic `$set` / `save` operations.

### 3.3 Cache, Queues & Distributed Bus: Redis (BullMQ + ioredis)
* **Multi-Role Utility:** Redis is used in four distinct capacities:
  1. **Socket.IO Scaling Backplane:** Synchronizes socket emissions across independent Node.js server pods using `@socket.io/redis-adapter`.
  2. **Distributed Rate Limiting:** Prevents brute-force attacks across all API replicas via `rate-limit-redis`.
  3. **Low-Latency Caching:** Caches `/api/host/all` queries with 30-second TTL and automatic cache invalidation on host mutations.
  4. **Delayed & Priority Job Queues:** BullMQ relies on Redis Hashes, Sorted Sets (ZSET), and Streams for scheduling auto-expiry jobs and email notifications.
* **Alternative Considered: RabbitMQ / Apache Kafka / AWS SQS:**
  * *Kafka / RabbitMQ:* Heavy operational overhead (JVM, Erlang runtime, clustering complexity).
  * *Redis:* Lightweight, sub-millisecond latency, and fulfills 4 architectural roles with a single infrastructure dependency.

### 3.4 Real-Time Transport: Socket.IO
* **Why Chosen:** Provides bi-directional, event-driven communication with automatic transport degradation (WebSockets -> HTTP Long-Polling) when network firewalls or cellular carriers block raw WebSocket upgrades.
* **Alternative Considered: Server-Sent Events (SSE) / Raw WebSockets:**
  * *SSE:* Monodirectional (server-to-client only). Requires a separate HTTP post loop from the client.
  * *Raw WebSockets:* Requires handcrafting reconnection logic, room abstractions, heartbeat pings, and horizontal cluster pub/sub syncing. Socket.IO provides all of this out-of-the-box.

---

## 4. Low-Level Design (LLD) & Micro-Architecture

### 4.1 Directory Structure & Architectural Separation
```
backend/
├── config/
│   └── db.js                       # Mongoose connection pool initialization
├── controllers/
│   ├── adminController.js          # Admin KYC approval, platform statistics
│   ├── authController.js           # Signup, login, OAuth, vehicle, OTP handling
│   ├── chargerController.js        # Charger station CRUD and availability
│   └── hostController.js           # Host discovery, radial search, map visibility
├── middleware/
│   ├── adminAuth.js                # Role check: req.user.role === 'admin'
│   ├── auth.js                     # JWT verification & Bearer token extraction
│   ├── scaledRateLimits.js         # Redis-backed tiered rate limiters
│   └── security.js                 # Helmet, mongo-sanitize, HPP configurations
├── models/
│   ├── BookingRequest.js           # Booking finite state machine and pricing snapshot
│   ├── ChargerStation.js           # Physical charging station specifications
│   ├── Host.js                     # Host profile, KYC documents, bank & pricing config
│   ├── Transaction.js              # Double-entry ledger audit trail (credit/debit)
│   └── User.js                     # User entity, vehicles array, credentials
├── queues/
│   └── jobQueues.js                # BullMQ queue definitions, job enqueuers
├── routes/
│   ├── admin.js                    # Admin routes (/api/admin/*)
│   ├── auth.js                     # Auth routes (/api/auth/*)
│   ├── host.js                     # Host routes (/api/host/*)
│   ├── payment.js                  # Payment routes (/api/payment/*)
│   └── user.js                     # User booking & profile routes (/api/user/*)
├── services/
│   ├── emailService.js             # SendGrid / Nodemailer transport + templates
│   ├── imagekitService.js          # HTTP-based multipart document uploader with retries
│   ├── paymentService.js           # Razorpay SDK wrapper with sandbox simulation fallback
│   ├── pricingService.js           # Electrical safety validation & cost engine
│   ├── redisService.js             # Singleton Redis connection manager with fallback
│   ├── socketService.js            # Socket.IO lifecycle & Redis adapter manager
│   └── vehicleService.js           # Indian RTO vehicle number format validator
├── workers/
│   ├── bookingExpiryWorker.js      # BullMQ worker for expiring abandoned bookings
│   ├── emailWorker.js              # BullMQ worker for transactional email processing
│   └── standalone.js               # Separate entry point for worker containers
└── server.js                       # Express bootstrap, HTTP server & socket binding
```

### 4.2 Key Design Patterns Implemented

#### 1. The Singleton & Fault-Tolerant Connection Manager Pattern (`redisService.js`)
* **Intent:** Ensures only one primary Redis connection pool is created per process, avoiding socket exhaustion.
* **Resilience Mechanism:** If Redis is down, `redisService.js` prevents the entire application from crashing by switching transparently to an in-memory Map fallback for OTP storage and caching.
```javascript
// Pattern implementation in backend/services/redisService.js
let redisClient = null;
const memoryStore = new Map(); // Resilient fallback

function getRedisClient() {
  if (redisClient) return redisClient;
  try {
    redisClient = new Redis(getRedisConnectionOptions('Main'));
    // Error event interception ensures uncaught network exceptions do not terminate Node.js
    redisClient.on('error', (err) => console.warn('⚠️ [Redis] Error:', err.message));
    return redisClient;
  } catch (err) {
    return null;
  }
}
```

#### 2. Strategy Pattern & Dual-Engine Architecture (`pricingService.js`)
* **Intent:** Provides seamless backward compatibility for older booking payloads while enforcing a physics-grounded, electrical safety-validated algorithm for new bookings.
* **Engine Comparison:**
  * **Approach A (Legacy Energy-Based):** $Cost = E_{delivered} \times \text{Price/kWh}$. Assumed arbitrary vehicle energy intake without checking the physical socket limits.
  * **Approach B (Safety & Electrical Rating Engine):** Real-world EV charging physics. Enforces:
    $$P_{effective} = \min(P_{user\_charger}, P_{socket\_max})$$
    $$E_{transferred} = P_{effective} \times \text{Duration (Hours)} \times \eta_{charger}$$
    $$\text{Total Bill} = (E_{transferred} \times \text{Price/kWh}) + \text{Convenience Fee} + \text{Platform Fee}$$

#### 3. Middleware Pipeline Pattern (`server.js`, `middleware/`)
Every incoming HTTP request traverses an ordered sequence of filters before hitting business controllers:
```
[ Incoming Request ]
        |
        v
[ securityMiddleware ] -> Helmet HTTP security headers
        |
[ express.json(10mb) ] -> Body parsing with strict size capping
        |
[ mongoSanitize ]      -> Strips `$` and `.` operators to prevent NoSQL injection
        |
[ hpp ]                -> HTTP Parameter Pollution defense
        |
[ scaledRateLimits ]   -> Redis-backed IP rate limiter
        |
[ authMiddleware ]     -> Extracts Bearer token, decodes JWT, populates req.user
        |
[ Controller Action ]  -> Domain logic execution
```

---

## 5. Database Schema & Data Modeling Deep Dive

### 5.1 Entity Relationship Diagram (ERD)
```
+---------------------------------------------------------------------------------+
|                                     USER                                        |
+---------------------------------------------------------------------------------+
| _id: ObjectId (PK)                                                              |
| email: String (Unique, Indexed)                                                 |
| password: String (Hashed via bcrypt)                                            |
| role: String ['user', 'host', 'admin']                                          |
| vehicles: [ { vehicleNumber, vehicleType, model, batteryCapacity, createdAt } ] |
| chargingSessions: Number                                                        |
+---------------------------------------------------------------------------------+
        | 1
        |
        | 1 (Optional, if User registers as Host)
        v
+---------------------------------------------------------------------------------+
|                                     HOST                                        |
+---------------------------------------------------------------------------------+
| _id: ObjectId (PK)                                                              |
| userId: ObjectId (FK -> User._id, Unique, Indexed)                              |
| hostName, email, phone: String                                                  |
| verificationStatus: String ['pending', 'approved', 'rejected']                  |
| isVisibleOnMap: Boolean (Indexed)                                               |
| location: { address, city, state, pincode, coordinates: { lat, lng } }          |
| socketMaxCapacity: Number (kW rating: e.g. 3.3, 7.2, 11, 22)                    |
| pricePerKwh: Number (₹ rate per unit of energy)                                 |
| convenienceFee: Number (₹ host service fee)                                     |
| totalEarnings: Number (₹ accumulated revenue)                                   |
| documents: { addressProofUrl, aadharCardUrl, lightConnectionProofUrl }          |
+---------------------------------------------------------------------------------+
        | 1                                                               | 1
        |                                                                 |
        | M                                                               | M
        v                                                                 v
+------------------------------------+   +----------------------------------------+
|          BOOKING_REQUEST           |   |              TRANSACTION               |
+------------------------------------+   +----------------------------------------+
| _id: ObjectId (PK)                 |   | _id: ObjectId (PK)                     |
| requestId: String (Unique, Indexed)|   | userId: ObjectId (FK -> User)          |
| userId: ObjectId (FK -> User)      |   | hostId: ObjectId (FK -> Host)          |
| hostId: ObjectId (FK -> Host)      |   | bookingId: ObjectId (FK -> Booking)    |
| status: String ['pending',         |   | type: String ['credit', 'debit']       |
|          'accepted', 'declined',   |   | amount: Number                         |
|          'ongoing', 'completed',   |   | status: String ['pending', 'completed']|
|          'cancelled', 'expired']   |   | referenceId: String (Unique, Indexed)  |
| scheduledTime: Date                |   | paymentMethod: String                  |
| userChargerPowerKw: Number         |   | orderId, paymentId: String             |
| socketMaxCapacity: Number          |   | metadata: Object                       |
| totalUnitsKwh: Number              |   +----------------------------------------+
| energyCost, totalBill: Number      |
| platformFee: Number (Default ₹10)  |
| paymentStatus: ['unpaid', 'paid']  |
| orderId, paymentId: String         |
+------------------------------------+
```

### 5.2 Deep Schema Analysis

#### 1. `User.js`
* **Purpose:** Identity and credentials store for all platform actors.
* **Embedded Sub-Documents:** `vehicles` is embedded directly within the User document.
  * *Engineering Rationale:* An EV driver rarely owns more than 2–5 vehicles. Embedding eliminates expensive `$lookup` joins on every booking screen, providing atomic additions and deletions via MongoDB `$push` / `$pull`.
* **Security Constraints:** `password` field is excluded by default in queries (`select('-password')`).

#### 2. `Host.js`
* **Purpose:** Supply-side electrical infrastructure, KYC credentials, and earnings ledger.
* **State Machine:** Governed by `verificationStatus: 'pending' | 'approved' | 'rejected'`. A host is never surfaced on public discovery maps (`/api/host/nearby` or `/api/host/all`) unless:
  $$\text{verificationStatus} == \text{'approved'} \quad \land \quad \text{isVisibleOnMap} == \text{true}$$
* **Geospatial Coordinates:** Stores `location.coordinates` with `lat` and `lng`.

#### 3. `BookingRequest.js`
* **Purpose:** Finite State Machine managing the lifecycle of an EV charging reservation.
* **State Transition Graph:**
```
               [ User Submits ]
                      |
                      v
                 ( PENDING )
                /     |     \
  Host Accepts /      |      \ Host Declines / Cancelled
              v       | Auto  v
        ( ACCEPTED )  | Expire ( DECLINED / CANCELLED )
              |       v
 User Starts  |   ( EXPIRED )
              v
        ( ONGOING )
              |
 Session Ends |
              v
       ( COMPLETED )
              |
 Payment Paid |
              v
          [ CLOSED ]
```
* **Financial Snapshotting:** Rather than linking to mutable host prices, `BookingRequest` creates a permanent immutable snapshot of `pricePerKwh`, `convenienceFee`, `platformFee`, and `totalBill` at the exact millisecond of booking creation. Even if a host later alters their price, the historic invoice remains legally and mathematically exact.

#### 4. `Transaction.js`
* **Purpose:** Audit-compliant double-entry ledger tracking user debits and host payout credits.
* **Ledger Mechanics:**
  * **Debit Entry:** Created when an EV Driver pays for a completed booking (`type: 'debit'`).
  * **Credit Entry:** Created when the platform credits the host's wallet balance (`type: 'credit'`).
  * **Host Payout Entry:** Created when a host withdraws balance to their UPI/Bank account (`type: 'debit'` with `metadata.payoutDetails`).

---

## 6. Concurrency, Distributed Queues & Async State

### 6.1 BullMQ & Redis Queue Architecture
ChargeLoop delegates long-running, latency-sensitive, and scheduled asynchronous tasks to **BullMQ**, backed by Redis Streams and Sorted Sets.

```
       [ Express API Request ]
                 |
                 +----------------------------+
                 |                            |
                 v                            v
       [ enqueueOtpEmail() ]     [ scheduleBookingExpiry() ]
                 |                            |
                 v                            v
       Queue: chargeloop-email    Queue: chargeloop-booking-expiry
       (Instant Job Processing)   (Delayed Job: 15min TTL)
                 |                            |
                 +--------------+-------------+
                                |
                                v
                       [ Redis In-Memory ]
                                |
                 +--------------+-------------+
                 |                            |
                 v                            v
        [ emailWorker.js ]       [ bookingExpiryWorker.js ]
        - Connects to SendGrid   - Runs when delay expires
        - Sends HTML Email       - Checks DB if status == 'pending'
        - Auto-retries x3        - Updates DB to 'expired'
                                 - Emits WebSocket to Host & User
```

### 6.2 The Auto-Expiry Workflow & Race-Condition Defense
* **The Problem:** If a user requests a booking and the host does not accept or decline, the charging slot would be reserved indefinitely, blocking other drivers.
* **The Solution:** When a booking is created, a delayed job is pushed to `chargeloop-booking-expiry`:
  $$\text{Delay} = \max(15 \text{ minutes}, \text{ScheduledTime} - \text{CurrentTime})$$
* **The Cancellation Pattern (`cancelBookingExpiry`):**
  If the host explicitly accepts or declines before the 15-minute countdown finishes:
  1. The API calls `cancelBookingExpiry(bookingId)`.
  2. BullMQ searches the delayed job queue by custom Job ID (`expiry-${bookingId}`).
  3. If found, `job.remove()` is called, preventing false expirations.
* **Idempotency Guard in Worker:** Even if the job cannot be cancelled in time, `bookingExpiryWorker.js` executes an atomic conditional check:
  ```javascript
  const booking = await BookingRequest.findOne({ _id: bookingId, status: 'pending' });
  if (!booking) return; // Already accepted/declined, no-op!
  booking.status = 'expired';
  await booking.save();
  ```

---

## 7. Real-Time & Event-Driven Engine (Socket.IO + Redis)

### 7.1 Architecture & Horizontal Scaling Backplane
When running multiple replicas of the API behind a Kubernetes Ingress or Load Balancer, a client connected to Pod A cannot directly communicate with a host connected to Pod B.

ChargeLoop solves this using `@socket.io/redis-adapter`:
* Two dedicated Redis connections are initialized: `pubClient` and `subClient`.
* When an event is emitted on Pod A, the Redis adapter publishes it to a Redis Pub/Sub channel.
* All other pods subscribe to this channel and immediately forward the message to the corresponding client socket.

```
[ Driver Client ]                    [ Host Client ]
       |                                    ^
       | WSS                                | WSS
       v                                    |
+---------------+                  +-----------------+
| API Pod 1     |                  | API Pod 2       |
+---------------+                  +-----------------+
| Socket Adapter|                  | Socket Adapter  |
+---------------+                  +-----------------+
       |                                    ^
       | Redis PUBLISH                      | Redis SUBSCRIBE
       +----------------> [ REDIS ] --------+
```

### 7.2 Connection Lifecycle & JWT Handshake Authentication
Every WebSocket connection is guarded by an authentication barrier in `socketService.js`:
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: No token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id: userId, ... }
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});
```

### 7.3 Room Partitioning Model
Upon successful connection, the server automatically assigns each socket to a private room matching their MongoDB User ID:
```javascript
socket.join(socket.user.id);
```
This enables targeted, multi-device delivery without storing socket ID maps in memory:
* To message a specific user: `io.to(userId.toString()).emit('event', payload)`
* To message a host: `io.to(host.userId.toString()).emit('event', payload)`

### 7.4 Socket Event Catalog

| Event Name | Emitter | Recipient Room | Payload Data | Triggering Action |
|---|---|---|---|---|
| `new_booking_request` | User Route (`/book`) | `hostId` | `bookingId`, `requestId`, `vehicleNumber`, `scheduledTime` | Driver submits booking |
| `booking_update` | Host Route (`/accept`, `/decline`, `/cancel`) | `userId` | `bookingId`, `status: 'accepted' \| 'declined' \| 'cancelled'`, `reason` | Host accepts or declines reservation |
| `booking_payment_received` | Payment Route (`/verify`) | `hostId` | `bookingId`, `requestId`, `amount`, `paymentStatus: 'paid'` | Driver completes Razorpay checkout |
| `payment_confirmed` | Payment Route (`/verify`) | `userId` | `bookingId`, `paymentId`, `amount` | Payment verified and signed |

---

## 8. Core Business Logic & Algorithms Deep Dive

### 8.1 Electrical Safety Validation & Charging Cost Algorithm
Implemented in `backend/services/pricingService.js`, this mathematical engine models real-world AC/DC electrical transfer constraints.

#### Step 1: Effective Power Limitation
An EV cannot charge faster than its internal On-Board Charger (OBC), nor can it exceed the host's physical circuit breaker/socket capacity:
$$P_{eff} = \min(P_{ev\_charger}, P_{socket\_max})$$

#### Step 2: Safety Overload Detection
If an EV requests charging power that exceeds the host socket's thermal threshold without active throttling, a safety violation is triggered:
```javascript
if (userChargerPowerKw > socketMaxCapacityKw) {
  return {
    isSafeToBook: false,
    safetyAlert: 'DANGER',
    safetyAlertMessage: `⚠️ Safety Warning: Your charger rating (${userChargerPowerKw} kW) exceeds the host's socket capacity (${socketMaxCapacityKw} kW). Booking this station risks electrical tripping or fire.`
  };
}
```

#### Step 3: Delivered Energy Calculation with Efficiency Loss
Energy transmission is not lossless. AC-to-DC rectification suffers a 13% average thermal loss ($\eta \approx 0.87$), whereas Fast DC charging achieves higher efficiency ($\eta \approx 0.92$):
$$E_{delivered} = P_{eff} \times \left(\frac{\text{Duration in Minutes}}{60}\right) \times \eta$$

#### Step 4: Estimated Driving Range Prediction
ChargeLoop converts raw kilowatt-hours into human-understandable range, assuming an average modern EV efficiency of $6.5 \text{ km per kWh}$:
$$\text{Range (km)} = E_{delivered} \times 6.5$$

#### Step 5: Itemized Bill Breakdown
$$\text{Energy Cost} = E_{delivered} \times \text{Price per kWh}$$
$$\text{Total Bill} = \text{Energy Cost} + \text{Convenience Fee} + \text{Platform Fee (₹10)}$$

---

## 9. Complete API Reference & Route Audit

### 9.1 Authentication & Identity Routes (`/api/auth`)

#### `POST /api/auth/send-otp`
* **Description:** Generates a 6-digit random cryptographically secure OTP, persists it in Redis (TTL: 10 minutes), and enqueues an email dispatch job.
* **Rate Limit:** Tiered OTP Limiter (5 requests / 15 mins).
* **Request Body:**
  ```json
  { "email": "user@example.com" }
  ```
* **Response (200 OK):**
  ```json
  { "success": true, "msg": "OTP sent successfully to your email" }
  ```

#### `POST /api/auth/verify-otp`
* **Description:** Compares the supplied OTP against Redis. Upon validation, generates a temporary `verificationToken` (JWT, 30m expiry).
* **Request Body:**
  ```json
  { "email": "user@example.com", "otp": "492810" }
  ```
* **Response (200 OK):**
  ```json
  { "success": true, "verificationToken": "eyJhbGciOi..." }
  ```

#### `POST /api/auth/complete-signup`
* **Description:** Validates `verificationToken`, ensures email matches token payload, hashes password with `bcryptjs` (salt 10), and creates user.
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "phone": "9876543210",
    "userType": "user",
    "verificationToken": "eyJhbGciOi..."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "msg": "User created successfully",
    "token": "eyJhbGciOi...",
    "user": { "id": "651f...", "name": "Jane Doe", "email": "user@example.com", "role": "user" }
  }
  ```

#### `POST /api/auth/google-login`
* **Description:** Verifies Google ID Token via Google Auth Library (`OAuth2Client.verifyIdToken`). Upserts user by `googleId` or `email`.
* **Request Body:**
  ```json
  { "credential": "eyJhbGciOi...", "loginType": "user" }
  ```

---

### 9.2 User & Booking Routes (`/api/user`)

#### `POST /api/user/bookings/book`
* **Auth:** Required (Bearer Token)
* **Description:** Initiates an EV charging booking request, computes safety validation, persists booking in `pending` status, emits WebSocket notification to host, and schedules BullMQ auto-expiry job.
* **Request Body:**
  ```json
  {
    "hostId": "651f89c0a1b2c3d4e5f67890",
    "hostName": "Green Villa Charging Hub",
    "hostLocation": "Koramangala, Bengaluru",
    "chargerType": "Type 2 AC",
    "userChargerPowerKw": 7.4,
    "bookingDurationMinutes": 120,
    "vehicleNumber": "KA01AB1234",
    "vehicleType": "suv",
    "vehicleModel": "Tata Nexon EV",
    "vehicleBatteryCapacity": 40.5,
    "scheduledTime": "2026-09-10T14:00:00.000Z"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "msg": "Booking request created successfully",
    "requestId": "REQ1725729182391ABC",
    "booking": {
      "_id": "651fa1...",
      "status": "pending",
      "totalUnitsKwh": 12.88,
      "energyCost": 154.56,
      "convenienceFee": 20,
      "platformFee": 10,
      "totalBill": 184.56,
      "estimatedRange": 83.72
    }
  }
  ```

#### `PUT /api/user/bookings/:sessionId/complete`
* **Auth:** Required (Bearer Token)
* **Description:** Finalizes charging session, records actual duration and energy consumed, transitions status to `completed`, and generates a debit transaction.

---

### 9.3 Host Operations Routes (`/api/host`)

#### `GET /api/host/nearby`
* **Auth:** Public
* **Description:** Radial proximity search. Filters approved and visible hosts within a specified radius (km) using coordinate distance algorithms.
* **Query Params:** `latitude=12.9352&longitude=77.6245&radius=15`

#### `PUT /api/host/requests/:requestId/accept`
* **Auth:** Required (Must be the owner host)
* **Description:** Host approves reservation. Status transitions to `accepted`. Queues confirmation email, cancels BullMQ auto-expiry job, and emits real-time WebSocket notification to user.

#### `PUT /api/host/requests/:requestId/decline`
* **Auth:** Required (Must be the owner host)
* **Description:** Host rejects reservation with reason. Status transitions to `declined`. Cancels auto-expiry job and emits WebSocket update to user.

#### `POST /api/host/upload-document`
* **Auth:** Required
* **Description:** Multipart file upload for KYC verification (Aadhar, Light bill, Property tax proof). Uploads directly to ImageKit CDN with 2-phase retry and 5MB size limit.

---

### 9.4 Payment & Ledger Routes (`/api/payment`)

#### `POST /api/payment/create-order`
* **Auth:** Required (Driver)
* **Description:** Creates a payment order via Razorpay API (or generates simulated order in sandbox mode). Links `orderId` to booking.
* **Request Body:** `{ "bookingId": "651fa1..." }`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderId": "order_NXK82194...",
    "amount": 18456,
    "currency": "INR",
    "keyId": "rzp_live_...",
    "isSimulation": false
  }
  ```

#### `POST /api/payment/verify`
* **Auth:** Required (Driver)
* **Description:** Verifies payment cryptographic authenticity using SHA256 HMAC signature verification:
  $$\text{Expected Signature} = \text{HMAC-SHA256}(\text{orderId} + "|" + \text{paymentId}, \text{RAZORPAY\_KEY\_SECRET})$$
  Upon match: updates booking `paymentStatus: 'paid'`, logs a completed `Transaction`, and notifies host in real time via WebSockets.

---

### 9.5 Admin Governance Routes (`/api/admin`)

#### `GET /api/admin/hosts/pending`
* **Auth:** Required (`req.user.role === 'admin'`)
* **Description:** Retrieves all hosts awaiting KYC verification with populated user profile data.

#### `PUT /api/admin/hosts/:hostId/approve`
* **Auth:** Required (Admin)
* **Description:** Approves host KYC. Sets `verificationStatus: 'approved'`, `isActive: true`, promotes linked User's role to `'host'`, and queues an approval notification email.

---

## 10. Authentication, Authorization & Security Architecture

### 10.1 Role-Based Access Control (RBAC) Matrix

| Resource / Action | Public / Guest | User (Driver) | Host | Admin |
|---|:---:|:---:|:---:|:---:|
| Search Public Map & Nearby Chargers | Yes | Yes | Yes | Yes |
| Submit Booking Request | No | Yes | Yes | Yes |
| Manage Personal EV Garage | No | Yes | Yes | Yes |
| Accept/Decline Booking Requests | No | No | Owner Only | Yes |
| Set Charger Pricing & Availability | No | No | Owner Only | Yes |
| Withdraw Host Wallet Earnings | No | No | Owner Only | Yes |
| Review KYC Documents & Approve Hosts | No | No | No | Yes |
| System Statistics & User Ban | No | No | No | Yes |

### 10.2 Defense-in-Depth Security Layers
1. **HTTP Security Headers (`helmet`):** Mitigates XSS, Clickjacking, and MIME-sniffing by configuring Content Security Policy, X-Frame-Options (`DENY`), and Strict-Transport-Security.
2. **NoSQL Injection Neutralization (`express-mongo-sanitize`):** Recursively scrubs request payloads, stripping malicious keys containing `$` or `.` to prevent operator injection attacks (e.g. `{"$gt": ""}`).
3. **HTTP Parameter Pollution Defense (`hpp`):** Protects query parameters from array pollution vulnerabilities.
4. **CORS Whitelisting:** Enforces strict Origin checking allowing only authorized production and preview domains (`chargeloop.vercel.app`, `chargeloop.com`).
5. **Cryptographic Salt Stash (`bcryptjs`):** Passwords salted with 10 rounds, ensuring rainbow table immunity.

---

## 11. End-to-End System Workflows & Sequence Diagrams

### 11.1 Booking Lifecycle Sequence Diagram
```
Driver (Client)             API Server               Redis / BullMQ          Host (Client)          MongoDB Atlas
      |                          |                          |                      |                      |
      |-- 1. POST /bookings ---->|                          |                      |                      |
      |   (Duration, Vehicle,    |-- 2. Validate Safety --->|                      |                      |
      |    Power, SchedTime)     |                          |                      |                      |
      |                          |-- 3. Save Booking (Pending) ------------------------------------------>|
      |                          |                          |                      |                      |
      |                          |-- 4. Enqueue Expiry ---->|                      |                      |
      |                          |      (15 min delay)      |                      |                      |
      |                          |                          |                      |                      |
      |                          |-- 5. Socket.io Emit ---->|                      |                      |
      |                          |      'new_booking_req'   +--------------------->|                      |
      |                          |                                                 | (Displays alert)     |
      |<- 201 Created -----------|                                                 |                      |
      |   (Booking ID, Pending)  |                                                 |                      |
      |                          |                                                 |                      |
      |                          |<-- 6. PUT /accept ------------------------------|                      |
      |                          |                                                 |                      |
      |                          |-- 7. Cancel Expiry Job ->|                      |                      |
      |                          |                          |                      |                      |
      |                          |-- 8. Enqueue Email ----->| (SendGrid sends      |                      |
      |                          |                          |  confirmation)       |                      |
      |                          |                                                 |                      |
      |                          |-- 9. Update Status ('accepted') -------------------------------------->|
      |                          |                                                 |                      |
      |                          |-- 10. Socket.io Emit ---------------------------+                      |
      |<- 'booking_update' ------|       'booking_update'                                                 |
      |   (Accepted!)            |                                                                        |
```

---

## 12. Failure Modes, Resilience & Circuit Breakers

| Failure Scenario | Immediate Consequence | System Mitigation & Recovery Strategy |
|---|---|---|
| **Redis Server Crash** | BullMQ queues pause, rate limiting fails, Socket clustering disconnects | **Dual Fallback:** `redisService.js` automatically catches connection errors and switches OTP operations to an internal in-memory Map. API requests continue processing without throwing unhandled exceptions. |
| **Razorpay API Outage** | Users unable to initiate payment on live gateway | **Payment Simulation Mode:** `paymentService.isConfigured()` detects gateway unresponsiveness, falling back to a deterministic sandbox simulation order (`order_sim_*`), allowing end-to-end user flows during demos/testing. |
| **SendGrid Email API Failure** | Welcome/OTP emails cannot be dispatched | **Queue Retry + Test Fallback:** BullMQ retries failed email jobs 3 times with exponential backoff. If SendGrid is unconfigured, `emailService.js` routes through local console test mode without dropping HTTP threads. |
| **Host Closes App During Booking** | Driver request left hanging in pending state | **Auto-Expiry Worker:** BullMQ delayed job triggers at the 15-minute mark, transitions status to `expired`, and emits notifications to clear UI state. |
| **ImageKit Storage Outage** | Document upload times out | **Exponential Retry Engine:** `imagekitService.uploadFile` implements network error detection (`ECONNABORTED`, `ETIMEDOUT`) with a 2-second and 4-second exponential backoff retry loop (max 2 retries). |

---

## 13. Production Deployment, Kubernetes & DevOps Topology

### 13.1 Container Architecture (Docker)
Both `backend` and `frontend` contain container definitions:
* **Backend:** Multi-stage Node.js Alpine base, strips dev-dependencies (`npm prune --production`), exposes port 5000, runs as a non-root user.
* **Frontend:** Next.js standalone build output, minimizing container image size from 1.2 GB to under 150 MB.

### 13.2 Kubernetes Manifests Breakdown (`k8s/`)

#### 1. Ingress Controller (`k8s/ingress-config.yaml`)
* Routes `chargeloop.com` -> `chargeloop-frontend:3000`
* Routes `api.chargeloop.com` -> `chargeloop-api:5000`
* Configures Nginx proxy timeouts (60s), request body limits (50MB), and edge SSL redirects.

#### 2. Backend Deployment & HPA (`k8s/api-deployment.yaml`)
* **Rolling Updates:** Zero-downtime deployment strategy (`maxSurge: 1`, `maxUnavailable: 0`).
* **Health Probes:**
  * `readinessProbe`: Validates container is ready to receive network traffic via HTTP GET `/`.
  * `livenessProbe`: Periodically verifies container health; restarts crashed processes automatically.
  * `startupProbe`: Allows up to 150 seconds for database connection initialization before failing.
* **Horizontal Pod Autoscaling (HPA):** Dynamically scales pod count from 2 to 10 instances when CPU exceeds 70% or Memory exceeds 80%.

#### 3. Worker Deployment (`k8s/worker-deployment.yaml`)
* Decouples background processing from the API server by overriding the container command:
  ```yaml
  command: ["node"]
  args: ["workers/standalone.js"]
  ```
* Ensures high-CPU email rendering or heavy queue processing never steals event-loop cycles from live user HTTP requests.

---

## 14. Scalability Bottlenecks & Optimization Strategies

### 14.1 Database Optimization
* **Connection Pool Tuning:** `maxPoolSize: 50` on API pods, `maxPoolSize: 5` on worker pods prevents exhausting MongoDB Atlas connection limits.
* **Compound Indexes:**
  * `BookingRequest`: `{ hostId: 1, status: 1, createdAt: -1 }` accelerates host dashboard queries.
  * `Host`: `{ verificationStatus: 1, isVisibleOnMap: 1 }` speeds up map filtering.
* **Lean Queries:** Pervasive use of `.lean()` strips heavy Mongoose prototype hydration for read-heavy routes, reducing memory consumption by up to 5x.

### 14.2 Redis Caching Layer
* In `backend/controllers/hostController.js`, public catalog searches (`/api/host/all`) are cached in Redis with a 30-second TTL:
  ```javascript
  const cacheKey = `hosts:all:${city || ''}:${state || ''}:${chargerType || ''}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ hosts: cached });
  ```
* **Cache Invalidation:** When a host updates their availability or toggles map visibility, `invalidateCachePattern('hosts:*')` immediately evicts stale cache entries.

---

## 15. Frontend Architecture & Client-Side Engineering

### 15.1 State Management & Context Hierarchy
The Next.js 16 App Router application wraps the layout in specialized React Contexts:
1. `SocketContext`: Manages single global WebSocket connection, authenticating with localStorage JWT.
2. `BookingFormContext`: Preserves multi-step wizard state (location, charger selection, vehicle parameters, pricing estimate) across route navigation.
3. `NotificationContext`: Displays real-time toast alerts upon receiving incoming socket events.
4. `ThemeContext`: Dark/Light mode theme switching with local storage persistence.

### 15.2 Client-Side Interactive Map (Leaflet)
* Utilizes `react-leaflet` with custom OpenStreetMap tile layers.
* Custom SVG markers denote charger speed classifications:
  * Green: Standard AC (3.3 kW - 7.4 kW)
  * Blue: Fast AC (11 kW - 22 kW)
  * Purple: Rapid DC (50 kW+)
* Implements dynamic viewport-based marker clustering, preventing browser DOM freezing when rendering thousands of charging points.

---

## 16. Interview Defense & Mastery Guide

### 16.1 System Design Interview Questions

#### Q1: "How does ChargeLoop prevent race conditions when two EV drivers try to book the same host charger for the same time slot?"
> **Answer:**
> "ChargeLoop handles concurrency at two distinct layers:
> 1. **Optimistic Pre-Check & Validation:** When a user requests a booking, the query verifies whether an active booking (`accepted` or `ongoing`) already occupies that time window.
> 2. **State Machine Atomicity:** The booking status transitions through a strict state machine (`pending` -> `accepted`). The first request accepted by the host executes an atomic database update (`findOneAndUpdate` with status condition check).
> If a second overlapping request attempts acceptance, the condition fails, returning an HTTP 400. In our Kubernetes roadmap, we also implement a Redis distributed lock (`Redlock` pattern) keyed by `lock:charger:${hostId}:${timeSlot}` during the 15-minute pending window."

#### Q2: "Why did you choose Socket.IO with a Redis Adapter instead of direct HTTP polling or Server-Sent Events (SSE)?"
> **Answer:**
> "HTTP polling introduces unacceptable network overhead and server strain, creating thousands of empty database queries per minute while drivers wait for host approval.
> SSE is unidirectional, requiring a separate HTTP channel for acknowledgments.
> Socket.IO provides bi-directional, low-latency communication with automatic fallback to HTTP long-polling if corporate firewalls or cellular networks block raw WebSockets.
> By integrating `@socket.io/redis-adapter`, we decoupled the socket cluster from individual Node.js processes. A message emitted by an API pod running in one Kubernetes node is published to Redis and instantly routed to the driver's device connected to a different pod, ensuring seamless horizontal scalability."

#### Q3: "How does the system ensure electrical safety between diverse vehicles and residential wall sockets?"
> **Answer:**
> "The platform implements a physics-grounded electrical rating validation algorithm in `pricingService.js`.
> During booking creation, the system extracts the vehicle's On-Board Charger power rating (`userChargerPowerKw`) and matches it against the host's physical circuit capacity (`socketMaxCapacityKw`).
> If `userChargerPowerKw > socketMaxCapacityKw`, the booking is blocked with a `DANGER` alert to prevent circuit overload or residential fire hazards.
> For valid bookings, effective charging power is calculated as $P_{eff} = \min(P_{ev}, P_{socket})$, factoring in an 87% AC/DC rectification efficiency loss to predict accurate kilowatt-hours, realistic charging duration, and reliable cost estimates."

#### Q4: "What happens if the Redis server crashes in production?"
> **Answer:**
> "ChargeLoop was designed with graceful degradation in mind:
> 1. In `redisService.js`, Redis connection failures are intercepted with `.on('error')` listeners, preventing unhandled crash loops.
> 2. For OTPs and authentication, the system automatically falls back to an internal in-memory cache (`Map`), keeping user logins functional.
> 3. For background queues, BullMQ jobs wait persistently on disk or in Redis AOF logs until the container restarts.
> 4. In our production Kubernetes topology, Redis is deployed as a StatefulSet with persistent volume claims (PVC) and health probes to ensure automatic container self-healing."

---

*ChargeLoop Engineering Deep-Dive Architecture Guide — Authored for Principal Engineering Mastery & System Design Defense.*
