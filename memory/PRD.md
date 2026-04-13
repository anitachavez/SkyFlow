# SkyFlow - Airline Boarding/Deboarding Logistics App

## Overview
Mobile-first application for airline boarding and deboarding logistics optimization.

## User Types
1. **Passengers** - Receive real-time notifications, view boarding status
2. **Staff** - Control center dashboard, manage boarding operations
3. **Administrators** - Full access, analytics, system management

## Core Features

### Passenger Experience
- Real-time notifications (get ready, line up, board, deboard)
- Priority-based boarding (first class, connections, families, disabilities)
- Status display: Waiting → Boarding → Seated
- QR code for check-in

### Staff Dashboard
- Real-time passenger stats (total, boarded, remaining, percentage)
- Manual override boarding order
- Trigger notifications to specific groups
- Alert system (missing passengers, delays, congestion)

### Intelligent Boarding System
- Rule-based optimal boarding order
- Adjusts based on delays, missing passengers, congestion
- Recommendations: "Board back rows first", "Delay group due to congestion"

### Aircraft Visualization
- 2D seat map with color coding
- Green = seated, Yellow = boarding, Red = not boarded
- Filter by zone and passenger type

### Deboarding System
- Priority-based exit (first class, connections, special assistance)
- Controlled flow to avoid congestion

## Technical Stack
- Frontend: Expo React Native
- Backend: FastAPI + MongoDB
- Real-time: Firebase Realtime Database
- Auth: Emergent Google OAuth
- Notifications: Expo Push Notifications

## Data Models

### Flight
- flight_id, flight_number, origin, destination
- departure_time, aircraft_type, total_seats
- status, boarding_phase

### Passenger
- passenger_id, user_id, flight_id
- seat_number, zone, priority, status
- expo_push_token

### User
- user_id, email, name, picture, role
