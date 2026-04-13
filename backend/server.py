from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Models ==============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "passenger"  # passenger, staff, admin

class UserSession(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Flight(BaseModel):
    flight_id: str = Field(default_factory=lambda: f"fl_{uuid.uuid4().hex[:12]}")
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: Optional[datetime] = None
    aircraft_type: str = "Boeing 737"
    total_seats: int = 180
    status: str = "scheduled"  # scheduled, boarding, departed, arrived, deboarding
    boarding_phase: str = "not_started"  # not_started, priority, zone_1, zone_2, zone_3, zone_4, complete
    gate: str = "A1"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Passenger(BaseModel):
    passenger_id: str = Field(default_factory=lambda: f"pax_{uuid.uuid4().hex[:12]}")
    user_id: str
    flight_id: str
    seat_number: str
    zone: int
    row: int
    priority: str = "standard"  # standard, first_class, connection, family, disability
    status: str = "checked_in"  # checked_in, waiting, boarding, seated, deboarding, exited
    name: str
    expo_push_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class SessionRequest(BaseModel):
    session_id: str

class DemoRequest(BaseModel):
    role: str

class FlightStatusUpdate(BaseModel):
    status: str

class BoardingPhaseUpdate(BaseModel):
    boarding_phase: str

class NotifyGroupRequest(BaseModel):
    flight_id: str
    priority: str
    message: str

class NotifyZoneRequest(BaseModel):
    flight_id: str
    zone: int
    message: str

class ConfirmBoardingRequest(BaseModel):
    flight_id: str
    passenger_id: str

class FlightCreate(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: Optional[datetime] = None
    aircraft_type: str = "Boeing 737"
    total_seats: int = 180
    gate: str = "A1"

# ============== Auth Helpers ==============

async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """Validate session token and return user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.replace("Bearer ", "")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def require_staff_or_admin(user: User = Depends(get_current_user)) -> User:
    """Require staff or admin role"""
    if user.role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Staff or admin access required")
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== Auth Endpoints ==============

@api_router.post("/auth/session")
async def exchange_session(request: SessionRequest):
    """Exchange session_id from Emergent Auth for user data and session token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
            
            if existing_user:
                user_id = existing_user["user_id"]
                # Update user info
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "name": auth_data["name"],
                        "picture": auth_data.get("picture"),
                    }}
                )
            else:
                # Create new user (default role: passenger)
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                new_user = {
                    "user_id": user_id,
                    "email": auth_data["email"],
                    "name": auth_data["name"],
                    "picture": auth_data.get("picture"),
                    "role": "passenger",
                    "created_at": datetime.now(timezone.utc)
                }
                await db.users.insert_one(new_user)
            
            # Create session
            session_token = auth_data.get("session_token", f"sess_{uuid.uuid4().hex}")
            session = {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc)
            }
            await db.user_sessions.insert_one(session)
            
            # Get updated user
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            
            return {
                "session_token": session_token,
                "user": user
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/auth/demo")
async def demo_login(request: DemoRequest):
    """Create a demo user for testing"""
    role = request.role if request.role in ["passenger", "staff", "admin"] else "passenger"
    
    # Create demo user
    user_id = f"demo_{role}_{uuid.uuid4().hex[:8]}"
    session_token = f"demo_sess_{uuid.uuid4().hex}"
    
    user = {
        "user_id": user_id,
        "email": f"demo_{role}@skyflow.app",
        "name": f"Demo {role.title()}",
        "picture": None,
        "role": role,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user)
    
    # Create session
    session = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session)
    
    # For demo passengers, create a booking on a sample flight
    if role == "passenger":
        await create_demo_booking(user_id, user["name"])
    
    # Remove _id from response
    user.pop("_id", None)
    
    return {
        "session_token": session_token,
        "user": user
    }

async def create_demo_booking(user_id: str, name: str):
    """Create a demo flight and booking for passenger"""
    # Check for existing demo flight or create one
    demo_flight = await db.flights.find_one({"flight_number": "SK101"}, {"_id": 0})
    
    if not demo_flight:
        # Create demo flight
        demo_flight = {
            "flight_id": f"fl_demo_{uuid.uuid4().hex[:8]}",
            "flight_number": "SK101",
            "origin": "JFK",
            "destination": "LAX",
            "departure_time": datetime.now(timezone.utc) + timedelta(hours=2),
            "arrival_time": datetime.now(timezone.utc) + timedelta(hours=7),
            "aircraft_type": "Boeing 737-800",
            "total_seats": 180,
            "status": "boarding",
            "boarding_phase": "zone_2",
            "gate": "B12",
            "created_at": datetime.now(timezone.utc)
        }
        await db.flights.insert_one(demo_flight)
        
        # Create some demo passengers for the flight
        await create_demo_passengers(demo_flight["flight_id"])
    
    # Create passenger booking
    row = random.randint(5, 30)
    seat_letter = random.choice(['A', 'B', 'C', 'D', 'E', 'F'])
    zone = (row - 1) // 8 + 1  # Zones 1-4 based on row
    
    passenger = {
        "passenger_id": f"pax_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "flight_id": demo_flight["flight_id"],
        "seat_number": f"{row}{seat_letter}",
        "zone": zone,
        "row": row,
        "priority": random.choice(["standard", "standard", "standard", "connection", "family"]),
        "status": "waiting",
        "name": name,
        "created_at": datetime.now(timezone.utc)
    }
    await db.passengers.insert_one(passenger)

