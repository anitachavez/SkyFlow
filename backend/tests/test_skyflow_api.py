"""
SkyFlow Backend API Tests
Tests all endpoints: auth, passenger, staff, admin
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_root_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "SkyFlow" in data["message"]
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestDemoAuth:
    """Demo authentication tests"""
    
    def test_demo_login_passenger(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["role"] == "passenger"
        assert "demo_passenger@skyflow.app" in data["user"]["email"]
    
    def test_demo_login_staff(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["role"] == "staff"
    
    def test_demo_login_admin(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
    
    def test_demo_login_invalid_role(self):
        """Invalid role should default to passenger"""
        response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "invalid"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "passenger"


class TestAuthValidation:
    """Auth validation and session tests"""
    
    def test_auth_me_with_valid_token(self):
        # First create a demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        # Then validate the token
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert data["role"] == "passenger"
    
    def test_auth_me_without_token(self):
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_auth_me_with_invalid_token(self):
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401
    
    def test_logout(self):
        # Create demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        # Logout
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert "message" in response.json()


class TestPassengerEndpoints:
    """Passenger-specific endpoint tests"""
    
    def test_get_my_booking_as_passenger(self):
        # Create demo passenger
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        # Get booking
        response = requests.get(
            f"{BASE_URL}/api/passenger/my-booking",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "flight" in data
        assert "passenger" in data
        assert "all_passengers" in data
        
        # Verify flight data structure
        if data["flight"]:
            flight = data["flight"]
            assert "flight_id" in flight
            assert "flight_number" in flight
            assert flight["flight_number"] == "SK101"
            assert "origin" in flight
            assert "destination" in flight
            assert "status" in flight
        
        # Verify passenger data
        if data["passenger"]:
            passenger = data["passenger"]
            assert "passenger_id" in passenger
            assert "seat_number" in passenger
            assert "zone" in passenger
            assert "status" in passenger
    
    def test_get_my_booking_without_auth(self):
        response = requests.get(f"{BASE_URL}/api/passenger/my-booking")
        assert response.status_code == 401


class TestStaffEndpoints:
    """Staff-specific endpoint tests"""
    
    def test_get_current_flight_as_staff(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        # Get current flight
        response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "flight" in data
        assert "passengers" in data
        
        if data["flight"]:
            assert "flight_id" in data["flight"]
            assert "status" in data["flight"]
    
    def test_get_current_flight_as_passenger_forbidden(self):
        # Create demo passenger
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        # Try to access staff endpoint
        response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_update_flight_status(self):
        # Create demo staff and get flight
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        flight_response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        flight_data = flight_response.json()
        
        if flight_data["flight"]:
            flight_id = flight_data["flight"]["flight_id"]
            
            # Update status
            response = requests.patch(
                f"{BASE_URL}/api/staff/flight/{flight_id}/status",
                headers={"Authorization": f"Bearer {token}"},
                json={"status": "boarding"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "boarding"
            
            # Verify update persisted
            verify_response = requests.get(
                f"{BASE_URL}/api/staff/current-flight",
                headers={"Authorization": f"Bearer {token}"}
            )
            verify_data = verify_response.json()
            assert verify_data["flight"]["status"] == "boarding"
    
    def test_update_boarding_phase(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        flight_response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        flight_data = flight_response.json()
        
        if flight_data["flight"]:
            flight_id = flight_data["flight"]["flight_id"]
            
            # Update phase
            response = requests.patch(
                f"{BASE_URL}/api/staff/flight/{flight_id}/phase",
                headers={"Authorization": f"Bearer {token}"},
                json={"boarding_phase": "zone_1"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["boarding_phase"] == "zone_1"
    
    def test_notify_priority_group(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        flight_response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        flight_data = flight_response.json()
        
        if flight_data["flight"]:
            flight_id = flight_data["flight"]["flight_id"]
            
            # Notify group
            response = requests.post(
                f"{BASE_URL}/api/staff/notify-group",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "flight_id": flight_id,
                    "priority": "first_class",
                    "message": "Please proceed to gate"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "group" in data
    
    def test_notify_zone(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        flight_response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        flight_data = flight_response.json()
        
        if flight_data["flight"]:
            flight_id = flight_data["flight"]["flight_id"]
            
            # Notify zone
            response = requests.post(
                f"{BASE_URL}/api/staff/notify-zone",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "flight_id": flight_id,
                    "zone": 1,
                    "message": "Zone 1 boarding now"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "zone" in data
    
    def test_confirm_boarding(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        flight_response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        flight_data = flight_response.json()
        
        if flight_data["flight"] and flight_data["passengers"]:
            flight_id = flight_data["flight"]["flight_id"]
            passenger_id = flight_data["passengers"][0]["passenger_id"]
            
            # Confirm boarding
            response = requests.post(
                f"{BASE_URL}/api/staff/confirm-boarding",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "flight_id": flight_id,
                    "passenger_id": passenger_id
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data


class TestAdminEndpoints:
    """Admin-specific endpoint tests"""
    
    def test_get_admin_dashboard(self):
        # Create demo admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        token = login_response.json()["session_token"]
        
        # Get dashboard
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        assert "recent_flights" in data
        
        stats = data["stats"]
        assert "totalFlights" in stats
        assert "activeFlights" in stats
        assert "totalPassengers" in stats
    
    def test_get_admin_dashboard_as_staff_forbidden(self):
        # Create demo staff
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        # Try to access admin endpoint
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_get_all_flights(self):
        # Create demo admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        token = login_response.json()["session_token"]
        
        # Get flights
        response = requests.get(
            f"{BASE_URL}/api/admin/flights",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "flights" in data
        assert isinstance(data["flights"], list)
    
    def test_create_flight_and_verify(self):
        # Create demo admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        token = login_response.json()["session_token"]
        
        # Create flight
        flight_data = {
            "flight_number": "TEST_SK999",
            "origin": "JFK",
            "destination": "SFO",
            "gate": "C10",
            "total_seats": 150,
            "aircraft_type": "Airbus A320"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/flights",
            headers={"Authorization": f"Bearer {token}"},
            json=flight_data
        )
        assert create_response.status_code == 200
        created_flight = create_response.json()
        assert created_flight["flight_number"] == "TEST_SK999"
        assert created_flight["origin"] == "JFK"
        assert created_flight["destination"] == "SFO"
        assert "flight_id" in created_flight
        
        # Verify flight was persisted
        get_response = requests.get(
            f"{BASE_URL}/api/admin/flights",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == 200
        flights = get_response.json()["flights"]
        assert any(f["flight_number"] == "TEST_SK999" for f in flights)
    
    def test_get_analytics(self):
        # Create demo admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        token = login_response.json()["session_token"]
        
        # Get analytics
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "totalFlights" in data
        assert "totalPassengers" in data
        assert "avgBoardingTime" in data
        assert "weeklyFlights" in data
        assert isinstance(data["weeklyFlights"], list)


class TestRoleBasedAccessControl:
    """Test role-based access control"""
    
    def test_passenger_cannot_access_staff_endpoints(self):
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_passenger_cannot_access_admin_endpoints(self):
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "passenger"}
        )
        token = login_response.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_staff_cannot_access_admin_endpoints(self):
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_staff_can_access_staff_endpoints(self):
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "staff"}
        )
        token = login_response.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
    
    def test_admin_can_access_staff_endpoints(self):
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo",
            json={"role": "admin"}
        )
        token = login_response.json()["session_token"]
        
        # Admin should be able to access staff endpoints
        response = requests.get(
            f"{BASE_URL}/api/staff/current-flight",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
