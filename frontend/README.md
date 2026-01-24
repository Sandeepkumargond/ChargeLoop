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

## Key Features

### Interactive Map & Location Services

- Real-time charger location discovery using Leaflet.js and OpenStreetMap  
- Multi-tier location detection (GPS → Network → IP → Default)  
- Dynamic search radius (1km - 10km)  
- Live availability status with visual indicators  

### User Management

- JWT-based secure authentication system  
- User profiles with charging history  
- Digital wallet with transaction management  
- Role-based access control  

### Host Portal

- Host registration system  
- Charger listing with specifications  
- Dashboard for managing bookings and earnings  
- Real-time availability management  

### Booking & Payments

- Real-time charger booking system  
- Digital wallet integration  
- Transparent pricing structure  
- Automated booking confirmations  

### Responsive Design

- Mobile-first responsive UI  
- Cross-platform compatibility  
- Modern design with Tailwind CSS  
- Intuitive user experience  

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
- JSON Web Tokens (JWT)  
- bcryptjs, cors, dotenv  
- Nodemailer, Nodemon  

### DevOps & Development

- npm  
- Next.js dev server with hot reload  
- ESLint for code quality  
- Deployment-ready for Vercel, Netlify

---