async def create_demo_passengers(flight_id: str):
    """Create demo passengers for a flight"""
    priorities = ["standard"] * 15 + ["first_class"] * 3 + ["connection"] * 2 + ["family"] * 2 + ["disability"] * 1
    statuses = ["seated"] * 10 + ["boarding"] * 3 + ["waiting"] * 5 + ["checked_in"] * 5
    names = [
        "John Smith", "Emily Johnson", "Michael Brown", "Sarah Davis", "James Wilson",
        "Emma Martinez", "Robert Taylor", "Olivia Anderson", "William Thomas", "Sophia Jackson",
        "David White", "Isabella Harris", "Joseph Martin", "Mia Thompson", "Charles Garcia",
        "Ava Robinson", "Daniel Clark", "Charlotte Lewis", "Matthew Walker", "Amelia Hall"
    ]
    
    passengers = []
    used_seats = set()
    
    for i, name in enumerate(names):
        row = (i % 30) + 1
        seat_letter = ['A', 'B', 'C', 'D', 'E', 'F'][i % 6]
        seat_number = f"{row}{seat_letter}"
        
        while seat_number in used_seats:
            row = random.randint(1, 30)
            seat_letter = random.choice(['A', 'B', 'C', 'D', 'E', 'F'])
            seat_number = f"{row}{seat_letter}"
        
        used_seats.add(seat_number)
        zone = (row - 1) // 8 + 1
        
        passenger = {
            "passenger_id": f"pax_{uuid.uuid4().hex[:12]}",
            "user_id": f"demo_user_{i}",
            "flight_id": flight_id,
            "seat_number": seat_number,
            "zone": min(zone, 4),
            "row": row,
            "priority": random.choice(priorities),
            "status": random.choice(statuses),
            "name": name,
            "created_at": datetime.now(timezone.utc)
        }
        passengers.append(passenger)
    
    if passengers:
        await db.passengers.insert_many(passengers)

@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout and invalidate session"""
    await db.user_sessions.delete_many({"user_id": user.user_id})
    return {"message": "Logged out successfully"}

# ============== Passenger Endpoints ==============

@api_router.get("/passenger/my-booking")
async def get_my_booking(user: User = Depends(get_current_user)):
    """Get current user's booking and flight info"""
    # Find passenger's booking
    passenger = await db.passengers.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not passenger:
        # Return empty state for new users
        return {
            "flight": None,
            "passenger": None,
            "all_passengers": []
        }
    
    # Get flight info
    flight = await db.flights.find_one({"flight_id": passenger["flight_id"]}, {"_id": 0})
    
    # Get all passengers on this flight
    all_passengers = await db.passengers.find(
        {"flight_id": passenger["flight_id"]},
        {"_id": 0}
    ).to_list(500)
    
    return {
        "flight": flight,
        "passenger": passenger,
        "all_passengers": all_passengers
    }

# ============== Staff Endpoints ==============

