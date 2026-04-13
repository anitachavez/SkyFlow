# SkyFlow - Airline Boarding/Deboarding Logistics App

## Overview
Mobile-first application for airline boarding and deboarding logistics optimization serving passengers, airline staff, and administrators.

## User Types
1. **Passengers** - Receive real-time notifications, view boarding status, digital boarding pass with QR code
2. **Staff** - Control center dashboard, manage boarding operations, aircraft visualization, QR scanner
3. **Administrators** - Full access, flight management, analytics, system settings

## Core Features

### Passenger Experience
- Real-time status notifications (Checked In → Waiting → Boarding → Seated → Deboarding → Exited)
- Priority-based boarding (first class, connections, families with children, disabilities)
- Digital boarding pass with QR code
- Flight info display with boarding progress bar
- Zone and row position display

### Staff Dashboard (Control Center)
- Real-time passenger stats (total, boarded, remaining, percentage)
- Manual override of boarding order via flight status and phase controls
- Priority group notifications (disability, family, first class, connection, standard)
- Zone-based notifications (Zones 1-4)
- AI-powered boarding recommendations with congestion detection
- Smart alerts (missing passengers, delays, bottlenecks)

### Intelligent Boarding System
- Rule-based optimal boarding order (back-to-front within zones)
- Priority: disability → family → first class → connections → standard
- Dynamic adjustments based on congestion detection
- Recommendations: "Board back rows first", "Delay group due to congestion"

### Aircraft Visualization
- Interactive 2D/3D seat map using React Native SVG
- Color-coded seats: Green (seated), Yellow (boarding), Red (not boarded), Gray (exited)
- Filter by zone (1-4) and passenger type
- Toggle between 3D and 2D views
- Tap-to-view passenger details

### Boarding & Check-in System
- QR code scanning for passenger check-in (using expo-camera)
- Passenger list management
- Real-time status updates
- Confirm boarding via scan

### Deboarding System
- Priority-based exit: connections → disability → first class → family → standard
- Front-to-back deboarding order
- Controlled flow to avoid congestion

### Smart Alerts System
- Staff alerts: missing passengers, boarding delays, congestion detection
- Passenger alerts: boarding turn, status changes, delays

### Analytics & Insights
- Weekly flight activity chart
- Performance metrics: on-time departure, boarding efficiency, passenger satisfaction
- Time analysis: avg boarding time, avg deboarding time, turnaround time
- AI insights and recommendations

## Technical Stack
- **Frontend**: Expo React Native (SDK 54) with expo-router file-based navigation
- **Backend**: FastAPI with MongoDB (motor async driver)
- **Real-time**: Firebase Realtime Database
- **Auth**: Emergent Google OAuth + Demo mode
- **Visualization**: React Native SVG for aircraft seat maps
- **QR Codes**: react-native-qrcode-svg for boarding passes, expo-camera for scanning
- **State Management**: Zustand
- **Navigation**: Expo Router with tab-based layouts per role

## Data Models

### Flight
- flight_id, flight_number, origin, destination
- departure_time, arrival_time, aircraft_type, total_seats
- status (scheduled/boarding/departed/arrived/deboarding)
- boarding_phase (not_started/priority/zone_1-4/complete)
- gate

### Passenger
- passenger_id, user_id, flight_id
- seat_number, zone, row, priority, status, name
- expo_push_token

### User
- user_id, email, name, picture, role (passenger/staff/admin)

## API Endpoints

### Auth
- POST /api/auth/demo - Demo login with role selection
- POST /api/auth/session - Exchange Emergent OAuth session_id
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout

### Passenger
- GET /api/passenger/my-booking - Get booking, flight, and all passengers

### Staff
- GET /api/staff/current-flight - Get active flight with passengers
- PATCH /api/staff/flight/{id}/status - Update flight status
- PATCH /api/staff/flight/{id}/phase - Update boarding phase
- POST /api/staff/notify-group - Notify priority group
- POST /api/staff/notify-zone - Notify zone
- POST /api/staff/confirm-boarding - Confirm passenger boarded

### Admin
- GET /api/admin/dashboard - Dashboard stats
- GET /api/admin/flights - List all flights
- POST /api/admin/flights - Create flight
- GET /api/admin/analytics - Analytics data

## Business Enhancement
Consider implementing a **premium fast-track boarding pass** feature where passengers can pay for priority boarding status, generating additional revenue per flight while improving the boarding experience for premium customers.
