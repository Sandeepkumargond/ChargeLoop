#!/usr/bin/env python3
"""
ChargeLoop Complete End-to-End API Test Suite
=============================================
This script tests all major backend API routes across:
1. System & Health Probes (/health, /ready, /, /admin/queues)
2. Authentication & OTP (/api/auth)
3. User Profile & EV Vehicles (/api/user)
4. Host Registration & Charger Stations (/api/host)
5. Admin Management & Approvals (/api/admin)
6. Booking Creation, Lifecycle, & Status Transitions (/api/user & /api/host)
7. Payment Order Creation & Signature Verification (/api/payment)
8. Contact & Notifications (/api/contact)
"""

import sys
import time
import json
import random
import subprocess
import requests

BASE_URL = "http://localhost:5000"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

class TestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.passed = 0
        self.failed = 0
        self.results = []
        self.run_id = int(time.time())

        # Test context state
        self.user_email = f"user_{self.run_id}@example.com"
        self.user_password = "Password@123"
        self.user_token = None
        self.user_id = None
        self.vehicle_id = None

        self.host_email = f"host_{self.run_id}@example.com"
        self.host_password = "HostPassword@123"
        self.host_token = None
        self.host_id = None
        self.station_id = None

        self.admin_email = "admin@chargeloop.com"
        self.admin_password = "Admin@123"
        self.admin_token = None

        self.booking_id = None
        self.booking_req_id = None
        self.order_id = None

    def log_test(self, name, success, details=""):
        if success:
            self.passed += 1
            print(f"  {GREEN}✔ PASS{RESET} {BOLD}{name}{RESET}")
            if details:
                print(f"         {CYAN}{details}{RESET}")
        else:
            self.failed += 1
            print(f"  {RED}✖ FAIL{RESET} {BOLD}{name}{RESET}")
            if details:
                print(f"         {RED}{details}{RESET}")
        self.results.append((name, success, details))

    def get_redis_otp(self, email):
        """Fetch OTP directly from local Redis container."""
        try:
            cmd = ["docker", "exec", "chargeloop-redis", "redis-cli", "get", f"otp:{email.lower().strip()}"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if res.stdout and "{" in res.stdout:
                data = json.loads(res.stdout.strip())
                return data.get("otp")
        except Exception:
            pass
        return None

    def ensure_admin_exists(self):
        """Ensure test admin exists in Mongo."""
        js_code = f"""
        const mongoose = require('mongoose');
        const bcrypt = require('bcryptjs');
        const User = require('./models/User');
        mongoose.connect('mongodb://127.0.0.1:27017/chargeloop').then(async () => {{
          let admin = await User.findOne({{ email: '{self.admin_email}' }});
          const hashed = await bcrypt.hash('{self.admin_password}', 10);
          if (!admin) {{
            await User.create({{
              name: 'System Admin',
              email: '{self.admin_email}',
              password: hashed,
              phone: '9876543210',
              role: 'admin',
              emailVerified: true
            }});
          }} else {{
            admin.role = 'admin';
            admin.password = hashed;
            await admin.save();
          }}
          process.exit(0);
        }}).catch(() => process.exit(1));
        """
        subprocess.run(["node", "-e", js_code], cwd="backend", capture_output=True)

    # =========================================================================
    # Group 1: System & Infrastructure
    # =========================================================================
    def test_group_system(self):
        print(f"\n{BOLD}{CYAN}=== 1. System & Infrastructure Endpoints ==={RESET}")

        # 1.1 Root Healthcheck
        try:
            r = self.session.get(f"{BASE_URL}/", timeout=5)
            data = r.json() if r.status_code == 200 else {}
            ok = r.status_code == 200 and data.get("mongoStatus") == "Connected" and data.get("redisStatus") == "Connected"
            self.log_test("GET / (Root health status)", ok, f"Mongo: {data.get('mongoStatus')}, Redis: {data.get('redisStatus')}, Uptime: {round(data.get('uptime', 0), 2)}s")
        except Exception as e:
            self.log_test("GET / (Root health status)", False, str(e))

        # 1.2 Kubernetes Liveness Probe
        try:
            r = self.session.get(f"{BASE_URL}/health", timeout=5)
            self.log_test("GET /health (Liveness probe)", r.status_code == 200 and r.text.strip() == "OK", f"HTTP {r.status_code} - {r.text.strip()}")
        except Exception as e:
            self.log_test("GET /health (Liveness probe)", False, str(e))

        # 1.3 Kubernetes Readiness Probe
        try:
            r = self.session.get(f"{BASE_URL}/ready", timeout=5)
            self.log_test("GET /ready (Readiness probe)", r.status_code == 200 and r.text.strip() == "Ready", f"HTTP {r.status_code} - {r.text.strip()}")
        except Exception as e:
            self.log_test("GET /ready (Readiness probe)", False, str(e))

        # 1.4 Bull Board Dashboard
        try:
            r = self.session.get(f"{BASE_URL}/admin/queues/", timeout=5)
            self.log_test("GET /admin/queues/ (Bull Board Dashboard)", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            self.log_test("GET /admin/queues/ (Bull Board Dashboard)", False, str(e))

    # =========================================================================
    # Group 2: Authentication & OTP
    # =========================================================================
    def test_group_auth(self):
        print(f"\n{BOLD}{CYAN}=== 2. Authentication & OTP Flows (/api/auth) ==={RESET}")

        # 2.1 Send OTP
        verification_token = None
        try:
            r = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={"email": self.user_email}, timeout=5)
            ok = r.status_code == 200 and r.json().get("success") is True
            self.log_test("POST /api/auth/send-otp", ok, r.json().get("msg", ""))
        except Exception as e:
            self.log_test("POST /api/auth/send-otp", False, str(e))

        # 2.2 Verify OTP via Redis
        otp = self.get_redis_otp(self.user_email)
        try:
            if not otp:
                otp = "123456"
            r = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={"email": self.user_email, "otp": otp}, timeout=5)
            ok = r.status_code == 200 and "verificationToken" in r.json()
            if ok:
                verification_token = r.json().get("verificationToken")
            self.log_test("POST /api/auth/verify-otp", ok, f"OTP: {otp}, Token acquired: {bool(verification_token)}")
        except Exception as e:
            self.log_test("POST /api/auth/verify-otp", False, str(e))

        # 2.3 Complete Signup
        try:
            payload = {
                "name": "Test User EV",
                "email": self.user_email,
                "password": self.user_password,
                "phone": "9876543211",
                "userType": "user",
                "verificationToken": verification_token
            }
            r = self.session.post(f"{BASE_URL}/api/auth/complete-signup", json=payload, timeout=5)
            ok = r.status_code == 201 and "token" in r.json()
            if ok:
                self.user_token = r.json().get("token")
                self.user_id = r.json().get("user", {}).get("id")
            self.log_test("POST /api/auth/complete-signup", ok, f"User ID: {self.user_id}")
        except Exception as e:
            self.log_test("POST /api/auth/complete-signup", False, str(e))

        # 2.4 Login User
        try:
            payload = {
                "email": self.user_email,
                "password": self.user_password,
                "loginType": "user"
            }
            r = self.session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=5)
            ok = r.status_code == 200 and "token" in r.json()
            if ok:
                self.user_token = r.json().get("token")
            self.log_test("POST /api/auth/login (User)", ok, f"Role: {r.json().get('user', {}).get('role')}")
        except Exception as e:
            self.log_test("POST /api/auth/login (User)", False, str(e))

        # 2.5 Check User Type
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            r = self.session.post(f"{BASE_URL}/api/auth/check-user-type", headers=headers, json={"email": self.user_email}, timeout=5)
            ok = r.status_code == 200 and r.json().get("userType") == "user"
            self.log_test("POST /api/auth/check-user-type", ok, f"Type: {r.json().get('userType')}")
        except Exception as e:
            self.log_test("POST /api/auth/check-user-type", False, str(e))

        # 2.6 Forgot Password OTP Dispatch
        try:
            r = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": self.user_email}, timeout=5)
            ok = r.status_code == 200
            self.log_test("POST /api/auth/forgot-password", ok, r.json().get("msg", ""))
        except Exception as e:
            self.log_test("POST /api/auth/forgot-password", False, str(e))

        # 2.7 Verify Vehicle Number Format
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            r = self.session.post(f"{BASE_URL}/api/auth/verify-vehicle", headers=headers, json={"vehicleNumber": "DL01AB1234"}, timeout=5)
            ok = r.status_code == 200
            self.log_test("POST /api/auth/verify-vehicle", ok, f"Format Check: {r.json().get('valid', True)}")
        except Exception as e:
            self.log_test("POST /api/auth/verify-vehicle", False, str(e))

    # =========================================================================
    # Group 3: User Profile & EV Vehicles
    # =========================================================================
    def test_group_user(self):
        print(f"\n{BOLD}{CYAN}=== 3. User Profile & EV Management (/api/user) ==={RESET}")
        headers = {"Authorization": f"Bearer {self.user_token}"}

        # 3.1 Get Profile
        try:
            r = self.session.get(f"{BASE_URL}/api/user/profile", headers=headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("email") == self.user_email
            self.log_test("GET /api/user/profile", ok, f"Name: {r.json().get('name')}")
        except Exception as e:
            self.log_test("GET /api/user/profile", False, str(e))

        # 3.2 Update Profile
        try:
            r = self.session.put(f"{BASE_URL}/api/user/profile", headers=headers, json={"name": "Test User Updated", "phone": "9876543299"}, timeout=5)
            ok = r.status_code == 200 and r.json().get("name") == "Test User Updated"
            self.log_test("PUT /api/user/profile", ok, f"Updated Name: {r.json().get('name')}")
        except Exception as e:
            self.log_test("PUT /api/user/profile", False, str(e))

        # 3.3 Add Vehicle
        try:
            veh_data = {
                "vehicleNumber": "MH12AB1234",
                "vehicleType": "suv",
                "model": "Tata Nexon EV Max",
                "batteryCapacity": 40.5
            }
            r = self.session.post(f"{BASE_URL}/api/user/vehicles", headers=headers, json=veh_data, timeout=5)
            ok = r.status_code == 201 and "vehicle" in r.json()
            if ok:
                self.vehicle_id = r.json().get("vehicle", {}).get("_id")
            self.log_test("POST /api/user/vehicles", ok, f"Vehicle ID: {self.vehicle_id}")
        except Exception as e:
            self.log_test("POST /api/user/vehicles", False, str(e))

        # 3.4 Get Vehicles
        try:
            r = self.session.get(f"{BASE_URL}/api/user/vehicles", headers=headers, timeout=5)
            ok = r.status_code == 200 and len(r.json().get("vehicles", [])) > 0
            self.log_test("GET /api/user/vehicles", ok, f"Count: {len(r.json().get('vehicles', []))}")
        except Exception as e:
            self.log_test("GET /api/user/vehicles", False, str(e))

        # 3.5 User Booking History
        try:
            r = self.session.get(f"{BASE_URL}/api/user/bookings/history", headers=headers, timeout=5)
            ok = r.status_code == 200 and "sessions" in r.json()
            self.log_test("GET /api/user/bookings/history", ok, f"Sessions: {len(r.json().get('sessions', []))}")
        except Exception as e:
            self.log_test("GET /api/user/bookings/history", False, str(e))

        # 3.6 User Current Bookings
        try:
            r = self.session.get(f"{BASE_URL}/api/user/bookings/current", headers=headers, timeout=5)
            data = r.json()
            count = len(data) if isinstance(data, list) else len(data.get("bookings", []))
            ok = r.status_code == 200 and (isinstance(data, list) or "bookings" in data)
            self.log_test("GET /api/user/bookings/current", ok, f"Current Count: {count}")
        except Exception as e:
            self.log_test("GET /api/user/bookings/current", False, str(e))

        # 3.7 User My Requests
        try:
            r = self.session.get(f"{BASE_URL}/api/user/bookings/requests/my-requests", headers=headers, timeout=5)
            ok = r.status_code == 200 and "requests" in r.json()
            self.log_test("GET /api/user/bookings/requests/my-requests", ok, f"Requests: {len(r.json().get('requests', []))}")
        except Exception as e:
            self.log_test("GET /api/user/bookings/requests/my-requests", False, str(e))

    # =========================================================================
    # Group 4: Host Registration & Admin Approval
    # =========================================================================
    def test_group_host_onboarding(self):
        print(f"\n{BOLD}{CYAN}=== 4. Host Registration & Admin Approval ==={RESET}")

        # 4.1 Create Host User
        try:
            r = self.session.post(f"{BASE_URL}/api/auth/signup", json={
                "name": "Super Fast Host",
                "email": self.host_email,
                "password": self.host_password,
                "phone": "9876543288",
                "userType": "host"
            }, timeout=5)
            ok = r.status_code == 201 and "token" in r.json()
            if ok:
                self.host_token = r.json().get("token")
            self.log_test("POST /api/auth/signup (Host)", ok, f"Host Email: {self.host_email}")
        except Exception as e:
            self.log_test("POST /api/auth/signup (Host)", False, str(e))

        # 4.2 Submit Host Registration Request
        host_headers = {"Authorization": f"Bearer {self.host_token}"}
        try:
            host_req_data = {
                "name": "Super Fast Host",
                "mobile": "9876543288",
                "address": "Connaught Place, Central Delhi",
                "latitude": 28.6315,
                "longitude": 77.2167,
                "addressProofUrl": "https://ik.imagekit.io/chargeloop/proof.pdf",
                "aadharCardUrl": "https://ik.imagekit.io/chargeloop/aadhar.pdf",
                "lightConnectionProofUrl": "https://ik.imagekit.io/chargeloop/light.pdf",
                "chargerPowerKw": 22,
                "socketMaxCapacity": 22,
                "pricePerKwh": 12.5,
                "convenienceFee": 5
            }
            r = self.session.post(f"{BASE_URL}/api/auth/request-host-registration", headers=host_headers, json=host_req_data, timeout=5)
            ok = r.status_code in [200, 201] and r.json().get("success") is True
            if ok:
                self.host_id = r.json().get("hostId") or r.json().get("requestId") or r.json().get("host", {}).get("_id")
            self.log_test("POST /api/auth/request-host-registration", ok, f"Host ID: {self.host_id}")
        except Exception as e:
            self.log_test("POST /api/auth/request-host-registration", False, str(e))

        # 4.3 Check Host Registration Status
        try:
            r = self.session.get(f"{BASE_URL}/api/auth/host-registration-status", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("status") == "pending"
            if not self.host_id and r.json().get("hostId"):
                self.host_id = r.json().get("hostId")
            self.log_test("GET /api/auth/host-registration-status", ok, f"Status: {r.json().get('status')}")
        except Exception as e:
            self.log_test("GET /api/auth/host-registration-status", False, str(e))

        # 4.4 Admin Login
        try:
            self.ensure_admin_exists()
            r = self.session.post(f"{BASE_URL}/api/admin/login", json={"email": self.admin_email, "password": self.admin_password}, timeout=5)
            ok = r.status_code == 200 and "token" in r.json()
            if ok:
                self.admin_token = r.json().get("token")
            self.log_test("POST /api/admin/login", ok, f"Admin Role: {r.json().get('user', {}).get('role')}")
        except Exception as e:
            self.log_test("POST /api/admin/login", False, str(e))

        # 4.5 Admin Approve Host
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        try:
            r = self.session.put(f"{BASE_URL}/api/admin/hosts/{self.host_id}/approve", headers=admin_headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("host", {}).get("verificationStatus") == "approved"
            self.log_test(f"PUT /api/admin/hosts/:hostId/approve", ok, f"Status: {r.json().get('host', {}).get('verificationStatus')}")
        except Exception as e:
            self.log_test(f"PUT /api/admin/hosts/:hostId/approve", False, str(e))

        # 4.6 Re-login Host after Approval to refresh JWT role
        try:
            r = self.session.post(f"{BASE_URL}/api/auth/login", json={"email": self.host_email, "password": self.host_password, "loginType": "host"}, timeout=5)
            ok = r.status_code == 200 and r.json().get("user", {}).get("role") == "host"
            if ok:
                self.host_token = r.json().get("token")
            self.log_test("POST /api/auth/login (Host Approved)", ok, f"Role: {r.json().get('user', {}).get('role')}")
        except Exception as e:
            self.log_test("POST /api/auth/login (Host Approved)", False, str(e))

    # =========================================================================
    # Group 5: Host Operations & Station Management
    # =========================================================================
    def test_group_host_operations(self):
        print(f"\n{BOLD}{CYAN}=== 5. Host Operations & Station Management (/api/host) ==={RESET}")
        host_headers = {"Authorization": f"Bearer {self.host_token}"}

        # 5.1 Get Host Profile
        try:
            r = self.session.get(f"{BASE_URL}/api/host/profile", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("hostName") == "Super Fast Host"
            self.log_test("GET /api/host/profile", ok, f"Host: {r.json().get('hostName')}, Verified: {r.json().get('verificationStatus')}")
        except Exception as e:
            self.log_test("GET /api/host/profile", False, str(e))

        # 5.2 Create Charger Station
        try:
            station_data = {
                "name": "CP High Speed Hub",
                "location": {
                    "address": "Inner Circle, Connaught Place",
                    "city": "New Delhi",
                    "state": "Delhi",
                    "pincode": "110001",
                    "coordinates": {"lat": 28.6315, "lng": 77.2167}
                },
                "chargerType": "AC",
                "socketMaxCapacity": 22,
                "chargerPowerKw": 22,
                "pricePerKwh": 12.5,
                "operatingHours": {"start": "00:00", "end": "23:59", "is24x7": True},
                "amenities": ["Parking", "WiFi", "Restroom"]
            }
            r = self.session.post(f"{BASE_URL}/api/host/chargers", headers=host_headers, json=station_data, timeout=5)
            ok = r.status_code == 201 and "station" in r.json()
            if ok:
                self.station_id = r.json().get("station", {}).get("_id")
            self.log_test("POST /api/host/chargers", ok, f"Station ID: {self.station_id}")
        except Exception as e:
            self.log_test("POST /api/host/chargers", False, str(e))

        # 5.3 Get Host Charger Stations
        try:
            r = self.session.get(f"{BASE_URL}/api/host/chargers/host/stations", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and len(r.json().get("stations", [])) > 0
            self.log_test("GET /api/host/chargers/host/stations", ok, f"Stations Count: {len(r.json().get('stations', []))}")
        except Exception as e:
            self.log_test("GET /api/host/chargers/host/stations", False, str(e))

        # 5.4 Nearby Charger Stations
        try:
            r = self.session.get(f"{BASE_URL}/api/host/chargers/nearby?lat=28.6315&lng=77.2167&radius=10", timeout=5)
            ok = r.status_code == 200 and len(r.json().get("stations", [])) > 0
            self.log_test("GET /api/host/chargers/nearby", ok, f"Found {len(r.json().get('stations', []))} nearby stations")
        except Exception as e:
            self.log_test("GET /api/host/chargers/nearby", False, str(e))

        # 5.5 All Hosts Listing
        try:
            r = self.session.get(f"{BASE_URL}/api/host/all", timeout=5)
            ok = r.status_code == 200 and "hosts" in r.json()
            self.log_test("GET /api/host/all", ok, f"Total Approved Hosts: {len(r.json().get('hosts', []))}")
        except Exception as e:
            self.log_test("GET /api/host/all", False, str(e))

        # 5.6 Toggle Host Availability
        try:
            r = self.session.put(f"{BASE_URL}/api/host/toggle-availability", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and "available" in r.json()
            if not r.json().get("available"):
                r = self.session.put(f"{BASE_URL}/api/host/toggle-availability", headers=host_headers, timeout=5)
            self.log_test("PUT /api/host/toggle-availability", ok, f"Availability: {r.json().get('available')}")
        except Exception as e:
            self.log_test("PUT /api/host/toggle-availability", False, str(e))

        # 5.7 Host Bookings History & Status Counts
        try:
            r = self.session.get(f"{BASE_URL}/api/host/booking-requests/history", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and "requests" in r.json() and "statusCounts" in r.json()
            self.log_test("GET /api/host/booking-requests/history (With aggregation counts)", ok, f"Counts: {r.json().get('statusCounts')}")
        except Exception as e:
            self.log_test("GET /api/host/booking-requests/history", False, str(e))

        # 5.8 Host Current Bookings (Initial check)
        try:
            r = self.session.get(f"{BASE_URL}/api/host/bookings/current", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and "bookings" in r.json()
            self.log_test("GET /api/host/bookings/current (Upcoming 24hr)", ok, f"Initial Upcoming: {len(r.json().get('bookings', []))}")
        except Exception as e:
            self.log_test("GET /api/host/bookings/current", False, str(e))

    # =========================================================================
    # Group 6: End-to-End Booking Lifecycle
    # =========================================================================
    def test_group_booking_lifecycle(self):
        print(f"\n{BOLD}{CYAN}=== 6. End-to-End Booking Lifecycle ==={RESET}")
        user_headers = {"Authorization": f"Bearer {self.user_token}"}
        host_headers = {"Authorization": f"Bearer {self.host_token}"}

        # 6.1 Create Booking Request (User -> Host)
        try:
            booking_payload = {
                "hostId": self.host_id,
                "hostName": "Super Fast Host",
                "hostLocation": "Connaught Place, Central Delhi",
                "chargerType": "Regular Charging (22kW)",
                "vehicleNumber": "MH12AB1234",
                "vehicleType": "suv",
                "vehicleModel": "Tata Nexon EV Max",
                "vehicleBatteryCapacity": 40.5,
                "userChargerPowerKw": 7.4,
                "bookingDurationMinutes": 60,
                "scheduledTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 3600))
            }
            r = self.session.post(f"{BASE_URL}/api/user/bookings/book", headers=user_headers, json=booking_payload, timeout=5)
            ok = r.status_code == 201 and "booking" in r.json()
            if ok:
                b = r.json().get("booking", {})
                self.booking_id = b.get("_id")
                self.booking_req_id = b.get("requestId")
            self.log_test("POST /api/user/bookings/book", ok, f"Booking ID: {self.booking_id}, Total Bill: ₹{r.json().get('booking', {}).get('totalBill', 'N/A')}")
        except Exception as e:
            self.log_test("POST /api/user/bookings/book", False, str(e))

        # 6.2 Host views pending request
        try:
            r = self.session.get(f"{BASE_URL}/api/host/booking-requests/pending", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and "requests" in r.json()
            found = any(req.get("_id") == self.booking_id for req in r.json().get("requests", []))
            self.log_test("GET /api/host/booking-requests/pending", ok and found, f"Pending Requests: {len(r.json().get('requests', []))}")
        except Exception as e:
            self.log_test("GET /api/host/booking-requests/pending", False, str(e))

        # 6.3 Host accepts booking request
        try:
            r = self.session.put(f"{BASE_URL}/api/host/booking-requests/{self.booking_id}/accept", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("success") is True
            self.log_test("PUT /api/host/booking-requests/:id/accept", ok, f"Accepted Status: {r.json().get('request', {}).get('status')}")
        except Exception as e:
            self.log_test("PUT /api/host/booking-requests/:id/accept", False, str(e))

        # 6.4 Create Payment Order (User)
        try:
            r = self.session.post(f"{BASE_URL}/api/payment/create-order", headers=user_headers, json={"bookingId": self.booking_id}, timeout=5)
            ok = r.status_code == 200 and "orderId" in r.json()
            if ok:
                self.order_id = r.json().get("orderId")
            self.log_test("POST /api/payment/create-order", ok, f"Order ID: {self.order_id}, Amount: ₹{r.json().get('amount', 0)/100}")
        except Exception as e:
            self.log_test("POST /api/payment/create-order", False, str(e))

        # 6.5 Verify Payment (User Sandbox Verification)
        try:
            pay_payload = {
                "bookingId": self.booking_id,
                "orderId": self.order_id,
                "paymentId": f"pay_sim_{int(time.time())}",
                "signature": f"sim_sig_{self.order_id}_test",
                "paymentMethod": "upi"
            }
            r = self.session.post(f"{BASE_URL}/api/payment/verify", headers=user_headers, json=pay_payload, timeout=5)
            ok = r.status_code == 200 and r.json().get("success") is True
            self.log_test("POST /api/payment/verify (Sandbox simulation)", ok, f"Payment ID: {r.json().get('paymentId')}")
        except Exception as e:
            self.log_test("POST /api/payment/verify (Sandbox simulation)", False, str(e))

        # 6.6 Host Marks Charging Completed (Mark Done)
        try:
            r = self.session.put(f"{BASE_URL}/api/host/booking-requests/{self.booking_id}/mark-done", headers=host_headers, timeout=5)
            ok = r.status_code == 200 and r.json().get("success") is True
            self.log_test("PUT /api/host/booking-requests/:id/mark-done", ok, f"Status: {r.json().get('request', {}).get('status')}")
        except Exception as e:
            self.log_test("PUT /api/host/booking-requests/:id/mark-done", False, str(e))

        # 6.7 User Reviews / Rates Completed Booking
        try:
            r = self.session.put(f"{BASE_URL}/api/user/bookings/{self.booking_id}/rate", headers=user_headers, json={"rating": 5, "comment": "Excellent high speed charger!"}, timeout=5)
            ok = r.status_code == 200 and "rating" in r.json()
            self.log_test("PUT /api/user/bookings/:id/rate", ok, f"Rating: {r.json().get('rating')} Stars")
        except Exception as e:
            self.log_test("PUT /api/user/bookings/:id/rate", False, str(e))

    # =========================================================================
    # Group 7: Contact Form & Notifications
    # =========================================================================
    def test_group_contact(self):
        print(f"\n{BOLD}{CYAN}=== 7. Contact Form & Notifications (/api/contact) ==={RESET}")
        try:
            payload = {
                "name": "Dr. EV Driver",
                "email": "driver@example.com",
                "subject": "Inquiry about high speed charging network",
                "message": "Hello ChargeLoop team, looking forward to installing a station.",
                "type": "general"
            }
            r = self.session.post(f"{BASE_URL}/api/contact", json=payload, timeout=5)
            ok = r.status_code == 200 and r.json().get("success") is True
            self.log_test("POST /api/contact (SendGrid dispatcher)", ok, r.json().get("message", ""))
        except Exception as e:
            self.log_test("POST /api/contact (SendGrid dispatcher)", False, str(e))

    # =========================================================================
    # Group 8: Admin Statistics & Management
    # =========================================================================
    def test_group_admin(self):
        print(f"\n{BOLD}{CYAN}=== 8. Admin Statistics & Management (/api/admin) ==={RESET}")
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # 8.1 Admin Stats
        try:
            r = self.session.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers, timeout=5)
            ok = r.status_code == 200 and "totalUsers" in r.json()
            self.log_test("GET /api/admin/stats", ok, f"Stats: {r.json()}")
        except Exception as e:
            self.log_test("GET /api/admin/stats", False, str(e))

        # 8.2 Admin List Hosts
        try:
            r = self.session.get(f"{BASE_URL}/api/admin/hosts", headers=admin_headers, timeout=5)
            ok = r.status_code == 200 and "hosts" in r.json()
            self.log_test("GET /api/admin/hosts", ok, f"Total Hosts: {len(r.json().get('hosts', []))}")
        except Exception as e:
            self.log_test("GET /api/admin/hosts", False, str(e))

        # 8.3 Admin List Users
        try:
            r = self.session.get(f"{BASE_URL}/api/admin/users", headers=admin_headers, timeout=5)
            ok = r.status_code == 200 and "users" in r.json()
            self.log_test("GET /api/admin/users", ok, f"Total Users: {len(r.json().get('users', []))}")
        except Exception as e:
            self.log_test("GET /api/admin/users", False, str(e))

    def run_all(self):
        print(f"\n{BOLD}======================================================{RESET}")
        print(f"{BOLD}⚡ ChargeLoop Comprehensive API Verification Suite ⚡{RESET}")
        print(f"{BOLD}Target Host:{RESET} {BASE_URL}")
        print(f"{BOLD}Timestamp:{RESET}   {time.ctime()}")
        print(f"{BOLD}======================================================{RESET}")

        start_time = time.time()

        self.test_group_system()
        self.test_group_auth()
        self.test_group_user()
        self.test_group_host_onboarding()
        self.test_group_host_operations()
        self.test_group_booking_lifecycle()
        self.test_group_contact()
        self.test_group_admin()

        duration = round(time.time() - start_time, 2)
        total = self.passed + self.failed
        rate = round((self.passed / total) * 100, 1) if total > 0 else 0

        print(f"\n{BOLD}======================================================{RESET}")
        print(f"{BOLD}🏁 TEST SUMMARY REPORT{RESET}")
        print(f"  Total Tests Executed: {BOLD}{total}{RESET}")
        print(f"  Passed:               {GREEN}{self.passed}{RESET}")
        print(f"  Failed:               {RED if self.failed > 0 else GREEN}{self.failed}{RESET}")
        print(f"  Success Rate:         {BOLD}{GREEN if rate == 100 else YELLOW}{rate}%{RESET}")
        print(f"  Execution Time:       {duration} seconds")
        print(f"{BOLD}======================================================{RESET}")

        if self.failed > 0:
            print(f"\n{RED}{BOLD}Failed Tests Details:{RESET}")
            for name, success, details in self.results:
                if not success:
                    print(f" - {name}: {details}")
            sys.exit(1)
        else:
            print(f"\n{GREEN}{BOLD}🎉 ALL API ENDPOINTS AND SYSTEM COMPONENTS WORKING 100% PERFECTLY!{RESET}\n")
            sys.exit(0)

if __name__ == "__main__":
    suite = TestSuite()
    suite.run_all()