@api_router.get("/staff/current-flight")
async def get_current_flight(user: User = Depends(require_staff_or_admin)):
    """Get current active flight for staff dashboard"""
    # Get the most recent boarding flight, or any recent flight
    flight = await db.flights.find_one(
        {"status": {"$in": ["boarding", "deboarding"]}},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not flight:
        flight = await db.flights.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    
    passengers = []
    if flight:
        passengers = await db.passengers.find(
            {"flight_id": flight["flight_id"]},
            {"_id": 0}
        ).to_list(500)
    
    return {
        "flight": flight,
        "passengers": passengers
    }

@api_router.patch("/staff/flight/{flight_id}/status")
async def update_flight_status(
    flight_id: str,
    update: FlightStatusUpdate,
    user: User = Depends(require_staff_or_admin)
):
    """Update flight status"""
    flight = await db.flights.find_one({"flight_id": flight_id}, {"_id": 0})
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    await db.flights.update_one(
        {"flight_id": flight_id},
        {"$set": {"status": update.status}}
    )
    
    return {"message": "Status updated", "status": update.status}

@api_router.patch("/staff/flight/{flight_id}/phase")
async def update_boarding_phase(
    flight_id: str,
    update: BoardingPhaseUpdate,
    user: User = Depends(require_staff_or_admin)
):
    """Update boarding phase"""
    flight = await db.flights.find_one({"flight_id": flight_id}, {"_id": 0})
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    await db.flights.update_one(
        {"flight_id": flight_id},
        {"$set": {"boarding_phase": update.boarding_phase}}
    )
    
    return {"message": "Phase updated", "boarding_phase": update.boarding_phase}

@api_router.post("/staff/notify-group")
async def notify_priority_group(
    request: NotifyGroupRequest,
    user: User = Depends(require_staff_or_admin)
):
    """Send notification to a priority group"""
    # Update passenger statuses
    result = await db.passengers.update_many(
        {
            "flight_id": request.flight_id,
            "priority": request.priority,
            "status": {"$in": ["checked_in", "waiting"]}
        },
        {"$set": {"status": "boarding"}}
    )
    
    # In a real app, send push notifications here
    logger.info(f"Notified {result.modified_count} passengers in {request.priority} group")
    
    return {
        "message": f"Notified {result.modified_count} passengers",
        "group": request.priority
    }

@api_router.post("/staff/notify-zone")
async def notify_zone(
    request: NotifyZoneRequest,
    user: User = Depends(require_staff_or_admin)
):
    """Send notification to a zone"""
    result = await db.passengers.update_many(
        {
            "flight_id": request.flight_id,
            "zone": request.zone,
            "status": {"$in": ["checked_in", "waiting"]}
        },
        {"$set": {"status": "boarding"}}
    )
    
    logger.info(f"Notified {result.modified_count} passengers in Zone {request.zone}")
    
    return {
        "message": f"Notified {result.modified_count} passengers",
        "zone": request.zone
    }

@api_router.post("/staff/confirm-boarding")
async def confirm_boarding(
    request: ConfirmBoardingRequest,
    user: User = Depends(require_staff_or_admin)
):
    """Confirm passenger has boarded (scanned QR)"""
    result = await db.passengers.update_one(
        {
            "flight_id": request.flight_id,
            "passenger_id": request.passenger_id
        },
        {"$set": {"status": "seated"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Passenger not found")
    
    return {"message": "Boarding confirmed", "passenger_id": request.passenger_id}

# ============== Admin Endpoints ==============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(user: User = Depends(require_admin)):
    """Get admin dashboard stats"""
    total_flights = await db.flights.count_documents({})
    active_flights = await db.flights.count_documents({"status": {"$in": ["boarding", "deboarding"]}})
    total_passengers = await db.passengers.count_documents({})
    
    # Get recent flights
    recent_flights = await db.flights.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "stats": {
            "totalFlights": total_flights,
            "activeFlights": active_flights,
            "totalPassengers": total_passengers,
            "avgBoardingTime": 25  # Demo value
        },
        "recent_flights": recent_flights
    }

@api_router.get("/admin/flights")
async def get_all_flights(user: User = Depends(require_admin)):
    """Get all flights"""
    flights = await db.flights.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"flights": flights}

@api_router.post("/admin/flights")
async def create_flight(
    flight_data: FlightCreate,
    user: User = Depends(require_admin)
):
    """Create a new flight"""
    flight = Flight(
        flight_number=flight_data.flight_number,
        origin=flight_data.origin,
        destination=flight_data.destination,
        departure_time=flight_data.departure_time or datetime.now(timezone.utc) + timedelta(hours=2),
        aircraft_type=flight_data.aircraft_type,
        total_seats=flight_data.total_seats,
        gate=flight_data.gate
    )
    
    flight_dict = flight.model_dump()
    await db.flights.insert_one(flight_dict)
    
    # Create demo passengers for the flight
    await create_demo_passengers(flight.flight_id)
    
    flight_dict.pop("_id", None)
    return flight_dict

@api_router.get("/admin/analytics")
async def get_analytics(user: User = Depends(require_admin)):
    """Get analytics data"""
    total_flights = await db.flights.count_documents({})
    total_passengers = await db.passengers.count_documents({})
    
    return {
        "totalFlights": total_flights,
        "totalPassengers": total_passengers,
        "avgBoardingTime": 25,
        "avgDeboardingTime": 15,
        "onTimePercentage": 87,
        "efficiency": 92,
        "weeklyFlights": [5, 8, 6, 9, 7, 4, 6],
        "weeklyPassengers": [450, 720, 540, 810, 630, 360, 540]
    }

# ============== Base Endpoints ==============

@api_router.get("/")
async def root():
    return {"message": "SkyFlow API v1.0", "status": "online"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
