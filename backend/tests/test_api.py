"""
Backend API Tests for Intensiti Digital Signage Application
Testing: Auth, Screens, Playlists, Media, Settings, Weather, RSS, Display
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://themes-live.preview.emergentagent.com').rstrip('/')

# Test credentials
SUPERADMIN_EMAIL = "admin@intensiti.com"
SUPERADMIN_PASSWORD = "admin123"
CLIENT_EMAIL = "demo@test.com"
CLIENT_PASSWORD = "demo123"

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_superadmin(self):
        """Test superadmin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERADMIN_EMAIL,
            "password": SUPERADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Superadmin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == SUPERADMIN_EMAIL
        assert data["user"]["role"] == "super_admin"
        print(f"Superadmin login successful: {data['user']['email']}")
    
    def test_login_client(self):
        """Test client login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Client login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == CLIENT_EMAIL
        assert data["user"]["role"] == "client"
        print(f"Client login successful: {data['user']['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected with 401")


class TestClientDashboard:
    """Client dashboard and stats tests"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_client_stats(self, client_token):
        """Test client dashboard stats"""
        headers = {"Authorization": f"Bearer {client_token}"}
        response = requests.get(f"{BASE_URL}/api/stats", headers=headers)
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        assert "total_screens" in data
        assert "online_screens" in data
        assert "total_media" in data
        assert "total_playlists" in data
        print(f"Client stats: {data}")


class TestScreens:
    """Screen management tests"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_screens(self, client_token):
        """Test listing screens"""
        headers = {"Authorization": f"Bearer {client_token}"}
        response = requests.get(f"{BASE_URL}/api/screens", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} screens")
        if len(data) > 0:
            screen = data[0]
            assert "id" in screen
            assert "name" in screen
            assert "pairing_code" in screen
            print(f"First screen: {screen['name']} (code: {screen['pairing_code']})")
    
    def test_create_and_delete_screen(self, client_token):
        """Test creating and deleting a screen"""
        headers = {"Authorization": f"Bearer {client_token}"}
        
        # Create screen
        screen_data = {
            "name": f"TEST_Screen_{uuid.uuid4().hex[:8]}",
            "weather_city": "Paris",
            "group": "Test Group",
            "tags": ["test", "automated"]
        }
        response = requests.post(f"{BASE_URL}/api/screens", json=screen_data, headers=headers)
        assert response.status_code == 200, f"Screen creation failed: {response.text}"
        created = response.json()
        assert created["name"] == screen_data["name"]
        screen_id = created["id"]
        print(f"Created screen: {created['name']} with code {created['pairing_code']}")
        
        # Delete screen
        response = requests.delete(f"{BASE_URL}/api/screens/{screen_id}", headers=headers)
        assert response.status_code == 200
        print(f"Deleted screen: {screen_id}")
    
    def test_force_refresh_endpoint(self, client_token):
        """Test the force refresh endpoint"""
        headers = {"Authorization": f"Bearer {client_token}"}
        
        # Get existing screen
        response = requests.get(f"{BASE_URL}/api/screens", headers=headers)
        screens = response.json()
        
        if len(screens) > 0:
            screen_id = screens[0]["id"]
            # Test force refresh
            response = requests.post(f"{BASE_URL}/api/screens/{screen_id}/refresh", headers=headers)
            assert response.status_code == 200, f"Force refresh failed: {response.text}"
            data = response.json()
            assert "message" in data
            print(f"Force refresh successful: {data['message']}")
        else:
            pytest.skip("No screens available to test force refresh")


class TestPlaylists:
    """Playlist management tests"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_playlists(self, client_token):
        """Test listing playlists"""
        headers = {"Authorization": f"Bearer {client_token}"}
        response = requests.get(f"{BASE_URL}/api/playlists", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} playlists")
    
    def test_create_update_delete_playlist(self, client_token):
        """Test CRUD operations on playlist"""
        headers = {"Authorization": f"Bearer {client_token}"}
        
        # Create
        playlist_data = {"name": f"TEST_Playlist_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        assert response.status_code == 200
        created = response.json()
        playlist_id = created["id"]
        print(f"Created playlist: {created['name']}")
        
        # Update
        update_data = {"name": f"{created['name']}_updated"}
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        updated = response.json()
        assert "_updated" in updated["name"]
        print(f"Updated playlist: {updated['name']}")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        assert response.status_code == 200
        print(f"Deleted playlist: {playlist_id}")
    
    def test_duplicate_playlist(self, client_token):
        """Test playlist duplication"""
        headers = {"Authorization": f"Bearer {client_token}"}
        
        # Get existing playlists
        response = requests.get(f"{BASE_URL}/api/playlists", headers=headers)
        playlists = response.json()
        
        if len(playlists) > 0:
            playlist_id = playlists[0]["id"]
            original_name = playlists[0]["name"]
            
            # Duplicate
            response = requests.post(f"{BASE_URL}/api/playlists/{playlist_id}/duplicate", headers=headers)
            assert response.status_code == 200, f"Duplicate failed: {response.text}"
            duplicated = response.json()
            assert "(copie)" in duplicated["name"]
            print(f"Duplicated playlist: '{original_name}' -> '{duplicated['name']}'")
            
            # Cleanup - delete the duplicate
            requests.delete(f"{BASE_URL}/api/playlists/{duplicated['id']}", headers=headers)
        else:
            pytest.skip("No playlists available to test duplication")


class TestDisplay:
    """Display page tests"""
    
    def test_display_page_data(self):
        """Test display page data endpoint"""
        # Using known display code from context
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200, f"Display data failed: {response.text}"
        data = response.json()
        assert "screen" in data
        assert "settings" in data
        print(f"Display data retrieved for code 386621")
        print(f"Screen: {data['screen'].get('name', 'Unknown')}")
    
    def test_display_invalid_code(self):
        """Test display with invalid code"""
        response = requests.get(f"{BASE_URL}/api/display/000000")
        assert response.status_code == 404
        print("Invalid display code correctly returns 404")


class TestWeather:
    """Weather API tests"""
    
    def test_current_weather(self):
        """Test current weather endpoint"""
        response = requests.get(f"{BASE_URL}/api/weather?city=Paris")
        assert response.status_code == 200
        data = response.json()
        assert "temp" in data
        assert data["temp"] is not None, "Weather temp should not be None"
        print(f"Weather: {data['temp']}°C in {data.get('city', 'Paris')}")
    
    def test_weather_forecast(self):
        """Test 3-day weather forecast endpoint"""
        response = requests.get(f"{BASE_URL}/api/weather/forecast?city=Paris")
        assert response.status_code == 200
        data = response.json()
        assert "forecast" in data
        assert isinstance(data["forecast"], list)
        assert len(data["forecast"]) >= 1, "Should return at least 1 day forecast"
        print(f"Forecast: {len(data['forecast'])} days for {data.get('city', 'Paris')}")
        for day in data["forecast"]:
            print(f"  - {day['day_name']}: {day['temp_min']}°C - {day['temp_max']}°C")


class TestRSS:
    """RSS feed tests"""
    
    def test_rss_feed(self):
        """Test RSS feed endpoint with Le Monde"""
        rss_url = "https://www.lemonde.fr/rss/une.xml"
        response = requests.get(f"{BASE_URL}/api/rss?url={rss_url}")
        assert response.status_code == 200, f"RSS failed: {response.text}"
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) > 0, "RSS should return items from Le Monde"
        print(f"RSS items: {len(data['items'])} headlines from Le Monde")
        print(f"First headline: {data['items'][0][:80]}...")


class TestSettings:
    """Settings management tests"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_settings(self, client_token):
        """Test getting client settings"""
        headers = {"Authorization": f"Bearer {client_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "header_bg" in data
        assert "footer_bg" in data
        assert "text_color" in data
        print(f"Settings retrieved: header_bg={data['header_bg']}, footer_bg={data['footer_bg']}")
    
    def test_update_settings(self, client_token):
        """Test updating client settings"""
        headers = {"Authorization": f"Bearer {client_token}"}
        
        # Get current settings
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        current = response.json()
        
        # Update with a new value
        update_data = {"footer_rss_url": "https://www.lemonde.fr/rss/une.xml"}
        response = requests.put(f"{BASE_URL}/api/settings", json=update_data, headers=headers)
        assert response.status_code == 200
        updated = response.json()
        assert updated["footer_rss_url"] == update_data["footer_rss_url"]
        print(f"Settings updated: footer_rss_url={updated['footer_rss_url']}")


class TestEphemeris:
    """Ephemeris (Saint du jour) tests"""
    
    def test_ephemeris(self):
        """Test ephemeris endpoint"""
        response = requests.get(f"{BASE_URL}/api/ephemeris")
        assert response.status_code == 200
        data = response.json()
        assert "saint" in data
        assert "date" in data
        print(f"Ephemeris: {data['saint']} ({data['day_key']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
